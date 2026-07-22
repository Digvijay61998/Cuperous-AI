export const MESSAGE_HANDLER_QUEUE = "message-handler";

/**
 * Maximum number of workflow nodes a single inbound message may traverse.
 * A normal static flow can legitimately traverse 15-20+ nodes in one pass
 * (start -> response -> input -> response -> ticket -> response -> ...).
 * Set high enough to never interfere with real flows, but low enough to stop
 * true infinite loops before they cause harm. 30 is safe for all legitimate
 * flows while stopping cycles within a few seconds.
 */
export const MAX_NODE_HOPS = 30;
