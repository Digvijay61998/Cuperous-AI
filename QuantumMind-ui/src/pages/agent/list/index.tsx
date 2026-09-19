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
import Typography from '@mui/material/Typography';
import { DataGrid } from '@mui/x-data-grid';

// ** Icon Imports
import Icon from 'src/@core/components/icon';

// ** Store Imports
import { useDispatch, useSelector } from 'react-redux';

// ** Custom Components Imports
import CardStatisticsHorizontal from 'src/@core/components/card-statistics/card-stats-horizontal';
import CustomAvatar from 'src/@core/components/mui/avatar';
import CustomChip from 'src/@core/components/mui/chip';

// ** Utils Import
import { getInitials } from 'src/@core/utils/get-initials';

// ** Actions Imports
import { fetchAgentList } from 'src/store/apps/agent';
import { gettag } from 'src/store/apps/tags';
// ** Third Party Components

// ** Types Imports
import { CardStatsHorizontalProps } from 'src/@core/components/card-statistics/types';
import { ThemeColor } from 'src/@core/layouts/types';
import { AppDispatch, RootState } from 'src/store';

// ** Custom Table Components Imports
import { Chip, OutlinedInput, Tooltip } from '@mui/material';
import Rating from '@mui/material/Rating';
import { useRouter } from 'next/router';
import { getAgentsCardStats } from 'src/store/apps/states';
import AddAgentDrawer from 'src/views/agent/list/AddAgentDrawer';
import AgentDeleteDialog from 'src/views/agent/list/AgentDeleteDialog';
import TableHeader from 'src/views/agent/list/TableHeader';
import { useEntitlements } from 'src/hooks/useEntitlements';
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
interface AgentStatusType {
  [key: string]: ThemeColor;
}

const userStatusObj: AgentStatusType = {
  online: 'success',
  busy: 'error',
  offline: 'secondary',
  away: 'warning',
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

// ** renders client column
const renderClient = (row: any) => {
  // if (row.avatar.length) {
  //   return (
  //     <CustomAvatar src={row.avatar} sx={{ mr: 3, width: 32, height: 32 }} />
  //   );
  // } else {
  return (
    <CustomAvatar
      skin="light"
      color={row.avatarColor || 'primary'}
      sx={{ mr: 3, width: 32, height: 32, fontSize: '.875rem' }}
    >
      {getInitials(row.name ? row.name : 'Unknown')}
    </CustomAvatar>
  );
  // }
};
const avatarIcon: any = {
  // main: 'mdi:account-group',
  // active_agent: 'material-symbols:support-agent-rounded',
  // online_agent: 'mdi:account-online',
  // conversation: 'zondicons:conversation',
  main: '/images/new/agents/TOTAL_AGENTS.png',
  active_agent: '/images/new/agents/ACTIVE_AGENTS.png',
  online_agent: '/images/new/agents/ONLINE_AGENTS.png',
  conversation: '/images/new/agents/zondicons:conversation',
};
const AgentList = () => {
  // ** State
  const [bot, setBot] = useState<string>('');
  const [tagFiltered, setTagFiltered] = useState<any>([]);
  const [value, setValue] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [pageSize, setPageSize] = useState<number>(10);
  const [addUserOpen, setAddUserOpen] = useState<boolean>(false);
  const [agentCardStates, setAgentCardStates] = useState<any>([]);
  const { agentStates } = useSelector((state: RootState) => state.states);
  // ** Router
  const router = useRouter();

  // ** Hooks
  const dispatch = useDispatch<AppDispatch>();

  const agentStore = useSelector(
    (state: RootState) => state.agent.agentListData.data,
  );
  const tagList = useSelector((state: RootState) => state.tags.list);
  const botList = useSelector((state: RootState) => state.bots.list);
  // can use "publishedBots" instead of the bot's "list"

  // ** delete dialog and agent
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [selectedAgentId, setSelectedAgentId] = useState<any>('');
  useEffect(() => {
    dispatch(getAgentsCardStats());
  }, []);
  useEffect(() => {
    if (agentStates && agentStates.length > 0) {
      let mapArr = agentStates.map((item: any) => {
        return {
          ...item,
          stats: item.stats.toString(),
          avatarIcon: avatarIcon[item.type],
          avatarColor:
            item.type === 'active_agent'
              ? 'warning'
              : item.type === 'main'
              ? 'success'
              : 'primary',
        };
      });
      setAgentCardStates(mapArr);
    }
  }, [agentStates]);
  // ** Functions
  const handleDeleteDialog = (id: any) => {
    setSelectedAgentId(id);
    setDeleteDialogOpen(true);
  };

  const [agentListDataFiltered, setAgentListDataFiltered] = useState([]);

  useEffect(() => {
    dispatch(gettag());
  }, []);

  useEffect(() => {
    dispatch(
      fetchAgentList({
        status: status,
        tags: tagFiltered ? tagFiltered : [],
        bot: bot || '',
      }),
    );
  }, [status, tagFiltered, bot]);

  useEffect(() => {
    if (value && value.trim() !== '') {
      let queryLowered = value.toLowerCase();
      const filteredData = agentStore?.filter(
        (item: any) =>
          item.name.toLowerCase().includes(queryLowered) ||
          item.email.toLowerCase().includes(queryLowered),
      );
      setAgentListDataFiltered(filteredData);
    } else {
      setAgentListDataFiltered(agentStore);
    }
  }, [value, agentStore]);

  const handleFilter = useCallback((val: string) => {
    setValue(val);
  }, []);

  const handleBotChange = useCallback((e: SelectChangeEvent) => {
    setBot(e.target.value);
  }, []);

  const handleTagFilteredChange = useCallback(
    (e: SelectChangeEvent<typeof tagFiltered>) => {
      const {
        target: { value },
      } = e;
      // setTagFiltered(value);
      setTagFiltered(
        // On autofill we get a stringified value.
        typeof value === 'string' ? value.split(',') : value,
      );
    },
    [],
  );

  const handleStatusChange = useCallback((e: SelectChangeEvent) => {
    setStatus(e.target.value);
  }, []);

  const toggleAddUserDrawer = () => setAddUserOpen(!addUserOpen);
  const { canCreate } = useEntitlements();
  const agentQuotaReached = !canCreate('agents');
  const columns = [
    {
      flex: 0.25,
      minWidth: 240,
      field: 'name',
      headerName: 'Agent',
      headerClassName : "custom-header",
      renderCell: ({ row }: any) => {
        const { _id, name, email, status } = row;

        return (
          
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {renderClient(row)}
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
                <Link href={`/agent/view/${_id}`} passHref>
                  <StyledLink>{name}</StyledLink>
                </Link>
                <CustomChip
                  rounded
                  skin="light"
                  size="small"
                  label={status}
                  color={userStatusObj[status]}
                  sx={{ fontSize: '0.6rem' }}
                />
              </Box>
            </Box>
          </Box>
        );
      },
    },
    {
      flex: 0.22,
      field: 'assignedBots',
      minWidth: 180,
      headerName: 'Assigned Bots',
      headerClassName : "custom-header",
      renderCell: ({ row }: any) => {
        return (
          <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
            {row?.assignedBots?.length > 0 ? (
              <>
                {row?.assignedBots?.map((item: any, index: number) => (
                  <Chip
                    key={index}
                    label={item?.name}
                    size="small"
                    color="primary"
                    sx={{ margin: '1.2px', fontSize: '13px',background:'primary.main', borderRadius:1}}
                  />
                ))}
              </>
            ) : (
              <>N/A</>
            )}
          </Box>
        );
      },
    },
    {
      flex: 0.2,
      minWidth: 180,
      headerName: 'Tags',
      field: 'tags',
      headerClassName : "custom-header",
      renderCell: ({ row }: any) => {
        return (
          <div style={{ display: 'flex', flexWrap: 'wrap' }}>
            {row?.tags?.length > 0 ? (
              <>
                {row?.tags?.map((item: any, index: number) => (
                  <Chip
                    key={index}
                    label={item?.name}
                    size="small"
                    color="primary"
                    sx={{ margin: '1.2px',fontSize: '13px',background:'primary.main', borderRadius:1}}
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
      flex: 0.1,
      minWidth: 100,
      field: 'activeConversations',
      headerName: 'Active Chats',
      headerClassName : "custom-header",
      renderCell: ({ row }: any) => {
        return (
          <Typography noWrap sx={{ color: 'text.secondary' }}>
            {row.activeConversations}
          </Typography>
        );
      },
    },
    {
      flex: 0.1,
      minWidth: 120,
      field: 'rating',
      headerName: 'Rating',
      headerClassName : "custom-header",
      renderCell: (params: any) => {
        return (
          <Rating name="read-only" value={params.value} size="small" readOnly />
        );
      },
    },

    {
      flex: 0.2,
      minWidth: 160,
      headerName: 'Last Seen',
      headerClassName : "custom-header",
      field: 'lastSeen',
      sort: 'desc',
      renderCell: (params: any) => {
        return (
          // <Typography>{new Date(row.createdAt).toLocaleString("en-IN")}</Typography>

          <span>
            {params.value
              ? new Date(params.value).toLocaleDateString('en-US', {
                  hour: 'numeric',
                  minute: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })
              : 'NA'}
          </span>
        );
      },
    },
    {
      flex: 0.1,
      minWidth: 100,
      sortable: false,
      field: 'actions',
      headerName: 'Actions',  headerClassName : "custom-header",

      renderCell: ({ row }: any) => {
        return (
          <>
            <Tooltip placement="top" title="View" arrow>
              <IconButton
                aria-label="View"
                size="small"
                sx={{ mr: 2 }} color="secondary"
                onClick={() => {
                  router.push(`/agent/view/${row?.id || row?._id}`);
                }}
              >
                <Icon icon="bx:show" fontSize={20} />
              </IconButton>
            </Tooltip>

            <Tooltip placement="top" title="Delete" arrow>
              <IconButton
                aria-label="Delete"
                size="small"
                sx={{ mr: 2 }} color="error"
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
        {agentCardStates && (
          <Grid container spacing={6}>
            {agentCardStates.map((item: CardStatsHorizontalProps, index: number) => {
              return (
                <Grid item xs={12} md={4} sm={6} key={index}>
                  <CardStatisticsHorizontal {...item} />
                </Grid>
              );
            })}
          </Grid>
        )}
      </Grid>
      <Grid item xs={12}>
        <Card  style={{ boxShadow:'rgba(0, 0, 0, 0.16) 0px 3px 6px, rgba(0, 0, 0, 0.23) 0px 3px 6px'}} >
          <TableHeader
            value={value}
            handleFilter={handleFilter}
            toggle={toggleAddUserDrawer}
            disableAdd={agentQuotaReached}
            disableReason="Agent limit reached for your plan. Upgrade to add more."
          />
          <Divider sx={{ m: '0 !important' }} />
          {/* <CardHeader title="Search Filters" /> */}
          <CardContent>
            <Grid container spacing={5}>
              <Grid item sm={3} xs={12}>
                <div style={{ fontSize: '1.1rem' }}>Filters</div>
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
                    {botList?.map((bot: any, index) => (
                      <MenuItem key={index} value={bot?._id || bot?.id}>
                        {bot?.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item sm={3} xs={12}>
                <FormControl fullWidth size="small">
                  <InputLabel id="tag-select">Select Tag</InputLabel>
                  <Select
                    fullWidth
                    value={tagFiltered}
                    id="select-tag"
                    size="small"
                    multiple
                    label="Select Tag"
                    labelId="tag-select"
                    onChange={handleTagFilteredChange}
                    input={
                      <OutlinedInput
                        id="select-multiple-tag"
                        label="Select Tag"
                      />
                    }
                    inputProps={{ placeholder: 'Select Tags' }}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((value: any) => {
                          let obj = tagList.find((x) => x._id === value);
                          return (
                            <Chip
                              key={value}
                              label={obj?.name}
                              color="primary"
                              size="small"
                              sx={{ margin: '1.2px', fontSize: '9px' }}
                            />
                          );
                        })}
                      </Box>
                    )}
                    MenuProps={MenuProps}
                  >
                    {tagList?.map((tag: any, index) => (
                      <MenuItem key={index} value={tag?._id || tag?.id}>
                        {tag?.name}
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
                    <MenuItem value="online">Online</MenuItem>
                    <MenuItem value="offline">Offline</MenuItem>
                    <MenuItem value="busy">Busy</MenuItem>
                    <MenuItem value="away">Away</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </CardContent>

          <DataGrid
            autoHeight
            rows={agentListDataFiltered ?? []}
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

      <AddAgentDrawer open={addUserOpen} toggle={toggleAddUserDrawer} />

      <AgentDeleteDialog
        agentId={selectedAgentId}
        open={deleteDialogOpen}
        setOpen={setDeleteDialogOpen}
      />
    </Grid>
  );
};


export default AgentList;
