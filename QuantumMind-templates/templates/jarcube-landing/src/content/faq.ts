import type { FaqEntry } from '../types';

/**
 * FAQ content — rendered by /, /partner and /contact through one shared
 * component, so an edit here lands on all three.
 *
 * Answers ship in the initial HTML rather than being fetched, so they are
 * indexable and readable with JavaScript disabled.
 */
export const faq: FaqEntry[] = [
  {
    question: 'What does JarCube actually do?',
    answer:
      'JarCube sits on top of your WhatsApp Business number and gives you one dashboard for it. Your team answers chats from a shared inbox, an AI assistant handles the routine questions on its own, automated flows carry customers through booking or ordering, and broadcast campaigns go out to segments you choose.',
  },
  {
    question: 'Can I keep the WhatsApp number I already use?',
    answer:
      'Usually yes. An existing number can be migrated to the WhatsApp Business API, or we can set you up with a new one. There are a few constraints depending on how the number is currently registered, and we will walk through them with you during onboarding.',
  },
  {
    question: 'Do I need a developer to set this up?',
    answer:
      'No. The flow builder works by dragging blocks into place, campaigns and the knowledge base are managed from the dashboard, and none of it requires code. If you do want to wire JarCube into your own systems, the API and webhooks are there for your developers.',
  },
  {
    question: 'How many people from my team can use it?',
    answer:
      'That depends on your plan — Starter includes 2 agent seats, Growth 5, Business 15, and Enterprise is unlimited. On every plan you can group agents into departments, set what each role can see, and route incoming chats to the right person.',
  },
  {
    question: 'Will it connect to my CRM or online store?',
    answer:
      'Yes. There are direct integrations for common CRMs, Google Sheets and Shopify, with Salesforce and HubSpot on Business and above. Anything else can be connected through our API, webhooks, or a connector platform such as Zapier.',
  },
  {
    question: 'How do WhatsApp message charges work?',
    answer:
      'Meta charges per message at its own published rates, and those charges are billed to you separately. Your JarCube subscription covers the platform itself — the inbox, automation, AI and team features. We do not add a markup on top of what Meta charges.',
  },
  {
    question: 'What support do I get?',
    answer:
      'Every plan includes support during business hours, and we help you through initial setup so you are not staring at an empty dashboard. Growth and above move you to priority support, and Business adds hands-on onboarding assistance.',
  },
  {
    question: 'Is there a free trial?',
    answer:
      'Growth comes with a 14-day free trial so you can build a flow, connect a number and see how it handles real conversations before committing. If you would rather be walked through it, book a demo and we will show you the parts relevant to your business.',
  },
];
