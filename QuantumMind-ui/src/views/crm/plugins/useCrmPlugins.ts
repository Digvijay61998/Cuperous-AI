import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from 'src/store';
import { fetchCrmPlugins, loadCachedCrmPlugins } from 'src/store/apps/crm-plugins';
import { CrmPlugin, CrmPluginKey, isPluginOn } from './crmPlugins';

/**
 * The org's CRM plugins for a page. Loads them when the layout has not yet
 * (direct link). While unknown, every plugin counts as on: the API decides.
 */
export const useCrmPlugins = () => {
  const dispatch = useDispatch<AppDispatch>();
  const plugins = useSelector((state: RootState) => (state as any).crmPlugins?.list ?? null) as CrmPlugin[] | null;
  const loading = useSelector((state: RootState) => !!(state as any).crmPlugins?.loading);
  const saving = useSelector((state: RootState) => !!(state as any).crmPlugins?.saving);
  useEffect(() => {
    if (plugins) return;
    dispatch(loadCachedCrmPlugins());
    dispatch(fetchCrmPlugins());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const isOn = (key: CrmPluginKey) => isPluginOn(plugins, key);
  return { plugins, loading, saving, isOn };
};

export default useCrmPlugins;
