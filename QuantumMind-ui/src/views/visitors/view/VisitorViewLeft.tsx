// ** React Imports
import { useState } from 'react';
// ** MUI Imports
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import Grid from '@mui/material/Grid';
import InputAdornment from '@mui/material/InputAdornment';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

// ** Icon Imports

// ** Custom Components
import UserSubscriptionDialog from 'src/views/apps/user/view/UserSubscriptionDialog';
import UserSuspendDialog from 'src/views/apps/user/view/UserSuspendDialog';

// ** Types
import { ThemeColor } from 'src/@core/layouts/types';

// ** Utils Import
import { useSelector } from 'react-redux';

interface ColorsType {
  [key: string]: ThemeColor;
}

type Props = {
  visitorId: any;
};

const VisitorViewLeft = ({ visitorId }: Props) => {
  // ** States
  const [openEdit, setOpenEdit] = useState<boolean>(false);
  const [openPlans, setOpenPlans] = useState<boolean>(false);
  const [suspendDialogOpen, setSuspendDialogOpen] = useState<boolean>(false);
  const [subscriptionDialogOpen, setSubscriptionDialogOpen] =
    useState<boolean>(false);

  //console.log(visitorDetail.name);

  // Handle Edit dialog
  const handleEditClickOpen = () => setOpenEdit(true);
  const handleEditClose = () => setOpenEdit(false);

  const { visitorDataList } = useSelector((state: any) => state.visitors);
  //console.log(visitorDataList)

  const { deviceDetails } = useSelector((state: any) => state.visitors);
  //console.log(visitorDataListDeep[visitorDataListDeep.length-1].ip)

  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6">Visitor Details</Typography>
            <Divider sx={{ mt: (theme) => `${theme.spacing(1)} !important` }} />
            <Box sx={{ pt: 4, pb: 2 }}>
              <Box sx={{ display: 'flex', mb: 4 }}>
                <Typography
                  sx={{ mr: 2, fontWeight: 700, color: 'text.secondary' }}
                >
                  Name:
                </Typography>
                <Typography sx={{ color: 'text.secondary' }}>
                  {visitorDataList.name}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', mb: 4 }}>
                <Typography
                  sx={{ mr: 2, fontWeight: 700, color: 'text.secondary' }}
                >
                  Bot Name:
                </Typography>
                <Typography sx={{ color: 'text.secondary' }}>
                  {visitorDataList?.bot?.name}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', mb: 4 }}>
                <Typography
                  sx={{ mr: 2, fontWeight: 700, color: 'text.secondary' }}
                >
                  Email:
                </Typography>
                <Typography sx={{ color: 'text.secondary' }}>
                  {visitorDataList.email}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', mb: 4 }}>
                <Typography
                  sx={{ mr: 2, fontWeight: 700, color: 'text.secondary' }}
                >
                  Phone:
                </Typography>
                <Typography sx={{ color: 'text.secondary' }}>
                  {visitorDataList.phone}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', mb: 4 }}>
                <Typography
                  sx={{ mr: 2, fontWeight: 700, color: 'text.secondary' }}
                >
                  When:
                </Typography>
                <Typography sx={{ color: 'text.secondary' }}>
                  {/* {visitorDataList.createdAt} */}

                  <span>
                    {new Date(visitorDataList.createdAt).toLocaleDateString(
                      'en-US',
                      {
                        hour: 'numeric',
                        minute: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      },
                    )}
                  </span>
                </Typography>
              </Box>

              {deviceDetails?.ip && (
                <Box sx={{ display: 'flex', mb: 4 }}>
                  <Typography
                    sx={{ mr: 2, fontWeight: 700, color: 'text.secondary' }}
                  >
                    IP:
                  </Typography>
                  <Typography sx={{ color: 'text.secondary' }}>
                    {deviceDetails?.ip}
                  </Typography>
                </Box>
              )}
              {deviceDetails?.device &&
                deviceDetails?.device.toLowerCase() !== 'unknown' && (
                  <Box sx={{ display: 'flex', mb: 4 }}>
                    <Typography
                      sx={{ mr: 2, fontWeight: 700, color: 'text.secondary' }}
                    >
                      Device:
                    </Typography>
                    <Typography sx={{ color: 'text.secondary' }}>
                      {deviceDetails?.device}
                    </Typography>
                  </Box>
                )}
              {deviceDetails?.browser &&
                deviceDetails?.browser.toLowerCase() !== 'unknown' && (
                  <Box sx={{ display: 'flex', mb: 4 }}>
                    <Typography
                      sx={{ mr: 2, fontWeight: 700, color: 'text.secondary' }}
                    >
                      Browser:
                    </Typography>
                    <Typography sx={{ color: 'text.secondary' }}>
                      {deviceDetails?.browser}
                    </Typography>
                  </Box>
                )}
              {deviceDetails?.country &&
                deviceDetails?.country.toLowerCase() !== 'unknown' && (
                  <Box sx={{ display: 'flex', mb: 4 }}>
                    <Typography
                      sx={{ mr: 2, fontWeight: 700, color: 'text.secondary' }}
                    >
                      Country:
                    </Typography>
                    <Typography sx={{ color: 'text.secondary' }}>
                      {deviceDetails?.country}
                    </Typography>
                  </Box>
                )}
              {deviceDetails?.city &&
                deviceDetails?.city.toLowerCase() !== 'unknown' && (
                  <Box sx={{ display: 'flex', mb: 4 }}>
                    <Typography
                      sx={{ mr: 2, fontWeight: 700, color: 'text.secondary' }}
                    >
                      City:
                    </Typography>
                    <Typography sx={{ color: 'text.secondary' }}>
                      {deviceDetails?.city}
                    </Typography>
                  </Box>
                )}
              {deviceDetails?.os &&
                deviceDetails?.os.toLowerCase() !== 'unknown' && (
                  <Box sx={{ display: 'flex', mb: 4 }}>
                    <Typography
                      sx={{ mr: 2, fontWeight: 700, color: 'text.secondary' }}
                    >
                      OS:
                    </Typography>
                    <Typography sx={{ color: 'text.secondary' }}>
                      {deviceDetails?.os}
                    </Typography>
                  </Box>
                )}

             {deviceDetails?.lat && deviceDetails?.lon  && <Box sx={{ display: 'flex', mb: 0 }}>
                <iframe
                  id="iframeId"
                  height="300px"
                  width="100%"
                  style={{ border: 0, borderRadius: '0.5rem' }}
                  src={`https://maps.google.com/maps?q=${
                    deviceDetails?.lat
                  },${deviceDetails?.lon}&hl=es;&output=embed`}
                ></iframe>
              </Box>}
            </Box>
          </CardContent>

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
              <form>
                <Grid container spacing={5}>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth label="First Name" defaultValue="" />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth label="Last Name" defaultValue="" />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Username"
                      defaultValue=""
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">@</InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      type="email"
                      label="Email"
                      defaultValue=""
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel id="user-view-status-label">
                        Status
                      </InputLabel>
                      <Select
                        label="Status"
                        defaultValue=""
                        id="user-view-status"
                        labelId="user-view-status-label"
                      >
                        <MenuItem value="active">Active</MenuItem>
                        <MenuItem value="inactive">Inactive</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Tags"
                      defaultValue="Marketing, Sales, Support"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth label="Phone Number" defaultValue="" />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel id="user-view-language-label">
                        Language
                      </InputLabel>
                      <Select
                        label="Language"
                        defaultValue="English"
                        id="user-view-language"
                        labelId="user-view-language-label"
                      >
                        <MenuItem value="English">English</MenuItem>
                        <MenuItem value="Spanish">Spanish</MenuItem>
                        <MenuItem value="Portuguese">Portuguese</MenuItem>
                        <MenuItem value="Russian">Russian</MenuItem>
                        <MenuItem value="French">French</MenuItem>
                        <MenuItem value="German">German</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel id="user-view-country-label">
                        Country
                      </InputLabel>
                      <Select
                        label="Country"
                        defaultValue="USA"
                        id="user-view-country"
                        labelId="user-view-country-label"
                      >
                        <MenuItem value="USA">USA</MenuItem>
                        <MenuItem value="UK">UK</MenuItem>
                        <MenuItem value="Spain">Spain</MenuItem>
                        <MenuItem value="Russia">Russia</MenuItem>
                        <MenuItem value="France">France</MenuItem>
                        <MenuItem value="Germany">Germany</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </form>
            </DialogContent>
            <DialogActions sx={{ justifyContent: 'center' }}>
              <Button
                variant="contained"
                sx={{ mr: 2 }}
                onClick={handleEditClose}
              >
                Submit
              </Button>
              <Button
                variant="outlined"
                color="secondary"
                onClick={handleEditClose}
              >
                Cancel
              </Button>
            </DialogActions>
          </Dialog>

          <UserSuspendDialog
            open={suspendDialogOpen}
            setOpen={setSuspendDialogOpen}
          />
          <UserSubscriptionDialog
            open={subscriptionDialogOpen}
            setOpen={setSubscriptionDialogOpen}
          />
        </Card>
      </Grid>
    </Grid>
  );
};

export default VisitorViewLeft;
