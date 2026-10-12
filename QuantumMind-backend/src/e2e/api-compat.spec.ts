/**
 * crm-incident-handover task 9.2, R15.4: the existing CRM, Service Request
 * and Question Bank endpoints stay backward compatible.
 *
 * The route list and stored fields below were taken from the last commit
 * before this feature (`git show HEAD:…`). Every old route must still exist
 * with the same method; every old field must still be stored; a request body
 * that was valid before must still validate. New routes and fields may be
 * added; nothing here may be removed.
 */
jest.mock("@nestjs/schedule", () => ({
  Interval: () => () => undefined,
  Cron: () => () => undefined,
  Timeout: () => () => undefined,
  CronExpression: new Proxy({}, { get: () => "* * * * *" }),
  ScheduleModule: { forRoot: () => ({}) },
}));

import "reflect-metadata";
import { RequestMethod } from "@nestjs/common";
import { METHOD_METADATA, PATH_METADATA } from "@nestjs/common/constants";
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { ActivitiesController } from "src/crm/activities/activities.controller";
import { CompaniesController } from "src/crm/companies/companies.controller";
import { ContactsController } from "src/crm/contacts/contacts.controller";
import { DealsController } from "src/crm/deals/deals.controller";
import { FieldsController } from "src/crm/fields/fields.controller";
import { FactsController } from "src/crm/intelligence/facts.controller";
import { SavedViewsController } from "src/crm/saved-views/saved-views.controller";
import { StatsController } from "src/crm/stats/stats.controller";
import { CreateSingleQuestionDto } from "src/questions/dto/create-question.dto";
import { QuestionSchema } from "src/questions/entities/question.entity";
import { QuestionsController } from "src/questions/questions.controller";
import { CreateTicketDto } from "src/tickets/dto/create-ticket.dto";
import { TicketSchema } from "src/tickets/entities/ticket.entity";
import { TicketsController } from "src/tickets/tickets.controller";

/** "METHOD base/path" for every route at HEAD. */
const ROUTES_AT_HEAD: Record<string, [any, string[]]> = {
  activities: [ActivitiesController, ["GET crm/activities", "POST crm/activities", "PATCH crm/activities/:id", "DELETE crm/activities/:id"]],
  companies: [
    CompaniesController,
    ["GET crm/companies", "GET crm/companies/:id", "POST crm/companies", "PATCH crm/companies/:id", "POST crm/companies/:id/archive", "POST crm/companies/:id/restore", "DELETE crm/companies/:id", "POST crm/companies/bulk-assign-owner", "POST crm/companies/bulk-archive", "POST crm/companies/bulk-restore", "POST crm/companies/bulk-purge"],
  ],
  contacts: [
    ContactsController,
    ["GET crm/contacts", "GET crm/contacts/:id", "POST crm/contacts", "PATCH crm/contacts/:id", "POST crm/contacts/:id/archive", "POST crm/contacts/:id/restore", "POST crm/contacts/:id/enrich", "DELETE crm/contacts/:id", "POST crm/contacts/bulk-assign-owner", "POST crm/contacts/bulk-set-company", "POST crm/contacts/bulk-archive", "POST crm/contacts/bulk-restore", "POST crm/contacts/bulk-purge"],
  ],
  deals: [
    DealsController,
    ["GET crm/deals", "GET crm/deals/pipeline", "GET crm/deals/:id", "POST crm/deals", "PATCH crm/deals/:id", "POST crm/deals/:id/stage", "POST crm/deals/:id/contacts", "DELETE crm/deals/:id/contacts/:contactId", "POST crm/deals/:id/archive", "POST crm/deals/:id/restore", "DELETE crm/deals/:id", "POST crm/deals/bulk-assign-owner", "POST crm/deals/bulk-archive", "POST crm/deals/bulk-restore", "POST crm/deals/bulk-purge"],
  ],
  fields: [FieldsController, ["GET crm/fields", "POST crm/fields", "GET crm/fields/values", "PUT crm/fields/values", "PATCH crm/fields/:id", "DELETE crm/fields/:id"]],
  facts: [FactsController, ["GET crm/contacts/:contactId/facts", "POST crm/facts/:id/decide"]],
  savedViews: [SavedViewsController, ["GET crm/saved-views", "POST crm/saved-views", "PATCH crm/saved-views/:id", "DELETE crm/saved-views/:id"]],
  stats: [StatsController, ["GET crm/stats"]],
  questions: [
    QuestionsController,
    ["POST questions", "POST questions/multiple", "GET questions/search", "GET questions", "GET questions/:id", "PATCH questions/:id", "DELETE questions/:id", "POST questions/:id/approve", "POST questions/find-answer", "GET questions/report/stats"],
  ],
  tickets: [
    TicketsController,
    ["POST tickets", "GET tickets", "GET tickets/assign-to-me", "GET tickets/mark-as-resolved", "GET tickets/stats", "GET tickets/stats/home", "GET tickets/stats/home/pending", "GET tickets/:id", "GET tickets/report/total", "GET tickets/report/day-wise-performance", "GET tickets/report/date-wise-performance", "PATCH tickets/:id"],
  ],
};

const clean = (p: string) => p.replace(/^\/+|\/+$/g, "");

function routesOf(controller: any): Set<string> {
  const base = clean(String(Reflect.getMetadata(PATH_METADATA, controller) ?? ""));
  const out = new Set<string>();
  for (const name of Object.getOwnPropertyNames(controller.prototype)) {
    const fn = controller.prototype[name];
    if (typeof fn !== "function") continue;
    const method = Reflect.getMetadata(METHOD_METADATA, fn);
    if (method === undefined) continue;
    const paths = ([] as string[]).concat(Reflect.getMetadata(PATH_METADATA, fn) ?? "");
    for (const p of paths) out.add(`${RequestMethod[method]} ${[base, clean(p)].filter(Boolean).join("/")}`);
  }
  return out;
}

describe("R15.4: existing endpoints are kept", () => {
  it.each(Object.entries(ROUTES_AT_HEAD))("%s: every route from before still exists", (_n, [controller, routes]) => {
    const now = routesOf(controller);
    expect(now.size).toBeGreaterThanOrEqual(routes.length); // the metadata really was read
    expect(routesOf(class Empty {}).size).toBe(0);
    const missing = routes.filter((r) => !now.has(r));
    expect(missing).toEqual([]);
  });

  it("stored Service Request fields are kept (new ones only added)", () => {
    const before = ["ticketId", "subject", "description", "status", "priority", "visitor", "bot", "agents", "activities", "closedAt", "conversationId", "tags"];
    const now = Object.keys(TicketSchema.paths);
    expect(before.filter((f) => !now.includes(f))).toEqual([]);
    expect(now).toEqual(expect.arrayContaining(["incident", "crmContactId", "source"]));
  });

  it("stored Question Bank fields are kept (new ones only added)", () => {
    const before = ["organizationId", "language", "question", "answers", "keywords", "tags", "status", "addedBy", "approvedBy", "usedcount", "search_keywords", "private", "intent", "questionLanguage"];
    const now = Object.keys(QuestionSchema.paths);
    expect(before.filter((f) => !now.includes(f))).toEqual([]);
    expect(now).toContain("source");
  });

  it("a Service Request body that was valid before still validates; new fields are optional", async () => {
    const old = { subject: "Door broken", description: "Floor 3", priority: "MEDIUM", bot: "64b0000000000000000000b1", visitor: "64c0000000000000000000a1", conversationId: "64c0000000000000000000c1", tags: [] };
    expect(await validate(plainToInstance(CreateTicketDto, old))).toEqual([]);
    const bad = await validate(plainToInstance(CreateTicketDto, { ...old, source: "hacker" }));
    expect(bad.map((e) => e.property)).toEqual(["source"]);
  });

  it("a Question Bank body that was valid before still validates", async () => {
    const old = { question: "How do I add a user?", answers: ["Open Users and press Add."], keywords: ["user"], tags: ["howto"] };
    expect(await validate(plainToInstance(CreateSingleQuestionDto, old))).toEqual([]);
  });
});
