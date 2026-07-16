// ** React Imports
import { useEffect } from 'react';

import Link from 'next/link';
// ** MUI Imports
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import Grid from '@mui/material/Grid';
import { styled } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from 'src/store';

// ** Third Party Imports
import { Button, Chip, Divider, Stack } from '@mui/material';
import { useRouter } from 'next/router';

// ** Icon Imports
import Icon from 'src/@core/components/icon';

// ** Custom Components Imports
import CustomChip from 'src/@core/components/mui/chip';
import { ThemeColor } from 'src/@core/layouts/types';

import { getChatLogsById } from 'src/store/apps/service-request';
import ChatLog from 'src/views/apps/chat/ChatLog';
import TimeLineActivity from 'src/views/service-request/list/view/TimeLineActivity';

interface StatusPriorityType {
  [key: string]: ThemeColor;
}
const serviceRequestObj: StatusPriorityType = {
  active: 'success',
  pending: 'warning',
  low: 'info',
  medium: 'warning',
  high: 'error',
  deferred: 'error',
  open: 'warning',
  closed: 'success',
  critical: 'error',
};

const StyledLink = styled('a')(({ theme }) => ({
  fontWeight: 600,
  fontSize: '1rem',
  cursor: 'pointer',
  textDecoration: 'none',
  color: theme.palette.text.secondary,
  '&:hover': {
    color: theme.palette.primary.main,
  },
}));

const InvoiceListTable = (agentDetail: any) => {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const store = useSelector((state: any) => state.serviceRequest.ticketData);

  const { chatLogData } = useSelector(
    (state: RootState) => state.serviceRequest,
  );

  useEffect(() => {
    if (store.conversationId) dispatch(getChatLogsById(store.conversationId));
  }, [store.conversationId]);


  return (
    <div>
      <Card>
        <Stack
          direction="row"
          justifyContent="space-between"
          // width="98%"
          alignItems="center"
          sx={{ p: '1.5rem' }}
        >
          <CardHeader title="Service Request" sx={{ p: 0 }} />

          <div style={{ display: 'flex', gap: 5 }}>
            {/* <ChatLogs id={store.conversationId} /> */}
            <Button
              variant="contained"
              size="small"
              onClick={(e: any) => router.back()}
              startIcon={<Icon icon="eva:arrow-back-fill" fontSize="20" />}
            >
              Back
            </Button>
          </div>
        </Stack>

        <Divider />

        <Grid container spacing={5} sx={{ p: 6 }}>
            {/*  Add title Visitor Details in oneline */}
            <Grid item xs={12}>
            <Typography variant="h6" component={'span'}>
             Service Request Details
            </Typography>
          </Grid>
          
          <Grid item xs={4}>
            <div style={{ display: 'flex', flexWrap: 'wrap' }}>
              <div>{'Bot Name :'}</div> &nbsp;
              <Link href={`/bots/settings/${store?.bot?._id}`} passHref>
                <StyledLink>{store?.bot?.name}</StyledLink>
              </Link>
            </div>
          </Grid>

          <Grid item xs={4}>
            <div style={{ display: 'flex', flexWrap: 'wrap' }}>
              <div>{'Status :'}</div> &nbsp;
              <CustomChip
                rounded
                skin="light"
                size="small"
                label={store?.status}
                color={serviceRequestObj[store?.status?.toLowerCase()]}
              />
            </div>
          </Grid>

          <Grid
            item
            xs={4}
            style={{
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Typography variant="body2" component={'span'}>
              {/* {store?.takenBy?.name ? (<>
              Taken by&nbsp;
              <Link
                href={`/agent/view/${store?.takenBy?._id}`}
                passHref
              >
                <StyledLink>{store?.takenBy?.name}</StyledLink>
              </Link>
              </>):(<>
                Not taken by any agent
              </>)}
              &nbsp; &  */}
              Last updated at&nbsp;
              <Typography variant="body2" component={'span'}>
                {new Date(store?.updatedAt || null).toLocaleDateString(
                  'en-US',
                  {
                    hour: 'numeric',
                    minute: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  },
                )}
              </Typography>
            </Typography>
          </Grid>

          <Grid item xs={4}>
            <div style={{ display: 'flex', flexWrap: 'wrap' }}>
              <div>{'Agents :'}</div> &nbsp;
              {store?.agents?.length > 0 ? (
                <>
                  {store?.agents?.map((obj: any, index: number) => (
                    <Chip
                      key={index}
                      label={obj?.name || obj?._id || obj}
                      size="small"
                      color="primary"
                      style={{
                        margin: '2px',
                        fontSize: '11px',
                      }}
                    />
                  ))}
                </>
              ) : (
                <Typography variant="body2" style={{ lineHeight: '1.9' }}>
                  N/A
                </Typography>
              )}
            </div>
          </Grid>

          <Grid item xs={8}>
            <div style={{ display: 'flex', flexWrap: 'wrap' }}>
              <div>{'Tags :'}</div> &nbsp;
              {store?.tags?.length > 0 ? (
                <>
                  {store?.tags?.map((obj: any, index: number) => (
                    <Chip
                      key={index}
                      label={obj}
                      size="small"
                      color="primary"
                      style={{
                        margin: '2px',
                        fontSize: '11px',
                      }}
                    />
                  ))}
                </>
              ) : (
                <Typography variant="body2" style={{ lineHeight: '1.9' }}>
                  N/A
                </Typography>
              )}
            </div>
          </Grid>

          <Grid item xs={12}>
            <div style={{ display: 'flex', flexWrap: 'wrap' }}>
              <div>{'Subject :'}</div> &nbsp;
              <Typography variant="body2" style={{ lineHeight: '1.9' }}>
                {store?.subject}
                {/* <Chip label={store?.ticketId} /> */}
              </Typography>
            </div>
          </Grid>

          <Grid item xs={12}>
            <div style={{ display: 'flex', flexWrap: 'wrap' }}>
              <div>{'Description :'}</div> &nbsp;
              <Typography variant="body2" style={{ lineHeight: '1.9' }}>
                {store?.description || 'N/A'}
              </Typography>
            </div>
          </Grid>
        </Grid>

        <Divider />
        <Grid container spacing={5} sx={{ p: 6 }}>
          {/*  Add title Visitor Details in oneline */}
          <Grid item xs={12}>
            <Typography variant="h6" component={'span'}>
              Visitor Details
            </Typography>
          </Grid>

          <Grid item xs={4}>
            <div style={{ display: 'flex', flexWrap: 'wrap' }}>
              <div>{'Visitor name :'}</div> &nbsp;
              <Link href={`/visitors/view/${store?.visitor?._id}`} passHref>
                <StyledLink>{store?.visitor?.name}</StyledLink>
              </Link>
            </div>
          </Grid>

          <Grid item xs={4}>
            <div style={{ display: 'flex', flexWrap: 'wrap' }}>
              <div>{'Priority :'}</div> &nbsp;
              <CustomChip
                rounded
                skin="light"
                size="small"
                label={store?.priority}
                color={serviceRequestObj[store?.priority?.toLowerCase()]}
              />
            </div>
          </Grid>
          <Grid item xs={4}>
            <Typography variant="body2" component={'span'}>
              Created on &nbsp;
              <Typography variant="body2" component={'span'}>
                {new Date(store?.createdAt || null).toLocaleDateString(
                  'en-US',
                  {
                    hour: 'numeric',
                    minute: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  },
                )}
              </Typography>
            </Typography>
          </Grid>

          <Grid item xs={4}>
            <div style={{ display: 'flex', flexWrap: 'wrap' }}>
              <div>{'Phone Number :'}</div> &nbsp;
              <Typography variant="body2" style={{ lineHeight: '1.9' }}>
                {store?.visitor?.phone}
              </Typography>
            </div>
          </Grid>

          <Grid item xs={4}>
            <div style={{ display: 'flex', flexWrap: 'wrap' }}>
              <div>{'Email Address :'}</div> &nbsp;
              <Typography variant="body2" style={{ lineHeight: '1.9' }}>
                {store?.visitor?.email}
              </Typography>
            </div>
          </Grid>
        </Grid>
      </Card>
      <br />

      <Grid container spacing={6} className="match-height">
        <Grid item xs={12} sm={6}>
          <Card sx={{ p: 5 }}>
            <CardHeader title="Activities" sx={{ p: 0 }} />
            <TimeLineActivity activity={store?.activities || []} />
          </Card>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Card sx={{ p: 5, maxHeight: '500px' }}>
            <CardHeader title="Conversation" sx={{ p: 0 }} />
            {/* <Box sx={{overflowY:'scroll'}}> */}
            <ChatLog hidden={false} data={chatLogData} />
            {/* </Box> */}
          </Card>
        </Grid>
      </Grid>
    </div>
  );
};

export default InvoiceListTable;
