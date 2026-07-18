import { api } from './api';
import { resolveTemplateId } from './context';

export interface ConfigField {
  key: string;
  type: 'text' | 'image' | 'color' | 'number' | 'select' | 'boolean' | string;
  label: string;
  defaultValue: any;
  group: string;
  options: string[];
}

export interface TemplateConfig {
  id: string;
  name: string;
  slug: string;
  configSchema: ConfigField[];
  configValues: Record<string, any>;
  supportedLanguages: string[];
  supportsDarkMode: boolean;
}

/**
 * Fetches the admin-editable configuration (labels, images, colors, ...) for a
 * template from the public backend endpoint:  GET /template/:id/config
 *
 * Falls back to the provided defaults if the template id can't be resolved or
 * the request fails, so previews still render.
 */
export const loadConfig = async (
  templateId?: string,
  fallback: Record<string, any> = {},
): Promise<Record<string, any>> => {
  const id = templateId || resolveTemplateId();
  if (!id) return fallback;

  try {
    const { data } = await api.get<TemplateConfig>(`/template/${id}/config`);
    return { ...fallback, ...(data?.configValues || {}) };
  } catch {
    return fallback;
  }
};

/** Reads a single config value with a default. */
export const configValue = <T = any>(
  config: Record<string, any>,
  key: string,
  fallback: T,
): T => {
  const val = config?.[key];
  return val === undefined || val === null || val === '' ? fallback : (val as T);
};
