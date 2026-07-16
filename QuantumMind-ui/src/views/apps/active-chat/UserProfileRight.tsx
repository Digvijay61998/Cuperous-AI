// ** React Imports
import {
  Fragment,
  JSXElementConstructor,
  Key,
  ReactElement,
  ReactFragment,
  ReactNode,
  ReactPortal,
  useEffect,
  useState,
} from 'react';

// ** MUI Imports
import MuiAvatar from '@mui/material/Avatar';
import Badge from '@mui/material/Badge';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import { Stack, Chip } from '@mui/material';
// ** Icon Imports
import Button from '@mui/material/Button';

import Icon from 'src/@core/components/icon';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import Switch from '@mui/material/Switch';
// ** Third Party Components
import PerfectScrollbar from 'react-perfect-scrollbar';

// ** Type
import { UserProfileRightType } from 'src/types/apps/chatTypes';
import Tooltip from '@mui/material';
// ** Custom Component Imports
import CustomAvatar from 'src/@core/components/mui/avatar';
import Sidebar from 'src/@core/components/sidebar';

// ** Utils Import
import { ReactI18NextChild } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from 'src/store';
import {
  fetchVisitorDetail,
  getSegmentsById,
  addVisitorToSegment,
  removeVisitorFromSegment,
} from 'src/store/apps/visitor';
import { getsegments } from 'src/store/apps/segments';
import CommonDialog from 'src/components/dialogs/general-dialog';
import { toast } from 'react-hot-toast';
import { LoadingButton } from '@mui/lab';
import Grid from '@mui/material/Grid';

const UserProfileRight = (props: UserProfileRightType) => {
  const {
    store,
    hidden,
    statusObj,
    getInitials,
    sidebarWidth,
    userProfileRightOpen,
    handleUserProfileRightSidebarToggle,
  } = props;
  const { segmentList } = useSelector((state: RootState) => state.visitors);
  const { selectedConversation } = useSelector(
    (state: RootState) => state.conversations,
  );

  const { list } = useSelector((state: RootState) => state.segments);
  const ScrollWrapper = ({ children }: { children: ReactNode }) => {
    if (hidden) {
      return (
        <Box sx={{ height: '100%', overflowY: 'auto', overflowX: 'hidden' }}>
          {children}
        </Box>
      );
    } else {
      return (
        <PerfectScrollbar options={{ wheelPropagation: false }}>
          {children}
        </PerfectScrollbar>
      );
    }
  };

  const dispatch = useDispatch<AppDispatch>();
  const { visitorDataList } = useSelector((state: any) => state.visitors);
  useEffect(() => {
    if (dispatch) {
      dispatch(getsegments());
    }
  }, [dispatch]);
  useEffect(() => {
    if (dispatch && visitorDataList?.visitorId) {
      dispatch(
        getSegmentsById(
          visitorDataList?._id ||
            visitorDataList?.id ||
            visitorDataList?.visitorId,
        ),
      );
    }
  }, [dispatch, visitorDataList?.visitorId]);
  useEffect(() => {
    if (store) {
      dispatch(fetchVisitorDetail(store));
    }

    return () => {};
  }, [dispatch, store]);
  // ** state labels **
  const [openSegmentAddDialog, setOpenSegmentAddDialog] = useState(false);
  const [openAttributeListDialog, setOpenAttributeListDialog] = useState(false);
  // view the attributes
  const handleCloseAttributeListDialog = () => {
    setOpenAttributeListDialog(false);
  };
  const [acivities, setAcivities] = useState<any>(null);
  useEffect(() => {
    if (
      selectedConversation &&
      selectedConversation?.activities &&
      selectedConversation?.activities[0]?.attributes &&
      Object.keys(selectedConversation?.activities[0]?.attributes).length !== 0
    ) {
      setAcivities(selectedConversation?.activities[0]?.attributes);
    }
  }, [selectedConversation, store, dispatch]);
  const ComponentAttribute = () => {
    return (
      <Box>
        <Grid
          container
          spacing={5}
          sx={{ overflow: 'scroll', maxHeight: '300px' }}
        >
          {acivities && Object.keys(acivities).length !== 0 ? (
            <>
              {Object.keys(acivities).map((atr: any, index: number) => (
                <Grid key={index} item xs={12} sx={{ textAlign: 'center' }}>
                  <Grid container spacing={2}>
                    <Grid item xs={4} sx={{ textAlign: 'right' }}>
                      {atr}
                    </Grid>
                    <Grid item xs={1}>
                      :
                    </Grid>
                    <Grid item xs={7} sx={{ textAlign: 'justify' }}>
                      {acivities[atr]}
                    </Grid>
                  </Grid>
                </Grid>
              ))}
            </>
          ) : (
            <Typography
              sx={{
                p: 3.5,
                textTransform: 'lowercase',
                width: '100%',
                textAlign: 'center',
              }}
            >
              No Attribute Found
            </Typography>
          )}
        </Grid>
      </Box>
    );
  };
  const ActionComponentAttribute = () => {
    return (
      <Box
        sx={{ display: 'flex', justifyContent: 'center', mt: 2, width: '100%' }}
      >
        <Button
          variant="outlined"
          size="small"
          onClick={handleCloseAttributeListDialog}
          color="primary"
          sx={{ mr: 2 }}
        >
          Close
        </Button>
      </Box>
    );
  };
  // Add to segment
  const handleCloseSegmentAddDialog = () => {
    setOpenSegmentAddDialog(false);
  };
  const [loading, setLoading] = useState<boolean>(false);
  const addToSegment = async () => {
    if (!selectedSegment) {
      toast.error('Please select segment');
      return;
    }
    setLoading(true);
    try {
      await dispatch(
        addVisitorToSegment({
          visitorId: visitorDataList?._id,
          segmentId: selectedSegment,
        }),
      );
      setLoading(false);
      setOpenSegmentAddDialog(false);
    } catch (error: any) {
      setLoading(false);
      toast.error(error?.message);
    }
  };
  const removeFromSegment = async (segmentId: string) => {
    setLoading(true);
    try {
      await dispatch(
        removeVisitorFromSegment({
          visitorId: visitorDataList?._id,
          segmentId,
        }),
      );
      setLoading(false);
    } catch (error: any) {
      toast.error(error?.message);
      setLoading(false);
    }
  };
  const [selectedSegment, setSelectedSegment] = useState<string>('');
  const Component = () => {
    return (
      <Box
        noValidate
        component="form"
        sx={{
          display: 'flex',
          flexDirection: 'column',
          m: 'auto',
          width: 'fit-content',
          mt: -2,
        }}
      >
        <FormControl size="small" sx={{ minWidth: 300 }}>
          <InputLabel htmlFor="max-width">Segment List</InputLabel>
          <Select
            autoFocus
            value={selectedSegment}
            onChange={(e) => setSelectedSegment(e.target.value)}
            label="Segment List"
            inputProps={{
              name: 'segment-list',
              id: 'segment-list',
            }}
          >
            {list.map((item: any, index: number) => {
              return (
                <MenuItem key={index} value={item?._id}>
                  {item?.name}
                </MenuItem>
              );
            })}
          </Select>
        </FormControl>
      </Box>
    );
  };

  const ActionComponent = () => {
    return (
      <Box
        sx={{ display: 'flex', justifyContent: 'center', mt: 2, width: '100%' }}
      >
        <Button
          variant="outlined"
          size="small"
          onClick={handleCloseSegmentAddDialog}
          color="primary"
          sx={{ mr: 2 }}
        >
          Cancel
        </Button>
        <LoadingButton
          loading={loading}
          variant="contained"
          size="small"
          onClick={addToSegment}
          color="primary"
        >
          Confirm
        </LoadingButton>
      </Box>
    );
  };
  return (
    <Sidebar
      direction="right"
      show={userProfileRightOpen}
      backDropClick={handleUserProfileRightSidebarToggle}
      sx={{
        zIndex: 9,
        height: '100%',
        width: sidebarWidth,
        borderTopRightRadius: (theme) => theme.shape.borderRadius,
        borderBottomRightRadius: (theme) => theme.shape.borderRadius,
        '& + .MuiBackdrop-root': {
          zIndex: 8,
          borderRadius: 1,
        },
      }}
    >
      {visitorDataList ? (
        <Fragment>
          <Box sx={{ position: 'relative' }}>
            <IconButton
              size="small"
              onClick={handleUserProfileRightSidebarToggle}
              sx={{
                top: '0.5rem',
                right: '0.5rem',
                position: 'absolute',
                color: 'text.secondary',
              }}
            >
              <Icon icon="bx:x" />
            </IconButton>
            <Box
              sx={{
                p: 5,
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'flex-start',
                alignItems: 'center',
              }}
            >
              <Box sx={{ mr: 3, display: 'flex', justifyContent: 'center' }}>
                <Badge
                  overlap="circular"
                  anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                  }}
                  badgeContent={
                    <Box
                      component="span"
                      sx={{
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        color: `online.main`,
                        boxShadow: (theme) =>
                          `0 0 0 2px ${theme.palette.background.paper}`,
                        backgroundColor: `online.main`,
                      }}
                    />
                  }
                >
                  {store?.selectedChat?.contact.avatar ? (
                    <MuiAvatar
                      sx={{ width: '5rem', height: '5rem' }}
                      src={store.selectedChat.contact.avatar}
                      alt={store.selectedChat.contact.fullName}
                    />
                  ) : (
                    <CustomAvatar
                      skin="light"
                      color="primary"
                      sx={{
                        width: '5rem',
                        height: '5rem',
                        fontWeight: 500,
                        fontSize: '2rem',
                      }}
                    >
                      {visitorDataList?.name && visitorDataList?.name[0]}
                    </CustomAvatar>
                  )}
                </Badge>
              </Box>
              <Stack
                flexDirection="column"
                justifyContent="flex-start"
                alignItems="flex-start"
              >
                <Typography sx={{ fontWeight: 500, textAlign: 'center' }}>
                  {visitorDataList?.name}
                </Typography>
                <Typography variant="body2" sx={{ textAlign: 'center' }}>
                  {visitorDataList?.email}
                </Typography>
                <Typography variant="body2" sx={{ textAlign: 'center' }}>
                  {visitorDataList?.phone}
                </Typography>
              </Stack>
            </Box>
          </Box>

          <Box sx={{ height: 'calc(100% - 11.8125rem)' }}>
            <ScrollWrapper>
              <Box sx={{ px: 5 }}>
                <div>
                  <List dense sx={{ paddingBottom: 5 }}>
                    <ListItem disablePadding style={{ display: 'list-item' }}>
                      <ListItemButton
                        onClick={(e) =>
                          setOpenAttributeListDialog((pre) => !pre)
                        }
                        disabled={!acivities}
                        sx={{ px: 2 }}
                      >
                        <ListItemIcon sx={{ mr: 2, color: 'text.primary' }}>
                          <Icon icon="carbon:data-view" />
                        </ListItemIcon>
                        <ListItemText primary="View Attributes" />
                      </ListItemButton>
                      <ListItemButton
                        onClick={(e) => setOpenSegmentAddDialog((pre) => !pre)}
                        sx={{ px: 2 }}
                      >
                        <ListItemIcon sx={{ mr: 2, color: 'text.primary' }}>
                          <Icon icon="bx:label" />
                        </ListItemIcon>
                        <ListItemText primary="Add To Segment" />
                      </ListItemButton>
                    </ListItem>
                  </List>
                </div>
                <Box sx={{ mb: 8.5 }}>
                  <Typography
                    variant="body2"
                    sx={{ mb: 3.5, textTransform: 'uppercase' }}
                  >
                    Segment List
                  </Typography>
                  {
                    // create a list of segments and show them here with material ui chip with delete icon
                    segmentList && segmentList?.length > 0 ? (
                      segmentList.map((item: any, index: number) => {
                        return (
                          <Chip
                            key={index}
                            label={item?.name}
                            onDelete={() => removeFromSegment(item._id)}
                            color="primary"
                            size="small"
                            sx={{
                              mr: 1,
                              mb: 1,
                              textTransform: 'lowercase',
                              fontSize: '0.6rem',
                            }}
                          />
                        );
                      })
                    ) : (
                      <Typography sx={{ mb: 3.5, textTransform: 'lowercase' }}>
                        No Segment Found
                      </Typography>
                    )
                  }
                  {visitorDataList?.details && (
                    <>
                      <Typography
                        variant="body2"
                        sx={{ mb: 3.5, textTransform: 'uppercase' }}
                      >
                        Personal Information
                      </Typography>
                      <List dense sx={{ p: 0 }}>
                        {visitorDataList?.details?.device &&
                          visitorDataList?.details?.device.toLowerCase() !==
                            'unknown' && (
                            <ListItem sx={{ px: 2 }}>
                              <ListItemIcon
                                sx={{ mr: 2, color: 'text.primary' }}
                              >
                                <Icon icon="ph:device-mobile-duotone" />
                              </ListItemIcon>

                              <ListItemText
                                primary={visitorDataList?.details.device}
                              />
                            </ListItem>
                          )}
                        {visitorDataList?.details?.browser &&
                          visitorDataList?.details?.browser.toLowerCase() !==
                            'unknown' && (
                            <ListItem sx={{ px: 2 }}>
                              <ListItemIcon
                                sx={{ mr: 2, color: 'text.primary' }}
                              >
                                <Icon icon="oi:browser" />
                              </ListItemIcon>
                              <ListItemText
                                primary={visitorDataList?.details.browser}
                              />
                            </ListItem>
                          )}
                        {visitorDataList?.details?.ip &&
                          visitorDataList?.details?.ip !== 'unknown' && (
                            <ListItem sx={{ px: 2 }}>
                              <ListItemIcon
                                sx={{ mr: 2, color: 'text.primary' }}
                              >
                                <Icon icon="eos-icons:ip" />
                              </ListItemIcon>

                              <ListItemText
                                primary={visitorDataList?.details.ip}
                              />
                            </ListItem>
                          )}
                        {visitorDataList?.details?.city &&
                          visitorDataList?.details?.city.toLowerCase() !==
                            'unknown' && (
                            <ListItem sx={{ px: 2 }}>
                              <ListItemIcon
                                sx={{ mr: 2, color: 'text.primary' }}
                              >
                                <Icon icon="material-symbols:location-city" />
                              </ListItemIcon>
                              <ListItemText
                                primary={visitorDataList?.details?.city}
                              />
                            </ListItem>
                          )}
                        {visitorDataList?.details?.country &&
                          visitorDataList?.details?.country.toLowerCase() !==
                            'unknown' && (
                            <ListItem sx={{ px: 2 }}>
                              <ListItemIcon
                                sx={{ mr: 2, color: 'text.primary' }}
                              >
                                <Icon icon="gis:search-country" />
                              </ListItemIcon>
                              <ListItemText
                                primary={visitorDataList?.details?.country}
                              />
                            </ListItem>
                          )}
                      </List>
                    </>
                  )}
                  <Typography
                    variant="body2"
                    sx={{ mb: 3.5, textTransform: 'uppercase' }}
                  >
                    Location
                  </Typography>
                  <Box sx={{ display: 'flex', mb: 0 }}>
                    <iframe
                      id="iframeId"
                      height="300px"
                      width="100%"
                      style={{ border: 0, borderRadius: '0.5rem' }}
                      src={`https://maps.google.com/maps?q=${
                        visitorDataList?.visitorDetails?.slice(-1)[0]?.lat
                      },${
                        visitorDataList?.visitorDetails?.slice(-1)[0]?.lon
                      }&z=16&output=embed`}
                    ></iframe>
                  </Box>
                </Box>
              </Box>
            </ScrollWrapper>
          </Box>
          <CommonDialog
            title={'Add Segment'}
            description={'Add a new visitor to segment'}
            open={openSegmentAddDialog}
            onClose={handleCloseSegmentAddDialog}
            Component={Component}
            ActionComponent={ActionComponent}
          />
          <CommonDialog
            title={'View Attribute'}
            description={'View last updated attribute'}
            open={openAttributeListDialog}
            onClose={handleCloseAttributeListDialog}
            Component={ComponentAttribute}
            ActionComponent={ActionComponentAttribute}
          />
        </Fragment>
      ) : null}
    </Sidebar>
  );
};

export default UserProfileRight;
