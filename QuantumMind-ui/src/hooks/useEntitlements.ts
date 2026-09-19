import { useCallback, useEffect, useState } from 'react';
import Axios from 'src/helper/Axios';

export interface EntitlementLimits {
  maxBots: number;
  maxAgents: number;
  maxPlatforms: number;
  maxTemplates: number;
}

export interface Entitlements {
  role: string;
  organizationId: string | null;
  allowedTabs: string[];
  limits: EntitlementLimits | null;
  features: Record<string, boolean> | null;
  usage: { bots: number; agents: number; templates: number } | null;
}

type CountedResource = 'bots' | 'agents' | 'templates';

const LIMIT_KEY: Record<CountedResource, keyof EntitlementLimits> = {
  bots: 'maxBots',
  agents: 'maxAgents',
  templates: 'maxTemplates',
};

/**
 * Fetches the current user's effective entitlements (limits, usage, features)
 * from /me/entitlements so the UI can gate create actions and features. The
 * backend still enforces everything; this only improves UX.
 */
export const useEntitlements = () => {
  const [entitlements, setEntitlements] = useState<Entitlements | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const refetch = useCallback(() => {
    setLoading(true);
    Axios.get('/me/entitlements')
      .then((res) => setEntitlements(res.data))
      .catch(() => setEntitlements(null))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  /** Whether the org can create another of `resource` (true when unlimited/unknown). */
  const canCreate = useCallback(
    (resource: CountedResource): boolean => {
      if (!entitlements?.limits || !entitlements?.usage) return true;
      const max = entitlements.limits[LIMIT_KEY[resource]];
      const used = (entitlements.usage as any)[resource] ?? 0;
      return used < max;
    },
    [entitlements],
  );

  const isFeatureEnabled = useCallback(
    (key: string): boolean => {
      if (!entitlements?.features) return true;
      return entitlements.features[key] === true;
    },
    [entitlements],
  );

  return { entitlements, loading, refetch, canCreate, isFeatureEnabled };
};

export default useEntitlements;
