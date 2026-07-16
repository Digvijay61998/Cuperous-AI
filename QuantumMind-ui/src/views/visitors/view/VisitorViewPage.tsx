import { useEffect, useState } from 'react';

// ** MUI Imports
import Grid from '@mui/material/Grid';

// ** Types

// ** Demo Components Imports
import VisitorViewLeft from 'src/views/visitors/view/VisitorViewLeft';
import VisitorViewRight from 'src/views/visitors/view/VisitorViewRight';

import { useSelector } from 'react-redux';
import { RootState } from 'src/store';
// ** Utils Import
import { useDispatch } from 'react-redux';
import { AppDispatch } from 'src/store';
import { fetchVisitorDetail } from 'src/store/apps/visitor';

type Props = {
  tab: string
  
  visitorId: any
  //visitorDetail: any

}


const VisitorView = ({ tab, visitorId}: Props) => {
  return (
    <Grid container spacing={6}>
      <Grid item xs={12} md={5} lg={4}>
        <VisitorViewLeft visitorId={visitorId}/>
      </Grid>
      <Grid item xs={12} md={7} lg={8}>
        <VisitorViewRight tab={tab} visitorId={visitorId} />
      </Grid>
    </Grid>
  )
}

export default VisitorView
