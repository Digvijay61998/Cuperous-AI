// ** React Imports
import { useState } from 'react'

// ** MUI Imports
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import Typography from '@mui/material/Typography'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'

// ** Icon Imports
import Icon from 'src/@core/components/icon'
import { useDispatch } from 'react-redux'
import { AppDispatch } from 'src/store'
import { updateWebhook } from 'src/store/apps/webhook'
import { LoadingButton } from '@mui/lab'

type Props = {
  webhookId: string,
  open: boolean
  setOpen: (val: boolean) => void
}

const WebhookSuspendDialog = (props: Props) => {
  // ** Props
  const { webhookId, open, setOpen } = props
  
  const [isLoading, setIsLoading] = useState<boolean>(false);
  // ** Hooks
  const dispatch = useDispatch<AppDispatch>();
  // ** States
  const [webhookInput, setWebhookInput] = useState<string>('yes')
  const [secondDialogOpen, setSecondDialogOpen] = useState<boolean>(false)

  const handleClose = () => setOpen(false)

  const handleSecondDialogClose = () => setSecondDialogOpen(false)

  const handleConfirmation = (value: string) => {
    if (value === 'yes') {
      setIsLoading(true);
      // call API to suspend webhook
      dispatch(updateWebhook({ id:webhookId, data:{ isActive:false } }));
      setIsLoading(false);
    }
    handleClose();
    // setWebhookInput(value)
    // setSecondDialogOpen(true)
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
            <Typography sx={{ fontSize: '1.125rem' }}>You want to suspend webhook?</Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center' }}>
          <LoadingButton loading={isLoading} variant='contained' sx={{ mr: 1.5 }} onClick={() => handleConfirmation('yes')}>
            Yes, Suspend webhook!
          </LoadingButton>
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
                color: webhookInput === 'yes' ? 'success.main' : 'error.main'
              }
            }}
          >
            <Icon fontSize='5rem' icon={webhookInput === 'yes' ? 'bx:check-circle' : 'bx:x-circle'} />
            <Typography variant='h5' sx={{ mb: 4, color: 'text.secondary' }}>
              {webhookInput === 'yes' ? 'Suspended!' : 'Cancelled'}
            </Typography>
            <Typography sx={{ fontSize: '1.125rem' }}>
              {webhookInput === 'yes' ? 'Webhook has been suspended.' : 'Cancelled Suspension :)'}
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

export default WebhookSuspendDialog
