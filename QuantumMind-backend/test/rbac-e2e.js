/* Live HTTP scenario suite for multi-tenant RBAC. Run against an ISOLATED db. */
const BASE = process.env.BASE || 'http://localhost:4099/api';
let pass = 0, fail = 0;
const failures = [];

async function req(method, path, token, body) {
  const res = await fetch(BASE + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: 'Bearer ' + token } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  let data = null;
  try { data = await res.json(); } catch { /* empty */ }
  return { status: res.status, data };
}
function check(name, cond, extra) {
  if (cond) { pass++; console.log('  ok  ', name); }
  else { fail++; failures.push(name); console.log('  FAIL', name, extra !== undefined ? JSON.stringify(extra).slice(0, 300) : ''); }
}
const is = (r, ...codes) => codes.includes(r.status);
const login = async (email, password) => (await req('POST', '/auth/login', null, { email, password }));

(async () => {
  console.log('\n# Bootstrap / auth');
  const sa = await login('root@e2e.test', 'RootPass123!');
  check('super admin logs in', sa.status === 201 && sa.data?.accessToken, sa);
  const SA = sa.data.accessToken;
  const me = await req('GET', '/agent/me', SA);
  check('super admin /agent/me role', me.data?.role === 'super_admin' && me.data?.organizationId === null, me.data);
  check('login email case-insensitive', (await login('ROOT@E2E.test', 'RootPass123!')).status === 201);
  const bad = await login('root@e2e.test', 'nope');
  check('wrong password rejected', bad.status >= 400 && bad.status < 500, bad);
  check('no token -> 401', (await req('GET', '/bots')).status === 401);
  check('garbage token -> 401', (await req('GET', '/bots', 'abc.def.ghi')).status === 401);

  console.log('\n# Super admin is not implicitly an org user');
  check('SA cannot list bots (org API)', (await req('GET', '/bots', SA)).status === 403);
  check('SA cannot read conversations', (await req('GET', '/conversation', SA)).status === 403);

  const plans = await req('GET', '/admin/plans', SA);
  check('plans seeded (3)', Array.isArray(plans.data) && plans.data.length === 3, plans.data);
  const pro = plans.data.find((p) => p.name === 'Pro');
  const basic = plans.data.find((p) => p.name === 'Basic');
  const overview0 = await req('GET', '/admin/overview', SA);
  check('no org auto-created', overview0.data?.organizations === 0, overview0.data);

  console.log('\n# Org creation (atomic, validated)');
  const badFeat = await req('POST', '/organizations', SA, {
    name: 'Bad', owner: { name: 'x', email: 'bad@e2e.test', password: 'Password1' },
    planId: pro._id, features: { 'not.a.feature': true },
  });
  check('unknown feature key -> 400', badFeat.status === 400, badFeat);
  const badLimit = await req('POST', '/organizations', SA, {
    name: 'Bad', owner: { name: 'x', email: 'bad@e2e.test', password: 'Password1' },
    planId: pro._id, limits: { maxBots: -3 },
  });
  check('negative limit -> 400', badLimit.status === 400, badLimit);
  const ov1 = await req('GET', '/admin/overview', SA);
  check('rejected creates left nothing behind', ov1.data?.organizations === 0, ov1.data);

  const orgA = await req('POST', '/organizations', SA, {
    name: 'Org A', owner: { name: 'Alice', email: 'alice@a.test', password: 'Password1' },
    planId: pro._id, limits: { maxBots: 2, maxAgents: 2, maxPlatforms: 1 },
  });
  check('create org A', orgA.status === 201, orgA);
  const A = orgA.data.organization;
  const orgB = await req('POST', '/organizations', SA, {
    name: 'Org B', owner: { name: 'Bob', email: 'bob@b.test', password: 'Password1' },
    planId: basic._id,
  });
  check('create org B', orgB.status === 201, orgB);
  const B = orgB.data.organization;
  const dupOwner = await req('POST', '/organizations', SA, {
    name: 'Org C', owner: { name: 'Dup', email: 'ALICE@a.test', password: 'Password1' },
    planId: pro._id,
  });
  check('duplicate owner email -> 409', dupOwner.status === 409, dupOwner);
  const ov2 = await req('GET', '/admin/overview', SA);
  check('failed org create compensated (still 2 orgs)', ov2.data?.organizations === 2, ov2.data);
  check('effective limits = override over plan', A.limits?.maxBots === 2 && A.limits?.maxTemplates === 20, A.limits);

  const alice = (await login('alice@a.test', 'Password1')).data.accessToken;
  const bob = (await login('bob@b.test', 'Password1')).data.accessToken;
  const ent = await req('GET', '/me/entitlements', alice);
  check('/me/entitlements for org admin', ent.data?.role === 'org_admin' && ent.data?.organizationId === A.id && ent.data?.limits?.maxBots === 2, ent.data);

  console.log('\n# Console APIs reject non-super-admins');
  for (const [m, p] of [['GET', '/organizations'], ['GET', '/admin/overview'], ['PATCH', `/organizations/${B.id}`], ['POST', `/organizations/${B.id}/impersonate`], ['GET', '/admin/audit-logs'], ['GET', '/feature-flags']]) {
    const r = await req(m, p, alice, m === 'PATCH' ? { status: 'suspended' } : undefined);
    check(`org admin ${m} ${p} -> 403`, r.status === 403, r);
  }

  console.log('\n# Delegated user creation');
  const esc1 = await req('POST', '/agent', alice, { name: 'x', email: 'x1@a.test', password: 'Password1', tags: [], role: 'org_admin' });
  check('org admin cannot create org_admin', esc1.status === 403, esc1);
  const esc2 = await req('POST', '/agent', alice, { name: 'x', email: 'x2@a.test', password: 'Password1', tags: [], role: 'super_admin' });
  check('org admin cannot create super_admin', esc2.status === 403, esc2);
  const mgr = await req('POST', '/agent', alice, { name: 'Mia', email: 'mia@a.test', password: 'Password1', tags: [], role: 'org_manager', organizationId: B.id });
  check('org admin creates manager (org forced to A)', mgr.status === 201 && String(mgr.data?.organizationId) === A.id, mgr.data);
  const manager = (await login('mia@a.test', 'Password1')).data.accessToken;
  const escM = await req('POST', '/agent', manager, { name: 'x', email: 'x3@a.test', password: 'Password1', tags: [], role: 'org_manager' });
  check('manager cannot create manager', escM.status === 403, escM);
  const ag = await req('POST', '/agent', manager, { name: 'Andy', email: 'andy@a.test', password: 'Password1', tags: [] });
  check('manager creates agent', ag.status === 201 && ag.data?.role === 'agent', ag.data);
  const quota = await req('POST', '/agent', alice, { name: 'x', email: 'x4@a.test', password: 'Password1', tags: [] });
  check('agent quota (2) enforced', quota.status === 403, quota);
  const agent = (await login('andy@a.test', 'Password1')).data.accessToken;
  const agC = await req('POST', '/agent', agent, { name: 'x', email: 'x5@a.test', password: 'Password1', tags: [] });
  check('agent cannot create users', agC.status === 403, agC);
  const saC = await req('POST', '/agent', SA, { name: 'x', email: 'x6@a.test', password: 'Password1', tags: [], role: 'agent', organizationId: A.id });
  check('super admin cannot create plain agent', saC.status === 403, saC);

  console.log('\n# Privilege escalation via update / delete');
  const andyId = ag.data._id, miaId = mgr.data._id;
  const self = await req('PATCH', `/agent/${andyId}`, agent, { role: 'org_admin' });
  check('agent cannot promote self', self.status === 403, self);
  const moveOrg = await req('PATCH', `/agent/${andyId}`, alice, { organizationId: B.id });
  check('organizationId not writable via PATCH', moveOrg.status === 400 || moveOrg.status === 200, moveOrg);
  const andyAfter = await req('GET', `/agent/${andyId}`, alice);
  check('user still in org A', String(andyAfter.data?.organizationId) === A.id, andyAfter.data?.organizationId);
  const mgrEditAdmin = await req('PATCH', `/agent/${A.ownerId}`, manager, { name: 'hacked' });
  check('manager cannot edit org admin', mgrEditAdmin.status === 403, mgrEditAdmin);
  const promote = await req('PATCH', `/agent/${andyId}`, alice, { role: 'org_admin' });
  check('admin cannot promote to own level', promote.status === 403, promote);
  const selfDel = await req('DELETE', `/agent/${A.ownerId}`, alice);
  check('admin cannot delete self', selfDel.status === 403, selfDel);
  const bobDelA = await req('DELETE', `/agent/${andyId}`, bob);
  check('cross-org delete -> 404', bobDelA.status === 404, bobDelA);
  const bobReadA = await req('GET', `/agent/${andyId}`, bob);
  check('cross-org read user -> 404', bobReadA.status === 404, bobReadA);
  const agentReadPeer = await req('GET', `/agent/${miaId}`, agent);
  check('agent cannot read another user profile', agentReadPeer.status === 404, agentReadPeer);
  const bobList = await req('GET', '/agent', bob);
  check('org B agent list excludes org A users', Array.isArray(bobList.data?.data) && bobList.data.data.every((u) => String(u.organizationId) === B.id), bobList.data);

  console.log('\n# Bots: isolation + quota');
  const b1 = await req('POST', '/bots', alice, { name: 'A-bot-1', agents: [andyId] });
  check('create bot 1', b1.status === 201, b1);
  const b2 = await req('POST', '/bots', alice, { name: 'A-bot-2' });
  check('create bot 2', b2.status === 201, b2);
  const b3 = await req('POST', '/bots', alice, { name: 'A-bot-3' });
  check('bot quota (2) enforced', b3.status === 403, b3);
  const bobBotForeignAgent = await req('POST', '/bots', bob, { name: 'B-bot', agents: [andyId] });
  check('cannot attach foreign agent to bot', bobBotForeignAgent.status === 404, bobBotForeignAgent);
  const bBot = await req('POST', '/bots', bob, { name: 'B-bot' });
  check('org B creates its own bot', bBot.status === 201, bBot);
  const aBotId = b1.data._id;
  for (const [m, p, body] of [
    ['GET', `/bots/${aBotId}`], ['PATCH', `/bots/${aBotId}`, { name: 'pwn', published: true }],
    ['DELETE', `/bots/${aBotId}`], ['GET', `/bots/${aBotId}/flow`], ['PATCH', `/bots/${aBotId}/setting`, { domains: ['evil'] }],
    ['GET', `/conversation/bot/${aBotId}`],
  ]) {
    const r = await req(m, p, bob, body);
    const okStatus = p.startsWith('/conversation') ? (r.status === 200 && Array.isArray(r.data) && r.data.length === 0) : r.status === 404;
    check(`org B ${m} ${p} blocked`, okStatus, r);
  }
  const flow = await req('GET', `/bots/${aBotId}/flow`, alice);
  const nodeId = flow.data?.nodes?.[0]?.id;
  check('owner reads flow', !!nodeId, flow.data);
  const nodeX = await req('GET', `/bots/flow/node/${nodeId}`, bob);
  check('cross-org flow node read -> 404', nodeX.status === 404, nodeX);
  const nodeW = await req('PATCH', `/bots/flow/node/${nodeId}`, bob, { title: 'pwn' });
  check('cross-org flow node write -> 404', nodeW.status === 404, nodeW);
  const nodeOk = await req('GET', `/bots/flow/node/${nodeId}`, alice);
  check('owner reads flow node', nodeOk.status === 200, nodeOk);
  const invalid = await req('GET', '/bots/not-an-id', alice);
  check('invalid bot id -> 404 not 500', invalid.status === 404, invalid);
  const bobBots = await req('GET', '/bots', bob);
  check('org B bot list only its bots', Array.isArray(bobBots.data) && bobBots.data.length === 1, bobBots.data);
  const agentBotCreate = await req('POST', '/bots', agent, { name: 'x' });
  check('agent cannot create bots', agentBotCreate.status === 403, agentBotCreate);

  console.log('\n# Delete frees quota, double delete does not');
  const del1 = await req('DELETE', `/bots/${b2.data._id}`, alice);
  await req('DELETE', `/bots/${b2.data._id}`, alice);
  const entAfter = await req('GET', '/me/entitlements', alice);
  check('usage.bots == 1 after delete (+double delete)', del1.status === 200 && entAfter.data?.usage?.bots === 1, entAfter.data?.usage);

  console.log('\n# Quota race (parallel creates)');
  await req('PATCH', `/organizations/${B.id}`, SA, { limits: { maxBots: 3 } });
  const race = await Promise.all(Array.from({ length: 8 }, (_, i) => req('POST', '/bots', bob, { name: 'race' + i })));
  const created = race.filter((r) => r.status === 201).length;
  check('race: exactly 2 more bots created (limit 3)', created === 2, race.map((r) => r.status));
  const bEnt = await req('GET', '/me/entitlements', bob);
  check('race: counter == 3', bEnt.data?.usage?.bots === 3, bEnt.data?.usage);

  console.log('\n# Downgrade below usage');
  await req('PATCH', `/organizations/${B.id}`, SA, { limits: { maxBots: 1 } });
  const afterDown = await req('POST', '/bots', bob, { name: 'nope' });
  check('downgrade blocks new create', afterDown.status === 403, afterDown);
  const stillThere = await req('GET', '/bots', bob);
  check('downgrade keeps existing bots', stillThere.data?.length === 3, stillThere.data?.length);

  console.log('\n# Feature gating + platform quota');
  const bobWA = await req('POST', '/whatsapp-web/sessions', bob, { name: 'bob-wa', jarcubeBot: bBot.data._id });
  check('Basic plan: openwa disabled -> 403', bobWA.status === 403, bobWA);
  const waForeign = await req('POST', '/whatsapp-web/sessions', alice, { name: 'alice-wa', jarcubeBot: bBot.data._id });
  check('WA session on foreign bot -> 404', waForeign.status === 404, waForeign);
  const wa1 = await req('POST', '/whatsapp-web/sessions', alice, { name: 'alice-wa', jarcubeBot: aBotId });
  check('Pro: create WA session', wa1.status === 201, wa1);
  const wa2 = await req('POST', '/whatsapp-web/sessions', alice, { name: 'alice-wa2', jarcubeBot: aBotId });
  check('platform quota (1) enforced', wa2.status === 403, wa2);
  const waList = await req('GET', '/whatsapp-web/sessions', bob);
  check('whatsapp-web requires feature for list too', waList.status === 403, waList);
  const waAnon = await req('GET', '/whatsapp-web/sessions');
  check('whatsapp-web no longer public', waAnon.status === 401, waAnon);
  const socAnon = await req('GET', '/social');
  check('social no longer public', socAnon.status === 401, socAnon);
  const socBob = await req('GET', '/social', bob);
  check('org B sees no org A connections', socBob.status === 200 && socBob.data?.count === 0, socBob.data);
  const socUnsupported = await req('POST', '/social', alice, { name: 'x', platform: 'viber', accessToken: 't', jarcubeBot: aBotId });
  check('unsupported platform rejected', socUnsupported.status === 403, socUnsupported);
  await req('PATCH', `/organizations/${B.id}`, SA, { features: { 'channel.telegram': true }, limits: { maxPlatforms: 2 } });
  const tgFlip = await req('POST', '/social', bob, { name: 'tg', platform: 'telegram', accessToken: 'tok', botId: 'tg-bot-1', jarcubeBot: bBot.data._id });
  check('feature override enables telegram for Basic org', tgFlip.status === 201 && !tgFlip.data?.accessToken, tgFlip);
  const tgDup = await req('POST', '/social', bob, { name: 'tg2', platform: 'telegram', accessToken: 'tok', botId: 'tg-bot-1', jarcubeBot: bBot.data._id });
  check('same platform account cannot be connected twice', tgDup.status === 409, tgDup);
  const waDel = await req('DELETE', `/whatsapp-web/sessions/${wa1.data.id}`, alice);
  check('delete WA session', waDel.status === 200, waDel);
  const entP = await req('GET', '/me/entitlements', alice);
  check('platform slot released', entP.data?.usage?.platforms === 0, entP.data?.usage);

  console.log('\n# Tab/role API enforcement');
  check('agent blocked from bots config', (await req('GET', `/bots/${aBotId}/flow`, agent)).status === 403);
  check('agent can read inbox channels', (await req('GET', '/inbox/channels', agent)).status === 200);
  check('agent can read conversations', (await req('GET', '/conversation', agent)).status === 200);
  check('manager blocked from channel providers', (await req('GET', '/messaging/providers', manager)).status === 403);
  const setGlobal = await req('PATCH', '/messaging/providers/whatsapp/active', alice, { providerId: 'whatsapp_openwa' });
  check('org admin cannot change GLOBAL provider', setGlobal.status === 400, setGlobal);
  const setForeign = await req('PATCH', '/messaging/providers/whatsapp/active', alice, { providerId: 'whatsapp_openwa', botId: bBot.data._id });
  check('org admin cannot change provider of foreign bot', setForeign.status === 404, setForeign);
  const tplCat = await req('POST', '/template/xxxxxxxxxxxxxxxxxxxxxxxx/publish', alice);
  check('org admin cannot publish catalog template', tplCat.status === 403, tplCat);

  console.log('\n# Previously-public data endpoints now closed');
  for (const p of ['/conversation/stats/home', '/visitor/stat/home', '/visitor/report/month-wise', '/tickets/stats/home', '/unanswered/stats/home', '/questions/search?question=hi', '/trainingdata/view/64b000000000000000000001', '/scraper', '/bots/report/day-wise-performance', '/social/report', '/chat-initializer/test/' + aBotId, '/conversation/64b000000000000000000001']) {
    const r = await req('GET', p);
    check(`anon GET ${p} -> 401`, r.status === 401, r.status);
  }
  const tdBob = await req('POST', `/trainingdata/bot/${aBotId}`, bob);
  check('training data of foreign bot -> 404', tdBob.status === 404, tdBob);
  const scrBob = await req('POST', '/scraper', bob, { url: 'https://x.test', botId: aBotId });
  check('scrape into foreign bot -> 404', scrBob.status === 404, scrBob);
  const homeA = await req('GET', '/conversation/stats/home', alice);
  check('home stats work for tenant', homeA.status === 200, homeA);
  const repB = await req('GET', `/bots/report/day-wise-performance?id=${aBotId}`, bob);
  check('foreign bot report returns empty', repB.status === 200 && Array.isArray(repB.data) && repB.data.length === 0, repB.data);
  const tixRep = await req('GET', '/tickets/report/total', alice);
  check('tickets/report/total not captured by :id', tixRep.status === 200, tixRep);

  console.log('\n# Suspension');
  await req('PATCH', `/organizations/${B.id}`, SA, { status: 'suspended' });
  check('suspended org: API blocked', (await req('GET', '/bots', bob)).status === 403);
  const bobLogin = await login('bob@b.test', 'Password1');
  check('suspended org: login blocked', bobLogin.status === 403, bobLogin);
  const imp = await req('POST', `/organizations/${B.id}/impersonate`, SA);
  check('cannot impersonate suspended org', imp.status === 400, imp);
  check('other org unaffected', (await req('GET', '/bots', alice)).status === 200);
  await req('PATCH', `/organizations/${B.id}`, SA, { status: 'active' });
  check('reactivated: API works', (await req('GET', '/bots', bob)).status === 200);

  console.log('\n# Impersonation');
  const impA = await req('POST', `/organizations/${A.id}/impersonate`, SA);
  check('impersonate org A', impA.status === 201 && impA.data?.accessToken, impA);
  const IT = impA.data.accessToken;
  const impMe = await req('GET', '/agent/me', IT);
  check('impersonation context = org A admin, impersonatedBy set', impMe.data?.role === 'org_admin' && impMe.data?.organizationId === A.id && !!impMe.data?.impersonatedBy, impMe.data);
  check('impersonation sees org A bots', (await req('GET', '/bots', IT)).data?.length === 1);
  check('impersonation cannot use console', (await req('GET', '/organizations', IT)).status === 403);
  const audit = await req('GET', `/admin/audit-logs?organizationId=${A.id}`, SA);
  const actions = (audit.data?.data || []).map((a) => a.action);
  check('audit: create + impersonate + subscription changes logged', actions.includes('organization.create') && actions.includes('organization.impersonate'), actions);
  const auditB = await req('GET', `/admin/audit-logs?organizationId=${B.id}`, SA);
  const bActs = (auditB.data?.data || []).map((a) => a.action);
  check('audit: suspend/reactivate/subscription.update logged', ['organization.suspend', 'organization.reactivate', 'subscription.update'].every((x) => bActs.includes(x)), bActs);
  check('audit metadata contains no password', !JSON.stringify(audit.data).includes('Password1'));

  console.log('\n# Console metadata only');
  const list = await req('GET', '/organizations', SA);
  const txt = JSON.stringify(list.data);
  check('org list has usage/limits/owner', list.data?.length === 2 && list.data[0].usage && list.data[0].limits && list.data[0].owner, list.data?.[0]);
  check('org list exposes no password / chats', !/password|chats|message/i.test(txt));
  check('invalid org id -> 404', (await req('GET', '/organizations/zzz', SA)).status === 404);

  console.log(`\n${pass} passed, ${fail} failed`);
  if (fail) console.log('FAILED:\n - ' + failures.join('\n - '));
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
