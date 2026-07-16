// ** React Imports
import { useCallback, useEffect, useState } from 'react';

// ** Next Import
import Link from 'next/link';

// ** MUI Imports
import { Chip } from '@mui/material';
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
import { getBotCardStats } from 'src/store/apps/states';

// ** Store Imports
import { useDispatch, useSelector } from 'react-redux';

// ** Custom Components Imports
import CardStatisticsHorizontal from 'src/@core/components/card-statistics/card-stats-horizontal';
import CustomChip from 'src/@core/components/mui/chip';

// ** Utils Import

// ** Actions Imports
import { fetchBotData } from 'src/store/apps/bots';
// ** Third Party Components
// ** Types Imports
import { CardStatsHorizontalProps } from 'src/@core/components/card-statistics/types';
import { ThemeColor } from 'src/@core/layouts/types';
import { AppDispatch, RootState } from 'src/store';
import { UsersType } from 'src/types/apps/userTypes';

// ** Custom Table Components Imports
import { OutlinedInput, Tooltip } from '@mui/material';
import TableHeader from 'src/views/bots/list/TableHeader';
import ImportBotView from 'src/views/bots/list/ImportBotsView';

import { gettag } from 'src/store/apps/tags';

import { access } from 'src/helper/Access';
import { AccessTypesEnum } from 'src/utils';
import BotDeleteDialog from 'src/views/bots/list/botDeleteDialog';

interface UserRoleType {
  [key: string]: { icon: string; color: string };
}

interface UserStatusType {
  [key: string]: ThemeColor;
}

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

type rowCellType = {
  name: string;
  botId: string;
  status: string;
  published: boolean;
  agents: any;
  tags: any;
  _id: string;
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
const avatarIcon: any = {
  // bot: 'ant-design:robot-filled',
  // ticket: 'carbon:request-quote',
  // conversation: 'bx:message',
  bot: '/images/new/bots/TOTAL_BOTS.png',
  ticket: '/images/new/bots/TOTAL.png',
  conversation: '/images/new/bots/TOTAL_CONVERSATIONS.png',
};
const BotList = () => {
  // ** State

  const [role, setRole] = useState<string>('');
  const [plan, setPlan] = useState<string>('');
  const [value, setValue] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [pageSize, setPageSize] = useState<number>(10);
  const [addUserOpen, setAddUserOpen] = useState<boolean>(false);
  const [openImportDrawer, setOpenImportDrawer] = useState<boolean>(false);
  // ** Hooks
  const dispatch = useDispatch<AppDispatch>();
  const { list, isLoadingExportBot, isLoadingImportBot } = useSelector(
    (state: RootState) => state.bots,
  );
  const { userData } = useSelector((state: RootState) => state.user);
  const { botStates } = useSelector((state: RootState) => state.states);
  const [botListDataFiltered, setBotListDataFiltered] = useState<any>([]);
  const [cardStates, setCardStates] = useState<any>([]);
  useEffect(() => {
    if (userData && userData?.role) {
      setRole(userData.role);
    }
  }, [userData]);
  useEffect(() => {
    if (botStates && botStates.length > 0) {
      let mapArr = botStates.map((item: any) => {
        return {
          ...item,
          stats: item.stats.toString(),
          avatarIcon: avatarIcon[item.type],
          avatarColor:
            item.type === 'conversation'
              ? 'warning'
              : item.type === 'ticket'
              ? 'success'
              : 'primary',
        };
      });
      setCardStates(mapArr);
    }
  }, [botStates]);
  useEffect(() => {
    if (value && value.trim() !== '') {
      let queryLowered = value.toLowerCase();
      const filteredData = list?.filter((item: any) =>
        item.name.toLowerCase().includes(queryLowered),
      );
      setBotListDataFiltered(filteredData);
    } else {
      setBotListDataFiltered(list);
    }
  }, [value, list]);

  const handleFilter = useCallback((val: string) => {
    setValue(val);
  }, []);

  const handleStatusChange = useCallback((e: SelectChangeEvent) => {
    setStatus(e.target.value);
  }, []);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [selectedBotId, setSelectedBotId] = useState<any>('');
  const [selectExportBots, setSelectExportBots] = useState<any>([]);
  const toggleAddUserDrawer = () => setAddUserOpen(!addUserOpen);

  const handleDelete = (_id: any) => {
    setSelectedBotId(_id);
    setDeleteDialogOpen(true);
  };

  const [tagFiltered, setTagFiltered] = useState<any>([]);
  useEffect(() => {
    dispatch(gettag());
    dispatch(getBotCardStats());
  }, []);

  useEffect(() => {
    dispatch(
      fetchBotData({
        status: status,
        tags: tagFiltered ? tagFiltered : [],
      }),
    );
  }, [status, tagFiltered]);

  const tagList = useSelector((state: RootState) => state.tags.list);

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

  const columns = [
    {
      flex: 0.25,
      minWidth: 220,
      field: 'name',
      headerName: 'Bot Name',
      headerClassName : "custom-header",
      renderCell: ({ row }: any) => {
        return (
          <>
            <Link href={`/bots/settings/${row?._id || row?.id}`}>
              <StyledLink>{row.name}</StyledLink>
            </Link>
            <CustomChip
              rounded
              skin="light"
              size="small"
              label={row.status}
              color={userStatusObj[row.status]}
            />
          </>
        );
      },
    },
    {
      flex: 0.15,
      minWidth: 120,
      headerName: 'No. Of Agents',
      field: 'currentPlan',
      headerClassName : "custom-header",
      renderCell: ({ row }: any) => {
        return (
          <>
            <Typography>{row.agents.length}</Typography>
          </>
        );
      },
    },
    {
      flex: 0.2,
      minWidth: 200,
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
                    sx={{ margin: '1.2px', fontSize: '13px', background:'primary.main', borderRadius:1}}
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
      flex: 0.15,
      minWidth: 120,
      headerName: 'Created On',
      field: 'createdAt',
      sort: 'desc',
      headerClassName : "custom-header",
      renderCell: (params: any) => {
        return (
          <span>
            {new Date(params.value).toLocaleDateString('en-US', {
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
      flex: 0.15,
      minWidth: 120,
      headerName: 'Updated On',
      field: 'updatedAt',
      sort: 'desc',
      headerClassName : "custom-header",
      renderCell: (params: any) => {
        return (
          <span>
            {new Date(params.value).toLocaleDateString('en-US', {
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
      flex: 0.1,
      minWidth: 180,
      sortable: false,
      field: 'actions',
      headerName: 'Actions',
      headerClassName : "custom-header",
      renderCell: ({ row }: any) => {
        return role && access(role, AccessTypesEnum.ACTION) ? (
          <>
            <Link href={`/bots/bot-flow/${row?._id || row?.id}`}>
              <Tooltip placement="top" title="Bot Flow" arrow>
                <IconButton
                  aria-label="bot-flow"
                  size="small"
                  sx={{ mr: 2 }}
                  color="inherit"
                >
                  <Icon icon="typcn:flow-merge" fontSize={20} />
                </IconButton>
              </Tooltip>
            </Link>

            <Link href={`/bots/settings/${row?._id || row?.id}`}>
              <Tooltip placement="top" title="Edit" arrow>
                <IconButton
                  aria-label="Edit"
                  size="small"
                  sx={{ mr: 2 }}
                  color="primary"
                >
                  <Icon icon="bx:pencil" fontSize={20} />
                </IconButton>
              </Tooltip>
            </Link>

            <Tooltip placement="top" title="Delete" arrow>
              <IconButton
                aria-label="delete"
                size="small"
                sx={{ mr: 2 }}
                color="error"
                onClick={() => handleDelete(row?._id || row?.id)}
              >
                <Icon icon="bx:trash" fontSize={20} />
              </IconButton>
            </Tooltip>
          </>
        ) : (
          <></>
        );
      },
    },
  ];

  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        {cardStates && (
          <Grid container spacing={6}>
            {cardStates.map((item: CardStatsHorizontalProps, index: number) => {
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
        <Card style={{ boxShadow:'rgba(0, 0, 0, 0.16) 0px 3px 6px, rgba(0, 0, 0, 0.23) 0px 3px 6px'}} >
          {
            <TableHeader
              value={value}
              handleFilter={handleFilter}
              toggle={toggleAddUserDrawer}
              isDisplay={access(role, AccessTypesEnum.CREATE)}
              selectExportBots={selectExportBots}
              dispatch={dispatch}
              isLoadingExportBot={isLoadingExportBot}
              setOpen={setOpenImportDrawer}
              isLoadingImportBot={isLoadingImportBot}
            />
          }

          <Divider sx={{ m: '0 !important' }} />
          <CardContent>
            <Grid container spacing={5}>
              <Grid item sm={3} xs={12}>
                <div style={{ fontSize: '1.1rem' }}>Filters</div>
              </Grid>
              <Grid item sm={3} xs={12}>
                {/* <FormControl fullWidth size="small">
                  <InputLabel id="role-select">Select Bot</InputLabel>
                  <Select
                    size="small"
                    value={role}
                    id="select-role"
                    label="Select Role"
                    labelId="role-select"
                    onChange={handleRoleChange}
                    inputProps={{ placeholder: 'Select Role' }}
                  >
                    <MenuItem value="">Select Bot</MenuItem>
                    <MenuItem value="admin">Marketing</MenuItem>
                    <MenuItem value="author">Finance</MenuItem>
                    <MenuItem value="editor">Banking</MenuItem>
                    <MenuItem value="maintainer">QnA</MenuItem>
                    <MenuItem value="subscriber">FAQ</MenuItem>
                  </Select>
                </FormControl> */}
              </Grid>
              <Grid item sm={3} xs={12}>
                <FormControl fullWidth size="small">
                  <InputLabel id="plan-select">Select Tag</InputLabel>
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
                        id="select-multiple-chip"
                        label="Select Tag"
                      />
                    }
                    inputProps={{ placeholder: 'Select Tags' }}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((value: any, index: number) => {
                          let obj = tagList.find((x) => x._id === value);
                          return (
                            <Chip
                              key={index}
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
                    size="small"
                    value={status}
                    id="select-status"
                    label="Select Status"
                    labelId="status-select"
                    onChange={handleStatusChange}
                    inputProps={{ placeholder: 'Select Role' }}
                  >
                    <MenuItem value="">Select Status</MenuItem>
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="suspended">Suspended</MenuItem>
                    <MenuItem value="deleted">Deleted</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </CardContent>
          <Divider sx={{ m: '0 !important' }} />

          <DataGrid
            autoHeight
            rows={botListDataFiltered ?? []}
            columns={columns}
            getRowId={(row: any) => row?._id || row?.id}
            pageSize={pageSize}
            checkboxSelection
            onSelectionModelChange={(e: any) => setSelectExportBots(e)}
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

      <BotDeleteDialog
        Id={selectedBotId}
        open={deleteDialogOpen}
        setOpen={setDeleteDialogOpen}
      />
      <ImportBotView
        open={openImportDrawer}
        setOpen={setOpenImportDrawer}
        toggle={() => {
          console.log('toggle');
        }}
      />
    </Grid>
  );
};

export default BotList;
