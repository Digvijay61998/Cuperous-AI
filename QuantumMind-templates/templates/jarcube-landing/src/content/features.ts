import type { FeaturePage } from '../types';

/**
 * Feature content — drives the landing-page feature grid and the five
 * /features/:slug detail pages. Slugs must match FEATURE_SLUGS in routes.ts.
 */
export const features: FeaturePage[] = [
  {
    slug: 'shared-inbox',
    cardTitle: 'Shared inbox for your whole team',
    cardSummary:
      'Put every agent on one WhatsApp number, with routing that lands each chat in the right hands.',
    icon: 'inbox',
    title: 'One WhatsApp number, your entire team',
    intro:
      'A single business number is easy to advertise and impossible to staff from one phone. The shared inbox puts your whole team behind that number without anyone stepping on anyone else.',
    sections: [
      {
        heading: 'Departments that match how you already work',
        body: 'Group agents into sales, support, accounts — whatever your structure is. Incoming chats are routed to the department that should own them, so nobody triages a queue that is not theirs.',
      },
      {
        heading: 'Roles and permissions',
        body: 'Decide what each role can see and do. Agents see the conversations assigned to them, leads see the whole queue, and sensitive customer data stays visible only to the people who need it.',
      },
      {
        heading: 'Assignment and handover',
        body: 'Chats can be claimed, reassigned, or passed to another department mid-conversation with the full history intact. When the AI assistant reaches something it should not answer, it hands the chat to a human rather than guessing.',
      },
      {
        heading: 'Internal notes',
        body: 'Leave context on a conversation for whoever picks it up next. Notes stay internal and never reach the customer.',
      },
    ],
  },

  {
    slug: 'flow-builder',
    cardTitle: 'Drag-and-drop flow builder',
    cardSummary:
      'Build automated WhatsApp journeys by dragging blocks around — no code, no developer queue.',
    icon: 'flow',
    title: 'Build conversation flows by dragging blocks',
    intro:
      'A flow is the path a customer takes through a conversation: what you ask, what you send, and what happens based on their answer. You build it visually and change it whenever you like.',
    sections: [
      {
        heading: 'Ask, branch, act',
        body: 'Collect an answer, branch on what you get back, and take an action — send a document, book a slot, save a field, notify an agent. Each step is a block you drop onto the canvas.',
      },
      {
        heading: 'Interactive replies',
        body: 'Use buttons and list pickers instead of asking customers to type. Fewer typos, fewer misread answers, and a noticeably faster path to the outcome.',
      },
      {
        heading: 'Data that carries through',
        body: 'What a customer tells you early in a flow is available later in the same flow and afterwards in their contact record, so nobody is asked the same question twice.',
      },
      {
        heading: 'Change it without a deploy',
        body: 'Edit a live flow and the next conversation uses the new version. No release process, no waiting on an engineering sprint.',
      },
    ],
  },

  {
    slug: 'knowledge-base',
    cardTitle: 'AI trained on your own content',
    cardSummary:
      'Point the assistant at your documents, website and CRM fields so its answers sound like your business.',
    icon: 'robot',
    title: 'An assistant that knows your business',
    intro:
      'A generic bot gives generic answers. Train the assistant on what you have already written — your documents, your site, your policies — and its replies reflect how your business actually operates.',
    sections: [
      {
        heading: 'Bring your own documents',
        body: 'Upload PDFs, price lists, policy documents and internal guides. The assistant draws on them when answering, so customers get your details rather than an approximation.',
      },
      {
        heading: 'Learn from your website',
        body: 'Point it at your site and it reads the pages you nominate. Anything already published becomes something the assistant can answer from.',
      },
      {
        heading: 'CRM fields as context',
        body: 'Let the assistant use what you already know about a contact — their plan, their last order, their pending request — so replies are specific to the person asking.',
      },
      {
        heading: 'Instructions and boundaries',
        body: 'Set the tone it writes in and the topics it must not attempt. When a question falls outside what it should handle, it hands over to a human instead of improvising.',
      },
    ],
  },

  {
    slug: 'marketing-campaigns',
    cardTitle: 'Campaigns with real-time analytics',
    cardSummary:
      'Run broadcasts and watch delivery, opens and clicks land as they happen.',
    icon: 'megaphone',
    title: 'Broadcasts you can actually measure',
    intro:
      'Sending is the easy half. Knowing which segment opened, which link pulled clicks, and which message quietly failed is what makes the next campaign better than the last.',
    sections: [
      {
        heading: 'Segments, not one big list',
        body: 'Build audiences from contact fields, tags, and past behaviour — customers who ordered last month, leads who never replied, anyone tagged for a particular product.',
      },
      {
        heading: 'Templates with real personalisation',
        body: 'Compose approved WhatsApp templates with variables that pull from each contact record, so a broadcast reads like a message rather than a circular.',
      },
      {
        heading: 'Live delivery reporting',
        body: 'Watch delivered, read and clicked counts move while the campaign is going out. Failures are surfaced with a reason rather than disappearing silently.',
      },
      {
        heading: 'Scheduling and follow-up',
        body: 'Schedule a send for when your audience is actually awake, then trigger a follow-up flow for the people who engaged.',
      },
    ],
  },

  {
    slug: 'whatsapp-api-integration',
    cardTitle: 'API and webhook integration',
    cardSummary:
      'Connect JarCube to the tools you already run and trigger actions in both directions.',
    icon: 'plug',
    title: 'Connect JarCube to the rest of your stack',
    intro:
      'A conversation is rarely the whole job. An order needs to reach your system, a lead needs to land in your CRM, a payment needs recording. The API and webhooks make JarCube a participant in those workflows rather than a silo.',
    sections: [
      {
        heading: 'Webhooks out',
        body: 'Have JarCube notify your systems when something happens — a flow completes, a lead qualifies, a chat is assigned. Your endpoint receives the event and does whatever it needs to.',
      },
      {
        heading: 'API in',
        body: 'Trigger a message, start a flow, or update a contact from your own software. Anything you can do in the dashboard can be driven programmatically.',
      },
      {
        heading: 'CRM and store sync',
        body: 'Keep contacts and order data in step with the systems that own them, so your inbox reflects the same reality as your CRM.',
      },
      {
        heading: 'Connector platforms',
        body: 'If you would rather not write code, connect through a platform like Zapier and wire JarCube to the apps you already use there.',
      },
    ],
  },
];

/** Look up one feature page by slug. */
export const featureBySlug = (slug: string): FeaturePage | undefined =>
  features.find((f) => f.slug === slug);
