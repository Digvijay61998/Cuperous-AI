import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { CrmPrismaService } from "../database/crm-prisma.service";
import {
  CreateSavedViewDto,
  ListSavedViewsDto,
  UpdateSavedViewDto,
} from "./dto/saved-view.dto";

const SELECT = {
  id: true,
  entity: true,
  name: true,
  shared: true,
  filters: true,
  ownerId: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.SavedViewSelect;

@Injectable()
export class SavedViewsService {
  constructor(private readonly crm: CrmPrismaService) {}

  /** Views the user can see for an entity: their own plus any shared in the org. */
  async list(orgId: string, userId: string, dto: ListSavedViewsDto) {
    const db = this.crm.forOrg(orgId);
    const rows = await db.savedView.findMany({
      where: {
        organizationId: orgId,
        entity: dto.entity,
        OR: [{ ownerId: userId }, { shared: true }],
      },
      orderBy: [{ shared: "asc" }, { name: "asc" }],
      select: SELECT,
    });
    return rows.map((row) => ({ ...row, isOwner: row.ownerId === userId }));
  }

  async create(orgId: string, userId: string, dto: CreateSavedViewDto) {
    const db = this.crm.forOrg(orgId);
    try {
      return await db.savedView.create({
        data: {
          organizationId: orgId,
          entity: dto.entity,
          name: dto.name.trim(),
          shared: dto.shared ?? false,
          filters: (dto.filters ?? {}) as Prisma.InputJsonValue,
          ownerId: userId,
        },
        select: SELECT,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new ConflictException("You already have a view with that name.");
      }
      throw error;
    }
  }

  async update(orgId: string, userId: string, id: string, dto: UpdateSavedViewDto) {
    const db = this.crm.forOrg(orgId);
    await this.assertOwned(orgId, userId, id);

    const data: Prisma.SavedViewUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name.trim();
    if (dto.shared !== undefined) data.shared = dto.shared;
    if (dto.filters !== undefined) data.filters = dto.filters as Prisma.InputJsonValue;

    try {
      return await db.savedView.update({ where: { id }, data, select: SELECT });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new ConflictException("You already have a view with that name.");
      }
      throw error;
    }
  }

  async remove(orgId: string, userId: string, id: string) {
    const db = this.crm.forOrg(orgId);
    await this.assertOwned(orgId, userId, id);
    await db.savedView.delete({ where: { id } });
    return { id };
  }

  private async assertOwned(orgId: string, userId: string, id: string) {
    const db = this.crm.forOrg(orgId);
    const view = await db.savedView.findFirst({
      where: { id, organizationId: orgId },
      select: { ownerId: true },
    });
    if (!view) throw new NotFoundException(`No saved view with id ${id}.`);
    if (view.ownerId !== userId) {
      throw new ForbiddenException("Only the owner can change this view.");
    }
  }
}
