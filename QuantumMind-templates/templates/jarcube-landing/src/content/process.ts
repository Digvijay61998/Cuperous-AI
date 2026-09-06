import type { ProcessStep } from '../types';

/**
 * The six-step story told on the landing page: how a conversation becomes a
 * customer, and what JarCube does at each stage.
 */
export const processSteps: ProcessStep[] = [
  {
    heading: 'Answer while they are still interested',
    body: 'The first reply sets the tone. Incoming messages get an instant, useful response instead of sitting in a queue until someone is free — which is usually after the person has moved on.',
  },
  {
    heading: 'Ask the questions that matter',
    body: 'Rather than a wall of form fields, a short conversation collects what you actually need: what they want, when they want it, and how to reach them. Answers land in the contact record automatically.',
  },
  {
    heading: 'Put each chat in the right hands',
    body: 'Sales questions reach sales, support reaches support. Routing happens on the way in, so nobody triages a queue that is not theirs and no conversation sits unclaimed.',
  },
  {
    heading: 'Close without the friction',
    body: 'Book the slot, confirm the order, take the detail you were missing — inside the same conversation. No links to a separate portal, no asking them to start again somewhere else.',
  },
  {
    heading: 'Follow up when it is worth following up',
    body: 'Reminders and nudges go out on their own schedule, based on what the customer actually did. Nobody has to keep a mental list of who needs chasing.',
  },
  {
    heading: 'See what is working',
    body: 'Which flows convert, where people drop off, which campaigns earned a reply. The reporting points at the specific step to fix rather than handing you a total.',
  },
];
