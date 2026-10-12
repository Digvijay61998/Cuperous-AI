import * as fs from "fs";
import * as path from "path";
import { BotsService } from "./bots.service";

/**
 * Covers the id-remapping / validation step of bot import. BotFlowNode.id is
 * unique across ALL bots, so an imported flow must get fresh ids everywhere
 * (nodes, edges, GO_TO_STEP targets, startNode) while keeping its shape.
 */
describe("BotsService.remapFlowIds (bot import)", () => {
  // remapFlowIds touches no injected dependency, so a bare instance suffices.
  const service = Object.create(BotsService.prototype) as any;
  const remap = (flow: any) => service.remapFlowIds(flow, 0);

  const flow = {
    nodes: [
      { id: "a", nodeType: "START_NODE", data: { title: "Start" } },
      { id: "b", nodeType: "BOT_RESPONSE", data: { title: "Menu" }, responses: [] },
      { id: "c", nodeType: "GO_TO_STEP", payload: { blockId: "b" } },
    ],
    edges: [
      { id: "e1", source: "a", target: "b" },
      { id: "e2", source: "b", target: "c" },
    ],
    customAttributes: ["x"],
  };

  it("regenerates every id and rewires edges, GO_TO targets and startNode", () => {
    const out = remap(flow);
    const ids = out.nodes.map((n: any) => n.id);
    expect(new Set(ids).size).toBe(3);
    ids.forEach((id: string) => expect(["a", "b", "c"]).not.toContain(id));

    const [start, menu, jump] = out.nodes;
    expect(out.startNode).toBe(start.id);
    expect(jump.payload.blockId).toBe(menu.id);
    expect(out.edges.map((e: any) => [e.source, e.target])).toEqual([
      [start.id, menu.id],
      [menu.id, jump.id],
    ]);
    expect(out.nodes[0].title).toBe("Start");
    expect(out.customAttributes).toEqual(["x"]);
  });

  it("rejects broken flows", () => {
    expect(() => remap({ nodes: [], edges: [] })).toThrow(/no nodes/);
    expect(() => remap({ nodes: [{ id: "a", nodeType: "NOPE" }], edges: [] })).toThrow(/unknown nodeType/);
    expect(() => remap({ nodes: [{ id: "a", nodeType: "BOT_RESPONSE" }], edges: [] })).toThrow(/START_NODE/);
    expect(() =>
      remap({ ...flow, edges: [{ id: "x", source: "a", target: "zzz" }] })
    ).toThrow(/missing node/);
    expect(() =>
      remap({ ...flow, nodes: [...flow.nodes.slice(0, 2), { id: "c", nodeType: "GO_TO_STEP", payload: { blockId: "zzz" } }] })
    ).toThrow(/GO_TO_STEP/);
  });

  it("accepts the generated myKONE Assistant flow file", () => {
    const file = path.resolve(
      __dirname,
      "../../../docs/koneTrainingData/bot/kone-mykone-assistant-flow.json"
    );
    if (!fs.existsSync(file)) return; // file lives outside the backend repo
    const kone = JSON.parse(fs.readFileSync(file, "utf8"));
    const out = remap(kone);
    expect(out.nodes).toHaveLength(kone.nodes.length);
    expect(out.edges).toHaveLength(kone.edges.length);
    const ids = new Set(out.nodes.map((n: any) => n.id));
    out.nodes
      .filter((n: any) => n.nodeType === "GO_TO_STEP")
      .forEach((n: any) => expect(ids.has(n.payload.blockId)).toBe(true));
  });
});
