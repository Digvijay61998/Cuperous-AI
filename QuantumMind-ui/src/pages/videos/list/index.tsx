// ** React Imports
import { useState, useEffect, MouseEvent, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
// ** Next Import
import Link from 'next/link';

// ** Icon Imports
import Icon from 'src/@core/components/icon';

// ** MUI Imports
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import { RootState, AppDispatch } from 'src/store';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';

// ** Utils Import
import { getInitials } from 'src/@core/utils/get-initials';
import Dialog, { DialogProps } from '@mui/material/Dialog';
// ** Actions Imports
import {
  fetchVideo,
  addVideoViewCount,
  fetchVideoCategory,
  updateVideo,
} from 'src/store/apps/video';

// ** Custom Table Components Imports
import TableHeader from 'src/views/videos/TableHeader';
import AddUserDrawer from 'src/views/apps/user/list/AddUserDrawer';
import DialogContent from '@mui/material/DialogContent';
import IconButton from '@mui/material/IconButton';
import AddAgentDrawer from 'src/views/videos/AddVideoDrawer';
import Pagination from '@mui/material/Pagination';
import { CardContent } from '@mui/material';
import { getComparator, stableSort } from 'src/helper';
import EditVideoDrawer from 'src/views/videos/EditVideoDrawer';
import CardMedia from '@mui/material/CardMedia';
import CardActions from '@mui/material/CardActions';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import VideoDeleteDialog from 'src/views/videos/DeleteVideoDialog';

const Videos = () => {
  // ** State
  const [value, setValue] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  
  // ** Hooks
  const [category, setCategory] = useState<string>('');
  const [fullWidth, setFullWidth] = useState(true);
  const [maxWidth, setMaxWidth] = useState<DialogProps['maxWidth']>('xl');
  const [show, setShow] = useState<boolean>(false);
  const [url, setUrl] = useState<string>('');
  const [addUserOpen, setAddUserOpen] = useState<boolean>(false);
  const [editUserOpen, setEditUserOpen] = useState<boolean>(false);
  
  // ** filter by search field works only with given list **
  // const [videoList, setVideoList] = useState([]);
  
  // Pagination
  const PER_PAGE = 10;
  let [page, setPage] = useState(0);
  const [order, setOrder] = useState('desc');

  const [videoCategoriesList, SetVideoCategoriesList] = useState<any>([]);

  // ** useRouter
  const dispatch = useDispatch<AppDispatch>();

  const videoStore = useSelector(
    (state: RootState) => state.video.vidoListData,
  );

  const videoCategoryStore = useSelector(
    (state: RootState) => state.video.videoCategory,
  );

  const handleFilter = useCallback((val: string) => {
    setValue(val);
  }, []);

  const toggleAddUserDrawer = () => setAddUserOpen(!addUserOpen);
  const toggleEditUserDrawer = () => setEditUserOpen(!editUserOpen);

  const handleVideoData = (item: any) => {
    let _id = item.id;
    dispatch(addVideoViewCount(_id)), setUrl(item.url);
    setShow(true);
  };

  const handleCategoryChange = useCallback((e: SelectChangeEvent) => {
    setCategory(e.target.value);
  }, []);

  const handleStatusChange = useCallback((e: SelectChangeEvent) => {
    setStatus(e.target.value);
  }, []);

  // ** live and draft and delete dialog and Video
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [selectedVideoId, setSelectedVideoId] = useState<any>('');
  // ** Functions
  const handleDeleteDialog = (id:any) => {
    setSelectedVideoId(id);
    setDeleteDialogOpen(true);
  };
  const handleLiveDialog = (id:any) => {
    setSelectedVideoId(id);
    dispatch(updateVideo({ id:id, data:{ status:'live' } }))
  }
  const handleDraftDialog = (id:any) => {
    setSelectedVideoId(id);
    dispatch(updateVideo({ id:id, data:{ status:'draft' } }))
  }
  const handleEditDialog = (id:any) => {
    setSelectedVideoId(id);
    toggleEditUserDrawer();
  }

  // * truncate
  function ellipsify(str: any) {
    if (str?.length > 100) {
      return str.substring(0, 100) + '...';
    } else {
      return str;
    }
  }

  useEffect(() => {
    dispatch(fetchVideoCategory());
  }, []);

  useEffect(() => {
    dispatch(
      fetchVideo({
        skip: page*PER_PAGE,
        limit: PER_PAGE,
        search: value,
        category: category,
        status: status,
    }));
  }, [page, PER_PAGE, value, category, status]);

  useEffect(() => {
    SetVideoCategoriesList(videoCategoryStore?.data);
  }, [videoCategoryStore]);

  // ** filter the Video by search field according to the given list only**
  // useEffect(() => {
  //   if (value && value.trim() !== '') {
  //     let queryLowered = value.toLowerCase();
  //     const filteredData = videoStore?.data?.filter(
  //       (item: any) =>
  //         item?.title?.toLowerCase().includes(queryLowered) ||
  //         item?.subtitle?.toLowerCase().includes(queryLowered) ||
  //         item?.description?.toLowerCase().includes(queryLowered) ||
  //         item?.category?.toLowerCase().includes(queryLowered),
  //     );
  //     setVideoList(filteredData);
  //   } else {
  //     setVideoList(videoStore?.data);
  //   }
  // }, [value, videoStore]);

  // Pagination
  const count = Math.ceil(videoStore?.count / PER_PAGE);
  const handleChange = (e: any, p: number) => {
    setPage(p - 1);
  };

  return (
    <>
      <Grid container spacing={6}>
        <Grid item xs={12}>
          <Card>
            <TableHeader
              value={value}
              handleFilter={handleFilter}
              toggle={toggleAddUserDrawer}
            />
            <Divider sx={{ m: '0 !important' }} />
            <CardContent>
              <Grid container spacing={5}>
                <Grid item sm={6} xs={12}>
                  <div style={{ fontSize:'1.1rem' }}>Filters</div>
                </Grid>

                <Grid item sm={3} xs={12}>
                  <FormControl fullWidth size="small">
                    <InputLabel id="category-select">Select Category</InputLabel>
                    <Select
                      fullWidth
                      value={category}
                      size="small"
                      id="select-category"
                      label="Select Category"
                      labelId="category-select"
                      onChange={handleCategoryChange}
                      inputProps={{ placeholder: 'Select Category' }}
                    >
                      <MenuItem value="">All</MenuItem>
                      {videoCategoryStore?.data?.map((item: any, index: number) => {
                        return <MenuItem key={index} value={item}>{item}</MenuItem>;
                      })}
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
                    {videoCategoryStore?.status?.map((item: any, index: number) => {
                      return <MenuItem key={index} value={item}>{item}</MenuItem>;
                    })}
                  </Select>
                </FormControl>
              </Grid>
              {/* -- Sort the Video according to the given list only-- */}
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

          <Box
            sx={{
              width: '100%',
              p: 6,
              gap: 6,
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'flex-start',
            }}
          >
            {videoStore?.data?.length > 0 &&
              stableSort(videoStore?.data, getComparator(order, 'createdAt'))?.map((item: any, index:number) => {
              return (
                <Button
                  key={index}
                  variant="text"
                  onClick={() => handleVideoData(item)}
                >
                  
                <Card sx={{ maxWidth: 345 }}>
                  <iframe
                    // component='iframe'
                    // alt={item?.title}
                    // height="140"
                    src={`${item?.url}?autoplay=0&showinfo=1&controls=0&autohid=0`}
                    frameBorder="0"
                    // webkitallowfullscreen
                    // mozallowfullscreen
                    allowFullScreen
                    style={{ width: '100%', height: '100%' }}
                  />

                  <div>
                    <Typography
                      component="div"
                      // variant="inherit"
                      gutterBottom
                      sx={{
                        fontWeight: 'bold',
                      }}
                    >
                      {item?.title}
                      <Tooltip placement='top' title={item?.status=='live'?"Live":"Draft"} arrow>
                        <IconButton
                          color={item?.status=='live'?"primary":"warning"} 
                        >
                          <Icon 
                            icon={item?.status=='live'?"charm:circle-tick":"bi:exclamation-circle-fill"}
                            fontSize={16} 
                          />
                        </IconButton>
                      </Tooltip>
                    </Typography>

                    <Typography paragraph 
                      sx={{
                        px: 2,
                        mb: 0,
                        mt: -1,
                        pb: 1.5,
                        fontWeight: 'bold',
                        fontSize: 12,
                        lineHeight: 1,
                      }}
                    >
                      {item?.subtitle}
                    </Typography>
                    <Typography paragraph variant="body2" color="text.secondary"
                      sx={{
                        px:2,
                        fontSize: 12,
                        lineHeight: 1,
                        textAlign: 'left',
                        textTransform: 'none'
                      }}
                    >
                      {ellipsify(item?.description)}
                    </Typography>
                  </div>
                  <CardActions sx={{ p:'0.5rem', flexDirection:'column' }}>
                      <Stack 
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                        spacing={2}
                        sx={{
                          width: '100%',
                        }}
                      >
                        <Typography
                          color="secondary"
                          style={{
                            fontSize:'14px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                        >
                          {item?.category}
                          &nbsp;
                          <Icon icon="ph:eye" fontSize={20} />
                          {item?.viewCount}
                        </Typography>
                      
                        <div>
                        <Tooltip placement='top' title="Edit" arrow>
                          <IconButton
                            aria-label="Edit"
                            size="small"
                            color="primary"
                            onClick={(e:any) => {
                              e.stopPropagation();
                              handleEditDialog(item.id);
                            }}
                          >
                            <Icon icon="bxs:edit" fontSize={20} />
                          </IconButton>
                        </Tooltip>

                        <Tooltip 
                          title={item?.status === 'draft'? 'Make Live' : 'Make Draft'}
                          placement="top"
                          arrow
                        >
                          <IconButton 
                            aria-label={item?.status}
                            size='small'
                            color={item?.status === 'draft'? 'success' : 'warning'}
                            onClick={(e:any) => {
                              e.stopPropagation();
                              if(item?.status === 'draft') {
                                handleLiveDialog(item.id)
                              } else {
                                handleDraftDialog(item.id)
                              }
                            }}
                          >
                            <Icon icon={item?.status === 'draft'?'material-symbols:check-circle-rounded':'material-symbols:block'} fontSize={20}/>
                          </IconButton>
                        </Tooltip>

                        <Tooltip placement='top' title="Delete" arrow>
                          <IconButton
                            aria-label="Delete"
                            size="small"
                            color="error"
                            onClick={(e:any) => {
                              e.stopPropagation();
                              handleDeleteDialog(item.id);
                            }}
                          >
                            <Icon icon="bx:trash" fontSize={20} />
                          </IconButton>
                        </Tooltip>
                        </div>
                      </Stack>
                  </CardActions>
                </Card>
                  
                </Button>
              );
            })}
          </Box>
          {videoStore?.data?.length<=0 && 
            <Box sx={{ display: 'flex', justifyContent:'center' }}>
              <Typography >No video found!</Typography>
            </Box>
          }
          <Box
            sx={{
              width: '100%',
              display: 'flex',
              justifyContent: 'center',
              flexDirection: 'row',
              height: '10vh',
              alignItems: 'center',
            }}
          >
            <Pagination count={count} page={page+1} color="primary" onChange={handleChange} />
          </Box>

        </Grid>
      </Grid>

      <Dialog
        open={show}
        fullWidth={fullWidth}
        maxWidth={maxWidth}
        scroll="body"
        onClose={() => setShow(false)}
        onBackdropClick={() => setShow(false)}
      >
        <DialogContent
          sx={{
            height: '90vh',
            pb: 8,
            px: { xs: 8, sm: 15 },
            pt: { xs: 8, sm: 12.5 },
            position: 'relative',
          }}
        >
          <IconButton
            size="small"
            onClick={() => setShow(false)}
            sx={{ position: 'absolute', right: '1rem', top: '1rem' }}
          >
            <Icon icon="bx:x" />
          </IconButton>
          <Box
            sx={{
              mb: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Box
              sx={{
                width: '100%',
                height: '80vh',
                borderRadius: '8px',
                overflow: 'hidden',
              }}
            >
              <iframe
                src={`${url}?showinfo=1`}
                frameBorder="0"
                allowFullScreen
                style={{ width: '100%', height: '100%' }}
              ></iframe>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>

      <AddAgentDrawer open={addUserOpen} toggle={toggleAddUserDrawer} />
      
      <EditVideoDrawer videoId={selectedVideoId} open={editUserOpen} toggle={toggleEditUserDrawer} />

      <VideoDeleteDialog videoId={selectedVideoId} open={deleteDialogOpen} setOpen={setDeleteDialogOpen}  />
    </>
  );
};

export default Videos;
