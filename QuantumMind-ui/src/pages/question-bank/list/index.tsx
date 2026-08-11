// ** React Imports
import {
  SyntheticEvent, useCallback, useEffect, useState
} from 'react';

// ** Next Import
import Link from 'next/link';

// ** MUI Imports
import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
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

// ** Icon Imports
import Icon from 'src/@core/components/icon';

// ** Store Imports
import { useDispatch, useSelector } from 'react-redux';

// ** Custom Components Imports
import CardStatisticsHorizontal from 'src/@core/components/card-statistics/card-stats-horizontal';

// ** Utils Import

// ** Actions Imports
import { gettag } from 'src/store/apps/tags';
// ** Third Party Components

// ** Types Imports
import { CardStatsHorizontalProps } from 'src/@core/components/card-statistics/types';
import { ThemeColor } from 'src/@core/layouts/types';
import { AppDispatch, RootState } from 'src/store';

// ** Custom Table Components Imports
import {
  Chip,
  OutlinedInput,
  Pagination,
  Stack,
  Tooltip
} from '@mui/material';
import { getComparator, stableSort } from 'src/helper';
import { fetchLanguages } from 'src/store/apps/bots';
import {
  fetchQuestionBankList,
  updateQAStatus
} from 'src/store/apps/question-bank';
import { getQuestionCardStates } from 'src/store/apps/states';
import AddBulkQA from 'src/views/question-bank/list/AddBulkQ&A';
import AddEditQA from 'src/views/question-bank/list/AddEditQ&A';
import QADeleteDialog from 'src/views/question-bank/list/QADeleteDialog';
import TableHeader from 'src/views/question-bank/list/TableHeader';

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
interface QAStatusType {
  [key: string]: ThemeColor;
}

const qaStatusObj: QAStatusType = {
  approved: 'success',
  under_review: 'warning',
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
  total_question: 'uil:layer-group',
  approved_question: 'material-symbols:new-releases',
  under_review_question: 'zondicons:conversation',
};
const avatarColor: any = {
  warning: 'warning',
  success: 'success',
  primary: 'primary',
};
const QAList = () => {
  // ** State
  const [tagFiltered, setTagFiltered] = useState<any>([]);
  const [languageFilter, setLanguageFilter] = useState<string>('');
  const [value, setValue] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  
  // Pagination
  const PER_PAGE = 10;
  let [page, setPage] = useState(0);
  const [order, setOrder] = useState('desc');

  const [addQAOpen, setAddQAOpen] = useState<boolean>(false);
  const [addBulkQAOpen, setAddBulkQAOpen] = useState<boolean>(false);

  const initAddData: any = {
    method: 'add',
    question: '',
    language: '',
    answers: [],
    tags: [],
    keywords: [],
  };
  const [data, setData] = useState<any>(initAddData);

  // ** Hooks
  const dispatch = useDispatch<AppDispatch>();
  const { questionBankListData, questionBankListCount } = useSelector(
    (state: RootState) => state.questionBank,
  );
  const tagList = useSelector((state: RootState) => state.tags.list);
  const langList: any = useSelector(
    (state: RootState) => state?.bots?.languages,
  );
  useEffect(() => {
    dispatch(fetchLanguages());
  }, []);
  
  // ** approve and under review and delete dialog and QA
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [selectedQAId, setSelectedQAId] = useState<any>('');
  const [approveDialogOpen, setApproveDialogOpen] = useState<boolean>(false);
  const [underReviewDialogOpen, setUnderReviewDialogOpen] =
    useState<boolean>(false);
  // ** Functions
  const handleDeleteDialog = (id: any) => {
    setSelectedQAId(id);
    setDeleteDialogOpen(true);
  };
  const handleApproveDialog = (id: any) => {
    setSelectedQAId(id);
    dispatch(updateQAStatus({ id: id, data: { status: 'approved' } }));
    // setApproveDialogOpen(true);
  };
  const handleUnderReviewDialog = (id: any) => {
    setSelectedQAId(id);
    dispatch(updateQAStatus({ id: id, data: { status: 'under_review' } }));
    // setUnderReviewDialogOpen(true);
  };
  const { questionStates } = useSelector((state: RootState) => state.states);

  // ** filter by search field works only with given list **
  // const [qAListDataFiltered, setQAListDataFiltered] = useState<any>([]);

  useEffect(() => {
    if (dispatch) dispatch(getQuestionCardStates());
  }, [dispatch]);
  const [questionCardData, setQuestionCardData] = useState<any>([]);
  useEffect(() => {
    if (questionStates && questionStates.length > 0) {
      let mapArr = questionStates.map((item: any) => {
        return {
          ...item,
          stats: item.stats.toString(),
          avatarIcon: item.title.toLowerCase().includes('total')
            ? "/images/new/segments/TOTAL_SEGS.png"
            : item.title.toLowerCase().includes('approved')
            ? "/images/new/segments/TOTAL_SEGMENTS.png"
            : item.title.toLowerCase().includes('under')
            ? '/images/new/segments/NEW_VISITORS.png'
            : '/images/new/segments/NEW_VISITORS.png',
          avatarColor: item.title.toLowerCase().includes('under')
            ? 'warning'
            : item.title.toLowerCase().includes('approved')
            ? 'success'
            : 'primary',
        };
      });
      setQuestionCardData(mapArr);
    }
  }, [questionStates]);
  // ** Accordion State
  const [expanded, setExpanded] = useState<string | false>(false);
  const [selectedQA, setSelectedQA] = useState<string[]>([]);
  const handleChange =
    (panel: string) => (event: SyntheticEvent, isExpanded: boolean) => {
      setExpanded(isExpanded ? panel : false);
    };
  const expandIcon = (value: string) => (
    <Icon icon={expanded === value ? 'bx:minus' : 'bx:plus'} />
  );

  useEffect(() => {
    dispatch(gettag());
  }, []);

  useEffect(() => {
    dispatch(
      fetchQuestionBankList({
        skip: page*PER_PAGE,
        limit: PER_PAGE,
        search: value,
        status: status,
        tags: tagFiltered ? tagFiltered : [],
        language: languageFilter,
      }),
    );
  }, [page, PER_PAGE, value, status, tagFiltered, languageFilter]);

  // ** filter the QB by search field according to the given list only**
  // useEffect(() => {
  //   if (value && value.trim() !== '') {
  //     let queryLowered = value.toLowerCase();
  //     const filteredData = questionBankListData?.filter((item: any) =>
  //       item.question.toLowerCase().includes(queryLowered),
  //     );
  //     setQAListDataFiltered(filteredData);
  //   } else {
  //     setQAListDataFiltered(questionBankListData);
  //   }
  // }, [value, questionBankListData]);

  const handleFilter = useCallback((val: string) => {
    setValue(val);
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

  const handleChangeLang = useCallback((e: SelectChangeEvent) => {
    setLanguageFilter(e.target.value);
  }, []);
  const handleStatusChange = useCallback((e: SelectChangeEvent) => {
    setStatus(e.target.value);
  }, []);

  const toggleAddQADrawer = () => {
    setData(initAddData);
    setAddQAOpen(!addQAOpen);
  };
  const toggleEditQADrawer = (data: any) => {
    setData(data);
    setAddQAOpen(!addQAOpen);
  };
  const toggleAddBulkQADrawer = () => setAddBulkQAOpen(!addBulkQAOpen);

  // Pagination
  const count = Math.ceil(questionBankListCount / PER_PAGE);
  const handleChangePage = (e: any, p: number) => {
    setPage(p - 1);
  };

  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        {questionCardData && (
          <Grid container spacing={6}>
            {questionCardData.map(
              (item: CardStatsHorizontalProps, index: number) => {
                return (
                  <Grid item xs={12} md={4} sm={6} key={index}>
                    <CardStatisticsHorizontal {...item} />
                  </Grid>
                );
              },
            )}
          </Grid>
        )}
      </Grid>
      <Grid item xs={12}>
        <Card  sx={{boxShadow:'rgba(0, 0, 0, 0.16) 0px 3px 6px, rgba(0, 0, 0, 0.23) 0px 3px 6px'}} >
          <TableHeader
            value={value}
            handleFilter={handleFilter}
            toggle={toggleAddQADrawer}
            toggleBulk={toggleAddBulkQADrawer}
          />
          <Divider sx={{ m: '0 !important' }} />
          <CardContent>
            <Grid container spacing={5}>
              <Grid item sm={3} xs={12}>
                <div style={{ fontSize: '1.1rem' }}>Filters</div>
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
                        {selected.map((value: any, index:number) => {
                          // let obj = tagList.find(x => x._id === value);
                          return (
                            <Chip

                              key={index}
                              label={value}
                              color="primary"
                              style={{ fontSize: '11px' }}
                            />
                          );
                        })}
                      </Box>
                    )}
                    MenuProps={MenuProps}
                  >
                    {tagList?.map((tag: any, index: number) => (
                      <MenuItem key={index} value={tag?.name}>
                        {tag?.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item sm={3} xs={12}>
                <FormControl fullWidth size="small">
                  <InputLabel id="select-lang">Select Language</InputLabel>

                  <Select
                    fullWidth
                    labelId="select-lang"
                    id="select-language"
                    value={languageFilter}
                    size="small"
                    onChange={handleChangeLang}
                    input={
                      <OutlinedInput
                        id="select-multiple-language"
                        label="Select language"
                      />
                    }
                    inputProps={{ placeholder: 'Select Language' }}
                    MenuProps={MenuProps}
                  >
                    <MenuItem value="">All</MenuItem>
                    {langList?.map((langItem: any, index: number) => (
                      <MenuItem key={index} value={langItem?.label}>
                        {langItem?.label}
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
                    <MenuItem value="approved">Approved</MenuItem>
                    <MenuItem value="under_review">Under Review</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              {/* -- Sort the QB according to the given list only-- */}
              {/* <Grid item sm={1} xs={6}>
                <Button
                  color="primary"
                  variant="contained"
                  fullWidth
                  onClick={() => {
                    setOrder((prev) => {
                      return prev == 'asc' ? 'desc' : 'asc';
                    });
                  }}
                  startIcon={
                    order === 'asc' ? (
                      <Icon icon={'ion:caret-down'} fontSize="20" />
                    ) : (
                      <Icon icon={'ion:caret-up'} fontSize="20" />
                    )
                  }
                  // style={{ textTransform: "none" }}
                >
                  {order}
                </Button>
              </Grid> */}
            </Grid>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12}>
        {questionBankListData && questionBankListData.length > 0 ? (
          <>
            {questionBankListData.length !== 0 &&
              stableSort(questionBankListData, getComparator(order, 'createdAt'))
                // .slice(page * PER_PAGE, page * PER_PAGE + PER_PAGE)
                .map((item: any, index: number) => {
                  return (
                    <div key={index}>
                      <Accordion
                        expanded={expanded === `panel${index}`}
                        onChange={handleChange(`panel${index}`)}
                        sx={{boxShadow:'rgba(0, 0, 0, 0.16) 0px 3px 6px, rgba(0, 0, 0, 0.23) 0px 3px 6px'}} 
                      >
                        <AccordionSummary
                          id={`actions-panel-header-${index}`}
                          expandIcon={expandIcon(`panel${index}`)}
                          aria-controls={`actions-panel-content-${index}`}
                          // expandIcon={<Icon icon='bx:chevron-down' />}
                          sx={{
                            '& .MuiAccordionSummary-content': {
                              my: 2,
                              '&.Mui-expanded': { my: 2 },
                            },
                          }}
                        >
                          <Grid
                            container
                            gap="1"
                            direction="row"
                            justifyContent="space-between"
                            alignItems="center"
                          >
                            <Grid item xs={10}>
                              <Typography
                                variant="body1"
                                component={'span'}
                                sx={{ py: 1 }}
                              >
                                {item.question}
                              </Typography>
                              <Tooltip
                                title={
                                  item.status === 'under_review'
                                    ? 'Under Review'
                                    : 'Approved'
                                }
                                placement="top"
                                arrow
                              >
                                <IconButton
                                  color={qaStatusObj[item.status]}
                                  onClick={(event) => event.stopPropagation()}
                                >
                                  <Icon
                                    icon={
                                      item.status === 'under_review'
                                        ? 'ic:round-new-releases'
                                        : 'material-symbols:new-releases'
                                    }
                                    fontSize={20}
                                  />
                                </IconButton>
                              </Tooltip>
                            </Grid>
                            <Grid item xs={'auto'}>
                              <Chip
                                label={
                                  <span style={{ textTransform: 'none' }}>
                                    used {item?.usedcount}times
                                  </span>
                                }
                              />
                            </Grid>
                          </Grid>
                        </AccordionSummary>
                        <AccordionDetails>
                          <Grid container spacing={2}>
                            <Grid item xs={12}>
                              <Stack
                                direction="column"
                                spacing={2}
                                justifyContent="space-between"
                              >
                                {item?.answers?.map((answer: string, index:number) => {
                                  return (
                                    <div key={index}>
                                      Answer : &nbsp;
                                      <Typography
                                        variant="body2"
                                        component={'span'}
                                      >
                                        {answer}
                                      </Typography>
                                    </div>
                                  );
                                })}
                              </Stack>
                            </Grid>

                            <Grid item xs={12}>
                              <div
                                style={{ display: 'flex', flexWrap: 'wrap' }}
                              >
                                <div>{'Intent :'}</div> &nbsp;
                                <Typography
                                  variant="body2"
                                  style={{ lineHeight: '1.9' }}
                                >
                                  {item?.intent || 'N/A'}
                                </Typography>
                              </div>
                            </Grid>

                            <Grid item xs={12}>
                              <div
                                style={{ display: 'flex', flexWrap: 'wrap' }}
                              >
                                <div>{'Keywords :'}</div> &nbsp;
                                {item?.keywords?.length > 0 ? (
                                  <>
                                    {item?.keywords?.map(
                                      (word: any, index: number) => (
                                        <Chip
                                          key={index}
                                          label={word}
                                          size="small"
                                          // color=""
                                          sx={{backgroundColor : 'secondary.main', color : "white"}}
                                          className='chip-class'
                                          style={{
                                            margin: '2px',
                                            fontSize: '11px',
                                          }}
                                        />
                                      ),
                                    )}
                                  </>
                                ) : (
                                  <Typography
                                    variant="body2"
                                    style={{ lineHeight: '1.9' }}
                                  >
                                    N/A
                                  </Typography>
                                )}
                              </div>
                            </Grid>

                            <Grid item xs={12}>
                              <div
                                style={{ display: 'flex', flexWrap: 'wrap' }}
                              >
                                <div>{'Tags :'}</div> &nbsp;
                                {item?.tags?.length > 0 ? (
                                  <>
                                    {item?.tags?.map(
                                      (obj: any, index: number) => (
                                        <Chip
                                          key={index}
                                          label={obj}
                                          size="small"
                                          // color="primary"
                                          sx={{backgroundColor : 'secondary.main', color : "white"}}
                                          style={{
                                            margin: '2px',
                                            fontSize: '11px',
                                          }}
                                        />
                                      ),
                                    )}
                                  </>
                                ) : (
                                  <Typography
                                    variant="body2"
                                    style={{ lineHeight: '1.9' }}
                                  >
                                    N/A
                                  </Typography>
                                )}
                              </div>
                            </Grid>

                            <Grid item xs={12}>
                              <div
                                style={{ display: 'flex', flexWrap: 'wrap' }}
                              >
                                <div>{'Language :'}</div> &nbsp;
                                <Typography
                                  variant="body2"
                                  style={{ lineHeight: '1.9' }}
                                >
                                  {item?.lang || 'N/A'}
                                </Typography>
                              </div>
                            </Grid>

                            <Grid
                              item
                              xs={8}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                              }}
                            >
                              <Typography variant="body2" component={'span'}>
                                Added by&nbsp;
                                <Link
                                  href={`/agent/view/${item?.addedBy?._id || item?.addedBy?.id}`}
                                  passHref
                                >
                                  <StyledLink>{item?.addedBy?.name}</StyledLink>
                                </Link>
                                &nbsp; & last updated at&nbsp;
                                <Typography variant="body2" component={'span'}>
                                  {new Date(
                                    item?.updatedAt || null,
                                  ).toLocaleDateString('en-US', {
                                    hour: 'numeric',
                                    minute: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                  })}
                                </Typography>
                              </Typography>
                            </Grid>
                            <Grid item xs={4}>
                              <Stack
                                direction="row"
                                spacing={1}
                                justifyContent="flex-end"
                              >
                                <Tooltip title={'Edit'} placement="top" arrow>
                                  <IconButton
                                    aria-label="edit"
                                    // variant='outlined'
                                    size="small"
                                    color="primary"
                                    onClick={() => {
                                      toggleEditQADrawer({
                                        method: 'edit',
                                        id: item.id,
                                        language: item.lang,
                                        question: item.question,
                                        answers: item.answers,
                                        tags: item.tags,
                                        keywords: item.keywords,
                                      });
                                    }}
                                    style={{ outline: '1px solid inherit' }}
                                  >
                                    <Icon icon="bxs:edit" fontSize={24} />
                                  </IconButton>
                                </Tooltip>

                                <Tooltip title={'Delete'} placement="top" arrow>
                                  <IconButton
                                    aria-label="delete"
                                    // variant='outlined'
                                    size="small"
                                    color="error"
                                    onClick={() => handleDeleteDialog(item.id)}
                                    style={{ outline: '1px solid inherit' }}
                                  >
                                    <Icon icon="bx:trash" fontSize={24} />
                                  </IconButton>
                                </Tooltip>

                                <Tooltip
                                  title={
                                    item?.status === 'under_review'
                                      ? 'Approve Question'
                                      : 'UnApprove Question'
                                  }
                                  placement="top"
                                  arrow
                                >
                                  <IconButton
                                    aria-label={item?.status}
                                    // variant='outlined'
                                    size="small"
                                    color={
                                      item?.status === 'under_review'
                                        ? 'success'
                                        : 'warning'
                                    }
                                    onClick={() => {
                                      if (item?.status === 'under_review') {
                                        handleApproveDialog(item.id);
                                      } else {
                                        handleUnderReviewDialog(item.id);
                                      }
                                    }}
                                    style={{ outline: '1px solid inherit' }}
                                  >
                                    <Icon
                                      icon={
                                        item?.status === 'under_review'
                                          ? 'charm:clipboard-tick'
                                          : 'pajamas:review-warning'
                                      }
                                      fontSize={24}
                                    />
                                  </IconButton>
                                </Tooltip>
                              </Stack>
                            </Grid>
                          </Grid>
                        </AccordionDetails>
                      </Accordion>
                    </div>
                  );
                })}
            <Stack
              direction="row"
              justifyContent="center"
              spacing={2}
              sx={{ marginTop: '1.5rem' }}
            >
              <Pagination
                count={count}
                page={page + 1}
                // color="primary"
                onChange={handleChangePage}
              />
            </Stack>
          </>
        ) : (
          <div style={{ textAlign: 'center' }}>
            No question and answer found
          </div>
        )}
      </Grid>

      <AddEditQA open={addQAOpen} toggle={toggleAddQADrawer} data={data} />
      {addBulkQAOpen && (
        <AddBulkQA open={addBulkQAOpen} toggle={toggleAddBulkQADrawer} />
      )}

      <QADeleteDialog
        questionId={selectedQAId}
        open={deleteDialogOpen}
        setOpen={setDeleteDialogOpen}
      />
    </Grid>
  );
};


export default QAList;
