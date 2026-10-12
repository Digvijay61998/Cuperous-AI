/** Chat wrap-up drafts: what the AI may and may not change. */
jest.mock("@nestjs/schedule", () => ({
  Interval: () => () => undefined,
  Cron: () => () => undefined,
  Timeout: () => () => undefined,
  CronExpression: new Proxy({}, { get: () => "* * * * *" }),
  ScheduleModule: { forRoot: () => ({}) },
}));
import { draftDescription, draftSubject } from "./service-request-wrap-up.service";

describe("wrap-up draft", () => {
  it("keeps a subject a person wrote; replaces a system placeholder with the AI's ask", () => {
    expect(draftSubject("Lift 2 door fault", "The customer wants the door fixed.")).toBe("Lift 2 door fault");
    expect(draftSubject("Request for a specialist from chat", "The customer wants the door fixed. Soon.")).toBe(
      "The customer wants the door fixed.",
    );
    expect(draftSubject("service request from chat", "")).toBe("service request from chat");
    // the TICKET node default names the bot; still a placeholder
    expect(draftSubject("Customer request from myKONE Assistant", "Check the tender.")).toBe("Check the tender.");
    expect(draftSubject("Customer requests from the portal team", "x")).toBe("Customer requests from the portal team");
    expect(draftSubject("", "")).toBe("Customer request");
    const long = draftSubject("Customer request", "x".repeat(300));
    expect(long.length).toBe(120);
    expect(long.endsWith("…")).toBe(true);
  });

  it("puts the summary first and keeps what was recorded before", () => {
    const d = draftDescription(
      { overview: "Door does not close.", customer_ask: "A repair.", actions_taken: "Nothing yet.", next_step: "Send an engineer." },
      "The lift door on floor 3 does not close\nLift 2, Building A",
    );
    expect(d).toBe(
      "Door does not close.\n\nCustomer wants: A repair.\nDone so far: Nothing yet.\nNext step: Send an engineer.\n\n" +
        "Recorded from the chat:\nThe lift door on floor 3 does not close\nLift 2, Building A",
    );
    // An earlier wrap-up's text is not appended twice.
    expect(draftDescription({ overview: "A" }, "A")).toBe("A");
    expect(draftDescription({}, "")).toBe("");
    expect(draftDescription({ overview: "x".repeat(20_000) }).length).toBe(10_000);
  });
});
