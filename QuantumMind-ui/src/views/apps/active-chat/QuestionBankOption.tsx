// ** React Imports
import { ReactNode, useEffect, useState } from 'react';

// ** MUI Imports
import Box from '@mui/material/Box';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import Button from '@mui/material/Button';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import ListItemButton from '@mui/material/ListItemButton';

// ** Icon Imports
import Icon from 'src/@core/components/icon';

// ** Third Party Components
import PerfectScrollbar from 'react-perfect-scrollbar';

// ** Type
import { QuestionBankType } from 'src/types/apps/chatTypes';

// ** Custom Component Imports
import Sidebar from 'src/@core/components/sidebar';
import { updateConversationChats } from 'src/store/apps/conversation';

// ** Utils Import
import { useDispatch } from 'react-redux';
import { AppDispatch, RootState } from 'src/store';
import { useSelector } from 'react-redux';
import { Divider } from '@mui/material';
import { fetchQuestionsList } from 'src/store/apps/question-bank';
import InputAdornment from '@mui/material/InputAdornment';

const QuestionBank = (props: QuestionBankType) => {
  const {
    store,
    hidden,
    statusObj,
    getInitials,
    sidebarWidth,
    questionBankRightOpen,
    handleQuestionBankRightSidebarToggle,
    socket,
  } = props;

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
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { selectedChat } = useSelector((state: any) => state.chat);
  const { userData } = useSelector((state: any) => state.user);
  const { questionsList } = useSelector((state: any) => state.questionBank);
  const { selectedVisitorId, activeChatId } = useSelector(
    (state: RootState) => state.conversations,
  );
  const [searchQ, setSearchQ] = useState<string>('');
  const [selectedAns, setSelectedAns] = useState<any>([]);
  // use "selectedAns" to the conversation

 

  const handleQAClick = (obj: any) => {
    setSelectedAns(obj?.answers);
    setSearchQ('');
    handleQuestionBankRightSidebarToggle();
  };
  const handleClose = () => {
    setSearchQ('');
    handleQuestionBankRightSidebarToggle();
  };
  useEffect(() => {
    if (selectedAns.length > 0) {
      const message = {
        message: selectedAns[0],
        type: 'text',
        sender: 'agent',
        time: new Date().toISOString(),
        id: new Date().getTime(),
      };
      socket.sendMessage('events', {
        event: 'chat-message-from-agent',
        data: {
          message: message.message,
          to: selectedVisitorId,
        },
      });

      dispatch(
        updateConversationChats({
          conversationId: activeChatId,
          message,
        }),
      );
    }
  }, [selectedAns]);
  const handleSearchQuestion = (e: any) => {
    dispatch(fetchQuestionsList({ question: searchQ }));
  }
  return (
    <Sidebar
      direction="right"
      show={questionBankRightOpen}
      backDropClick={handleClose}
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
      <Box sx={{ position: 'relative' }}>
        <IconButton
          size="small"
          onClick={handleClose}
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
            pt: 5,
            px: 5,
            display: 'flex',
            gap: 2,
            flexDirection: 'column',
          }}
        >
          <Typography sx={{ mb: 1.5, fontWeight: 500, textAlign: 'left' }}>
            Question Bank
          </Typography>

          <TextField
            required
            value={searchQ}
            fullWidth
            size="small"
            onChange={(e: any) => setSearchQ(e.target.value)}
            onKeyUp={(e: any) => {
              if (e.key === 'Enter') {
                handleSearchQuestion(e)
              }
            }}
            placeholder="Search Question"
            sx={{ '& .MuiInputBase-root': { borderRadius: 5 } }}
            InputProps={{
              endAdornment: (
                <InputAdornment
                  position="start"
                  sx={{ color: 'text.secondary', mr: -2 }}
                >
                  <Button
                  sx={{textTransform:"capitalize"}}
                    onClick={handleSearchQuestion}
                 
                    startIcon={<Icon icon="bx:search" fontSize={20} />}
                  >
                    Search
                  </Button>
                </InputAdornment>
              ),
            }}
          />
        </Box>
      </Box>
      <Divider style={{ marginBottom: 0 }} />
      <Box sx={{ height: 'calc(100% - 6.5rem)' }}>
        <PerfectScrollbar options={{ wheelPropagation: true }}>
          <List
            sx={{ width: '100%', maxWidth: 360, bgcolor: 'background.paper' }}
          >
            {questionsList?.length > 0 &&
              questionsList.map((value: any, index: number) => (
                <ListItem
                  key={index}
                  disableGutters
                  disablePadding
                  style={{ paddingLeft: '10px' }}
                >
                  <ListItemButton
                    disableRipple
                    onClick={() => handleQAClick(value)}
                    sx={{
                      px: 3,
                      py: 2,
                      width: '100%',
                      borderRadius: 1,
                      alignItems: 'flex-start',
                    }}
                  >
                    <ListItemText
                      primary={value?.question}
                      secondary={
                        value?.answers?.length > 0 ? (
                          value?.answers.map((ans: any, idx: number) => (
                            <Typography
                              noWrap
                              key={idx}
                              variant="body2"
                              sx={{ color: 'text.secondary' }}
                            >
                              {ans}
                            </Typography>
                          ))
                        ) : (
                          <Typography sx={{ color: 'text.secondary' }}>
                            "N/A"
                          </Typography>
                        )
                      }
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            {questionsList?.length <= 0 && (
              <Typography
                sx={{ my: 1.5, fontWeight: 500, textAlign: 'center' }}
              >
                No questions found!
              </Typography>
            )}
          </List>
        </PerfectScrollbar>
      </Box>
    </Sidebar>
  );
};

export default QuestionBank;
