export const defaultNodes = {
  nodes: [
    {
      id: '1',
      data: {
        label: 'Start Point',
        icon: 'ant-design:home-filled',
        title: 'Start Point',
      },
      position: {
        x: 50,
        y: 250,
      },
      type: 'start_node',
      className: 'flow_customNode__BuuZa',
      width: 157,
      height: 32,
      nodeType: 'START_NODE',
    },
    {
      data: {
        label: 'Bot Response',
        icon: 'bi:send-fill',
        title: 'Welcome Message',
      },
      position: {
        x: 335,
        y: 173,
      },
      id: 'node_v7rWfOnDtPVhm1gwCPBF9',
      type: 'custom_node',
      nodeType: 'BOT_RESPONSE',
      width: 174,
      height: 34,
      selected: false,
      positionAbsolute: {
        x: 335,
        y: 173,
      },
      dragging: false,
    },
    {
      data: {
        label: 'Fall Back',
        icon: 'pajamas:false-positive',
        title: 'Default Fall Back',
      },
      position: {
        x: 340,
        y: 321,
      },
      id: 'node_Zj-Z6xx_0IDFy81Iukh5a',
      type: 'custom_node',
      nodeType: 'FALL_BACK',
      width: 143,
      height: 34,
      selected: false,
      positionAbsolute: {
        x: 340,
        y: 321,
      },
      dragging: false,
    },
    {
      data: {
        label: 'Bot Response',
        icon: 'bi:send-fill',
        title: 'Fallback Message',
      },
      position: {
        x: 563,
        y: 320,
      },
      id: 'node_jhKveyEVEyAPSG95Pxxrs',
      type: 'custom_node',
      nodeType: 'BOT_RESPONSE',
      width: 174,
      height: 34,
      selected: true,
      positionAbsolute: {
        x: 563,
        y: 320,
      },
      dragging: false,
    },
  ],
  edges: [
    {
      id: 'el-node_v7rWfOnDtPVhm1gwCPBF9',
      source: '1',
      target: 'node_v7rWfOnDtPVhm1gwCPBF9',
    },
    {
      id: 'el-node_Zj-Z6xx_0IDFy81Iukh5a',
      source: '1',
      target: 'node_Zj-Z6xx_0IDFy81Iukh5a',
    },
    {
      id: 'el-node_jhKveyEVEyAPSG95Pxxrs',
      source: 'node_Zj-Z6xx_0IDFy81Iukh5a',
      target: 'node_jhKveyEVEyAPSG95Pxxrs',
    },
  ],
};
