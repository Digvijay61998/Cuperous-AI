import { Inject, Injectable } from "@nestjs/common";
import mongoose, { Model } from "mongoose";
import { BOTS_PROVIDER } from "src/bots/constant";
import { BotDocument } from "src/bots/entities";
import { isCrossOrg, scopedFilter, TenantContext } from "./tenant-context";

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

  /**
   * A Mongo match fragment that pins a `bot`-referencing collection to the
   * caller's organization. Empty (`{}`) for SUPER_ADMIN.
   *
   * @param field the field on the target collection that references the bot.
   */
  async orgBotMatch(
    user?: TenantContext,
    field = "bot",
  ): Promise<Record<string, any>> {
    const ids = await this.orgBotIds(user);
    if (ids === null) return {};
    return { [field]: { $in: ids } };
  }
}
