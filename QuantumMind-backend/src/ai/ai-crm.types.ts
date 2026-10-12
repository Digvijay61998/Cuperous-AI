/**
 * Request/response contracts for the CRM-related AI endpoints
 * (crm-incident-handover design, "AI service" table). The AI side returns
 * snake_case, so these mirror the wire format.
 */

export interface VisitorProfileOpenIssue {
  text: string;
  since?: string;
  incidentId?: string;
  ticketRef?: string;
}

export interface VisitorProfileEntry {
  /** The conversation this entry is for (idempotency key, R18.2). */
  conversationId?: string;
  at: string;
  tz?: string;
  bot?: string;
  channel?: string;
  summary: string;
  tags?: string[];
  outcome?: string;
  incidentId?: string;
  ticketRef?: string;
  agent?: string;
  problem?: string;
  resolution?: string;
  /** False for the deterministic fallback entry (R11.7). */
  ai?: boolean;
}

export interface VisitorProfileEarlier {
  from?: string;
  to?: string;
  summary: string;
  /** How many entries were folded in. */
  count?: number;
  incidentRefs?: string[];
  incidentIds?: string[];
}

export interface VisitorProfile {
  v: 1;
  facts: {
    interests?: string[];
    products?: string[];
    preferences?: string[];
    openIssues?: VisitorProfileOpenIssue[];
    language?: string;
  };
  adminOverrides?: Record<string, unknown>;
  /** Newest first. */
  entries: VisitorProfileEntry[];
  earlier?: VisitorProfileEarlier | null;
}

export interface ProfileMergeChat {
  role: "visitor" | "bot" | "agent" | "ai" | string;
  text: string;
  at: string;
}

export interface ProfileMergeRequest {
  profile?: VisitorProfile | null;
  chats: ProfileMergeChat[];
  incident?: Record<string, unknown>;
  org_tz: string;
  bot?: string;
  channel: string;
  compress?: boolean;
  conversation_id?: string;
  ended_at?: string;
}

export interface ProfileMergeResponse {
  profile: VisitorProfile;
  tokens_used?: number;
  provider?: string;
  model?: string;
}

export interface KnowledgeCandidateRequest {
  problem: string;
  resolution: string;
  company?: string;
}

export interface KnowledgeCandidateResponse {
  question: string;
  answer: string;
}

export interface KnowledgeSimilarRequest {
  client_id: string;
  text: string;
  source_prefix?: string;
}

export interface KnowledgeSimilarResponse {
  best?: { source: string; score: number } | null;
}

export interface ExtractContactResponse {
  name?: string;
  email?: string;
  phone?: string;
}

// --- Service request summary (crm-plugins-service-desk R15) -------------------

export interface ServiceRequestSummaryRequest {
  subject: string;
  description?: string | null;
  /** Masked lines, oldest first. */
  transcript: { from: string; text: string }[];
  language?: string;
}

export interface ServiceRequestSummaryResponse {
  overview: string;
  customer_ask: string;
  actions_taken: string;
  next_step: string;
}
