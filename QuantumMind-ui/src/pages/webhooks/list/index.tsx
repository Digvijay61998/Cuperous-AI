// ** React Imports
import { useCallback, useEffect, useState } from 'react';

// ** Next Import
import Link from 'next/link';

// ** MUI Imports
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import { styled } from '@mui/material/styles';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { DataGrid } from '@mui/x-data-grid';

// ** Icon Imports
import Icon from 'src/@core/components/icon';

// ** Store Imports
import { useDispatch, useSelector } from 'react-redux';

// ** Custom Components Imports
import CardStatisticsHorizontal from 'src/@core/components/card-statistics/card-stats-horizontal';
import CustomChip from 'src/@core/components/mui/chip';

// ** Utils Import

// ** Third Party Components

// ** Types Imports
import { CardStatsHorizontalProps } from 'src/@core/components/card-statistics/types';
import { ThemeColor } from 'src/@core/layouts/types';
import { AppDispatch, RootState } from 'src/store';
import { UsersType } from 'src/types/apps/userTypes';

// ** Custom Table Components Imports
import { LoadingButton } from '@mui/lab';
import { Tooltip } from '@mui/material';
import { getWebhookCardStates } from 'src/store/apps/states';
import {
  fetchWebhookDetail,
  fetchWebhookList,
  testWebhook,
  updateWebhook
} from 'src/store/apps/webhook';
import TableHeader from 'src/views/webhooks/list/TableHeader';
import WebhookActivateDialog from 'src/views/webhooks/list/WebhookActivateDialog';
import WebhookDeleteDialog from 'src/views/webhooks/list/WebhookDeleteDialog';
import WebhookSuspendDialog from 'src/views/webhooks/list/WebhookSuspendDialog';
interface UserRoleType {
  [key: string]: { icon: string; color: string };
}

interface UserStatusType {
  [key: string]: ThemeColor;
}

// ** Vars
const userRoleObj: UserRoleType = {
  admin: { icon: 'bx:mobile-alt', color: 'error' },
  author: { icon: 'bx:cog', color: 'warning' },
  editor: { icon: 'bx:edit', color: 'info' },
  maintainer: { icon: 'bx:pie-chart-alt', color: 'success' },
  subscriber: { icon: 'bx:user', color: 'primary' },
};

interface CellType {
  row: UsersType;
}

const userStatusObj: UserStatusType = {
  Active: 'success',
  Inactive: 'secondary',
};

const StyledHead = styled('div')(({ theme }) => ({
  fontWeight: 600,
  fontSize: '1rem',
  // cursor: 'pointer',
  textDecoration: 'none',
  color: theme.palette.text.secondary,
  // '&:hover': {
  //   color: theme.palette.primary.main,
  // },
}));

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

const Webhooks = () => {
  const initialWebhookDetail = {
    name: '',
    url: '',
    verifyToken: '',
    headersKey: '',
    headersValue: '',
    basicAuthUsername: '',
    basicAuthPassword: '',
    // events:"",
    // isActive:true,
  };

  const [isLoading, setIsLoading] = useState<boolean>(false);

  // ** State
  const [value, setValue] = useState<string>('');
  const [pageSize, setPageSize] = useState<number>(10);

  // ** Hooks
  const dispatch = useDispatch<AppDispatch>();
  const store = useSelector((state: RootState) => state.webhook);

  const [webhookListDataFiltered, setWebhookListDataFiltered] = useState([]);
  useEffect(() => {
    dispatch(fetchWebhookList());
  }, [dispatch]);

  useEffect(() => {
    if (value && value.trim() !== '') {
      let queryLowered = value.toLowerCase();
      const filteredData = store?.webhookListData.data.filter(
        (item: any) =>
          item.name.toLowerCase().includes(queryLowered) ||
          item.url.toLowerCase().includes(queryLowered),
      );
      setWebhookListDataFiltered(filteredData);
    } else {
      setWebhookListDataFiltered(store?.webhookListData?.data);
    }
  }, [value, store?.webhookListData?.data]);

  const handleFilter = useCallback((val: string) => {
    setValue(val);
  }, []);

  const [webhookCardData, setWebhookCardData] = useState<any>([]);
  const { webhookStates } = useSelector((state: RootState) => state.states);
  useEffect(() => {
    if (dispatch) dispatch(getWebhookCardStates());
  }, [dispatch]);
  const avatarIcons: any = {
    webhook: 'material-symbols:webhook-rounded',
    calls: 'fluent:call-24-filled',
    success: 'fluent:call-checkmark-24-filled',
    failed: 'fluent:call-dismiss-24-filled',
  };
  useEffect(() => {
    if (webhookStates && webhookStates.length > 0) {
      let mapArr = webhookStates.map((item: any) => {
        return {
          ...item,
          stats: item.stats.toString(),
          avatarIcon: avatarIcons[item.type],
          avatarColor: item.title.toLowerCase().includes('failed')
            ? 'error'
            : item.title.toLowerCase().includes('success')
            ? 'success'
            : 'primary',
        };
      });
      setWebhookCardData(mapArr);
    }
  }, [webhookStates]);
  // ** Edit and delete process
  const [openEdit, setOpenEdit] = useState<boolean>(false);
  const [webhookIdDialog, setWebhookIdDialog] = useState<any>('');
  const [webhookDetails, setWebhookDetails] =
    useState<any>(initialWebhookDetail);

  useEffect(() => {
    if (store?.selectedWebhookData) {
      setWebhookDetails(store?.selectedWebhookData);
    } else {
      setWebhookDetails({});
    }
  }, [dispatch, store?.selectedWebhookData]);

  // Handle Edit dialog
  const handleEditClickOpen = (id: any) => {
    dispatch(fetchWebhookDetail(id));
    setWebhookIdDialog(id);
    setOpenEdit(true);
  };
  const handleEditClickClose = () => {
    setWebhookDetails(initialWebhookDetail);
    setWebhookIdDialog('');
    setOpenEdit(false);
  };
  const handleEditClickSubmit = (event: any) => {
    event.preventDefault();
    setIsLoading(true);
    dispatch(
      updateWebhook({
        id: webhookIdDialog,
        data: webhookDetails,
      }),
    );
    setIsLoading(false);
    handleEditClickClose();
  };

  // ** delete, suspend, activate, test dialog and selected webhook
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [suspendDialogOpen, setSuspendDialogOpen] = useState<boolean>(false);
  const [activateDialogOpen, setActivateDialogOpen] = useState<boolean>(false);
  const [testDialogOpen, setTestDialogOpen] = useState<boolean>(false);
  const [selectedWebhookId, setSelectedWebhookId] = useState<any>('');
  // ** functions delete webhook
  const handleDeleteDialog = (id: any) => {
    setSelectedWebhookId(id);
    setDeleteDialogOpen(true);
  };
  // ** functions suspend webhook
  const handleSuspendDialog = (id: any) => {
    setSelectedWebhookId(id);
    setSuspendDialogOpen(true);
  };
  // ** functions activate webhook
  const handleActivateDialog = (id: any) => {
    setSelectedWebhookId(id);
    setActivateDialogOpen(true);
  };
  // ** functions test webhook
  const handleTestDialog = (id: any) => {
    setIsLoading(true);
    setSelectedWebhookId(id);
    // call API to test webhook
    dispatch(testWebhook(id));
    setIsLoading(false);
    // setTestDialogOpen(true);
  };

  const columns = [
    {
      flex: 0.2,
      minWidth: 240,
      field: 'name',
      headerName: 'Name',
      renderCell: ({ row }: any) => {
        return (
          <Box
            sx={{ display: 'flex', alignItems: 'center', overflow: 'hidden' }}
          >
            {/* {renderClient(row)} */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'flex-start',
                flexDirection: 'column',
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  gap: 1,
                  alignItems: 'flex-start',
                }}
              >
                <StyledHead>{row?.name}</StyledHead>
                <CustomChip
                  rounded
                  skin="light"
                  size="small"
                  label={row.isActive ? 'Active' : 'Inactive'}
                  color={userStatusObj[row.isActive ? 'Active' : 'Inactive']}
                  sx={{ fontSize: '0.6rem' }}
                />
              </Box>
              <Typography
                // noWrap
                variant="caption"
                sx={{ color: 'text.disabled' }}
              >
                {row?.url}
              </Typography>
            </Box>
          </Box>
        );
      },
    },
    // {
    //   flex: 0.1,
    //   field: 'url',
    //   minWidth: 120,
    //   headerName: 'URL',
    //   renderCell: ({ row }: any) => {
    //     return (
    //       <Box sx={{ display: 'flex', alignItems: 'center' }}>
    //         <Typography
    //           noWrap
    //           sx={{ color:'text.secondary', textTransform:'none' }}
    //         >
    //           {row?.url || 'N/A'}
    //         </Typography>
    //       </Box>
    //     );
    //   },
    // },
    {
      flex: 0.1,
      minWidth: 60,
      headerName: 'Total Calls',
      field: 'totalRequests',
      renderCell: ({ row }: any) => {
        return (
          <Typography noWrap sx={{ color: 'text.secondary' }}>
            {row.succesRequests + row.failedRequests}
          </Typography>
        );
      },
    },
    {
      flex: 0.1,
      minWidth: 60,
      headerName: 'Success Calls',
      field: 'succesRequests',
      renderCell: ({ row }: any) => {
        return (
          <Typography noWrap sx={{ color: 'text.secondary' }}>
            {row.succesRequests}
          </Typography>
        );
      },
    },
    {
      flex: 0.1,
      minWidth: 60,
      headerName: 'Failed Calls',
      field: 'failedRequests',
      renderCell: ({ row }: any) => {
        return (
          <Typography noWrap sx={{ color: 'text.secondary' }}>
            {row.failedRequests}
          </Typography>
        );
      },
    },
    {
      flex: 0.1,
      minWidth: 60,
      headerName: 'Basic Auth',
      field: 'basicAuth',
      renderCell: ({ row }: any) => {
        return (
          <Typography
            noWrap
            sx={{ color: 'text.secondary' }}
            // color={row?.basicAuthUsername?'success':'error'}
          >
            {row?.basicAuthUsername ? 'YES' : 'NO'}
          </Typography>
        );
      },
    },
    {
      flex: 0.1,
      minWidth: 60,
      headerName: 'Headers',
      field: 'header',
      renderCell: ({ row }: any) => {
        return (
          <Typography
            noWrap
            sx={{ color: 'text.secondary' }}
            // color={row?.headersKey?'success':'error'}
          >
            {row?.headersKey ? 'YES' : 'NO'}
          </Typography>
        );
      },
    },
    {
      flex: 0.1,
      minWidth: 120,
      sortable: false,
      field: 'actions',
      headerName: 'Actions',
      renderCell: ({ row }: any) => {
        return (
          <>
            <Tooltip title={'Edit'} placement="top" arrow>
              <IconButton
                aria-label="Edit"
                size="small"
                color="primary"
                sx={{ mr: 2 }}
                onClick={() => handleEditClickOpen(row?._id || row?.id)}
              >
                <Icon icon="bx:pencil" fontSize={20} />
              </IconButton>
            </Tooltip>
            {row?.isActive ? (
              <Tooltip title={'Suspend'} placement="top" arrow>
                <IconButton
                  aria-label="Suspend"
                  size="small"
                  color="warning"
                  sx={{ mr: 2 }}
                  onClick={() => handleSuspendDialog(row?._id || row?.id)}
                >
                  <Icon icon="material-symbols:block" fontSize={20} />
                </IconButton>
              </Tooltip>
            ) : (
              <Tooltip title={'Activate'} placement="top" arrow>
                <IconButton
                  aria-label="Activate"
                  size="small"
                  color="success"
                  sx={{ mr: 2 }}
                  onClick={() => handleActivateDialog(row?._id || row?.id)}
                >
                  <Icon
                    icon="material-symbols:check-circle-rounded"
                    fontSize={20}
                  />
                </IconButton>
              </Tooltip>
            )}
            <Tooltip title={'Delete'} placement="top" arrow>
              <IconButton
                aria-label="Delete"
                size="small"
                color="error"
                sx={{ mr: 2 }}
                onClick={() => {
                  handleDeleteDialog(row?._id || row?.id);
                }}
              >
                <Icon icon="bx:trash" fontSize={20} />
              </IconButton>
            </Tooltip>
          </>
        );
      },
    },
    {
      flex: 0.1,
      minWidth: 80,
      sortable: false,
      headerName: 'Test Webhook',
      field: 'test',
      renderCell: ({ row }: any) => {
        return (
          <LoadingButton
            loading={row._id === selectedWebhookId ? isLoading : false}
            variant="outlined"
            color="primary"
            size="small"
            startIcon={
              <Icon icon="material-symbols:webhook-rounded" fontSize={20} />
            }
            onClick={() => {
              handleTestDialog(row?._id || row?.id);
            }}
          >
            Test
          </LoadingButton>
        );
      },
    },
  ];

  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        {webhookCardData && (
          <Grid container spacing={6}>
            {webhookCardData.map(
              (item: CardStatsHorizontalProps, index: number) => {
                return (
                  <Grid item xs={12} md={3} sm={6} key={index}>
                    <CardStatisticsHorizontal {...item} />
                  </Grid>
                );
              },
            )}
          </Grid>
        )}
      </Grid>
      <Grid item xs={12}>
        <Card>
          {/* <Divider sx={{ m: '0 !important' }} /> */}
          <TableHeader value={value} handleFilter={handleFilter} />
          <DataGrid
            autoHeight
            rows={webhookListDataFiltered || []}
            getRowId={(row: any) => row?._id || row?.id}
            getRowHeight={() => 'auto'}
            columns={columns}
            pageSize={pageSize}
            disableSelectionOnClick
            rowsPerPageOptions={[10, 25, 50]}
            onPageSizeChange={(newPageSize: number) => setPageSize(newPageSize)}
          />
        </Card>
      </Grid>

      <Dialog
        scroll="body"
        open={openEdit}
        onClose={handleEditClickClose}
        aria-labelledby="user-view-edit"
        sx={{
          '& .MuiPaper-root': {
            width: '100%',
            maxWidth: 650,
            p: [2, 10],
          },
          '& .MuiDialogTitle-root + .MuiDialogContent-root': {
            pt: (theme) => `${theme.spacing(2)} !important`,
          },
        }}
        aria-describedby="user-view-edit-description"
      >
        <form onSubmit={handleEditClickSubmit}>
          <DialogContent>
            <IconButton
              size="small"
              onClick={() => handleEditClickClose()}
              sx={{ position: 'absolute', right: '1rem', top: '1rem' }}
            >
              <Icon icon="bx:x" />
            </IconButton>
            <Box sx={{ mb: 8, textAlign: 'center' }}>
              <Typography variant="h5" sx={{ mb: 3 }}>
                Update Webhook Information
              </Typography>
              <Typography variant="body2">
                <Link href={`/documentation/webhook`} passHref>
                  <StyledLink>You can refer our documentation.</StyledLink>
                </Link>
              </Typography>
            </Box>
            <Grid container spacing={6}>
              <Grid item sm={6} xs={12}>
                <TextField
                  required
                  size="small"
                  fullWidth
                  value={webhookDetails.name}
                  label="Webhook Name"
                  placeholder="John Doe"
                  onChange={(e) =>
                    setWebhookDetails({
                      ...webhookDetails,
                      name: e.target.value,
                    })
                  }
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item sm={6} xs={12}>
                <TextField
                  required
                  size="small"
                  fullWidth
                  value={webhookDetails?.url}
                  label="Webhook URL"
                  placeholder="URL"
                  onChange={(e) =>
                    setWebhookDetails({
                      ...webhookDetails,
                      url: e.target.value,
                    })
                  }
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item sm={12} xs={12}>
                <TextField
                  required
                  size="small"
                  fullWidth
                  value={webhookDetails?.verifyToken}
                  label="Verification Token"
                  placeholder="token"
                  onChange={(e) =>
                    setWebhookDetails({
                      ...webhookDetails,
                      verifyToken: e.target.value,
                    })
                  }
                  InputLabelProps={{ shrink: true }}
                  type="password"
                />
              </Grid>

              <Grid item sm={12} xs={12}>
                <span>
                  <b>Basic Auth</b>
                </span>
              </Grid>

              <Grid item sm={6} xs={12}>
                <TextField
                  size="small"
                  fullWidth
                  name="basicAuthUsername"
                  label="User Name"
                  placeholder="johnDoe"
                  value={webhookDetails?.basicAuthUsername}
                  onChange={(e) =>
                    setWebhookDetails({
                      ...webhookDetails,
                      basicAuthUsername: e.target.value,
                    })
                  }
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item sm={6} xs={12}>
                <TextField
                  size="small"
                  name="basicAuthPassword"
                  fullWidth
                  type="password"
                  label="Password"
                  placeholder="*****"
                  value={webhookDetails?.basicAuthPassword}
                  onChange={(e) =>
                    setWebhookDetails({
                      ...webhookDetails,
                      basicAuthPassword: e.target.value,
                    })
                  }
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid item sm={12} xs={12}>
                <span>
                  <b>Headers</b>
                </span>
              </Grid>

              <Grid item sm={6} xs={12}>
                <TextField
                  size="small"
                  fullWidth
                  label="Enter Key"
                  placeholder="headerKey"
                  value={webhookDetails?.headersKey}
                  onChange={(e) =>
                    setWebhookDetails({
                      ...webhookDetails,
                      headersKey: e.target.value,
                    })
                  }
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item sm={6} xs={12}>
                <TextField
                  size="small"
                  fullWidth
                  label="Enter Value"
                  placeholder="headerValue"
                  value={webhookDetails?.headersValue}
                  onChange={(e) =>
                    setWebhookDetails({
                      ...webhookDetails,
                      headersValue: e.target.value,
                    })
                  }
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ justifyContent: 'center' }}>
            <LoadingButton
              loading={isLoading}
              variant="contained"
              sx={{ mr: 1 }}
              // onClick={() => handleEditClickSubmit()}
              type="submit"
            >
              Update
            </LoadingButton>
            <Button
              variant="outlined"
              color="secondary"
              onClick={() => handleEditClickClose()}
            >
              Cancel
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <WebhookDeleteDialog
        webhookId={selectedWebhookId}
        open={deleteDialogOpen}
        setOpen={setDeleteDialogOpen}
      />

      <WebhookActivateDialog
        webhookId={selectedWebhookId}
        open={activateDialogOpen}
        setOpen={setActivateDialogOpen}
      />
      <WebhookSuspendDialog
        webhookId={selectedWebhookId}
        open={suspendDialogOpen}
        setOpen={setSuspendDialogOpen}
      />

      <Dialog
        fullWidth
        open={testDialogOpen}
        onClose={() => setTestDialogOpen(false)}
        sx={{ '& .MuiPaper-root': { width: '100%', maxWidth: 512 } }}
      >
        <DialogContent sx={{ pb: 4 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
            }}
          >
            <Typography sx={{ fontSize: '1.125rem' }}>
              Tested webhook!
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center' }}>
          <Button
            variant="outlined"
            color="secondary"
            onClick={() => setTestDialogOpen(false)}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Grid>
  );
};

export default Webhooks;
