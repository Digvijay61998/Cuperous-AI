// ** React Imports
import { useCallback, useEffect, useState } from 'react';

// ** Next Import

// ** MUI Imports
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import Typography from '@mui/material/Typography';
import { DataGrid } from '@mui/x-data-grid';

// ** Icon Imports
import Icon from 'src/@core/components/icon';

// ** Store Imports
import { useDispatch, useSelector } from 'react-redux';

// ** Custom Components Imports
import CardStatisticsHorizontal from 'src/@core/components/card-statistics/card-stats-horizontal';
import CustomChip from 'src/@core/components/mui/chip';

const avatarIcon: any = {
  total_advertisement: 'mdi:ads',
  published_advertisement: 'entypo:publish',
  draft_advertisement: 'fluent:drafts-24-filled',
};
// ** Third Party Components

// ** Types Imports
import { CardStatsHorizontalProps } from 'src/@core/components/card-statistics/types';
import { ThemeColor } from 'src/@core/layouts/types';
import { AppDispatch, RootState } from 'src/store';

// ** Custom Table Components Imports
import { Chip, Tooltip } from '@mui/material';
import { fetchAdsList, updateAds } from 'src/store/apps/advertisement';
import { fetchBotData } from 'src/store/apps/bots';
import { getAdvertisementCardStats } from 'src/store/apps/states';
import AddEditAds from 'src/views/advertisements/list/AddEditAds';
import AdsDeleteDialog from 'src/views/advertisements/list/AdsDeleteDialog';
import TableHeader from 'src/views/advertisements/list/TableHeader';

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 250,
    },
  },
};
interface AdsStatusType {
  [key: string]: ThemeColor;
}

const adsStatusObj: AdsStatusType = {
  published: 'success',
  draft: 'warning',
};

const AdsList = () => {
  // ** State
  const [value, setValue] = useState<string>('');
  const [bot, setBot] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [pageSize, setPageSize] = useState<number>(10);
  const [addAdsOpen, setAddAdsOpen] = useState<boolean>(false);

  const initAddData: any = {
    method: 'add',
    title: '',
    assignedToBots: [],
    posters: [],
  };
  const [data, setData] = useState<any>(initAddData);

  // ** Hooks
  const dispatch = useDispatch<AppDispatch>();
  const adsStore = useSelector(
    (state: RootState) => state.advertisement.adsListData,
  );
  const botList = useSelector((state: RootState) => state.bots.list);

  // ** publish and draft and delete dialog and Ads
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [selectedAdsId, setSelectedAdsId] = useState<any>('');
  // ** Functions
  const handleDeleteDialog = (id: any) => {
    setSelectedAdsId(id);
    setDeleteDialogOpen(true);
  };
  const handlePublishDialog = (id: any) => {
    setSelectedAdsId(id);
    dispatch(updateAds({ id: id, data: { status: 'published' } }));
  };
  const handleDraftDialog = (id: any) => {
    setSelectedAdsId(id);
    dispatch(updateAds({ id: id, data: { status: 'draft' } }));
  };

  const { advertisementStats } = useSelector(
    (state: RootState) => state.states,
  );
  const [adsListDataFiltered, setAdsListDataFiltered] = useState<any>([]);

  useEffect(() => {
    if (dispatch) dispatch(getAdvertisementCardStats());
  }, [dispatch]);
  const [advertisementCardData, setAdvertisementCardData] = useState<any>([]);
  useEffect(() => {
    if (advertisementStats && advertisementStats.length > 0) {
      let mapArr = advertisementStats.map((item: any) => {
        return {
          ...item,
          stats: item.stats.toString(),
          avatarIcon: item.title.toLowerCase().includes('total')
            ? "/images/new/advertisements/TOTAL_ADS.png"
            : item.title.toLowerCase().includes('published')
            ? "/images/new/advertisements/PUBLISHED_ADS.png"
            : item.title.toLowerCase().includes('draft')
            ?  "/images/new/advertisements/DRAFT_ADVERTISEMENTS.png"
            : 'ic:baseline-question-mark',
          avatarColor: item.title.toLowerCase().includes('draft')
            ? 'warning'
            : item.title.toLowerCase().includes('published')
            ? 'success'
            : 'primary',
        };
      });
      setAdvertisementCardData(mapArr);
    }
  }, [advertisementStats]);

  useEffect(() => {
    dispatch(fetchBotData());
  }, []);

  useEffect(() => {
    dispatch(
      fetchAdsList({
        status: status,
        bot: bot,
      }),
    );
  }, [status, bot]);

  useEffect(() => {
    if (value && value.trim() !== '') {
      let queryLowered = value.toLowerCase();
      const filteredData = adsStore?.filter((item: any) =>
        item.title.toLowerCase().includes(queryLowered),
      );
      setAdsListDataFiltered(filteredData);
    } else {
      setAdsListDataFiltered(adsStore);
    }
  }, [value, adsStore]);

  const handleFilter = useCallback((val: string) => {
    setValue(val);
  }, []);

  const handleBotChange = useCallback((e: SelectChangeEvent) => {
    setBot(e.target.value);
  }, []);
  const handleStatusChange = useCallback((e: SelectChangeEvent) => {
    setStatus(e.target.value);
  }, []);

  const toggleAddAdsDrawer = () => {
    setData(initAddData);
    setAddAdsOpen(!addAdsOpen);
  };
  const toggleEditAdsDrawer = (data: any) => {
    setData(data);
    setAddAdsOpen(!addAdsOpen);
  };

  const columns = [
    {
      flex: 1,
      minWidth: 240,
      field: 'title',
      headerName: 'Title',
      headerClassName : "custom-header",
      renderCell: ({ row }: any) => {
        const { title, status } = row;

        return (
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <div>{title}</div>
            <CustomChip
              rounded
              skin="light"
              size="small"
              label={status}
              color={adsStatusObj[status]}
              sx={{ fontSize: '0.6rem' }}
            />
          </Box>
        );
      },
    },
    {
      flex: 1,
      minWidth: 180,
      headerName: 'Assigned To Bots',
      field: 'assignedToBots',
      headerClassName : "custom-header",
      renderCell: ({ row }: any) => {
        return (
          <div style={{ display: 'flex', flexWrap: 'wrap' }}>
            {row?.assignedToBots?.length > 0 ? (
              <>
                {row?.assignedToBots?.map((item: any, index: number) => (
                  <Chip
                    key={index}
                    label={item?.name || item?.id || item}
                    size="small"
                    color="primary"
                    style={{ margin: '2px', fontSize: '11px' }}
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
      flex: 1,
      minWidth: 100,
      field: 'clicksCount',
      headerClassName : "custom-header",
      headerName: 'Total Clicks',
      renderCell: ({ row }: any) => {
        return (
          <Typography noWrap sx={{ color: 'text.secondary' }}>
            {row?.clicksCount}
          </Typography>
        );
      },
    },
    {
      flex: 1,
      minWidth: 100,
      field: 'posters',
      headerClassName : "custom-header",
      headerName: 'No. of posters',
      renderCell: ({ row }: any) => {
        return (
          <Typography noWrap sx={{ color: 'text.secondary' }}>
            {row?.posters?.length || 0}
          </Typography>
        );
      },
    },
    {
      flex: 1,
      minWidth: 160,
      headerName: 'Created On',
      field: 'createdAt',
      sort: 'desc',
      headerClassName : "custom-header",
      renderCell: ({ row }: any) => {
        return (
          <span>
            {new Date(row.createdAt).toLocaleDateString('en-US', {
              hour: 'numeric',
              minute: 'numeric',
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </span>
        );
      },
    },
    {
      flex: 1,
      minWidth: 100,
      sortable: false,
      field: 'actions',
      headerName: 'Actions',
      headerClassName : "custom-header",
      renderCell: ({ row }: any) => {
        return (
          <>
            <Tooltip placement="top" title="Edit" arrow>
              <IconButton
                aria-label="Edit"
                size="small"
                sx={{ mr: 2 }}
                color="primary"
                onClick={() => {
                  toggleEditAdsDrawer({
                    method: 'edit',
                    ...row,
                  });
                }}
              >
                <Icon icon="bxs:edit" fontSize={20} />
              </IconButton>
            </Tooltip>

            <Tooltip
              title={row?.status === 'draft' ? 'Publish Ad' : 'UnPublish Ad'}
              placement="top"
              arrow
            >
              <IconButton
                aria-label={row?.status}
                size="small"
                sx={{ mr: 2 }}
                color={row?.status === 'draft' ? 'success' : 'warning'}
                onClick={() => {
                  if (row?.status === 'draft') {
                    handlePublishDialog(row?.id || row?._id);
                  } else {
                    handleDraftDialog(row?.id || row?._id);
                  }
                }}
              >
                <Icon
                  icon={
                    row?.status === 'draft'
                      ? 'material-symbols:check-circle-rounded'
                      : 'material-symbols:block'
                  }
                  fontSize={20}
                />
              </IconButton>
            </Tooltip>

            <Tooltip placement="top" title="Delete" arrow>
              <IconButton
                aria-label="Delete"
                size="small"
                sx={{ mr: 2 }}
                color="error"
                onClick={() => {
                  handleDeleteDialog(row?.id || row?._id);
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
    <Grid container spacing={6}>
      <Grid item xs={12}>
        {advertisementCardData && (
          <Grid container spacing={6}>
            {advertisementCardData.map(
              (item: CardStatsHorizontalProps, index: number) => {
                return (
                  <Grid item xs={12} md={4} sm={4} key={index}>
                    <CardStatisticsHorizontal {...item} />
                  </Grid>
                );
              },
            )}
          </Grid>
        )}
      </Grid>
      <Grid item xs={12}>
        <Card sx={{boxShadow:'rgba(0, 0, 0, 0.16) 0px 3px 6px, rgba(0, 0, 0, 0.23) 0px 3px 6px'}} >
          <TableHeader
            value={value}
            handleFilter={handleFilter}
            toggle={toggleAddAdsDrawer}
          />
          <Divider sx={{ m: '0 !important' }} />
          <CardContent>
            <Grid container sx={{display : "flex", justifyContent : "start", alignItems : "center"}} spacing={5}>
              <Grid item sm={1} xs={12}>
                <div style={{ fontSize: '1.1rem', color : "black" }}>Filters</div>
              </Grid>
              <Grid item sm={3} xs={12}>
                <FormControl fullWidth size="small">
                  <InputLabel id="bot-select">Select Bot</InputLabel>
                  <Select
                    fullWidth
                    value={bot}
                    size="small"
                    id="select-bot"
                    label="Select Bot"
                    labelId="bot-select"
                    onChange={handleBotChange}
                    inputProps={{ placeholder: 'Select Bot' }}
                    MenuProps={MenuProps}
                  >
                    <MenuItem value="">All</MenuItem>
                    {botList?.map((bot: any, index: number) => (
                      <MenuItem key={index} value={bot?._id || bot?.id}>
                        {bot?.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item sm={3} xs={12}>
                <FormControl fullWidth size="small">
                  <InputLabel id="status-select">Select Status </InputLabel>
                  <Select
                    fullWidth
                    value={status}
                    size="small"
                    id="select-status"
                    label="Select Status"
                    labelId="status-select"
                    onChange={handleStatusChange}
                    inputProps={{ placeholder: 'Select Status' }}
                  >
                    <MenuItem value="">All</MenuItem>
                    <MenuItem value="published">Published</MenuItem>
                    <MenuItem value="draft">Draft</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </CardContent>

          <DataGrid
            autoHeight
            rows={adsListDataFiltered ?? []}
            columns={columns}
            getRowId={(row: any) => row?._id || row?.id}
            pageSize={pageSize}
            disableSelectionOnClick
            rowsPerPageOptions={[10, 25, 50]}
            onPageSizeChange={(newPageSize: number) => setPageSize(newPageSize)}
            getRowHeight={() => 'auto'}
            initialState={{
              sorting: {
                sortModel: [{ field: 'createdAt', sort: 'desc' }],
              },
            }}
          />
        </Card>
      </Grid>

     {addAdsOpen && <AddEditAds open={addAdsOpen} toggle={toggleAddAdsDrawer} data={data} />
}
      <AdsDeleteDialog
        adsId={selectedAdsId}
        open={deleteDialogOpen}
        setOpen={setDeleteDialogOpen}
      />
  
   </Grid>
  );
};


export default AdsList;
