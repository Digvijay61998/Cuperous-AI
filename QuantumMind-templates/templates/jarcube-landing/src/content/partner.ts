import type { PartnerConfig } from '../types';

/**
 * Partner programme content.
 *
 * `commissionRatePct` and `monthlySalesExample` drive the commission table —
 * the displayed figures are computed from these, never hard-coded in markup,
 * so changing the rate updates every number shown.
 *
 * The comparison rows describe limitations of generic alternatives in neutral
 * category terms and deliberately name no competitor product.
 */
export const partner: PartnerConfig = {
  commissionRatePct: 20,
  monthlySalesExample: 200000,
  exampleMonths: 3,

  benefits: [
    {
      title: 'A product that keeps getting better',
      body: 'New integrations, AI improvements and features your clients ask for ship continuously. You are selling something that is further ahead each quarter, not a product frozen at launch.',
    },
    {
      title: 'Clients who stay',
      body: 'Once a business runs its customer conversations through JarCube, switching means rebuilding flows and retraining a team. That makes your commission recurring in practice, not just on paper.',
    },
    {
      title: 'Demand that already exists',
      body: 'You are not explaining why WhatsApp matters — businesses already run on it and already know their current setup does not scale. The gap sells itself.',
    },
    {
      title: 'We handle the hard part',
      body: 'Complex flow builds, API work and technical escalations come to our team. You own the client relationship; we own the engineering.',
    },
  ],

  modelTerms: [
    'You receive 20% of total client billing as recurring commission, for as long as the client stays.',
    'JarCube retains 80%, covering platform usage, automation setup, support and ongoing development.',
    'Meta WhatsApp messaging charges are paid directly by the client or by you. JarCube does not absorb these.',
    'Reselling above an agreed price threshold is possible, subject to mutual discussion first.',
  ],

  featureGroups: [
    {
      group: 'Conversations',
      items: [
        { name: 'Live chat', body: 'Handle high-priority customers in real time from a shared queue.' },
        { name: 'Internal collaboration', body: 'Pull a colleague into a conversation privately, without the customer seeing it.' },
        { name: 'Load distribution', body: 'Spread incoming chats across available agents instead of piling them on whoever is fastest.' },
        { name: 'Transfers', body: 'Move a chat to another agent or department with its full history attached.' },
        { name: 'AI handover', body: 'The assistant passes a conversation to a human when it reaches something it should not answer.' },
        { name: 'Interactive flows', body: 'Collect data, show option lists and branch on replies inside the chat.' },
      ],
    },
    {
      group: 'Team management',
      items: [
        { name: 'Granular permissions', body: 'Set precisely what each role can see and act on.' },
        { name: 'Departments', body: 'Group agents and route conversations to the right group automatically.' },
        { name: 'Audit logs', body: 'A record of who did what, available on higher plans.' },
      ],
    },
    {
      group: 'Outbound',
      items: [
        { name: 'Broadcast campaigns', body: 'Send approved templates to segments built from contact data and behaviour.' },
        { name: 'Personalisation', body: 'Pull values from each contact record so messages read individually.' },
        { name: 'Audience sources', body: 'Build recipient lists from the CRM, a manual upload, or a connected data source.' },
        { name: 'Triggers', body: 'Schedule a send, or fire one from a flow or an external system.' },
      ],
    },
    {
      group: 'Integrations',
      items: [
        { name: 'CRM sync', body: 'Keep contacts and deal data aligned with the system that owns it.' },
        { name: 'Webhooks', body: 'Notify your systems the moment something happens in a conversation.' },
        { name: 'REST API', body: 'Drive messages, flows and contact updates from your own software.' },
        { name: 'Connector platforms', body: 'Reach the rest of your stack through Zapier and similar tools, without writing code.' },
      ],
    },
    {
      group: 'Analytics',
      items: [
        { name: 'Campaign reporting', body: 'Delivery, read and click figures per campaign as they land.' },
        { name: 'Segmentation', body: 'Cut the numbers by audience to see which groups actually respond.' },
        { name: 'Funnel drop-off', body: 'Find the step in a flow where people stop, so you know what to fix.' },
        { name: 'Custom KPIs', body: 'Choose the measures that matter to the business and track those.' },
      ],
    },
    {
      group: 'Knowledge base',
      items: [
        { name: 'Documents', body: 'Upload PDFs and guides for the assistant to answer from.' },
        { name: 'Website ingestion', body: 'Point it at pages you nominate and it learns from what is already published.' },
        { name: 'Structured data', body: 'Search records in natural language and trigger automations from the results.' },
      ],
    },
  ],

  responsibilities: [
    {
      title: 'First-line support',
      owner: 'partner',
      body: 'You handle everyday client questions — onboarding queries, how a feature works, general usage doubts. Clients get a fast answer from someone they already know, which is a large part of why they stay.',
    },
    {
      title: 'Technical support',
      owner: 'jarcube',
      body: 'Platform bugs, API problems and integration failures come to our engineers. You pass the issue on and we resolve it, rather than you carrying technical load you did not sign up for.',
    },
    {
      title: 'Straightforward flow builds',
      owner: 'partner',
      body: 'Welcome messages, booking confirmations, basic lead capture — you can set these up if you want to. We supply ready-made templates and training so it stays quick.',
    },
    {
      title: 'Complex flow builds',
      owner: 'jarcube',
      body: 'Anything involving AI logic, dynamic variables, API calls or multi-system integration is built end to end by our automation team. You gather what the client needs and hand it over.',
    },
  ],

  comparison: [
    {
      category: 'Automation intelligence',
      generic: 'Rule-based replies that break the moment a customer phrases something unexpectedly',
      jarcube: 'AI trained on your documents and past conversations, so it handles variation',
    },
    {
      category: 'Routing',
      generic: 'Manual assignment, with chats sitting unclaimed until somebody notices',
      jarcube: 'Automatic routing by department, with AI-suggested replies for the agent who picks it up',
    },
    {
      category: 'Reporting depth',
      generic: 'Message counts and little else',
      jarcube: 'Campaign and flow-level reporting, including where in a flow people drop off',
    },
    {
      category: 'Answer quality',
      generic: 'A generic bot that cannot speak to your specifics',
      jarcube: 'Answers grounded in your own knowledge base, FAQs and CRM data',
    },
    {
      category: 'Seat and feature costs',
      generic: 'Per-agent charges and paywalled features that inflate the real monthly figure',
      jarcube: 'Seats and features stated up front per plan, with no mid-term surprises',
    },
    {
      category: 'Support model',
      generic: 'Outsourced tiers where nobody owns your problem',
      jarcube: 'In-house support handling onboarding, training and escalation',
    },
    {
      category: 'Messaging charges',
      generic: 'A markup quietly added on top of Meta conversation rates',
      jarcube: "Meta's actual rates billed separately, with no markup from us",
    },
  ],
};
