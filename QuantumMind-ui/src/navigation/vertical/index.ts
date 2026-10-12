// ** Type import
import { VerticalNavItemsType } from 'src/@core/layouts/types';
import { RoleEnum } from 'src/utils/role.enum';
import { NAV_TITLE_TAB, tabsForRole } from 'src/utils/role-tabs';
import { CrmPlugin, crmMenuChildren } from 'src/views/crm/plugins/crmPlugins';

// Dedicated sidebar for the super-admin console.
const superAdminNavigation = (): VerticalNavItemsType => [
  {
    title: 'Organizations',
    icon: 'bx:buildings',
    path: '/super-admin',
  },
];

const orgNavigation = (): VerticalNavItemsType => {
  return [
    {
      title: 'Dashboards',
      icon: 'bx:home-circle',
      // badgeContent: 'new',
      // badgeColor: 'error',
      path: '/dashboards/analytics',
    },
    {
      title: 'Conversations',
      icon: 'bx:message',
      path: '/apps/chat',
      children: [
        {
          title: 'Active',
          path: '/apps/chat/active',
        },
        {
          title: 'History',
          path: '/apps/chat/history',
        },
        {
          title: 'Blocked',
          path: '/apps/chat/blocked',
        },
      ],
    },
    {
      title: 'Bots',
      icon: 'ant-design:robot-filled',
      path: '/bots/list',
    },

    {
      title: 'Agents',
      icon: 'bx:user',
      path: '/agent/list',
    },
    {
      title: 'Visitors',
      icon: 'fa6-solid:people-group',
      path: '/visitors/list',
    },
    {
      title: 'Management',
      icon: 'material-symbols:settings-suggest-rounded',
      path: '',
      children: [
        // {
        //   title: 'Webhooks',
        //   // icon: 'tabler:fish-hook',
        //   path: '/webhooks/list',
        // },
        {
          title: 'Segments',
          // icon: 'carbon:cics-system-group',
          path: '/segments/list',
        },
        {
          title: 'Tags',
          // icon: 'ant-design:tag-filled',
          path: '/tag/list',
        },
        {
          title: 'Organization',
          path: '/organization/settings',
        },
        // {
        //   title: 'Scraping',
        //   // icon: 'material-symbols:screen-search-desktop-rounded',
        //   path: '/scraping',
        // },
      ],
    },
    // Service Requests moved under CRM (crm-plugins-service-desk R17.5).
    {
      title: 'Question Bank',
      icon: 'wpf:faq',
      path: '/question-bank/list',
    },
    {
      title: 'Templates',
      icon: 'material-symbols-light:web-sharp',
      path: '/templates/list',
    },
    {
      title: 'CRM',
      icon: 'bx:group',
      path: '',
      children: [
        {
          title: 'Overview',
          path: '/crm',
        },
        {
          title: 'Contacts',
          path: '/crm/contacts',
        },
        {
          title: 'Companies',
          path: '/crm/companies',
        },
        {
          title: 'Deals',
          path: '/crm/deals',
        },
      ],
    },
    {
      title: 'Marketing',
      icon: 'mdi:marketplace',
      path: '',
      children: [
        {
          title: 'Advertisements',
          // icon: 'icons8:advertising',
          path: '/advertisements/list',
        },
        {
          title: 'Offers',
          // icon: 'bxs:offer',
          path: '/offers/list',
        },
      ],
    },
    {
      title: 'Social Messengers',
      icon: 'ion:social-buffer',
      path: '/social/list',
    },
    {
      title: 'Channel Providers',
      icon: 'carbon:connect',
      path: '/messaging/providers',
    },
    {
      title: 'Reports',
      icon: 'mdi:graph-box-outline',
      path: '',
      children: [
        {
          title: 'Bots',
          path: '/reports/bots',
        },
        {
          title: 'Agents',
          path: '/reports/agents',
        },
        {
          title: 'Service Requests',
          path: '/reports/service-request',
        },
        {
          title: 'Visitors',
          path: '/reports/visitors',
        },
        {
          title: 'Webhooks',
          path: '/reports/webhooks',
        },
        {
          title: 'Segments',
          path: '/reports/segments',
        },
        {
          title: 'Advertisements',
          path: '/reports/advertisements',
        },
        {
          title: 'Offers',
          path: '/reports/offers',
        },
        {
          title: 'Social Messenger',
          path: '/reports/social',
        },
      ],
    },
    {
      title: 'Support',
      icon: 'material-symbols:support',
      path: '',
      // children: [
      //   {
      //     title: 'Videos',
      //     // icon: 'bxs:videos',
      //     path: '/videos/list',
      //   },
      // ],
    },
  ];
};

/**
 * Role-aware sidebar. Super admin gets the console nav; everyone else gets the
 * org nav filtered to the tabs their role may see (handles top-level groups,
 * which the path-based access() check can't gate because their path is empty).
 */
/** Nav titles hidden when the org's plan does not enable the feature. */
const FEATURE_GATED_TITLES: Record<string, string> = {
  'Question Bank': 'question-bank',
  Advertisements: 'advertisements',
  Offers: 'offers',
};

const navigation = (
  role?: string,
  features?: Record<string, boolean> | null,
  crmPlugins?: CrmPlugin[] | null,
): VerticalNavItemsType => {
  if (role === RoleEnum.SUPER_ADMIN) return superAdminNavigation();
  // The CRM sub-menu follows the org's plugins (crm-plugins-service-desk R8.1).
  const withCrm = (items: any[]) =>
    items.map((item) => (item.title === 'CRM' ? { ...item, children: crmMenuChildren(crmPlugins, role) } : item));

  // Unknown feature map (still loading) => do not hide anything.
  const featureOn = (title: string) => {
    const key = FEATURE_GATED_TITLES[title];
    return !key || !features || features[key] === true;
  };

  // Fail closed: unknown / missing roles see no org tabs.
  const allowedTabs = tabsForRole(role);
  return withCrm(orgNavigation())
    .map((item: any) =>
      // CRM children carry their own tab: an agent sees the group with only
      // Service Requests in it (R17.1, R17.2).
      item.title === 'CRM'
        ? { ...item, children: item.children.filter((c: any) => allowedTabs.includes(c.tab ?? 'crm')) }
        : item,
    )
    .filter((item: any) => {
      if (item.title === 'CRM') return item.children.length > 0;
      const tab = NAV_TITLE_TAB[item.title];
      // Unmapped items are hidden (fail closed); mapped items require the tab.
      return tab !== undefined && allowedTabs.includes(tab) && featureOn(item.title);
    })
    .map((item: any) =>
      item.children
        ? { ...item, children: item.children.filter((c: any) => featureOn(c.title)) }
        : item,
    )
    .filter((item: any) => !item.children || item.children.length > 0);
};

export default navigation;
