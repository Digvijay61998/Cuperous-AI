import { ComponentType } from 'react';
import { CrmPluginKey } from './crmPlugins';
import PluginOffState from './PluginOffState';
import useCrmPlugins from './useCrmPlugins';

/**
 * Wrap a CRM page so it shows "This module is turned off" while its plugin
 * is off (crm-plugins-service-desk R8.2). The page's own data calls would get
 * 403 anyway; this avoids rendering an empty, broken page.
 */
export function withCrmPlugin<P extends object>(
  Page: ComponentType<P>,
  key: CrmPluginKey,
  label: string,
  icon?: string,
) {
  const Gated = (props: P) => {
    const { isOn } = useCrmPlugins();
    if (!isOn(key)) return <PluginOffState label={label} icon={icon} />;
    return <Page {...props} />;
  };
  Gated.displayName = `withCrmPlugin(${Page.displayName || Page.name || 'Page'})`;
  return Gated;
}

export default withCrmPlugin;
