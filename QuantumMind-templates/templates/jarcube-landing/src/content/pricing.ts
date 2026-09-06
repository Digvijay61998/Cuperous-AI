import type { PricingConfig } from '../types';

/**
 * JarCube pricing — the single source read by BOTH the /pricing page and the
 * landing-page teaser, so the two can never show contradicting prices.
 *
 * Message figures are JarCube *platform automation* allowances. Meta's
 * per-message WhatsApp fees are billed separately and directly, which the
 * disclaimer below states plainly.
 */
export const pricing: PricingConfig = {
  currencySymbol: '₹',
  annualSavingsPct: 17,

  metaChargesDisclaimer:
    'WhatsApp messaging fees are charged separately by Meta at their current rates. Your JarCube subscription covers the platform, automation, AI and team features.',

  allowanceNote:
    'Message figures are JarCube automation allowances, not WhatsApp message quotas.',

  tiers: [
    {
      id: 'starter',
      name: 'Starter',
      positioning: 'For small businesses getting started with WhatsApp automation.',
      monthly: 999,
      annual: 9990,
      mostPopular: false,
      limits: {
        agents: '2 agents',
        contacts: '1,000 contacts',
        messages: '2,000 automation messages / month',
        flows: '5 flows',
        numbers: '1 WhatsApp number',
      },
      headlineLimits: '2 agents · 1,000 contacts · 2,000 messages',
      inheritsFrom: null,
      features: [
        'WhatsApp shared inbox',
        'Basic chatbot',
        'Lead and contact management',
        'Tags and custom fields',
        'Quick replies',
        'WhatsApp templates',
        'Website chatbot',
        'Basic analytics',
        'Basic API access',
        'Email support',
      ],
      cta: { kind: 'signup', label: 'Start free' },
    },

    {
      id: 'growth',
      name: 'Growth',
      positioning:
        'For growing businesses automating sales, support and customer engagement.',
      monthly: 2999,
      annual: 29990,
      mostPopular: true,
      limits: {
        agents: '5 agents',
        contacts: '5,000 contacts',
        messages: '10,000 automation messages / month',
        flows: '25 flows',
        numbers: '2 WhatsApp numbers',
      },
      headlineLimits: '5 agents · 5,000 contacts · 10,000 messages',
      inheritsFrom: 'Starter',
      features: [
        'Advanced flow builder',
        'AI chatbot with AI-powered replies',
        'Lead qualification',
        'Automated follow-ups',
        'Appointment booking',
        'Broadcast campaigns',
        'Customer segmentation',
        'Conversation routing and agent assignment',
        'Advanced analytics and conversion tracking',
        'Webhooks and full API access',
        'CRM, Google Sheets and Shopify integrations',
        'Priority support',
      ],
      cta: { kind: 'trial', label: 'Start 14-day free trial' },
    },

    {
      id: 'business',
      name: 'Business',
      positioning:
        'For businesses running high conversation volume across multiple teams.',
      monthly: 7999,
      annual: 79990,
      mostPopular: false,
      limits: {
        agents: '15 agents',
        contacts: '25,000 contacts',
        messages: '50,000 automation messages / month',
        flows: 'Unlimited flows',
        numbers: '5 WhatsApp numbers',
      },
      headlineLimits: '15 agents · 25,000 contacts · 50,000 messages',
      inheritsFrom: 'Growth',
      features: [
        'Multiple advanced AI agents',
        'Advanced RAG knowledge base',
        'Custom AI instructions',
        'Multiple inboxes',
        'Team-based routing',
        'Role-based access control',
        'Campaign analytics',
        'Customer journey automation',
        'Custom webhooks and raised API limits',
        'Salesforce, HubSpot and custom integrations',
        'Audit logs',
        'Onboarding assistance',
      ],
      cta: { kind: 'demo', label: 'Book a demo' },
    },

    {
      id: 'enterprise',
      name: 'Enterprise',
      positioning:
        'For organisations that need scale, security and custom integrations.',
      // Null on both renders a custom-pricing label rather than a figure.
      monthly: null,
      annual: null,
      mostPopular: false,
      limits: {
        agents: 'Unlimited agents',
        contacts: 'Custom contacts',
        messages: 'Custom volume',
        flows: 'Unlimited flows',
        numbers: 'Custom WhatsApp numbers',
      },
      headlineLimits: 'Unlimited agents · Custom contacts · Custom volume',
      inheritsFrom: 'Business',
      features: [
        'Multiple businesses and workspaces',
        'Custom RAG knowledge bases',
        'Custom AI models',
        'Dedicated infrastructure options',
        'SSO and RBAC',
        'Advanced security and audit logs',
        'Custom API limits',
        'Dedicated support with an SLA',
        'Dedicated account manager',
        'Onboarding and migration',
        'Custom reporting',
      ],
      cta: { kind: 'sales', label: 'Talk to sales' },
    },
  ],
};
