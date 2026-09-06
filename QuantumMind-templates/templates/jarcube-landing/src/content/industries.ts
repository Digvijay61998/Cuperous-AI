import type { Industry } from '../types';

/**
 * Industry content — read by three surfaces:
 *   1. /industry index cards
 *   2. the eight /industry/:slug detail pages
 *   3. the landing-page demo cards
 *
 * Slugs must match INDUSTRY_SLUGS in routes.ts.
 */
export const industries: Industry[] = [
  {
    slug: 'healthcare',
    name: 'Healthcare',
    painPoint:
      'Reception spends the morning on the phone booking slots and reading out report statuses, and follow-ups slip through when nobody has time to chase them.',
    question: 'Still booking appointments and chasing reports by phone?',
    useCases: [
      'Patients pick an appointment slot in chat and get a confirmation plus a reminder the day before',
      'Reports and prescriptions go out as documents the moment they are ready',
      'Routine questions on timings, departments and preparation instructions are answered instantly',
      'Post-visit follow-ups go out on schedule without anyone remembering to send them',
    ],
    icon: 'stethoscope',
  },
  {
    slug: 'real-estate',
    name: 'Real Estate',
    painPoint:
      'Enquiries arrive at all hours and go cold within the day, and sending a floor plan means digging through folders to find the right file.',
    question: 'Still answering property enquiries hours after they arrive?',
    useCases: [
      'Every enquiry gets an instant reply with location, price band and availability',
      'Brochures and floor plans are delivered in chat as soon as someone asks',
      'Leads are qualified on budget and timeline before they reach an agent',
      'Site visits are booked and confirmed without a single phone call',
    ],
    icon: 'building',
  },
  {
    slug: 'finance',
    name: 'Finance',
    painPoint:
      'Clients ask for the same statements and forms over and over, and each request means someone finds a file and emails it manually.',
    question: 'Still emailing statements and forms one request at a time?',
    useCases: [
      'Policy documents, statements and application forms are delivered on request',
      'Repeat questions on charges, eligibility and process are handled automatically',
      'New enquiries are qualified before they reach an advisor',
      'Renewal and payment reminders go out on their own schedule',
    ],
    icon: 'bank',
  },
  {
    slug: 'distributors',
    name: 'Distributors',
    painPoint:
      'Order-taking runs on scattered chats and calls, and the team answers the same pricing and delivery questions several times a day.',
    question: 'Still taking orders across scattered chats and calls?',
    useCases: [
      'Retailers place and repeat orders directly in chat',
      'Stock availability is confirmed without a call to the warehouse',
      'Price lists and catalogues are shared instantly on request',
      'Dispatch and delivery updates reach buyers without anyone typing them',
    ],
    icon: 'truck',
  },
  {
    slug: 'education',
    name: 'Education',
    painPoint:
      'Admission season buries the office in the same questions on courses, fees and documents, and prospectus requests pile up unanswered.',
    question: 'Still fielding the same admission questions all season?',
    useCases: [
      'Course details, fee structures and eligibility are answered on the spot',
      'Prospectuses and application forms are sent the moment they are requested',
      'Enquiries are captured with the course and intake the student wants',
      'Deadline and document reminders go out to applicants automatically',
    ],
    icon: 'graduation',
  },
  {
    slug: 'home-services',
    name: 'Home Services',
    painPoint:
      'Bookings are taken by phone into a notebook or spreadsheet, double-bookings happen, and no-shows cost a slot that could have been filled.',
    question: 'Still taking bookings by phone into a spreadsheet?',
    useCases: [
      'Customers see open slots and book without waiting on a callback',
      'Confirmations and day-before reminders cut no-shows',
      'Service and pricing questions are answered before booking',
      'Follow-ups invite repeat bookings after the job is done',
    ],
    icon: 'wrench',
  },
  {
    slug: 'e-commerce',
    name: 'E-commerce',
    painPoint:
      '"Where is my order?" fills the inbox, return requests get buried, and product questions go unanswered long enough to lose the sale.',
    question: 'Still drowning in order-status and return messages?',
    useCases: [
      'Order confirmations and shipping updates are sent as status changes',
      'Return and refund requests are collected and routed in chat',
      'Product questions on sizing, stock and specifics are answered instantly',
      'Abandoned carts get a nudge while the customer is still deciding',
    ],
    icon: 'cart',
  },
  {
    slug: 'automobiles',
    name: 'Automobiles',
    painPoint:
      'Test drive requests sit unanswered while the buyer shops elsewhere, and service reminders only go out when somebody remembers.',
    question: 'Still losing test drive leads to a slow reply?',
    useCases: [
      'Test drives are booked and confirmed straight from chat',
      'Service reminders go out on schedule by vehicle',
      'Model, variant and finance questions are answered without a callback',
      'Warm leads are followed up until they book or opt out',
    ],
    icon: 'car',
  },
];

/** Look up one industry by slug. */
export const industryBySlug = (slug: string): Industry | undefined =>
  industries.find((i) => i.slug === slug);

/** Subset shown on the landing page demo grid. */
export const landingIndustrySlugs = [
  'distributors',
  'home-services',
  'healthcare',
  'finance',
  'e-commerce',
  'real-estate',
] as const;
