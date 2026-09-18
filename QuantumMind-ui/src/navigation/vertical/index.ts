// ** Type import
import { VerticalNavItemsType } from 'src/@core/layouts/types';

const navigation = (): VerticalNavItemsType => {
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
  
    // {
    //     title: 'Documentation',
    //     icon: 'simple-icons:readthedocs',
    //     path: '',
    //     children: [
    //       {
    //         title: 'Webhooks',
    //         // icon: 'mdi:hook',
    //         path: '/documentation/webhook',
    //       },
    //     ],
    // }
  ];
};

export default navigation;
