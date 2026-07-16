import React, { SyntheticEvent, useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import AppBar from '@mui/material/AppBar';
import CssBaseline from '@mui/material/CssBaseline';
import Toolbar from '@mui/material/Toolbar';
import List from '@mui/material/List';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import { Paper } from '@mui/material';
import TreeView from '@mui/lab/TreeView'
import TreeItem from '@mui/lab/TreeItem'

// ** Icon Imports
import Icon from 'src/@core/components/icon'
import WebhookParagraph from 'src/views/documentation/webhook/webhook';
import GettingStartedPara from 'src/views/documentation/webhook/gettingStarted';
import { useRouter } from 'next/router';
import GetStartAdAccountsPara from 'src/views/documentation/webhook/getStartAdAccounts';
import GetStartCertTransparencyPara from 'src/views/documentation/webhook/getStartCertTransparency';
import GetStartInstagramPara from 'src/views/documentation/webhook/getStartInstagram';
import GetStartLeadsPara from 'src/views/documentation/webhook/getStartLeads';
import GetStartMessengerPara from 'src/views/documentation/webhook/getStartMessenger';
import GetStartPaymentsPara from 'src/views/documentation/webhook/getStartPayments';
import GetStartPagesPara from 'src/views/documentation/webhook/getStartPages';
import GetStartWhatsappBAccountsPara from 'src/views/documentation/webhook/getStartWhatsappBAccounts';
import SampleAppsPara from 'src/views/documentation/webhook/sampleApps';
import SubscriptionEdgePara from 'src/views/documentation/webhook/subscriptionEdge';
import ReferencePara from 'src/views/documentation/webhook/reference';
import RefAdAccountPara from 'src/views/documentation/webhook/refAdAccount';
import RefApplicationPara from 'src/views/documentation/webhook/refApplication';
import RefCertTransparencyPara from 'src/views/documentation/webhook/refCertTransparency';
import RefInstagramPara from 'src/views/documentation/webhook/refInstagram';
import RefPagePara from 'src/views/documentation/webhook/refPage';
import RefPermissionsPara from 'src/views/documentation/webhook/refPermissions';
import RefUserPara from 'src/views/documentation/webhook/refUser';
import RefWhatsappBAccountPara from 'src/views/documentation/webhook/refWhatsappBAccount';

const drawerWidth = 240;

type Props = {};

interface TreeProps {
  direction: 'ltr' | 'rtl'
}

export default function WebhookDocPage({ direction='ltr' }: TreeProps) {
  const router = useRouter()
  const { tab } = router.query
  // ** States
  const [expanded, setExpanded] = useState<string[]>([])
  const [selected, setSelected] = useState<any>([])

  useEffect(() => {
    if(tab === '2'){
      setExpanded(['2']);
      setSelected(tab);  
    } else if(tab === '3') {
      setExpanded(['2']);
      setSelected(tab); 
    } else if(tab === '4') {
      setExpanded(['2']);
      setSelected(tab); 
    } else if(tab === '5') {
      setExpanded(['2']);
      setSelected(tab); 
    } else if(tab === '6') {
      setExpanded(['2']);
      setSelected(tab); 
    } else if(tab === '7') {
      setExpanded(['2']);
      setSelected(tab); 
    } else if(tab === '8') {
      setExpanded(['2']);
      setSelected(tab); 
    } else if(tab === '9') {
      setExpanded(['2']);
      setSelected(tab); 
    } else if(tab === '10') {
      setExpanded(['2']);
      setSelected(tab); 
    } else if(tab === '11') {
      setExpanded([]);
      setSelected(tab); 
    } else if(tab === '12') {
      setExpanded([]);
      setSelected(tab); 
    } else if(tab === '13') {
      setExpanded(['13']);
      setSelected(tab);
    } else if(tab === '14') {
      setExpanded(['13']);
      setSelected(tab);
    } else if(tab === '15') {
      setExpanded(['13']);
      setSelected(tab);
    } else if(tab === '16') {
      setExpanded(['13']);
      setSelected(tab);
    } else if(tab === '17') {
      setExpanded(['13']);
      setSelected(tab);
    } else if(tab === '18') {
      setExpanded(['13']);
      setSelected(tab);
    } else if(tab === '19') {
      setExpanded(['13']);
      setSelected(tab);
    } else if(tab === '20') {
      setExpanded(['13']);
      setSelected(tab);
    } else if(tab === '21') {
      setExpanded(['13']);
      setSelected(tab);
    } else {
      setExpanded([]);
      setSelected('1');
    }
  
    return () => {}
  }, [tab]);
  

  const handleToggle = (event: SyntheticEvent, nodeIds: string[]) => {
    setExpanded(nodeIds);
  };

  const handleSelect = (event: SyntheticEvent, nodeIds: string[]) => {
    setSelected(nodeIds);
    // ** redirects to the router **
    // router.query.tab = nodeIds
    // router.push(router);
    // ** only replace the router **
    router.replace({
      query: { ...router.query, tab: nodeIds },
    });
  };

  const ExpandIcon = direction === 'rtl' ? 'bx:chevron-left' : 'bx:chevron-right';

  function changePara(nodeId: any) {
    if (nodeId === '2') {
      return <GettingStartedPara drawerWidth={drawerWidth} value={selected} />
    } else if (nodeId === '3') {
      return <GetStartAdAccountsPara drawerWidth={drawerWidth} value={selected} />
    } else if (nodeId === '4') {
      return <GetStartCertTransparencyPara drawerWidth={drawerWidth} value={selected} />
    } else if (nodeId === '5') {
      return <GetStartInstagramPara drawerWidth={drawerWidth} value={selected} />
    } else if (nodeId === '6') {
      return <GetStartLeadsPara drawerWidth={drawerWidth} value={selected} />
    } else if (nodeId === '7') {
      return <GetStartMessengerPara drawerWidth={drawerWidth} value={selected} />
    } else if (nodeId === '8') {
      return <GetStartPagesPara drawerWidth={drawerWidth} value={selected} />
    } else if (nodeId === '9') {
      return <GetStartPaymentsPara drawerWidth={drawerWidth} value={selected} />
    } else if (nodeId === '10') {
      return <GetStartWhatsappBAccountsPara drawerWidth={drawerWidth} value={selected} />
    } else if (nodeId === '11') {
      return <SampleAppsPara drawerWidth={drawerWidth} value={selected} />
    } else if (nodeId === '12') {
      return <SubscriptionEdgePara drawerWidth={drawerWidth} value={selected} />
    } else if (nodeId === '13') {
      return <ReferencePara drawerWidth={drawerWidth} value={selected} />
    } else if (nodeId === '14') {
      return <RefAdAccountPara drawerWidth={drawerWidth} value={selected} />
    } else if (nodeId === '15') {
      return <RefApplicationPara drawerWidth={drawerWidth} value={selected} />
    } else if (nodeId === '16') {
      return <RefCertTransparencyPara drawerWidth={drawerWidth} value={selected} />
    } else if (nodeId === '17') {
      return <RefInstagramPara drawerWidth={drawerWidth} value={selected} />
    } else if (nodeId === '18') {
      return <RefPagePara drawerWidth={drawerWidth} value={selected} />
    } else if (nodeId === '19') {
      return <RefPermissionsPara drawerWidth={drawerWidth} value={selected} />
    } else if (nodeId === '20') {
      return <RefUserPara drawerWidth={drawerWidth} value={selected} />
    } else if (nodeId === '21') {
      return <RefWhatsappBAccountPara drawerWidth={drawerWidth} value={selected} />
    } else {
      return <WebhookParagraph drawerWidth={drawerWidth} value={selected} />
    }
  }

  return (
    <Paper sx={{ display: 'flex', p:4 }}>
      <>
      <Box
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box' },
        }}
      >
        <Box sx={{ overflow: 'auto' }}>
          <TreeView
            expanded={expanded}
            selected={selected}
            sx={{ minHeight: 240 }}
            onNodeToggle={handleToggle}
            onNodeSelect={handleSelect}
            defaultExpandIcon={
              <Box sx={{ display: 'flex' }}>
                <Icon icon={ExpandIcon} />
              </Box>
            }
            defaultCollapseIcon={
              <Box sx={{ display: 'flex' }}>
                <Icon icon='bx:chevron-down' />
              </Box>
            }
          >
            <TreeItem nodeId='1' label='Webhooks' sx={{ py:1 }}/>

            <TreeItem nodeId='2' label='Getting Started' sx={{ py:1 }}>
              <TreeItem nodeId='3' label='Ad Accounts' sx={{ py:1 }}/>
              <TreeItem nodeId='4' label='Certificate Transparency' sx={{ py:1 }}/>
              <TreeItem nodeId='5' label='Instagram' sx={{ py:1 }}/>
              <TreeItem nodeId='6' label='Leads' sx={{ py:1 }}/>
              <TreeItem nodeId='7' label='Messenger' sx={{ py:1 }}/>
              <TreeItem nodeId='8' label='Pages' sx={{ py:1 }}/>
              <TreeItem nodeId='9' label='Payments' sx={{ py:1 }}/>
              <TreeItem nodeId='10' label='WhatsApp Business Account' sx={{ py:1 }}/>
            </TreeItem>

            <TreeItem nodeId='11' label='Sample Apps' sx={{ py:1 }}/>

            <TreeItem nodeId='12' label='Subscription Edge' sx={{ py:1 }}/>

            <TreeItem nodeId='13' label='Reference' sx={{ py:1 }}>
              <TreeItem nodeId='14' label='Ad Account' sx={{ py:1 }}/>
              <TreeItem nodeId='15' label='Application' sx={{ py:1 }}/>
              <TreeItem nodeId='16' label='Certificate Transparency' sx={{ py:1 }}/>
              <TreeItem nodeId='17' label='Instagram' sx={{ py:1 }}/>
              <TreeItem nodeId='18' label='Page' sx={{ py:1 }}/>
              <TreeItem nodeId='19' label='Permissions' sx={{ py:1 }}/>
              <TreeItem nodeId='20' label='User' sx={{ py:1 }}/>
              <TreeItem nodeId='21' label='WhatsApp Business Account' sx={{ py:1 }}/>
            </TreeItem>
            
          </TreeView>
        </Box>
      </Box>

      {changePara(selected)}
      </>
    </Paper>
  );
}
