import { ChatTypeEnum } from "src/conversation/enums/chat-type.enum";

/**
 * One inbound customer message from a Cloud API webhook, normalised.
 *
 * `botInput` is what the bot flow is fed; `text` is what the inbox shows. They
 * differ for button/list replies, where the customer sees (and we display) the
 * option's title but the flow matches on its value, which we sent as the id.
 */
export interface CloudInboundMessage {
  /** WhatsApp Business Account id (`entry[].id`). */
  wabaId: string;
  phoneNumberId?: string;
  displayPhoneNumber?: string;
  /** Customer's WhatsApp id (their number, without `+`). */
  from: string;
  profileName?: string;
  /** Meta's message id (`wamid…`) — the dedup key. */
  messageId: string;
  time: Date;
  type: string;
  text: string;
  botInput: string;
  /** Media still to be fetched (Cloud API sends an id, not bytes). */
  media?: { id: string; mimetype?: string; fileName?: string };
  quotedMessageId?: string;
  /** Click-to-WhatsApp ad / link referral, when the chat started from one. */
  referral?: Record<string, any>;
  /** True for content we store but never feed to the bot (reactions, system). */
  storeOnly?: boolean;
}

/** One delivery receipt for a message we sent. */
export interface CloudStatusEvent {
  wabaId: string;
  phoneNumberId?: string;
  messageId: string;
  status: string;
  recipient?: string;
  time: Date;
  errors?: Array<{ code?: number; title?: string; message?: string }>;
}

const toDate = (ts: unknown): Date => {
  const n = Number(ts);
  return Number.isFinite(n) && n > 0 ? new Date(n * 1000) : new Date();
};

/**
 * Parse a Cloud API webhook into every message and status it carries.
 *
 * Meta batches: one POST can hold several entries, changes, messages and
 * statuses. The previous parser read only `entry[0].changes[0].messages[0]`,
 * silently dropping the rest. Unknown shapes are skipped, never thrown on —
 * the webhook must always answer 200 or Meta retries and eventually disables it.
 */
export function parseCloudWebhook(body: any): {
  messages: CloudInboundMessage[];
  statuses: CloudStatusEvent[];
} {
  const messages: CloudInboundMessage[] = [];
  const statuses: CloudStatusEvent[] = [];
  if (!body || body.object !== "whatsapp_business_account") {
    return { messages, statuses };
  }

  for (const entry of Array.isArray(body.entry) ? body.entry : []) {
    const wabaId = entry?.id ? String(entry.id) : "";
    for (const change of Array.isArray(entry?.changes) ? entry.changes : []) {
      if (change?.field !== "messages") continue;
      const value = change.value || {};
      const phoneNumberId = value.metadata?.phone_number_id
        ? String(value.metadata.phone_number_id)
        : undefined;
      const displayPhoneNumber = value.metadata?.display_phone_number;
      const contacts: any[] = Array.isArray(value.contacts) ? value.contacts : [];

      for (const m of Array.isArray(value.messages) ? value.messages : []) {
        const parsed = parseMessage(m, contacts);
        if (!parsed) continue;
        messages.push({ wabaId, phoneNumberId, displayPhoneNumber, ...parsed });
      }

      for (const s of Array.isArray(value.statuses) ? value.statuses : []) {
        if (!s?.id || !s?.status) continue;
        statuses.push({
          wabaId,
          phoneNumberId,
          messageId: String(s.id),
          status: String(s.status),
          recipient: s.recipient_id ? String(s.recipient_id) : undefined,
          time: toDate(s.timestamp),
          errors: Array.isArray(s.errors) ? s.errors : undefined,
        });
      }
    }
  }
  return { messages, statuses };
}

type ParsedBody = Omit<
  CloudInboundMessage,
  "wabaId" | "phoneNumberId" | "displayPhoneNumber"
>;

function parseMessage(m: any, contacts: any[]): ParsedBody | null {
  if (!m?.id || !m?.from) return null;
  const from = String(m.from);
  const contact = contacts.find((c) => String(c?.wa_id) === from) || contacts[0];
  const base = {
    from,
    profileName: contact?.profile?.name || undefined,
    messageId: String(m.id),
    time: toDate(m.timestamp),
    quotedMessageId: m.context?.id ? String(m.context.id) : undefined,
    referral: m.referral || undefined,
  };

  const media = (kind: any, type: string, placeholder: string): ParsedBody => {
    const caption = kind?.caption || "";
    return {
      ...base,
      type,
      text: caption,
      botInput: caption || placeholder,
      media: kind?.id
        ? { id: String(kind.id), mimetype: kind.mime_type, fileName: kind.filename }
        : undefined,
    };
  };

  switch (m.type) {
    case "text": {
      const body = m.text?.body || "";
      return { ...base, type: ChatTypeEnum.TEXT, text: body, botInput: body };
    }
    case "image":
      return media(m.image, ChatTypeEnum.IMAGE, "[image]");
    case "sticker":
      return media(m.sticker, ChatTypeEnum.IMAGE, "[sticker]");
    case "video":
      return media(m.video, ChatTypeEnum.VIDEO, "[video]");
    case "audio":
      return media(m.audio, ChatTypeEnum.AUDIO, "[audio]");
    case "document":
      return media(m.document, ChatTypeEnum.FILE, m.document?.filename || "[document]");
    case "location": {
      const loc = m.location || {};
      const label = [loc.name, loc.address].filter(Boolean).join(", ");
      const link = `https://maps.google.com/?q=${loc.latitude},${loc.longitude}`;
      const text = label ? `📍 ${label}\n${link}` : `📍 ${link}`;
      return { ...base, type: ChatTypeEnum.TEXT, text, botInput: text };
    }
    case "contacts": {
      const shared = (m.contacts || [])
        .map((c: any) => {
          const name = c?.name?.formatted_name || "";
          const phone = c?.phones?.[0]?.phone || c?.phones?.[0]?.wa_id || "";
          return [name, phone].filter(Boolean).join(" ");
        })
        .filter(Boolean)
        .join("\n");
      const text = shared ? `👤 ${shared}` : "👤 Contact card";
      return { ...base, type: ChatTypeEnum.TEXT, text, botInput: text };
    }
    case "interactive": {
      const reply = m.interactive?.button_reply || m.interactive?.list_reply;
      if (!reply) break;
      const title = reply.title || reply.id || "";
      return {
        ...base,
        type: ChatTypeEnum.TEXT,
        text: title,
        // Our outbound options carry the flow's option value as their id.
        botInput: reply.id || title,
      };
    }
    case "button": {
      // Quick-reply button on an approved template.
      const text = m.button?.text || m.button?.payload || "";
      return {
        ...base,
        type: ChatTypeEnum.TEXT,
        text,
        botInput: m.button?.payload || text,
      };
    }
    case "reaction": {
      const emoji = m.reaction?.emoji;
      // An empty emoji is a reaction being removed — nothing to show.
      if (!emoji) return null;
      return {
        ...base,
        type: ChatTypeEnum.TEXT,
        text: `Reacted ${emoji}`,
        botInput: "",
        quotedMessageId: m.reaction?.message_id || base.quotedMessageId,
        storeOnly: true,
      };
    }
    case "system":
      return {
        ...base,
        type: ChatTypeEnum.TEXT,
        text: m.system?.body || "System message",
        botInput: "",
        storeOnly: true,
      };
    default:
      break;
  }

  return {
    ...base,
    type: ChatTypeEnum.TEXT,
    text: "[Unsupported message type]",
    botInput: "",
    storeOnly: true,
  };
}
