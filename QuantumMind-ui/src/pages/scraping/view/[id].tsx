// ** React Imports
import { useState, useEffect, MouseEvent, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
// ** Next Import
import Link from 'next/link';

// ** MUI Imports

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import TextField from '@mui/material/TextField';
import Menu from '@mui/material/Menu';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Divider from '@mui/material/Divider';
import { DataGrid } from '@mui/x-data-grid';
import { styled } from '@mui/material/styles';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import { Tooltip } from '@mui/material';
import { LoadingButton } from '@mui/lab';
import CustomChip from 'src/@core/components/mui/chip';
import { ThemeColor } from 'src/@core/layouts/types';

// ** Icon Imports
import Icon from 'src/@core/components/icon';
import TableHeader from 'src/views/scraping/TableHeader';
import AddScrapingDrawer from 'src/views/scraping/AddScrapingDrawer';
import { AppDispatch } from 'src/store';
import {
  handleGetScrapingDataById,
  handleDeleteChildScrapingById,
  handleUpdateChildScrapeStatus,
} from 'src/store/apps/scraper';
import DeleteDialog from 'src/views/scraping/dialogs/DeleteScraper';
import ChangeStatus from 'src/views/scraping/dialogs/Status';
import Summary from 'src/views/scraping/dialogs/Summary';
import { RootState } from 'src/store';
import { useRouter } from 'next/router';
// ** MUI Imports

const dummyData = [
  {
    tags: [],
    mainId: '63bbc4bd65165433e700804c',
    title: 'Public Bins - City of Melville',
    url: 'https://www.melvillecity.com.au/',
    text: [
      'Popular searches',
      'Find out about public bins, including how to request more compostable doggie bags, request public bins to be emptied, request a repair to a public bin, and information on our Doggie Dunnies.',
      'We regularly refill doggie bag stations in our parks and dog exercise areas, however if you find a station with no bags available, fill in our online form to request more compostable doggie bags.',
      'We regularly empty public bins around the City, however if you find full or overflowing bins, please fill in our online form to request the public bin to be emptied.',
      'If you notice a damaged or broken public bin, please fill in our online form to let us know that we need to repair the public bin.',
      "We’ve recently installed some 'Doggie Dunnies' which are specifically designed to capture compostable bags of dog waste. These bins are collected by our food organics, garden organics (FOGO) trucks to send for composting, diverting it from landfill.",
      'You can find Doggie Dunnies in the following locations:',
      'Read more about Doggie Dunnies.',
      'To use the Doggie Dunnies, follow these steps:',
      ' ',
      'Sign up to our newsletter and receive the latest news and updates.Subscribe',
      'See all contacts',
      'The City of Melville acknowledges the Bibbulmun people as the Traditional Owners of the land on which the City stands today and pays its respects to the Whadjuk people, and Elders both past and present.',
      'City of Melville nagolik Bibbulmen Nyungar ally-maga milgebar gardukung naga boordjar-il narnga allidja yugow yeye wer ali kaanya Whadjack Nyungar wer netingar quadja wer burdik.',
      'Please let us know who you are',
      '✘',
      '✘',
      '',
    ],
    status: 'published',
    createdAt: '2023-01-09T07:39:52.260Z',
    updatedAt: '2023-01-09T07:39:52.260Z',
    id: '63bbc4c865165433e7008052',
    wordCound: 100
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
  const {id} = useRouter().query;
  const dispatch = useDispatch<AppDispatch>();
const {scrapeListById} = useSelector((state: RootState) => state.scraper);
  useEffect(()=>{
    if(id && dispatch){
      dispatch(handleGetScrapingDataById({id}))
    }
  },[id, dispatch])  

useEffect(()=>{
    if(scrapeListById && scrapeListById.length >0){
      setScrapedDataFiltered(scrapeListById)
    }
  },[scrapeListById])
  const toggleAddUserDrawer = () => setAddUserOpen(!addUserOpen);

  // Handle Edit dialog
  const handleEditClickOpen = (id: any) => {
    setOpenView(true);
  };
  const handleEditClickClose = () => {
    setOpenView(false);
  };

  const handleFilter = useCallback((val: string) => {
    setValue(val);
  }, []);


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
    published: 'primary',
    unpublished: 'secondary',
  };

  // delete scraper
  const [deleteDialog, setDeleteDialog] = useState<boolean>(false);
  const [deleteId, setDeleteId] = useState<string>('');
  const handleCloseDeleteDialog = () => {
    setDeleteDialog(false);
  };
  const handleConfirmDeleteDialog = () => {
    dispatch(handleDeleteChildScrapingById(deleteId));
    setDeleteDialog(false);
  };
  const handleOpenDeleteDialog = (id: any) => {
    setDeleteId(id);
    setDeleteDialog(true);
  };
  // changes status of scraper
  const [statusDialog, setStatusDialog] = useState<boolean>(false);
  const [statusId, setStatusId] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const handleCloseStatusDialog = () => {
    setStatusDialog(false);
  };
  const handleConfirmStatusDialog = () => {
    dispatch(handleUpdateChildScrapeStatus({ id: statusId }));
    setStatusDialog(false);
  };
  const handleOpenStatusDialog = (id: string, status: string) => {
    setStatusId(id);
    setStatus(status);
    setStatusDialog(true);
  };
  // summary of scraper
  const [summaryDialog, setSummaryDialog] = useState<boolean>(false);
  const [summaryText, setSummaryText] = useState<any>('');
  const [titleText, setTitleText] = useState<string>("")
  const handleCloseSummaryDialog = () => {
    setSummaryDialog(false);
  };
  const handleOpenSummaryDialog = (summary: any, title: string) => {
    setSummaryText(summary);
    setTitleText(title)
    setSummaryDialog(true);
  };

  const columns = [
    {
      flex: 1,
      minWidth: 240,
      field: 'Details',
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
                <CustomChip
                  rounded
                  skin="light"
                  size="small"
                  label={
                    row?.status?.toLowerCase() ? 'Published' : 'Unpublished'
                  }
                  color={userStatusObj[row?.status?.toLowerCase()]}
                  sx={{ fontSize: '0.6rem' }}
                  variant="outlined"
                />
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
      flex: 0.4,
      minWidth: 60,
      headerName: 'Summary',
      field: 'text',
      renderCell: ({ row }: any) => {
        return (
          <Button
            size="small"
            variant="outlined"
            onClick={()=>handleOpenSummaryDialog(row?.data, row?.title)}
          >
            Summary
          </Button>
        );
      },
    },

    {
      flex: 0.4,
      minWidth: 60,
      headerName: 'Word Count',
      field: 'wordCound',
    },
    {
      flex: 0.4,
      minWidth: 60,
      headerName: 'Created On',
      field: 'createdAt',
      renderCell: (params: any) => {
        return (
          <Typography noWrap sx={{ color: 'text.secondary' }}>
            {new Date(params.value).toLocaleDateString()}
          </Typography>
        );
      },
    },
    {
      flex: 0.4,
      minWidth: 60,
      headerName: 'Updated On',
      field: 'updatedAt',
      renderCell: (params: any) => {
        return (
          <Typography noWrap sx={{ color: 'text.secondary' }}>
            {new Date(params.value).toLocaleDateString()}
          </Typography>
        );
      },
    },
    {
      flex: 0.4,
      minWidth: 120,
      sortable: false,
      field: 'actions',
      headerName: 'Actions',
      renderCell: ({ row }: any) => {
        return (
          <>
            {row?.status === 'published' ? (
              <Tooltip title={'Unpublish'} placement="top" arrow>
                <IconButton
                  aria-label="Unpublish"
                  size="small"
                  color="warning"
                  sx={{ mr: 2 }}
                  onClick={() => {
                    handleOpenStatusDialog(row.id, 'unpublished');
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
                    handleOpenStatusDialog(row.id, 'published');
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
                  handleOpenDeleteDialog(row?.id);
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
          value={'View Scrape Data'}
          handleFilter={handleFilter}
          toggle={null}
        />
      </Card>
      <Card>
       {scrapeDataFiltered && scrapeDataFiltered?.length >0 && <DataGrid
          autoHeight
          rows={scrapeDataFiltered || []}
          getRowId={(row: any) => row.id || row._id}
          getRowHeight={() => 'auto'}
          columns={columns}
          pageSize={pageSize}
          disableSelectionOnClick
          rowsPerPageOptions={[10, 25, 50]}
          onPageSizeChange={(newPageSize: number) => setPageSize(newPageSize)}
        />}
      </Card>

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
      <Summary
        open={summaryDialog}
        onClose={handleCloseSummaryDialog}
        textArray={summaryText}
        title={titleText}
      />
    </>
  );
};

export default Scraping;
