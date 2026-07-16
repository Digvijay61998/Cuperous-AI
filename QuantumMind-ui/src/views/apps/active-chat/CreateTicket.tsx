// ** React Imports
import { Fragment, JSXElementConstructor, Key, ReactElement, ReactFragment, ReactNode, ReactPortal, useEffect, useState } from 'react'

// ** MUI Imports
import Box from '@mui/material/Box'
import Select, { SelectChangeEvent } from '@mui/material/Select';
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import FormControl from '@mui/material/FormControl'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

// ** Third Party Components
import PerfectScrollbar from 'react-perfect-scrollbar'

// ** Type
import { CreateTicketType } from 'src/types/apps/chatTypes'

// ** Custom Component Imports
import Sidebar from 'src/@core/components/sidebar'
import CustomAvatar from 'src/@core/components/mui/avatar'

// ** Utils Import
import { getInitials } from 'src/@core/utils/get-initials';
import { useDispatch } from 'react-redux';
import { AppDispatch, RootState } from 'src/store';
import { fetchVisitorDetail } from 'src/store/apps/visitor';
import { useSelector } from 'react-redux'
import { Divider } from '@mui/material';
import { LoadingButton } from '@mui/lab'
import { CreateTicketData } from 'src/store/apps/service-request';
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

const CreateTicket = (props: CreateTicketType) => {
  const {
    store,
    hidden,
    statusObj,
    getInitials,
    sidebarWidth,
    createTicketRightOpen,
    handleCreateTicketRightSidebarToggle
  } = props

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedChat, setSelectedChat] = useState<any>(null)
  const { activeChatId, activeConversations } = useSelector(
    (state: RootState) => state.conversations,
  );
  const tagList = useSelector((state: RootState) => state.tags.list);
  const activeChat: any = activeConversations.find(
    (chat: any) => chat._id === activeChatId,
  );
  const dispatch = useDispatch<AppDispatch>();
  useEffect(() => {
    if (activeChat?.chats) {
      setSelectedChat(activeChat);
    }
  }, [activeChat]);
  const {userData} = useSelector((state: any) => state.user);

  const [subject, setSubject] = useState<string>('');
  const [tags, setTags] = useState<any[]>([]);
  const [priority, setPriority] = useState<string>('');
  const [description, setDescription] = useState<string>('');


  useEffect(() => {
    dispatch(gettag());
  }, []);

  const handleChange = (event: SelectChangeEvent<typeof tags>) => {
    const {
      target: { value },
    } = event;
    // setTag(value);
    setTags(
      // On autofill we get a stringified value.
      typeof value === 'string' ? value.split(',') : value,
    );
  };

  const onSubmit = (e:any) => {
    e.preventDefault();
    setIsLoading(true);

    dispatch(CreateTicketData({
        subject: subject,
        priority: priority,
        description: description,
        tags: tags,
        bot: selectedChat?.bot?.id,
        conversationId: selectedChat?._id,
        agents: [userData._id],
        visitor: selectedChat.visitor?._id
    }));
    setIsLoading(false);
    handleCreateTicketRightSidebarToggle();
  }
  const handleClose = () => {
    handleCreateTicketRightSidebarToggle();
  }

  return (
    <Sidebar
      direction='right'
      show={createTicketRightOpen}
      backDropClick={handleClose}
      sx={{
        zIndex: 9,
        height: '100%',
        width: sidebarWidth,
        borderTopRightRadius: theme => theme.shape.borderRadius,
        borderBottomRightRadius: theme => theme.shape.borderRadius,
        '& + .MuiBackdrop-root': {
          zIndex: 8,
          borderRadius: 1
        }
      }}
    >
        <Box sx={{ position: 'relative' }}>
            <IconButton
              size='small'
              onClick={handleClose}
              sx={{ top: '0.5rem', right: '0.5rem', position: 'absolute', color: 'text.secondary' }}
            >
              <Icon icon='bx:x' />
            </IconButton>
            <Box sx={{ p: 5, display: 'flex', flexDirection: 'column' }}>
              <Typography sx={{ mb: 0.5, fontWeight: 500, textAlign: 'left' }}>
                Create Ticket
              </Typography>
            </Box>
        </Box>

        <Divider style={{ padding:0, margin:0 }}/>

        <Box sx={{ height: 'calc(100% - 5.5rem)' }}>
          <PerfectScrollbar options={{ wheelPropagation: true }}>
            <form onSubmit={onSubmit} style={{ padding:20 }}>
                <div style={{ color:'#32475c99' }}>Subject * :</div>
                <FormControl required size="small" fullWidth sx={{ mt:1, mb:4 }}>
                    <TextField
                        required
                        value={subject}
                        size="small"
                        onChange={(e:any) => setSubject(e.target.value)}
                        placeholder='Enter the subject'
                    />
                </FormControl>

                <div style={{ color:'#32475c99' }}>Tags * :</div>
                <FormControl required fullWidth sx={{ mt:1, mb:4 }} size='small'>
                  <Select
                    required
                    labelId="select-multiple-chip-label"
                    id="select-multiple-tag"
                    multiple
                    value={tags}
                    size="small"
                    displayEmpty
                    onChange={handleChange}
                    // input={<OutlinedInput id="select-multiple-chip" label="Tags" />}
                    inputProps={{ placeholder: 'Select Tags' }}
                    renderValue={(selected) => (
                      <>
                        {selected?.length > 0 ? (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {selected.map((value: any) => {
                              // let obj = tagList.find(x => x._id === value);
                              return (
                                <Chip
                                  key={value}
                                  sx={{ fontSize: '11px' }}
                                  label={value}
                                  color="primary"
                                />
                              );
                            })}
                          </Box>
                        ) : (
                          <div
                            style={{
                              color: '#b4bcc3',
                              fontWeight: '400',
                              fontSize: '1rem',
                            }}
                          >
                            select the tags
                          </div>
                        )}
                      </>
                    )}
                    MenuProps={MenuProps}
                  >
                    {tagList?.map((tagItem: any, index: number) => (
                      <MenuItem key={index} value={tagItem.name}>
                        {tagItem?.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <div style={{ color:'#32475c99' }}>Priority * :</div>
                <FormControl required fullWidth sx={{ mt:1, mb:4 }} size='small'>
                    <Select
                    required
                    labelId="select-chip-label"
                    id='select-Priority'
                    value={priority}
                    size="small"
                    displayEmpty
                    onChange={(e:any) => setPriority(e.target.value)}
                    inputProps={{ placeholder: 'Select the priority' }}
                    renderValue={(selected) => (<>
                        {selected?.length > 0 ? (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {selected}
                        </Box>
                        ):(
                        <div style={{ 
                            color:'#b4bcc3',
                            fontWeight: '400', 
                            fontSize: '1rem', 
                        }}>Select the priority</div>)}
                    </>)}
                    >
                      <MenuItem value="LOW">LOW</MenuItem>
                      <MenuItem value="MEDIUM">MEDIUM</MenuItem>
                      <MenuItem value="HIGH">HIGH</MenuItem>
                      <MenuItem value="CRITICAL">CRITICAL</MenuItem>
                    </Select>
                </FormControl>
                
                <div style={{ color:'#32475c99' }}>Description * :</div>
                <FormControl required size="small" fullWidth sx={{ mt:1, mb:4 }}>
                    <TextField
                    multiline required
                    minRows={3}
                    size="small"
                    value={description}
                    onChange={(e:any) => setDescription(e.target.value)}
                    placeholder='Enter the description'
                    />
                </FormControl>

                
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <LoadingButton loading={isLoading} size='large' type='submit' variant='contained' sx={{ mr: 3 }}>
                    Submit
                    </LoadingButton>
                    <Button size='large' variant='outlined' color='secondary' onClick={handleClose}>
                    Cancel
                    </Button>
                </Box>
            </form>
          </PerfectScrollbar>
        </Box>
    </Sidebar>
  )
}

export default CreateTicket
