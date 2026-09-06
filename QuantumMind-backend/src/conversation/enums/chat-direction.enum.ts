/**
 * Which way a message travelled, from the platform's point of view.
 *
 * Distinct from `Chat.sender` because on a social channel the two do not line
 * up: a message the operator types on their own phone is OUTBOUND, but its
 * sender is neither our bot nor a dashboard agent.
 */
export enum ChatDirectionEnum {
  /** From the external contact to us. */
  INBOUND = 'inbound',
  /** From us (bot, dashboard agent, or the operator's own phone) to the contact. */
  OUTBOUND = 'outbound',
}
