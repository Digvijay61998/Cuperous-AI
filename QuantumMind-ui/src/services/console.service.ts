import Axios from 'src/helper/Axios';

export interface OrgLimits {
  maxBots: number;
  maxAgents: number;
  maxPlatforms: number;
  maxTemplates: number;
}

export interface OrgMeta {
  id: string;
  name: string;
  slug: string;
  status: 'active' | 'suspended';
  ownerId: string | null;
  plan: string | null;
  subscriptionStatus: string | null;
  limits: OrgLimits | null;
  features: Record<string, boolean> | null;
  usage: { bots: number; agents: number; templates: number };
  counts: { orgManagers: number; agents: number };
  createdAt?: string;
}

export interface OverviewData {
  organizations: number;
  orgAdmins: number;
  orgManagers: number;
  agents: number;
  bots: number;
  activeSubscriptions: number;
}

export interface PlanData {
  _id: string;
  name: string;
  limits: OrgLimits;
  features: Record<string, boolean>;
}

export interface CreateOrgPayload {
  name: string;
  owner: { name: string; email: string; password: string };
  planId: string;
  limits?: Partial<OrgLimits>;
  features?: Record<string, boolean>;
}

export const ConsoleService = {
  overview: () =>
    Axios.get<OverviewData>('/admin/overview').then((r) => r.data),

  plans: () => Axios.get<PlanData[]>('/admin/plans').then((r) => r.data),

  listOrganizations: () =>
    Axios.get<OrgMeta[]>('/organizations').then((r) => r.data),

  createOrganization: (payload: CreateOrgPayload) =>
    Axios.post('/organizations', payload).then((r) => r.data),

  updateOrganization: (
    id: string,
    changes: {
      status?: 'active' | 'suspended';
      planId?: string;
      limits?: Partial<OrgLimits>;
      features?: Record<string, boolean>;
    },
  ) => Axios.patch(`/organizations/${id}`, changes).then((r) => r.data),

  impersonate: (id: string) =>
    Axios.post<{ accessToken: string; organizationId: string }>(
      `/organizations/${id}/impersonate`,
      {},
    ).then((r) => r.data),
};

export default ConsoleService;
