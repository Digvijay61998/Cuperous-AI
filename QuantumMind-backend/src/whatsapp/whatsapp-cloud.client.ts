import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from "rxjs";

/** What a send needs: the account's token and its sending number. */
export interface CloudCredentials {
  accessToken: string;
  phoneNumberId: string;
}

/**
 * A Graph API failure, keeping Meta's own error code so callers can classify on
 * it (e.g. 131047 = outside the 24h customer-service window) instead of on the
 * human-readable message, which Meta rewords freely.
 */
export class WhatsappCloudApiError extends Error {
  constructor(
    message: string,
    readonly code?: number,
    readonly httpStatus?: number,
    readonly details?: string
  ) {
    super(message);
  }
}

/** Meta error codes that mean "free-form messages are not allowed right now". */
export const SERVICE_WINDOW_ERROR_CODES = new Set([131047, 470]);
/** Meta error codes that mean the token / account is no longer usable. */
export const AUTH_ERROR_CODES = new Set([190, 10, 200, 131005, 131031]);
/** Meta error codes for throttling. */
export const RATE_LIMIT_ERROR_CODES = new Set([4, 80007, 130429, 131048, 131056]);

/**
 * Minimal, stateless WhatsApp Cloud API client.
 *
 * Replaces the stateful `WhatsappCloud` util on every path that has to work
 * after a restart: it holds no per-tenant state, so a reply only needs the
 * credentials (read from the Social row) and the recipient (read from the
 * durable ChannelThread). It also returns Meta's message id (`wamid`), which is
 * what binds delivery/read receipts to the stored row.
 */
@Injectable()
export class WhatsappCloudClient {
  private readonly logger = new Logger(WhatsappCloudClient.name);

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService
  ) {}

  private get baseUrl(): string {
    const version =
      this.config.get<string>("social.whatsappCloud.graphVersion") || "v21.0";
    return `https://graph.facebook.com/${version}`;
  }

  get maxMediaBytes(): number {
    return (
      this.config.get<number>("social.whatsappCloud.maxMediaBytes") ||
      25 * 1024 * 1024
    );
  }

  /**
   * Send one message. `content` is the type-specific part of the payload
   * (`{ type: 'text', text: {...} }` etc.). Returns Meta's message id.
   */
  async sendMessage(
    creds: CloudCredentials,
    to: string,
    content: Record<string, any>,
    contextMessageId?: string
  ): Promise<string> {
    const body: Record<string, any> = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      ...content,
    };
    if (contextMessageId) body.context = { message_id: contextMessageId };

    const data = await this.request("POST", `/${creds.phoneNumberId}/messages`, creds.accessToken, body);
    const id = data?.messages?.[0]?.id;
    if (!id) {
      throw new WhatsappCloudApiError("WhatsApp returned no message id");
    }
    return id;
  }

  /** Blue ticks. Marking one message read marks every earlier one too. */
  async markRead(creds: CloudCredentials, messageId: string): Promise<void> {
    await this.request("POST", `/${creds.phoneNumberId}/messages`, creds.accessToken, {
      messaging_product: "whatsapp",
      status: "read",
      message_id: messageId,
    });
  }

  /** Resolve a media id to its (short-lived, auth-protected) download URL. */
  async getMediaInfo(
    accessToken: string,
    mediaId: string
  ): Promise<{ url: string; mime_type?: string; file_size?: number }> {
    return this.request("GET", `/${encodeURIComponent(mediaId)}`, accessToken);
  }

  /** Download media bytes. Refuses anything over `maxMediaBytes`. */
  async downloadMedia(accessToken: string, url: string): Promise<Buffer> {
    const res = await firstValueFrom(
      this.http.get(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
        responseType: "arraybuffer",
        maxContentLength: this.maxMediaBytes,
        timeout: 30_000,
      })
    );
    return Buffer.from(res.data);
  }

  private async request(
    method: "GET" | "POST",
    path: string,
    accessToken: string,
    body?: Record<string, any>
  ): Promise<any> {
    try {
      const res = await firstValueFrom(
        this.http.request({
          method,
          url: `${this.baseUrl}${path}`,
          data: body,
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          timeout: 20_000,
        })
      );
      return res.data;
    } catch (error) {
      const meta = error?.response?.data?.error;
      throw new WhatsappCloudApiError(
        meta?.message || error?.message || "WhatsApp request failed",
        meta?.code,
        error?.response?.status,
        meta?.error_data?.details
      );
    }
  }
}
