// ** React Imports
import { SyntheticEvent, useEffect, useState } from 'react';

// ** Next Import
import { useRouter } from 'next/router';

// ** MUI Imports
import MuiTabList, { TabListProps } from '@mui/lab/TabList';
import { styled, Theme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';

// ** Icon Imports

// ** Demo Components Imports
import UserViewAccount from 'src/views/visitors/view/VisitorViewAccount';

// ** Types



//  ** Styled TabList component
const TabList = styled(MuiTabList)<TabListProps>(({ theme }) => ({
  minHeight: 40,
  marginBottom: theme.spacing(6),
  '& .MuiTabs-indicator': {
    display: 'none',
  },
  '& .MuiTab-root': {
    minWidth: 65,
    minHeight: 40,
    paddingTop: theme.spacing(2.5),
    paddingBottom: theme.spacing(2.5),
    borderRadius: theme.shape.borderRadius,
    '&.Mui-selected': {
      color: theme.palette.common.white,
      backgroundColor: theme.palette.primary.main,
    },
  },
}));

interface Props {
  tab: string
  visitorId: string
}

const VisitorViewRight = ({ tab, visitorId}: Props) => {
  

  return <UserViewAccount tab={tab} visitorId={visitorId}/>;
};

export default VisitorViewRight;
