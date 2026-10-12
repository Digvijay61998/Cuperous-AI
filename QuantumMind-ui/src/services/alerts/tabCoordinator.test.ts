import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { ChannelLike, StorageLike, TabCoordinator } from './tabCoordinator';

/** Shared localStorage + a BroadcastChannel bus, as seen by N tabs of one browser. */
function browser() {
  const data = new Map<string, string>();
  const storage: StorageLike = {
    getItem: (k) => (data.has(k) ? data.get(k)! : null),
    setItem: (k, v) => void data.set(k, v),
  };
  const channels = new Set<ChannelLike>();
  const makeChannel = (): ChannelLike => {
    const ch: ChannelLike = {
      onmessage: null,
      postMessage: (msg) => {
        // Deliver asynchronously to every OTHER tab, like BroadcastChannel.
        channels.forEach((other) => {
          if (other !== ch) queueMicrotask(() => other.onmessage?.({ data: msg }));
        });
      },
      close: () => void channels.delete(ch),
    };
    channels.add(ch);
    return ch;
  };
  return { storage, makeChannel };
}

const tick = () => new Promise<void>((r) => setTimeout(r, 0));

describe('TabCoordinator', () => {
  // Property 5: one tab plays.
  it('property: N tabs racing on one key -> exactly one claim wins', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 6 }),
        fc.array(fc.integer({ min: 0, max: 5 }), { minLength: 6, maxLength: 6 }),
        async (n, delays) => {
          const b = browser();
          const tabs = Array.from(
            { length: n },
            (_, i) =>
              new TabCoordinator({
                storage: b.storage,
                channel: b.makeChannel(),
                tabId: `tab${i}`,
                sleep: () => tick(),
              }),
          );
          const results = await Promise.all(
            tabs.map(async (t, i) => {
              for (let d = 0; d < delays[i]; d++) await Promise.resolve();
              return t.claim('alert-1');
            }),
          );
          expect(results.filter(Boolean)).toHaveLength(1);
          tabs.forEach((t) => t.close());
        },
      ),
      { numRuns: 60 },
    );
  });

  it('a repeat after a win is refused in every tab (reconnect / re-send)', async () => {
    const b = browser();
    const a = new TabCoordinator({ storage: b.storage, channel: b.makeChannel(), tabId: 'a', sleep: tick });
    const c = new TabCoordinator({ storage: b.storage, channel: b.makeChannel(), tabId: 'c', sleep: tick });
    expect(await a.claim('k')).toBe(true);
    await tick();
    expect(await a.claim('k')).toBe(false);
    expect(await c.claim('k')).toBe(false);
    expect(c.hasPlayed('k')).toBe(true);
  });

  it('markPlayed keys are never claimed (alerts fetched on load stay silent)', async () => {
    const b = browser();
    const a = new TabCoordinator({ storage: b.storage, channel: null, tabId: 'a', sleep: tick });
    a.markPlayed(['old-1', 'old-2']);
    expect(await a.claim('old-1')).toBe(false);
    expect(await a.claim('new')).toBe(true);
  });

  it('without storage: still dedups within the tab', async () => {
    const a = new TabCoordinator({ storage: null, channel: null, tabId: 'a', sleep: tick });
    expect(await a.claim('k')).toBe(true);
    expect(await a.claim('k')).toBe(false);
  });

  it('prefs are broadcast to other tabs and cached', async () => {
    const b = browser();
    const a = new TabCoordinator({ storage: b.storage, channel: b.makeChannel(), tabId: 'a', sleep: tick });
    const c = new TabCoordinator({ storage: b.storage, channel: b.makeChannel(), tabId: 'c', sleep: tick });
    const got: any[] = [];
    c.onPrefs((p) => got.push(p));
    a.broadcastPrefs({ handoverSound: false, messageSound: true });
    await tick();
    expect(got).toEqual([{ handoverSound: false, messageSound: true }]);
    expect(c.readCachedPrefs()).toEqual({ handoverSound: false, messageSound: true });
  });

  it('survives corrupt storage', async () => {
    const b = browser();
    b.storage.setItem('jarcube.alerts.played', '{not json');
    const a = new TabCoordinator({ storage: b.storage, channel: null, tabId: 'a', sleep: tick });
    expect(await a.claim('k')).toBe(true);
  });
});
