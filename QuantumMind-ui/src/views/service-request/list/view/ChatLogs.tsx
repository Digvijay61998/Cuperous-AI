import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Drawer from '@mui/material/Drawer';
import * as React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from 'src/store';
import ChatLog from 'src/views/apps/chat/ChatLog';
import { getChatLogsById } from 'src/store/apps/service-request';
import Icon from 'src/@core/components/icon';
import { IconButton } from '@mui/material';
export default function ChatLogs({ id, showIconOnly }: any) {
  const { chatLogData } = useSelector(
    (state: RootState) => state.serviceRequest,
  );
  const dispatch = useDispatch<AppDispatch>();
  const [state, setState] = React.useState({
    right: false,
  });
  useEffect(() => {
    if (id) dispatch(getChatLogsById(id));
  }, [id]);
  const toggleDrawer =
    (anchor: 'right', open: boolean) =>
    (event: React.KeyboardEvent | React.MouseEvent) => {
      if (
        event.type === 'keydown' &&
        ((event as React.KeyboardEvent).key === 'Tab' ||
          (event as React.KeyboardEvent).key === 'Shift')
      ) {
        return;
      }

      setState({ ...state, [anchor]: open });
    };

  return (
    <div>
      <>
        {showIconOnly  && (
          <IconButton onClick={toggleDrawer('right', true)} color="primary">
            <Icon icon="mdi:message-group" fontSize={20} />
          </IconButton>
        )}
        <Drawer
          anchor={'right'}
          open={state['right']}
          onClose={toggleDrawer('right', false)}
        >
          <ChatLog hidden={false} data={chatLogData} />
          <Button
            variant="outlined"
            size="small"
            sx={{
              textTransform: 'capitalize',
              position: 'absolute',
              left: '40%',
              bottom: '5%',
            }}
            onClick={toggleDrawer('right', false)}
          >
            Close Conversation
          </Button>
        </Drawer>
      </>
    </div>
  );
}
