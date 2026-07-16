// ** React Imports
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import { useCallback, useEffect, useState } from 'react';
// ** Next Import

// ** MUI Imports
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import { styled } from '@mui/material/styles';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { DataGrid, GridColumnHeaderParams, GridToolbarContainerProps } from '@mui/x-data-grid';

// ** Icon Imports
import Icon from 'src/@core/components/icon';

// ** Store Imports
import { useDispatch, useSelector } from 'react-redux';

// ** Custom Components Imports
import CardStatisticsHorizontal from 'src/@core/components/card-statistics/card-stats-horizontal';

// ** Utils Import

// ** Actions Imports
import { getTagCount } from 'src/store/apps/tags';

// ** Third Party Components

// ** Types Imports
import { CardStatsHorizontalProps } from 'src/@core/components/card-statistics/types';
import { ThemeColor } from 'src/@core/layouts/types';
import { AppDispatch, RootState } from 'src/store';

// ** Custom Table Components Imports
import AddUserDrawer from 'src/views/apps/user/list/AddUserDrawer';
import TableHeader from 'src/views/tag/list/TableHeader';

import Chip from '@mui/material/Chip';
import { getTagsCardStats } from 'src/store/apps/states';
import DeleteTagDialog from 'src/views/tag/list/DeleteTagDialog';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 2 }}>
          <Typography>{children}</Typography>
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  };
}

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

const userStatusObj: UserStatusType = {
  active: 'success',
  pending: 'warning',
  inactive: 'secondary',
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

const Tags = () => {
  const [valuetab, setValuetab] = useState(0);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValuetab(newValue);
  };

  // ** State
  const [role, setRole] = useState<string>('');
  const [plan, setPlan] = useState<string>('');
  const [value, setValue] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [pageSize, setPageSize] = useState<number>(10);
  const [addUserOpen, setAddUserOpen] = useState<boolean>(false);

  const [selectedTag, setSelectedTag] = useState<string>('');
  const [deleteTagDialogOpen, setDeleteTagDialogOpen] =
    useState<boolean>(false);

  // ** Hooks
  const dispatch = useDispatch<AppDispatch>();
  const { tagsStats } = useSelector((state: RootState) => state.states);


  const handleFilter = useCallback((val: string) => {
    setValue(val);
  }, []);

  // ** Hooks
  const tagList = useSelector((state: RootState) => state.tags);

  const [tagListDataFiltered, setTagListDataFiltered] = useState<any>({
    custom: [],
    default: [],
  });

  useEffect(() => {
    dispatch(getTagCount());
    dispatch(getTagsCardStats());
  }, [dispatch]);

  useEffect(() => {
    if (value && value.trim() !== '') {
      let queryLowered = value.toLowerCase();
      const filteredCustomData = tagList?.countCustom?.filter((item: any) =>
        item.name.toLowerCase().includes(queryLowered),
      );
      const filteredDefaultData = tagList?.countDefault?.filter((item: any) =>
        item.name.toLowerCase().includes(queryLowered),
      );
      setTagListDataFiltered({
        ...tagListDataFiltered,
        custom: filteredCustomData,
        default: filteredDefaultData,
      });
    } else {
      setTagListDataFiltered({
        custom: tagList?.countCustom,
        default: tagList?.countDefault,
      });
    }
  }, [value, tagList?.countCustom, tagList?.countDefault]);

  const handleDelete = (id: string) => {
    setSelectedTag(id);
    setDeleteTagDialogOpen(true);
  };

  const toggleAddUserDrawer = () => setAddUserOpen(!addUserOpen);
  const avatarIcon: any = {
    total: 'mdi:tag-multiple',
    default: 'mdi:tag-heart',
    custom: 'mdi:tag-arrow-right',
  };

  const [tagsStatsData, setTagsStatsData] = useState<any>([])
  useEffect(() => {
    if (tagsStats && tagsStats.length > 0) {
      let mapArr = tagsStats.map((item: any) => {
        return {
          ...item,
          stats: item.stats.toString(),
          avatarIcon: item.title.toLowerCase().includes('total')
            ? "/images/new/segments/TOTAL_SEGS.png"
            : item.title.toLowerCase().includes('default')
            ? "/images/new/segments/TOTAL_SEGMENTS.png"
            : item.title.toLowerCase().includes('custom')
            ? avatarIcon.custom : '/images/new/segments/NEW_VISITORS.png',
          avatarColor:
          item.title.toLowerCase().includes('total') 
          ? 'success'
          : item.title.toLowerCase().includes('default') 
          ? 'info'
          :  item.title.toLowerCase().includes('custom') 
          ? 'warning'
          : 'primary',
        };
      });
      setTagsStatsData(mapArr);
    }
  }, [tagsStats]);
  const columns=[
    // {
    //   maxWidth: 70,
    //   field: 'id',
    //   headerName: 'Sr.No',
    //   headerClassName : "custom-header",
    //   renderCell: (params: any) =>params.api.getRowIndex(params?.row?._id || params?.row?.id) + 1

    // },
  
    {
      flex: 1,
      minWidth: 240,
      field: 'name',
      headerName: 'Tag Name',
      headerClassName : "custom-header",
      // renderCell: (params: any) => {
      //   return (
      //     <Chip label={params.value} size="small" color="primary" />
      //   );
      // },
    },
    
    {
      minWidth: 120,
      field: 'botCount',
      headerName: 'Bots',
      headerClassName : "custom-header",
    },
    {
      minWidth: 120,
      field: 'agentCount',
      headerName: 'Agents',
      headerClassName : "custom-header",

    },
    {
      minWidth: 120,
      field: 'serviceRequests',
      headerName: 'Tickets',
      headerClassName : "custom-header",
    },
    {
      minWidth: 120,
      field: 'questionCount',
      headerName: 'Questions',
      headerClassName : "custom-header",
    },
    // {
    //   minWidth: 120,
    //   field: 'advertisementCount',
    //   headerName: 'Ads',
    //   headerClassName : "custom-header",
    // },
    {
      minWidth: 120,
      field: 'offerCount',
      headerName: 'Offers',
      headerClassName : "custom-header",
    },
  ]
  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        {tagsStatsData && (
          <Grid container spacing={6}>
            {tagsStatsData.map((item: CardStatsHorizontalProps, index: number) => {
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
        <Card sx={{boxShadow:'rgba(0, 0, 0, 0.16) 0px 3px 6px, rgba(0, 0, 0, 0.23) 0px 3px 6px'}}  >
          <TableHeader
            value={value}
            handleFilter={handleFilter}
            toggle={toggleAddUserDrawer}
          />

          <Divider sx={{ m: '0 !important' }} />

          <Box sx={{ width: '100%' }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs
                value={valuetab}
                onChange={handleChange}
                aria-label="basic tabs example"
              >
                <Tab label="Default Tags" {...a11yProps(0)} />
                <Tab label="Custom Tags" {...a11yProps(1)} />
              </Tabs>
            </Box>
            <TabPanel value={valuetab} index={0}>
            <DataGrid
                autoHeight
                getRowId={(row: any) => row?._id || row?.id}
                rows={tagListDataFiltered.default ?? []}
                columns={columns}
                pageSize={pageSize}
                rowsPerPageOptions={[10, 25, 50]}
                onPageSizeChange={(newPageSize: number) =>
                  setPageSize(newPageSize)
                }
                
              />
            </TabPanel>
            <TabPanel value={valuetab} index={1}>
            <DataGrid
                autoHeight
                getRowId={(row: any) => row?._id || row?.id}
                rows={tagListDataFiltered.custom ?? []}
                columns={[
                  // {
                  //   maxWidth: 70,
                  //   field: 'id',
                  //   headerName: 'Sr.No',
                  //   filterable: false,
                  //   headerClassName : "custom-header",
                  //   renderCell: (index: any) => {
                  //     return (
                  //       <div style={{ textAlign: 'center', width: '100%' }}>
                  //         {index.api.getRowIndex(index?.row?._id || index?.row?.id) + 1}
                  //       </div>
                  //     );
                  //   },
                  // },

                  {
                    flex: 1,
                    minWidth: 240,
                    field: 'name',
                    headerName: 'Tag Name',
                    headerClassName : "custom-header",
                    // renderCell: (params: any) => {
                    //   return (
                    //     <Chip label={params?.value} size="small" color="primary" />
                    //   );
                    // },
                  },
                  
                  {
                    minWidth: 120,
                    field: 'botCount',
                    headerName: 'Bots',
                    headerClassName : "custom-header",
                  },
                  {
                    minWidth: 120,
                    field: 'agentCount',
                    headerName: 'Agents',
                    headerClassName : "custom-header",
                  },
                  {
                    minWidth: 120,
                    field: 'serviceRequests',
                    headerName: 'Tickets',
                    headerClassName : "custom-header",
                  },
                  {
                    minWidth: 120,
                    field: 'questionCount',
                    headerName: 'Questions',
                    headerClassName : "custom-header",
                  },
                  // {
                  //   minWidth: 120,
                  //   field: 'advertisementCount',
                  //   headerName: 'Ads',
                  //   headerClassName : "custom-header",
                  // },
                  {
                    minWidth: 120,
                    field: 'offerCount',
                    headerName: 'Offers',
                    headerClassName : "custom-header",
                  },

                  {
                    minWidth: 100,
                    sortable: false,
                    field: 'actions',
                    headerName: 'Actions',
                    headerClassName : "custom-header",
                    renderCell: ({ row }: any) => {
                      return (
                          <Tooltip placement="top" title="Delete" arrow>
                            <IconButton
                              aria-label="Delete"
                              size="small"
                              color="error"
                              sx={{ mr: 2 }}
                              onClick={() => handleDelete(row?._id || row?.id)}
                              disabled={row?.botCount || 0}
                            >
                              <Icon icon="bx:trash" fontSize={20} />
                            </IconButton>
                          </Tooltip>
                      );
                    },
                  },
                ]}
                pageSize={pageSize}
                rowsPerPageOptions={[10, 25, 50]}
                onPageSizeChange={(newPageSize: number) =>
                  setPageSize(newPageSize)
                }
              />
            </TabPanel>
         
          </Box>
        </Card>
      </Grid>

      <AddUserDrawer open={addUserOpen} toggle={toggleAddUserDrawer} />

      <DeleteTagDialog
        tagId={selectedTag}
        open={deleteTagDialogOpen}
        setOpen={setDeleteTagDialogOpen}
      />
    </Grid>
  );
};


export default Tags;
