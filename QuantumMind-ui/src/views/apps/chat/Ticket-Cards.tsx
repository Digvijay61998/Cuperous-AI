// ** MUI Imports
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useSelector } from 'react-redux';
import CustomChip from 'src/@core/components/mui/chip';
import { ThemeColor } from 'src/@core/layouts/types';
import { RootState } from 'src/store';

const TicketCards = () => {
  const { visitorDataList } = useSelector((state: RootState) => state.visitors);
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
  return (
    <Stack direction="column" flexWrap="wrap" gap="1">
      {visitorDataList?.serviceRequests &&
      visitorDataList?.serviceRequests.legnth ? (
        visitorDataList?.serviceRequests.map((ticket: any, index: number) => (
          <Card key={index} sx={{ mb: 3 }}>
            <CardHeader title={ticket?.subject} sx={{ mb: -4 }} />
            <CardContent>
              {ticket?.description && (
                <Typography variant="body2">{ticket?.description}</Typography>
              )}
              {ticket?.tags && ticket?.tags.length > 0 && (
                <Stack direction="row" flexWrap="wrap" sx={{ mt: 2 }}>
                  <span style={{ marginRight: '0.5rem' }}>Tags: </span>{' '}
                  <Stack direction="row" flexWrap="wrap" gap={1}>
                    {ticket?.tags &&
                      ticket?.tags.map((tag: any, index: number) => (
                        <CustomChip
                          rounded
                          skin="light"
                          key={index}
                          label={tag}
                          size="small"
                        />
                      ))}
                  </Stack>
                </Stack>
              )}
            </CardContent>
            <CardActions className="card-action-dense">
              <Stack
                direction="row"
                justifyContent="space-between"
                width="100%"
                alignItems="center"
              >
                {ticket?.priority && (
                  <Stack direction="row" flexWrap="wrap" sx={{ mt: 2 }}>
                    <span style={{ marginRight: '0.5rem' }}>Priority: </span>{' '}
                    <CustomChip
                      rounded
                      skin="light"
                      label={ticket?.priority}
                      color={serviceRequestObj[ticket.priority?.toLowerCase()]}
                      size="small"
                    />
                  </Stack>
                )}

                {ticket?.status && (
                  <Stack direction="row" flexWrap="wrap" sx={{ mt: 2 }}>
                    <span style={{ marginRight: '0.5rem' }}>Status: </span>{' '}
                    <CustomChip
                      rounded
                      skin="light"
                      label={ticket?.status}
                      color={serviceRequestObj[ticket.status?.toLowerCase()]}
                      size="small"
                    />
                  </Stack>
                )}
              </Stack>
              {/* <Button>Read More</Button> */}
            </CardActions>
          </Card>
        ))
      ) : (
        <Typography variant="body2" sx={{textAlign:"center"}}>No Service Requests Found</Typography>
      )}
    </Stack>
  );
};

export default TicketCards;
