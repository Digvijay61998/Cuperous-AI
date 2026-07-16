// ** React Imports

// ** MUI Imports
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

// ** Icon Imports
import Icon from 'src/@core/components/icon';

// ** Third Party Components

// ** Type
import { CreateTicketType } from 'src/types/apps/chatTypes';

// ** Custom Component Imports
import Sidebar from 'src/@core/components/sidebar';

// ** Utils Import
import { useDispatch } from 'react-redux';
import { AppDispatch } from 'src/store';
import TicketCards from './Ticket-Cards';
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

  const dispatch = useDispatch<AppDispatch>();


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
                View Ticket
              </Typography>
            </Box>
        </Box>

        <Box sx={{ height: 'calc(100% - 5.8125rem)',p:6, overflowY:'auto' }}>
           <TicketCards/>
        </Box>
    </Sidebar>
  )
}

export default CreateTicket
