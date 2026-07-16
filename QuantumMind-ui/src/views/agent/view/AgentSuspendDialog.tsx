// ** React Imports
import { useState } from 'react'

// ** MUI Imports
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import Typography from '@mui/material/Typography'

// ** Icon Imports
import { useDispatch } from 'react-redux'
import Icon from 'src/@core/components/icon'
import { AppDispatch } from 'src/store'
import { updateAgent } from 'src/store/apps/agent'

type Props = {
  agentId: string,
  open: boolean
  setOpen: (val: boolean) => void
}

const AgentSuspendDialog = (props: Props) => {
  // ** Props
  const { open, setOpen } = props
  // ** Hooks
  const dispatch = useDispatch<AppDispatch>();
  // ** States
  const [agentInput, setAgentInput] = useState<string>('yes')
  const [secondDialogOpen, setSecondDialogOpen] = useState<boolean>(false)

  const handleClose = () => setOpen(false)

  const handleSecondDialogClose = () => setSecondDialogOpen(false)

  const handleConfirmation = (value: string) => {
    if (value === 'yes') {
      // call API to suspend agent
      dispatch(updateAgent({ id:props.agentId, data:{ active:false } }));
    }
    handleClose();
    setAgentInput(value)
    setSecondDialogOpen(true)
  }

  return (
    <>
      <Dialog fullWidth open={open} onClose={handleClose} sx={{ '& .MuiPaper-root': { width: '100%', maxWidth: 512 } }}>
        <DialogContent sx={{ pb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
            <Box sx={{ mb: 4, maxWidth: '85%', textAlign: 'center', '& svg': { mb: 2, color: 'warning.main' } }}>
              <Icon icon='bx:error-circle' fontSize='5rem' />
              <Typography variant='h5' sx={{ color: 'text.secondary' }}>
                Are you sure?
              </Typography>
            </Box>
            <Typography sx={{ fontSize: '1.125rem' }}>You won't be able to revert agent!</Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center' }}>
          <Button variant='contained' sx={{ mr: 1.5 }} onClick={() => handleConfirmation('yes')}>
            Yes, Suspend agent!
          </Button>
          <Button variant='outlined' color='secondary' onClick={() => handleConfirmation('cancel')}>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog
        fullWidth
        open={secondDialogOpen}
        onClose={handleSecondDialogClose}
        sx={{ '& .MuiPaper-root': { width: '100%', maxWidth: 512 } }}
      >
        <DialogContent sx={{ pb: 4 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              flexDirection: 'column',
              '& svg': {
                mb: 2,
                color: agentInput === 'yes' ? 'success.main' : 'error.main'
              }
            }}
          >
            <Icon fontSize='5rem' icon={agentInput === 'yes' ? 'bx:check-circle' : 'bx:x-circle'} />
            <Typography variant='h5' sx={{ mb: 4, color: 'text.secondary' }}>
              {agentInput === 'yes' ? 'Suspended!' : 'Cancelled'}
            </Typography>
            <Typography sx={{ fontSize: '1.125rem' }}>
              {agentInput === 'yes' ? 'Agent has been suspended.' : 'Cancelled Suspension :)'}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center' }}>
          <Button variant='contained' color='success' onClick={handleSecondDialogClose}>
            OK
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default AgentSuspendDialog
