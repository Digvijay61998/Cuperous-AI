// ** Type import
import { VerticalNavItemsType } from 'src/@core/layouts/types';
import { RoleEnum } from 'src/utils/role.enum';
import { NAV_TITLE_TAB, ROLE_TABS } from 'src/utils/role-tabs';

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
        // {
        //   title: 'Scraping',
        //   // icon: 'material-symbols:screen-search-desktop-rounded',
        //   path: '/scraping',
        // },
      ],
    },
    {
      title: 'Service Requests',
      icon: 'carbon:request-quote',
      path: '/service-request/list',
    },
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
const navigation = (role?: string): VerticalNavItemsType => {
  if (role === RoleEnum.SUPER_ADMIN) return superAdminNavigation();

  const allowedTabs = ROLE_TABS[role ?? ''] ?? ROLE_TABS[RoleEnum.ORG_ADMIN];
  return orgNavigation().filter((item: any) => {
    const tab = NAV_TITLE_TAB[item.title];
    // Unmapped items stay visible; mapped items require the tab.
    return tab === undefined || allowedTabs.includes(tab);
  });
};

export default navigation;
