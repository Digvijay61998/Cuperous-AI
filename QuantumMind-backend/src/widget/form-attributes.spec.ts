/** crm-plugins-service-desk R23: pre-chat form answers seed the flow's attributes. */
jest.mock("@nestjs/schedule", () => ({
  Interval: () => () => undefined,
  Cron: () => () => undefined,
  Timeout: () => () => undefined,
  CronExpression: new Proxy({}, { get: () => "* * * * *" }),
  ScheduleModule: { forRoot: () => ({}) },
}));
import { formAttributes } from "./widget.service";

describe("formAttributes", () => {
  it("puts valid form values under the default contact aliases", () => {
    expect(formAttributes({ name: " Raj Kumar ", email: "Raj@X.com", phone: "+91 98765 43210" })).toEqual({
      contact_name: "Raj Kumar",
      contact_email: "raj@x.com",
      contact_phone: "+919876543210",
    });
  });

  it("uses the bot's mapping and drops skipped / invalid fields", () => {
    expect(formAttributes({ name: "Anonymous", email: "nope", phone: "" }, { name: "n", email: "e", phone: "p" })).toEqual({});
    expect(formAttributes({ name: "Raj" }, { name: "visitor_name" })).toEqual({ visitor_name: "Raj" });
    expect(formAttributes(undefined)).toEqual({});
  });
});
