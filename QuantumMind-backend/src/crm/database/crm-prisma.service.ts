import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaClient } from "@prisma/client";

/**
 * The CRM's Postgres access layer.
 *
 * Multi-tenant by design. Today every organization shares one RDS instance and
 * rows are separated by `organizationId`, so {@link forOrg} returns the single
 * shared client for everyone. When a client is later moved to its own database,
 * {@link urlForOrg} resolves that org to a different connection string and a
 * per-connection {@link PrismaClient} is created and cached here — no change to
 * any service or controller.
 *
 * Callers still pass `organizationId` in every `where`; that is what keeps the
 * shared database isolated and what makes a tenant's rows trivially copyable to
 * their own database (a single `WHERE organizationId = ...` export).
 */
@Injectable()
export class CrmPrismaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CrmPrismaService.name);

  private readonly defaultUrl: string;
  private readonly defaultClient: PrismaClient;

  // Keyed by connection string so two orgs pointed at the same database share
  // one pool. The shared client is seeded in under its own url.
  private readonly clients = new Map<string, PrismaClient>();

  constructor(private readonly configService: ConfigService) {
    this.defaultUrl = this.configService.get<string>("crm.databaseUrl");
    this.defaultClient = this.buildClient(this.defaultUrl);
    this.clients.set(this.defaultUrl, this.defaultClient);
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.defaultClient.$connect();
      this.logger.log("Connected to the shared CRM Postgres database");
    } catch (error) {
      // Never crash the whole backend if the CRM DB is unreachable — the rest
      // of the platform (Mongo) must keep serving. CRM routes will surface the
      // error on first use instead.
      this.logger.error(
        `Could not connect to the CRM database on startup: ${
          error instanceof Error ? error.message : error
        }`,
      );
    }
  }

  async onModuleDestroy(): Promise<void> {
    await Promise.all(
      [...this.clients.values()].map((client) =>
        client.$disconnect().catch(() => undefined),
      ),
    );
  }

  /**
   * The Prisma client for a given tenant. Always filter your queries by
   * `organizationId` regardless — the client is shared today.
   */
  forOrg(organizationId: string | null | undefined): PrismaClient {
    const url = this.urlForOrg(organizationId);
    if (url === this.defaultUrl) return this.defaultClient;

    const existing = this.clients.get(url);
    if (existing) return existing;

    const client = this.buildClient(url);
    this.clients.set(url, client);
    void client
      .$connect()
      .then(() =>
        this.logger.log(
          `Opened a dedicated CRM database connection for org ${organizationId}`,
        ),
      )
      .catch((error) =>
        this.logger.error(
          `Failed to connect a dedicated CRM database for org ${organizationId}: ${
            error instanceof Error ? error.message : error
          }`,
        ),
      );
    return client;
  }

  /** The shared client, for maintenance/admin work not scoped to one tenant. */
  get client(): PrismaClient {
    return this.defaultClient;
  }

  /**
   * Resolve which database connection string serves an organization.
   *
   * Extension point for per-tenant databases: today it returns the shared url
   * for everyone. To give a client its own database, return that client's
   * connection string here (from an env map or a small config lookup) — nothing
   * else in the codebase needs to change.
   */
  private urlForOrg(_organizationId: string | null | undefined): string {
    return this.defaultUrl;
  }

  private buildClient(url: string): PrismaClient {
    return new PrismaClient({
      datasources: { db: { url } },
    });
  }
}
