// ** React Imports
import { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
// ** Next Import

// ** MUI Imports

import { Tooltip, Chip } from '@mui/material';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import { styled } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import { DataGrid } from '@mui/x-data-grid';
import CustomChip from 'src/@core/components/mui/chip';
import { ThemeColor } from 'src/@core/layouts/types';
import { AppDispatch, RootState } from 'src/store';
// ** Icon Imports
import Icon from 'src/@core/components/icon';
import { gettag } from 'src/store/apps/tags';
import AddScrapingDrawer from 'src/views/scraping/AddScrapingDrawer';
import TableHeader from 'src/views/scraping/TableHeader';
import { useRouter } from 'next/router';
import SyncDialog from 'src/views/scraping/dialogs/Sync';
// ** MUI Imports
import {
  handleUpdateScrapeStatus,
  handleUpdateScrapingById,
  handleDeleteScrapingById,
  getAllScrapData,
} from 'src/store/apps/scraper';
import DeleteDialog from 'src/views/scraping/dialogs/DeleteScraper';
import ChangeStatus from 'src/views/scraping/dialogs/Status';
const dummyData = [
  {
    _id: '1',
    title: 'Public Bins - City of Melville',
    author: null,
    createdAt: '2021-09-01T00:00:00.000Z',
    updatedAt: '2021-09-01T00:00:00.000Z',
    status: 'published',
    tags: ['636b96338c4cf88a7b852a04'],
    totalPages: 11,
    domain: 'www.melvillecity.com.au',
  },
];

interface UserStatusType {
  [key: string]: ThemeColor;
}

const Scraping = () => {
  const [value, setValue] = useState<string>('');
  const [addUserOpen, setAddUserOpen] = useState<boolean>(false);
  const [pageSize, setPageSize] = useState<number>(10);
  const [scrapeDataFiltered, setScrapedDataFiltered] = useState<any>([]);
  const [openView, setOpenView] = useState<boolean>(false);
  const [scrapeData, setScrapedData] = useState<any>({});
  const tagList = useSelector((state: RootState) => state.tags.list);
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { list } = useSelector((state: RootState) => state.scraper);
  useEffect(() => {
    if (dispatch) {
      dispatch(getAllScrapData(null));
    }
  }, [dispatch]);

  useEffect(() => {
    dispatch(gettag());
  }, []);
  const toggleAddUserDrawer = () => setAddUserOpen(!addUserOpen);
  console.log({ tagList });

  const handleEditClickClose = () => {
    setOpenView(false);
  };

  const handleFilter = useCallback((val: string) => {
    setValue(val);
  }, []);

  useEffect(() => {
    if (list && list.length) {
      setScrapedDataFiltered(list);
    }
  }, [list]);

  const StyledHead = styled('div')(({ theme }) => ({
    fontWeight: 600,
    fontSize: '1rem',
    cursor: 'pointer',
    textDecoration: 'none',
    color: theme.palette.text.secondary,
    // '&:hover': {
    //   color: theme.palette.primary.main,
    // },
  }));
  const userStatusObj: UserStatusType = {
    complete: 'success',
    pending: 'warning',
    error: 'error',
    canceled: 'error',
  };
  const [syncDialog, setSyncDialog] = useState<boolean>(false);
  const handleCloseSyncDialog = () => {
    setSyncDialog(false);
  };

  // sync again secton
  const [syncId, setSyncId] = useState<any>('');
  const handleConfirmSyncDialog = () => {
    dispatch(handleUpdateScrapingById({ id: syncId }));
    setSyncDialog(false);
  };
  const handleOpenSyncDialog = (id: any) => {
    setSyncId(id);
    setSyncDialog(true);
  };

  // delete scraper
  const [deleteDialog, setDeleteDialog] = useState<boolean>(false);
  const [deleteId, setDeleteId] = useState<string>('');
  const handleCloseDeleteDialog = () => {
    setDeleteDialog(false);
  };
  const handleConfirmDeleteDialog = () => {
    console.log({ deleteId });
    dispatch(handleDeleteScrapingById(deleteId));
    setDeleteDialog(false);
  };
  const handleOpenDeleteDialog = (id: any) => {
    setDeleteId(id);
    setDeleteDialog(true);
  };
console.log({deleteId})
  // changes status of scraper
  const [statusDialog, setStatusDialog] = useState<boolean>(false);
  const [statusId, setStatusId] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const handleCloseStatusDialog = () => {
    setStatusDialog(false);
  };
  const handleConfirmStatusDialog = () => {
    console.log({ statusId });
    dispatch(handleUpdateScrapeStatus({ id: statusId }));
    setStatusDialog(false);
  };
  const handleOpenStatusDialog = (id: string, status: string) => {
    setStatusId(id);
    setStatus(status);
    setStatusDialog(true);
  };

  const columns = [
    {
      flex: 1,
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
                <StyledHead>{row?.title}</StyledHead>
                {row?.sync && (
                  <Tooltip title="Sync Status" placement='top' arrow>
                   <Typography>
                   <CustomChip
                      rounded
                      skin="light"
                      size="small"
                      label={row.sync}
                      color={userStatusObj[row?.sync?.toLowerCase()]}
                      sx={{ fontSize: '0.6rem' }}
                    />
                   </Typography>
                  </Tooltip>
                )}
              </Box>
              <Typography
                // noWrap
                variant="caption"
                sx={{ color: 'text.disabled' }}
              >
                {row?.url}
                {/* {row?.url} */}
              </Typography>
            </Box>
          </Box>
        );
      },
    },
    {
      flex: 1,
      minWidth: 100,
      headerName: 'Tags',
      field: 'tags',
      renderCell: ({ row }: any) => {
        return (
          <div style={{ display: 'flex', flexWrap: 'wrap' }}>
            {row?.tags?.length > 0 ? (
              <>
                {row?.tags?.map((item: any) => (
                  <CustomChip
                    skin="light"
                    label={tagList?.find((tag: any) => tag._id === item)?.name}
                    size="small"
                    color="primary"
                    sx={{ margin: '1.2px', fontSize: '9px' }}
                  />
                ))}
              </>
            ) : (
              <>N/A</>
            )}
          </div>
        );
      },
    },
    {
      // flex: 1,
      minWidth: 120,
      headerName: 'Total pages',
      field: 'totalPages',
      renderCell: (params: any) => {
        return (
          <Typography noWrap sx={{ color: 'text.secondary' }}>
            {params.value}
          </Typography>
        );
      },
    },
    {
      // flex: 1,
      minWidth: 60,
      headerName: 'Status',
      field: 'status',
      renderCell: (params: any) => {
        return (
          // add in chip
          <Typography noWrap sx={{ color: 'text.secondary' }}>
            <CustomChip
              color={
                params.value.toLowerCase() === 'published'
                  ? 'success'
                  : params.value.toLowerCase() === 'unpublished'
                  ? 'warning'
                  : 'default'
              }
              label={params?.value?.toLowerCase()}
              size="small"
              sx={{
                margin: '1.2px',
                fontSize: '9px',
                textTransform: 'lowercase',
              }}
            />
          </Typography>
        );
      },
    },
    {
      flex: 1,
      minWidth: 160,
      headerName: 'Created On',
      field: 'createdAt',
      renderCell: (params: any) => {
        return (
          <Typography noWrap sx={{ color: 'text.secondary' }}>
            {params.value
              ? new Date(params.value).toLocaleDateString('en-US', {
                  hour: 'numeric',
                  minute: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })
              : 'NA'}
          </Typography>
        );
      },
    },
    {
      flex: 1,
      minWidth: 160,
      headerName: 'Last Updated',
      field: 'updatedAt',
      renderCell: (params: any) => {
        return (
          <Typography noWrap sx={{ color: 'text.secondary' }}>
            {params.value
              ? new Date(params.value).toLocaleDateString('en-US', {
                  hour: 'numeric',
                  minute: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })
              : 'NA'}
          </Typography>
        );
      },
    },
    {
      // flex: 1,
      minWidth: 180,
      sortable: false,
      field: 'actions',
      headerName: 'Actions',
      renderCell: ({ row }: any) => {
        return (
          <>
            <Tooltip title={'View List'} placement="top" arrow>
              <IconButton
                aria-label="View List"
                size="small"
                color="primary"
                sx={{ mr: 2 }}
                onClick={() => {
                  //  open veiw list route
                  router.push(`scraping/view/${row.id}`);
                }}
              >
                <Icon icon="ic:baseline-all-inbox" fontSize={20} />
              </IconButton>
            </Tooltip>
            <Tooltip title={'Sync Again'} placement="top" arrow>
              <IconButton
                aria-label="Sync Again"
                size="small"
                color="success"
                sx={{ mr: 2 }}
                onClick={() => {
                  handleOpenSyncDialog(row?._id || row?.id);
                }}
              >
                <Icon icon="material-symbols:cloud-sync" fontSize={20} />
              </IconButton>
            </Tooltip>
            {row?.status === 'published' ? (
              <Tooltip title={'Unpublish'} placement="top" arrow>
                <IconButton
                  aria-label="Unpublish"
                  size="small"
                  color="warning"
                  sx={{ mr: 2 }}
                  onClick={() => {
                    handleOpenStatusDialog(row?._id || row?.id, 'unpublished');
                  }}
                >
                  <Icon
                    icon="material-symbols:unpublished-rounded"
                    fontSize={20}
                  />
                </IconButton>
              </Tooltip>
            ) : (
              <Tooltip title={'Publish'} placement="top" arrow>
                <IconButton
                  aria-label="Publish"
                  size="small"
                  color="warning"
                  sx={{ mr: 2 }}
                  onClick={() => {
                    handleOpenStatusDialog(row?._id || row?.id, 'published');
                  }}
                >
                  <Icon icon="material-symbols:check-circle" fontSize={20} />
                </IconButton>
              </Tooltip>
            )}
            <Tooltip title={'Delete'} placement="top" arrow>
              <IconButton
                aria-label="Delete"
                size="small"
                color="error"
                sx={{ mr: 2 }}
                onClick={(e: any) => {
                  handleOpenDeleteDialog(row?._id || row?.id);
                }}
              >
                <Icon icon="bx:trash" fontSize={20} />
              </IconButton>
            </Tooltip>
          </>
        );
      },
    },
  ];
  return (
    <>
      <Card>
        <Divider sx={{ m: '0 !important' }} />
        <TableHeader
          value={'Website Scraping List'}
          handleFilter={handleFilter}
          toggle={toggleAddUserDrawer}
        />
      </Card>
      <Card>
      {scrapeDataFiltered && scrapeDataFiltered?.length &&  <DataGrid
          autoHeight
          rows={scrapeDataFiltered || []}
          getRowId={(row: any) => row.id || row?._id}
          getRowHeight={() => 'auto'}
          columns={columns}
          pageSize={pageSize}
          disableSelectionOnClick
          rowsPerPageOptions={[10, 25, 50, 100]}
          onPageSizeChange={(newPageSize: number) => setPageSize(newPageSize)}
        />}
      </Card>
      <AddScrapingDrawer
        tagList={tagList}
        open={addUserOpen}
        toggle={toggleAddUserDrawer}
      />

      <Dialog
        scroll="body"
        open={openView}
        onClose={handleEditClickClose}
        aria-labelledby="user-view-edit"
        // sx={{
        //   '& .MuiPaper-root': {
        //     width: '100%',
        //     maxWidth: 650,
        //     p: [2, 10],
        //   },
        //   '& .MuiDialogTitle-root + .MuiDialogContent-root': {
        //     pt: (theme) => `${theme.spacing(2)} !important`,
        //   },
        // }}
        aria-describedby="user-view-edit-description"
      >
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
              {scrapeData?.title}
            </Typography>
            <Typography>{scrapeData?.pageUrl}</Typography>
            {scrapeData?.result?.text?.map((item: any) => {
              return <Typography>{item?.data}</Typography>;
            })}
          </Box>
        </DialogContent>
      </Dialog>
      <SyncDialog
        open={syncDialog}
        onClose={handleCloseSyncDialog}
        onConfirm={handleConfirmSyncDialog}
      />
      <DeleteDialog
        open={deleteDialog}
        onClose={handleCloseDeleteDialog}
        onConfirm={handleConfirmDeleteDialog}
      />
      <ChangeStatus
        open={statusDialog}
        onClose={handleCloseStatusDialog}
        onConfirm={handleConfirmStatusDialog}
        status={status}
      />
    </>
  );
};

export default Scraping;
