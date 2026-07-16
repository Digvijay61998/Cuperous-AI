// ** React Imports
import { useEffect, useState } from 'react';

// ** MUI Imports
import { Chip, OutlinedInput, Stack } from '@mui/material';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import Grid from '@mui/material/Grid';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import { styled } from '@mui/material/styles';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

// ** Third Party Imports
import * as yup from 'yup';

// ** Icon Imports
import Icon from 'src/@core/components/icon';

// ** Custom Components
import CustomAvatar from 'src/@core/components/mui/avatar';
import CustomChip from 'src/@core/components/mui/chip';
import AgentSuspendDialog from 'src/views/agent/view/AgentSuspendDialog';

import AgentActivateDialog from 'src/views/agent/view/AgentActivateDialog';

// ** Types
import { ThemeColor } from 'src/@core/layouts/types';

// ** Utils Import
import { useDispatch, useSelector } from 'react-redux';
import { getInitials } from 'src/@core/utils/get-initials';
import { AppDispatch, RootState } from 'src/store';
import { updateAgent } from 'src/store/apps/agent';
import { gettag } from 'src/store/apps/tags';

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

interface ColorsType {
  [key: string]: ThemeColor;
}

const data: any = {
  id: 1,
  role: 'admin',
  status: 'active',
  username: 'gslixby0',
  billing: 'Enterprise',
  avatarColor: 'primary',
  country: 'El Salvador',
  company: 'Yotz PVT LTD',
  contact: '(479) 232-9151',
  currentPlan: 'enterprise',
  fullName: 'Daisy Patterson',
  email: 'gslixby0@abc.net.au',
  avatar: '/images/avatars/10.png',
};

const roleColors: ColorsType = {
  admin: 'error',
  editor: 'info',
  author: 'warning',
  maintainer: 'success',
  subscriber: 'primary',
};

const statusColors: ColorsType = {
  online: 'success',
  busy: 'error',
  offline: 'secondary',
  away: 'warning',
};

// ** Styled <sup> component
const Sup = styled('sup')(({ theme }) => ({
  top: '0.25rem',
  left: '-1rem',
  fontSize: '1.125rem',
  position: 'absolute',
  color: theme.palette.primary.main,
}));

// ** Styled <sub> component
const Sub = styled('sub')(({ theme }) => ({
  fontSize: '1rem',
  marginTop: '0.5rem',
  alignSelf: 'flex-end',
  color: theme.palette.text.secondary,
}));

const showErrors = (field: string, valueLen: number, min: number) => {
  if (valueLen === 0) {
    return `${field} field is required`;
  } else if (valueLen > 0 && valueLen < min) {
    return `${field} must be at least ${min} characters`;
  } else {
    return '';
  }
};

const schema = yup.object().shape({
  activeHours: yup.string().required(),
  email: yup.string().email().required(),
  name: yup
    .string()
    .min(3, (obj) => showErrors('First Name', obj.value.length, obj.min))
    .required(),
});

type Props = {
  agentId: any;
  agentDetail: any;
};
const UserViewLeft = ({ agentId, agentDetail }: Props) => {
  // ** States
  const [openEdit, setOpenEdit] = useState<boolean>(false);
  const [suspendDialogOpen, setSuspendDialogOpen] = useState<boolean>(false);
  const [activateDialogOpen, setActivateDialogOpen] = useState<boolean>(false);

  // Handle Edit dialog
  const handleEditClickOpen = () => setOpenEdit(true);
  const handleEditClose = () => setOpenEdit(false);

  const [defaultValues, setDefaultValues] = useState<any>({});
  // ** State
  const [tag, setTag] = useState<any[]>(agentDetail?.tags || []);

  const handleChange = (event: SelectChangeEvent<typeof tag>) => {
    const {
      target: { value },
    } = event;
    // setTag(value);
    setTag(
      // On autofill we get a stringified value.
      typeof value === 'string' ? value.split(',') : value,
    );
  };

  // ** Hooks
  const dispatch = useDispatch<AppDispatch>();
  const tagList = useSelector((state: RootState) => state.tags.list);

  useEffect(() => {
    dispatch(gettag());
  }, [dispatch]);

  useEffect(() => {
    if (agentDetail) {
      setDefaultValues({
        email: agentDetail?.email || '',
        activeHours: agentDetail?.activeHours || '',
        name: agentDetail?.name || '',
      });
      setTag(agentDetail?.tags || []);
    }

    return () => {};
  }, [agentDetail, openEdit]);

  // const {
  //   reset,
  //   control,
  //   setValue,
  //   handleSubmit,
  //   formState: { errors }
  // } = useForm({
  //   defaultValues:defaultValues,
  //   mode: 'onChange',
  //   resolver: yupResolver(schema)
  // })

  const onSubmitHandle = (event: any) => {
    event?.preventDefault();
    let result = tag.map((a) => a?._id || a);
    dispatch(
      updateAgent({ id: agentId, data: { ...defaultValues, tags: result } }),
    );
    handleEditClose();
    // reset()
  };

  const handleClose = () => {
    handleEditClose();
    // reset()
  };

  if (agentDetail) {
    return (
      <Grid container spacing={6}>
        <Grid item xs={12}>
          <Card>
            <CardContent
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <CardContent
                sx={{
                  pt: 12,
                  display: 'flex',
                  alignItems: 'center',
                  flexDirection: 'column',
                }}
              >
                {/* {data.avatar.length ? ( 
                  <CustomAvatar
                    src={data.avatar}
                    variant="rounded"
                    alt={agentDetail?.name}
                    sx={{ width: 110, height: 110, mb: 6 }}
                  />
                ) : (*/}
                <CustomAvatar
                  skin="light"
                  variant="rounded"
                  color={(data.avatarColor as ThemeColor) || 'primary'}
                  sx={{
                    width: 110,
                    height: 110,
                    fontWeight: 600,
                    mb: 6,
                    fontSize: '3rem',
                  }}
                >
                  {getInitials(agentDetail?.name || 'Unknown')}
                </CustomAvatar>
                {/* )} */}
                <Typography
                  variant="h5"
                  sx={{
                    mb: 2.5,
                    fontSize: '1rem !important',
                    textAlign: 'center',
                  }}
                >
                  {agentDetail?.name}
                </Typography>
                <CustomChip
                  rounded
                  skin="light"
                  size="small"
                  label={agentDetail?.role || "Agent"}
                  sx={{ fontWeight: 500 }}
                  color={'error'}
                />
              </CardContent>

              <CardContent sx={{ mt: 6 }}>
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    justifyContent: 'center',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2.5 }}>
                    <CustomAvatar skin="light" variant="rounded" sx={{ mr: 4 }}>
                      <Icon icon="bx:check" />
                    </CustomAvatar>
                    <div>
                      <Typography
                        variant="h6"
                        sx={{ fontSize: '1.125rem !important' }}
                      >
                        {agentDetail?.conversations?.length}
                      </Typography>
                      <Typography sx={{ color: 'text.secondary' }}>
                        Conversations
                      </Typography>
                    </div>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2.5 }}>
                    <CustomAvatar skin="light" variant="rounded" sx={{ mr: 4 }}>
                      <Icon icon="bx:customize" />
                    </CustomAvatar>
                    <div>
                      <Typography
                        variant="h6"
                        sx={{ fontSize: '1.125rem !important' }}
                      >
                        {agentDetail?.serviceRequests?.length}
                      </Typography>
                      <Typography sx={{ color: 'text.secondary' }}>
                        Service Requests
                      </Typography>
                    </div>
                  </Box>
                </Box>
              </CardContent>
            </CardContent>

            <CardContent>
              <Typography variant="h6">Details</Typography>
              <Divider
                sx={{ mt: (theme) => `${theme.spacing(1)} !important` }}
              />
              <Box sx={{ pt: 4, pb: 2 }}>
                <Box sx={{ display: 'flex', mb: 4 }}>
                  <Typography
                    sx={{ mr: 2, fontWeight: 700, color: 'text.secondary' }}
                  >
                    Name:
                  </Typography>
                  <Typography sx={{ color: 'text.secondary' }}>
                    {agentDetail?.name}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', mb: 4 }}>
                  <Typography
                    sx={{ mr: 2, fontWeight: 700, color: 'text.secondary' }}
                  >
                    Email:
                  </Typography>
                  <Typography sx={{ color: 'text.secondary' }}>
                    {agentDetail?.email}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', mb: 4 }}>
                  <Typography
                    sx={{ mr: 2, fontWeight: 700, color: 'text.secondary' }}
                  >
                    Status:
                  </Typography>
                  <CustomChip
                    rounded
                    skin="light"
                    size="small"
                    label={agentDetail?.status}
                    sx={{ fontWeight: 500 }}
                    color={statusColors[agentDetail?.status]}
                  />
                </Box>
                <Box sx={{ display: 'flex', mb: 4 }}>
                  <Typography
                    sx={{ mr: 2, fontWeight: 700, color: 'text.secondary' }}
                  >
                    Active:
                  </Typography>
                  <Typography
                    sx={{
                      color: 'text.secondary',
                      textTransform: 'capitalize',
                    }}
                  >
                    {agentDetail?.active ? 'yes' : 'no'}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', mb: 4, flexWrap:"wrap"  }}>
                  <Typography
                    sx={{ mr: 2, fontWeight: 700, color: 'text.secondary' }}
                  >
                    Tags:
                  </Typography>
                    {agentDetail && agentDetail?.tags?.length > 0 ? (
                      <Stack direction='row' flexWrap='wrap'>
                        {agentDetail?.tags?.map((item: any, index: number) => (
                          <Chip
                            key={index}
                            label={item?.name}
                            size="small"
                            color="primary"
                            style={{ margin: '2px', fontSize: '11px' }}
                          />
                        ))}
                      </Stack>
                    ) : (
                      <>N/A</>
                    )}
                </Box>
                <Box sx={{ display: 'flex', mb: 4, }}>
                  <Typography
                    sx={{ mr: 2, fontWeight: 700, color: 'text.secondary' }}
                  >
                    Assigned Bots:
                  </Typography>
                    {agentDetail?.assignedBots?.length > 0 ? (
                      <Stack direction='row' flexWrap='wrap' >
                        {agentDetail?.assignedBots?.map(
                          (item: any, index: number) => (
                            <Chip
                              key={index}
                              label={item?.name}
                              size="small"
                              color="primary"
                              style={{ margin: '2px', fontSize: '11px' }}
                            />
                          ),
                        )}
                      </Stack>
                    ) : (
                      <>N/A</>
                    )}
                </Box>
              </Box>
            </CardContent>

            <CardActions sx={{ display: 'flex', justifyContent: 'center' }}>
              <Button
                variant="contained"
                sx={{ mr: 2 }}
                onClick={handleEditClickOpen}
              >
                Edit
              </Button>
              <Button
                color={agentDetail?.active ? 'error' : 'success'}
                variant="outlined"
                onClick={() => {
                  if (agentDetail?.active) {
                    setSuspendDialogOpen(true);
                  } else {
                    setActivateDialogOpen(true);
                  }
                }}
              >
                {agentDetail?.active ? 'Suspend' : 'Activate'}
              </Button>
            </CardActions>

            <Dialog
              scroll="body"
              open={openEdit}
              onClose={handleEditClose}
              aria-labelledby="user-view-edit"
              sx={{
                '& .MuiPaper-root': {
                  width: '100%',
                  maxWidth: 650,
                  p: [2, 10],
                },
                '& .MuiDialogTitle-root + .MuiDialogContent-root': {
                  pt: (theme) => `${theme.spacing(2)} !important`,
                },
              }}
              aria-describedby="user-view-edit-description"
            >
              <DialogTitle
                id="user-view-edit"
                sx={{ textAlign: 'center', fontSize: '1.5rem !important' }}
              >
                Edit Agent Information
              </DialogTitle>
              <DialogContent>
                <DialogContentText
                  variant="body2"
                  id="user-view-edit-description"
                  sx={{ textAlign: 'center', mb: 7 }}
                >
                  Updating Agent details will receive a privacy audit.
                </DialogContentText>

                <form onSubmit={onSubmitHandle}>
                  <FormControl fullWidth required sx={{ mb: 6 }}>
                    {/* <Controller
                    name='name'
                    control={control}
                    rules={{ required: true }}
                    render={({ field: { value, onChange } }) => ( */}
                    <TextField
                      required
                      value={defaultValues?.name}
                      label="Full Name"
                      onChange={(e) => {
                        setDefaultValues({
                          ...defaultValues,
                          name: e.target.value,
                        });
                      }}
                      placeholder="enter the full nam"
                      // error={Boolean(errors.name)}
                    />
                    {/* )}
                  />
                  {errors.name && <FormHelperText sx={{ color: 'error.main' }}><>{errors.name.message}</></FormHelperText>} */}
                  </FormControl>

                  <FormControl fullWidth required sx={{ mb: 6 }}>
                    {/* <Controller
                    name='email'
                    control={control}
                    rules={{ required: true }}
                    render={({ field: { value, onChange } }) => ( */}
                    <TextField
                      required
                      type="email"
                      value={defaultValues?.email}
                      label="Email"
                      onChange={(e) => {
                        setDefaultValues({
                          ...defaultValues,
                          email: e.target.value,
                        });
                      }}
                      placeholder="enter the valid email id"
                      // error={Boolean(errors.email)}
                    />
                    {/* )}
                  />
                  {errors.email && <FormHelperText sx={{ color: 'error.main' }}><>{errors.email.message}</></FormHelperText>} */}
                  </FormControl>

                  <FormControl fullWidth required sx={{ mb: 6 }}>
                    {/* <Controller
                    name='activeHours'
                    control={control}
                    rules={{ required: true }}
                    render={({ field: { value, onChange } }) => ( */}
                    <TextField
                      required
                      value={defaultValues?.activeHours}
                      label="Active Hours"
                      onChange={(e) => {
                        setDefaultValues({
                          ...defaultValues,
                          activeHours: e.target.value,
                        });
                      }}
                      placeholder="enter the active hours"
                      // error={Boolean(errors.activeHours)}
                    />
                    {/* )}
                  />
                  {errors.activeHours && <FormHelperText sx={{ color: 'error.main' }}><>{errors.activeHours.message}</></FormHelperText>} */}
                  </FormControl>

                  <FormControl fullWidth sx={{ mb: 6 }}>
                    <InputLabel id="select-multiple-chip-label">
                      Tags
                    </InputLabel>
                    <Select
                      labelId="select-multiple-chip-label"
                      id="select-multiple-tag"
                      multiple
                      value={tag}
                      onChange={handleChange}
                      input={
                        <OutlinedInput id="select-multiple-chip" label="Tags" />
                      }
                      inputProps={{ placeholder: 'Select Tags' }}
                      renderValue={(selected) => (
                        <Box
                          sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}
                        >
                          {selected.map((value: any) => {
                            let obj = tagList.find((x) => x._id === value);
                            return (
                              <Chip
                                key={value}
                                label={value?.name}
                                color="primary"
                              />
                            );
                          })}
                        </Box>
                      )}
                      MenuProps={MenuProps}
                    >
                      {tagList?.map((tagItem: any, index: number) => (
                        <MenuItem key={index} value={tagItem._id}>
                          {tagItem?.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Button type="submit" variant="contained" sx={{ mr: 3 }}>
                      Submit
                    </Button>
                    <Button
                      variant="outlined"
                      color="secondary"
                      onClick={handleClose}
                    >
                      Cancel
                    </Button>
                  </Box>
                </form>
              </DialogContent>
            </Dialog>

            <AgentSuspendDialog
              agentId={agentId}
              open={suspendDialogOpen}
              setOpen={setSuspendDialogOpen}
            />

            <AgentActivateDialog
              agentId={agentId}
              open={activateDialogOpen}
              setOpen={setActivateDialogOpen}
            />
          </Card>
        </Grid>
      </Grid>
    );
  } else {
    return null;
  }
};

export default UserViewLeft;
