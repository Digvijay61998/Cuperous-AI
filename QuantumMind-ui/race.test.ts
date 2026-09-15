import { mergeOrAppend, reconcileOptimistic } from './src/store/apps/inbox/merge';

const CID = 'msg-abc123';
const optimistic: any = { id: `optimistic:${CID}`, correlationId: CID, optimistic: true,
  message: 'testing', type: 'text', time: '2026-09-08T20:00:00.000Z',
  direction: 'outbound', status: 'pending', historical: false };
const echo: any = { id: '68c0f1aa', externalMessageId: '3EB0ABC', correlationId: CID,
  message: 'testing', type: 'text', time: '2026-09-08T20:00:01.000Z',
  direction: 'outbound', status: 'sent', historical: false };
const httpResp = { id: '68c0f1aa', externalMessageId: '3EB0ABC', status: 'sent' };

const show = (l: any[], label: string) => {
  const ok = l.length === 1;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}: ${l.length} bubble(s)` +
    (ok ? ` [status=${l[0].status} optimistic=${!!l[0].optimistic}]` : ''));
  if (!ok) l.forEach((m: any) => console.log('        ', m.id, m.status, 'opt=' + !!m.optimistic));
};

// A: response then echo
let a = mergeOrAppend([], optimistic);
a = reconcileOptimistic(a, CID, httpResp);
a = mergeOrAppend(a, echo);
show(a, 'response -> echo');

// B: echo then response  (the ordering that was duplicating)
let b = mergeOrAppend([], optimistic);
b = mergeOrAppend(b, echo);
show(b, 'echo folded onto optimistic');
b = reconcileOptimistic(b, CID, httpResp);
show(b, 'echo -> response');

// C: echo only, no response yet
let c = mergeOrAppend([], optimistic);
c = mergeOrAppend(c, echo);
show(c, 'echo only');

// D: a refetched page must not add a third
let d = b;
d = mergeOrAppend(d, { ...echo, status: 'read' });
show(d, 'later page/ack merge');
