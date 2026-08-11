// ** React Imports
import { useCallback, useEffect, useState } from 'react';

// ** Next Import
import Link from 'next/link';

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
import { styled } from '@mui/material/styles';
import { DataGrid } from '@mui/x-data-grid';

// ** Icon Imports
import Icon from 'src/@core/components/icon';

// ** Store Imports
import { useDispatch, useSelector } from 'react-redux';

// ** Custom Components Imports
import CardStatisticsHorizontal from 'src/@core/components/card-statistics/card-stats-horizontal';
import CustomChip from 'src/@core/components/mui/chip';

// ** Third Party Components

// ** Types Imports
import { CardStatsHorizontalProps } from 'src/@core/components/card-statistics/types';
import { ThemeColor } from 'src/@core/layouts/types';
import { AppDispatch, RootState } from 'src/store';

// ** Custom Table Components Imports
import { Tooltip } from '@mui/material';
import returnPlatformIcon from 'src/components/PlatforomIcons';
import { fetchBotData } from 'src/store/apps/bots';
import { deleteSocial, fetchSocialList, updateSocialStatus } from 'src/store/apps/social';
import { getSocialsCardStats } from 'src/store/apps/states';
import DeleteDialog from 'src/views/social/DeleteDialog';
import AddEditSocial from 'src/views/social/list/AddEditSocial';
import TableHeader from 'src/views/social/TableHeader';
const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      // width: 250,
    },
  },
}
interface SocialStatusType {
  [key: string]: ThemeColor;
}

const socialStatusObj: SocialStatusType = {
  published: 'success',
  draft: 'warning',
};

const avatarIcon: any = {
  total_social: 'mdi:internet',
  published_social: 'entypo:publish',
  draft_social: 'fluent:drafts-24-filled',
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



const SocialList = () => {
  // ** State
  const [value, setValue] = useState<string>('');
  const [bot, setBot] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [platform, setPlatform] = useState<string>('');
  const [pageSize, setPageSize] = useState<number>(10);
  const [addSocialOpen, setAddSocialOpen] = useState<boolean>(false);

  const initAddData:any = {
    method: 'add',
    name: '',
    botId: '',
    jarcubeBot: '',
    platform: '',
    accessToken: ''
  }
  const [data, setData] = useState<any>(initAddData);

  // ** Hooks
  const dispatch = useDispatch<AppDispatch>();
  const { socialListData, socialListSearch } = useSelector((state: RootState) => state.social);
  const botList = useSelector((state: RootState) => state.bots.list);

  // ** publish and draft and delete dialog and Social
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [selectedSocialId, setSelectedSocialId] = useState<any>('');
  // ** Functions
  const handleDeleteDialog = (id:any) => {
    setSelectedSocialId(id);
    setDeleteDialogOpen(true);
  }
  const handlePublishDialog = (id:any) => {
    setSelectedSocialId(id);
    dispatch(updateSocialStatus({ id:id, data:{ status:'published' } }))
  }
  const handleDraftDialog = (id:any) => {
    setSelectedSocialId(id);
    dispatch(updateSocialStatus({ id:id, data:{ status:'draft' } }))
  }

  const { socialStats } = useSelector((state: RootState) => state.states);
  const [socialListDataFiltered, setSocialListDataFiltered] = useState<any>([]);
    
  useEffect(() => {
    if (dispatch) dispatch(getSocialsCardStats());
  }, [dispatch, socialListDataFiltered]);
  const [socialCardData, setSocialCardData] = useState<any>([]);
  useEffect(() => {
    if (socialListDataFiltered && socialStats && socialStats?.length > 0) {
      let mapArr = socialStats.map((item: any) => {
        return {
          ...item,
          stats: item.stats.toString(),
          avatarIcon: item.title.toLowerCase().includes('total')
            ? "/images/new/segments/TOTAL_SEGS.png"
            : item.title.toLowerCase().includes('published')
            ? "/images/new/segments/TOTAL_SEGMENTS.png"
            : item.title.toLowerCase().includes('draft')
            ? '/images/new/segments/NEW_VISITORS.png'
            : '/images/new/segments/NEW_VISITORS.png',
          avatarColor:
            item.title.toLowerCase().includes('draft') 
              ? 'warning'
              : item.title.toLowerCase().includes('published') 
              ? 'success'
              : 'primary',
        };
      });
      setSocialCardData(mapArr || []);
    }
  }, [socialStats]);

  useEffect(() => {
    dispatch(fetchBotData());
  }, []);

  useEffect(() => {
    dispatch(
      fetchSocialList({
        platform: platform,
        status: status,
        bot: bot,
      }),
    );
  }, [status, platform, bot]);

  useEffect(() => {
    if (value && value.trim() !== '') {
      let queryLowered = value.toLowerCase();
      const filteredData = socialListData?.filter(
        (item: any) =>
          item.name?.toLowerCase().includes(queryLowered)
      );
      setSocialListDataFiltered(filteredData);
    } else {
      setSocialListDataFiltered(socialListData);
    }
  }, [value,socialListData]);
console.log("filteredDatafilteredData",platform)
  const handleFilter = useCallback((val: string) => {
    setValue(val);
  }, []);

  const handleBotChange = useCallback((e: SelectChangeEvent) => {
    setBot(e.target.value);
  }, []);
  const handlePlatformChange = useCallback((e: SelectChangeEvent) => {
    setPlatform(e.target.value);
  }, []);
  const handleStatusChange = useCallback((e: SelectChangeEvent) => {
    setStatus(e.target.value);
  }, []);

  const toggleAddSocialDrawer = () => {
    setData(initAddData);
    setAddSocialOpen(!addSocialOpen)
  };
  const toggleEditSocialDrawer = (data:any) => {
    setData(data);
    setAddSocialOpen(!addSocialOpen);
  };

  const columns = [
    {
      // flex: 0.5,
      // minWidth: 100,
      headerName: 'Platform',
      field: 'platform',
      headerClassName:'custom-header',
      renderCell: ({ row }: any) => {
        return (
          <div style={{ width:'100%', display:'flex', justifyContent:'center', alignItems: 'center' }}>
            <Tooltip 
              title={row?.platform.charAt(0).toUpperCase() + row?.platform.slice(1)} 
              placement='top' 
              arrow
            >
              <IconButton
                aria-label="Platform"
                size="small"
              >
                {returnPlatformIcon(row?.platform)}
              </IconButton>
            </Tooltip>
          </div>
        );
      },
    },
    {
      flex: 1,
      minWidth: 240,
      field: 'name',
      headerName: 'Name',
      headerClassName:'custom-header',
      renderCell: ({ row }: any) => {
        const { name, status } = row;
        
        return (
          <Box sx={{ display: 'flex', gap:1, alignItems: 'center' }}>
            <div>{name}</div>
            <CustomChip
              rounded
              skin="light"
              size="small"
              label={status}
              color={socialStatusObj[status]}
              sx={{ fontSize: '0.6rem' }}
            />
          </Box>
        );
      },
    },
    {
      flex: 1,
      minWidth: 180,
      headerName: 'JarCube Bot',
      field: 'jarcubeBot',
      headerClassName:'custom-header',
      renderCell: ({ row }: any) => {
        return (
          <Link href={`/bots/settings/${row?.jarcubeBot?._id || row?.jarcubeBot?.id || row?.jarcubeBot}`}>
            <StyledLink>{row?.jarcubeBot?.name || row?.jarcubeBot?._id || row?.jarcubeBot?.id || row?.jarcubeBot}</StyledLink>
          </Link>
        );
      },
    },
    // {
    //   flex: 1,
    //   minWidth: 180,
    //   field: 'botId',
    //   headerName: 'Bot Id',
    // },
    // {
    //   flex: 1,
    //   minWidth: 180,
    //   field: 'accessToken',
    //   headerName: 'Access Token',
    // },
    {
      flex: 1,
      minWidth: 180,
      headerName: 'Created On',
      field: 'createdAt',
      sort: "desc",
      headerClassName:'custom-header',
      renderCell: ({row}: any) => {
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
      headerClassName:'custom-header',
      renderCell: ({ row }: any) => {
        return (
          <>
            <Tooltip placement='top' title="Edit" arrow>
              <IconButton
                aria-label="Edit"
                size="small"
                sx={{ mr: 2 }}
                color="primary"
                onClick={() => {
                  toggleEditSocialDrawer({
                    method: 'edit',
                    ...row
                  });
                }}
              >
                <Icon icon="bxs:edit" fontSize={20} />
              </IconButton>
            </Tooltip>

            <Tooltip 
              title={row?.status === 'draft'? 'Publish Social' : 'UnPublish Social'}
              placement="top"
              arrow
            >
              <IconButton 
                aria-label={row?.status}
                size='small' 
                sx={{ mr: 2 }}
                color={row?.status === 'draft'? 'success' : 'warning'}
                onClick={() => {
                  if(row?.status === 'draft') {
                    handlePublishDialog(row?.id || row?._id)
                  } else {
                    handleDraftDialog(row?.id || row?._id)
                  }
                }}
              >
                <Icon icon={row?.status === 'draft'?'material-symbols:check-circle-rounded':'material-symbols:block'} fontSize={20}/>
              </IconButton>
            </Tooltip>

            <Tooltip placement='top' title="Delete" arrow>
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
        )
      },
    },
  ];

  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        {socialCardData && (
          <Grid container spacing={6}>
            {socialCardData?.map((item: CardStatsHorizontalProps, index: number) => {
              return (
                <Grid item xs={12} md={4} sm={4} key={index}>
                  <CardStatisticsHorizontal {...item} />
                </Grid>
              );
            })}
          </Grid>
        )}
      </Grid>
      <Grid item xs={12}>
        <Card sx={{
            boxShadow:
              'rgba(0, 0, 0, 0.16) 0px 3px 6px, rgba(0, 0, 0, 0.23) 0px 3px 6px',
          }}>
          <TableHeader
            title={'Social Messengers List'}
            value={value}
            buttonName={'Add Messenger'}
            handleFilter={handleFilter}
            toggle={toggleAddSocialDrawer}
          />
          <Divider sx={{ m: '0 !important' }} />
          <CardContent>
            <Grid container spacing={5}>
              <Grid item sm={3} xs={12}>
                <div style={{ fontSize:'1.1rem' }}>Filters</div>
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
                    {botList?.map((bot: any, index:number) => (
                      <MenuItem key={index} value={bot?._id || bot?.id}>
                        {bot?.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item sm={3} xs={12}>
                <FormControl fullWidth size="small">
                  <InputLabel id="status-select">Select Status</InputLabel>
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
                    {socialListSearch?.status?.map((item: any, index:number) => (
                      <MenuItem key={index} value={item}>
                        {item}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item sm={3} xs={12}>
                <FormControl fullWidth size="small">
                  <InputLabel id="platform-select">Select Platform</InputLabel>
                  <Select
                    fullWidth
                    value={platform}
                    size="small"
                    id="select-platform"
                    label="Select Platform"
                    labelId="platform-select"
                    onChange={handlePlatformChange}
                    inputProps={{ placeholder: 'Select Platform' }}
                  >
                    <MenuItem value="">All</MenuItem>
                    {socialListSearch?.platforms?.map((item: any, index:number) => (
                      <MenuItem key={index} value={item}>
                        {item}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </CardContent>
          <DataGrid 
            autoHeight
            rows={socialListDataFiltered ?? []}
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

      <AddEditSocial open={addSocialOpen} toggle={toggleAddSocialDrawer} data={data} />

      <DeleteDialog
        applicationId={selectedSocialId}
        open={deleteDialogOpen}
        setOpen={setDeleteDialogOpen}
        title={"Are you sure?"} 
        body={"You won't be able to revert social!"} 
        buttonNameYes={"Yes, Delete Social!"} 
        handleYes={(id: string) => {
          dispatch(deleteSocial(id));
        }}      
      />

    </Grid>
  );
};


export default SocialList;
