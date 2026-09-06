// ** React Imports
import { useEffect, useState } from 'react';

// ** MUI Imports
import Drawer from '@mui/material/Drawer';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import { styled } from '@mui/material/styles';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import InputLabel from '@mui/material/InputLabel';
import Typography from '@mui/material/Typography';
import Box, { BoxProps } from '@mui/material/Box';
import FormControl from '@mui/material/FormControl';
import { Chip, FormGroup, OutlinedInput, Paper } from '@mui/material';

// ** Icon Imports
import Icon from 'src/@core/components/icon';

// ** Store Imports
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from 'src/store';
import toast from 'react-hot-toast';
import { addNewSocial, fetchSocialList, updateSocial } from 'src/store/apps/social';
import WhatsappWebConnect from './WhatsappWebConnect';

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      // width: 250,
    },
  },
};

interface SidebarAddNewSocialType {
  open: boolean;
  toggle: () => void;
  data: any;
}

const Header = styled(Box)<BoxProps>(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(3, 4),
  justifyContent: 'space-between',
  backgroundColor: theme.palette.background.default,
}));

const selectFacebookType = [
  {
    label: 'Facebook Messenger',
    value: 'messenger',
  },
  {
    label: 'Facebook Comment',
    value: 'comment',
  },
];

const selectInstagramType = [
  {
    label: 'Instagram Messenger',
    value: 'messenger',
  },
  {
    label: 'Instagram Comment',
    value: 'comment',
  },
];

const SidebarAddNewSocial = (props: SidebarAddNewSocialType) => {
  // ** Props
  const { open, toggle, data } = props;

  const [name, setName] = useState<string>('');
  const [platformField, setPlatformField] = useState<string>('');
  const [botId, setBotId] = useState<string>('');
  const [jarcubeBot, setJarcubeBot] = useState<string>('');
  const [accessTokenField, setAccessTokenField] = useState<string>('');
  const [phoneNumberId, setPhoneNumberId] = useState<number>(0);
  const [type, setType] = useState<string>('');
  // ** Hooks
  const dispatch = useDispatch<AppDispatch>();
  const botList = useSelector((state: RootState) => state.bots.list);
  const { socialListSearch } = useSelector((state: RootState) => state.social);
  const [oldAccessToken, setOldAccessToken] = useState<string>('');
  const [commentToken, setCommentToken] = useState('')
  useEffect(() => {
    if (data.method === 'edit') {
      setName(data?.name);
      setPlatformField(data?.platform);
      setBotId(data?.botId);
      setJarcubeBot(data?.jarcubeBot?._id || data?.jarcubeBot?.id);
      setAccessTokenField(data?.accessToken);
      setOldAccessToken(data?.accessToken);
      setType(data?.type || '');
      setPhoneNumberId(data?.phoneNumberId || 0);
      setCommentToken(data?.commentToken || '')
    }
  }, [data]);

  const onSubmit = (event: any) => {
    event.preventDefault();
    const extraDataByPlatform =
      platformField === 'facebook'
        ? { type }
        : platformField === 'instagram'
        ? { type }
        : platformField === 'whatsapp'
        ? { phoneNumberId }
        : {};
    if (data.method === 'add') {
      dispatch(
        addNewSocial({
          name: name,
          platform: platformField,
          botId: botId,
          jarcubeBot: jarcubeBot,
          accessToken: accessTokenField,
          ...extraDataByPlatform,
        }),
      );
    } else if (data.method === 'edit') {
      if (oldAccessToken !== accessTokenField) {
        dispatch(
          updateSocial({
            id: data?._id || data.id,
            data: {
              name: name,
              platform: platformField,
              botId: botId,
              jarcubeBot: jarcubeBot,
              accessToken: accessTokenField,
              ...extraDataByPlatform,
            },
          }),
        );
      } else {
        dispatch(
          updateSocial({
            id: data?._id || data.id,
            data: {
              name: name,
              platform: platformField,
              botId: botId,
              jarcubeBot: jarcubeBot,
              ...extraDataByPlatform,
            },
          }),
        );
      }
    }
    setName('');
    setBotId('');
    setJarcubeBot('');
    setPlatformField('');
    setAccessTokenField('');
    toggle();
  };

  const handleClose = () => {
    setName('');
    setBotId('');
    setJarcubeBot('');
    setPlatformField('');
    setAccessTokenField('');
    toggle();
  };
  return (
    <Drawer
      open={open}
      anchor="right"
      variant="temporary"
      onClose={handleClose}
      ModalProps={{ keepMounted: true }}
      sx={{ '& .MuiDrawer-paper': { width: { xs: 300, sm: 400 } } }}
    >
      <Header>
        <Typography variant="h6">
          {data.method === 'add' ? 'Add Messenger' : 'Edit Messenger'}
        </Typography>
        <IconButton
          size="small"
          onClick={handleClose}
          sx={{ color: 'text.primary' }}
        >
          <Icon icon="bx:x" fontSize={20} />
        </IconButton>
      </Header>
      <Box sx={{ p: 5 }}>
        <Typography variant="body2">
          Your name, assigned bot and access token will get used for creating
          social platform chatbot.
        </Typography>
        <br />
        <form onSubmit={onSubmit}>
          <FormControl required fullWidth sx={{ mb: 6 }}>
            <TextField
              required
              size="small"
              value={name}
              label="Name"
              inputProps={{
                maxLength: 60,
              }}
              onChange={(e: any) => setName(e.target.value)}
              placeholder="maximum 60 characters"
            />
          </FormControl>
          <FormControl required fullWidth sx={{ mb: 6 }} size="small">
            <InputLabel id="select-single-chip-label">
              Select JarCube Bot
            </InputLabel>

            <Select
              required
              labelId="select-single-chip-label"
              id="select-single-bots"
              value={jarcubeBot}
              size="small"
              onChange={(e: any) => setJarcubeBot(e.target.value)}
              input={
                <OutlinedInput
                  id="select-single-chip"
                  label="Select JarCube Bot"
                />
              }
              inputProps={{ placeholder: 'Select JarCube Bot' }}
              // renderValue={(selected) => (
              //   <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              //     {selected.map((value:any) => {
              //       let obj:any = botList.find((x:any) => x._id === value);
              //       return (<Chip key={value} sx={{fontSize: '11px'}} label={obj?.name} color='primary'/>);
              //     })}
              //   </Box>
              // )}
              MenuProps={MenuProps}
            >
              {botList?.map((botItem: any, index: number) => (
                <MenuItem key={index} value={botItem?._id || botItem?.id}>
                  {botItem?.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl required fullWidth sx={{ mb: 6 }} size="small">
            <InputLabel id="platform-select">Platform</InputLabel>
            <Select
              required
              labelId="platform-select"
              id="select-platform"
              value={platformField}
              size="small"
              onChange={(e: any) => setPlatformField(e.target.value)}
              input={
                <OutlinedInput id="select-platform-chip" label="Platform" />
              }
              inputProps={{ placeholder: 'Select Platform' }}
            >
              {socialListSearch?.platforms?.map((item: any, index: number) => (
                <MenuItem key={index} value={item}>
                  {item}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {platformField === 'whatsapp_web' && (
            <WhatsappWebConnect
              name={name}
              jarcubeBot={jarcubeBot}
              existingSession={
                data?.method === 'edit' && data?.sessionId
                  ? ({
                      id: data.sessionId,
                      name: name,
                      status: data.sessionStatus || 'created',
                    } as any)
                  : null
              }
              onDone={() => {
                dispatch(fetchSocialList());
                handleClose();
              }}
            />
          )}

          {(platformField === 'facebook' ||
            platformField === 'instagram' ||
            platformField === 'telegram') && (
            <FormControl required fullWidth sx={{ mb: 6 }}>
              <TextField
                required
                size="small"
                value={botId}
                label={
                  platformField === 'facebook' || platformField === 'instagram'
                    ? 'Page ID'
                    : 'Bot ID'
                }
                onChange={(e: any) => setBotId(e.target.value)}
              />
            </FormControl>
          )}

         
          {platformField === 'facebook' && (
            <FormControl required fullWidth sx={{ mb: 6 }} size="small">
              <InputLabel id="facebook-type"> Select Facebook Type</InputLabel>
              <Select
                required
                labelId="facebook-type"
                id="select-type"
                value={type}
                size="small"
                onChange={(e: any) => setType(e.target.value)}
                input={
                  <OutlinedInput
                    id="select-platform-chip"
                    label="Select Facebook Type"
                  />
                }
                inputProps={{ placeholder: 'Select Facebook Type' }}
              >
                {selectFacebookType?.map((item: any, index: number) => (
                  <MenuItem key={index} value={item.value}>
                    {item.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
           {(platformField === 'facebook' && type === 'comment') && (
            <FormControl required fullWidth sx={{ mb: 6 }}>
              <TextField
                required
                size="small"
                value={commentToken}
                label="Comment Token"
                onChange={(e: any) => setCommentToken(e.target.value)}
              />
            </FormControl>
          )}
          {platformField === 'instagram' && (
            <FormControl required fullWidth sx={{ mb: 6 }} size="small">
              <InputLabel id="instagram-type">
                {' '}
                Select Instagram Type
              </InputLabel>
              <Select
                required
                labelId="instagram-type"
                id="select-instagram-type"
                value={type}
                size="small"
                onChange={(e: any) => setType(e.target.value)}
                input={
                  <OutlinedInput
                    id="select-instagram-chip"
                    label="Select Instagram Type"
                  />
                }
                inputProps={{ placeholder: 'Select Instagram Type' }}
              >
                {selectInstagramType?.map((item: any, index: number) => (
                  <MenuItem key={index} value={item.value}>
                    {item.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
          {platformField === 'whatsapp' && (
            <FormControl required fullWidth sx={{ mb: 6 }}>
              <TextField
                required
                size="small"
                value={botId}
                label="Business Account"
                onChange={(e: any) => setBotId(e.target.value)}
                placeholder="Enter Business Account"
              />
            </FormControl>
          )}

          {platformField === 'whatsapp' && (
            <FormControl required fullWidth sx={{ mb: 6 }}>
              <TextField
                required
                size="small"
                value={phoneNumberId}
                label="Phone Number Id"
                // inputProps={{
                //   maxLength: 60,
                // }}
                type={'number'}
                onChange={(e: any) => setPhoneNumberId(e.target.value)}
                placeholder="Enter Phone Number Id"
              />
            </FormControl>
          )}

          {platformField !== 'whatsapp_web' && (
            <FormControl required fullWidth sx={{ mb: 6 }}>
              <TextField
                required
                size="small"
                value={accessTokenField}
                label="Access Token"
                onChange={(e: any) => setAccessTokenField(e.target.value)}
              />
            </FormControl>
          )}

          {platformField !== 'whatsapp_web' && (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Button
                size="large"
                type="submit"
                variant="contained"
                sx={{ mr: 3 }}
              >
                Submit
              </Button>
              <Button
                size="large"
                variant="outlined"
                color="secondary"
                onClick={handleClose}
              >
                Cancel
              </Button>
            </Box>
          )}
        </form>
      </Box>
    </Drawer>
  );
};

export default SidebarAddNewSocial;
