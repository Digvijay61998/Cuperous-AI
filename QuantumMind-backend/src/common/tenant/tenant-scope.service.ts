import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import mongoose, { Model } from "mongoose";
import { BOTS_PROVIDER } from "src/bots/constant";
import { BotDocument } from "src/bots/entities";
import {
  isCrossOrg,
  ownsResource,
  scopedFilter,
  TenantContext,
} from "./tenant-context";

/**
 * Resolves the set of bots owned by the caller's organization.
 *
 * Many collections (conversation, ticket, visitor, feedback, ...) do not carry
 * an `organizationId` of their own — they only reference a `bot`. To scope
 * those reads/counts to a single tenant we first resolve which bots the org
 * owns, then filter by `{ bot: { $in: orgBotIds } }`.
 *
 * SUPER_ADMIN is org-independent, so `orgBotIds` returns `null` ("no bot
 * restriction") and `orgBotMatch` returns an empty match — i.e. full
 * cross-org visibility, matching the behaviour of {@link scopedFilter}.
 *
 * Fail-closed: a non-super-admin with no organization resolves to an empty bot
 * list, so their counts/reads see nothing rather than another tenant's data.
 */
@Injectable()
export class TenantScopeService {
  constructor(
    @Inject(BOTS_PROVIDER) private readonly botModel: Model<BotDocument>,
  ) {}

  /**
   * The org's bot `_id`s, or `null` when the caller may see every org
   * (SUPER_ADMIN). An org-scoped caller with no bots resolves to `[]`.
   */
  async orgBotIds(
    user?: TenantContext,
  ): Promise<mongoose.Types.ObjectId[] | null> {
    if (isCrossOrg(user)) return null;
    const scoped = scopedFilter(user, {});
    const bots = await this.botModel.find(scoped).select("_id").lean();
    return bots.map((b: any) => b._id as mongoose.Types.ObjectId);
  }

  /** Same as {@link orgBotIds} but as hex strings (for string-typed botId fields). */
  async orgBotIdStrings(user?: TenantContext): Promise<string[] | null> {
    const ids = await this.orgBotIds(user);
    return ids === null ? null : ids.map((id) => id.toString());
  }

  /**
   * A Mongo match fragment that pins a `bot`-referencing collection to the
   * caller's organization. Empty (`{}`) for SUPER_ADMIN.
   *
   * @param field the field on the target collection that references the bot.
   * @param asString match against string ids (for `botId: string` fields).
   */
  async orgBotMatch(
    user?: TenantContext,
    field = "bot",
    asString = false,
  ): Promise<Record<string, any>> {
    const ids = await this.orgBotIds(user);
    if (ids === null) return {};
    return {
      [field]: { $in: asString ? ids.map((i) => i.toString()) : ids },
    };
  }

  /**
   * Resolves a bot by `_id` (or custom `botId`) and asserts the caller's org
   * owns it. Throws 404 for missing AND cross-org bots so existence cannot be
   * probed. Returns the bot's `_id` and `organizationId`.
   */
  async assertBotInOrg(
    user: TenantContext | undefined,
    botRef: any,
  ): Promise<{ _id: mongoose.Types.ObjectId; organizationId: any }> {
    const ref = botRef?._id ?? botRef;
    if (!ref) throw new NotFoundException("Bot not found");
    const or: Record<string, any>[] = [{ botId: String(ref) }];
    if (mongoose.isValidObjectId(ref)) or.unshift({ _id: ref });
    const bot = await this.botModel
      .findOne({ $or: or })
      .select("_id organizationId")
      .lean();
    if (!bot || !ownsResource(user, (bot as any).organizationId?.toString())) {
      throw new NotFoundException("Bot not found");
    }
    return bot as any;
  }

  /** True when the bot exists and belongs to the caller's org (no throw). */
  async isBotInOrg(user: TenantContext | undefined, botRef: any) {
    try {
      await this.assertBotInOrg(user, botRef);
      return true;
    } catch {
      return false;
    }
  }

  /** The organizationId owning a bot, or null when unknown. */
  async orgIdForBot(botRef: any): Promise<string | null> {
    const ref = botRef?._id ?? botRef;
    if (!ref) return null;
    const or: Record<string, any>[] = [{ botId: String(ref) }];
    if (mongoose.isValidObjectId(ref)) or.unshift({ _id: ref });
    const bot = await this.botModel
      .findOne({ $or: or })
      .select("organizationId")
      .lean();
    return (bot as any)?.organizationId
      ? String((bot as any).organizationId)
      : null;
  }
}
