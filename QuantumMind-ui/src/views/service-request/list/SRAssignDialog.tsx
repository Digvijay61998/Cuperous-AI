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
import { LoadingButton } from '@mui/lab'
import { assignTicketById, markResolvedTicketById, updateTicket } from 'src/store/apps/service-request'

type Props = {
  ticketId: string,
  open: boolean
  setOpen: (val: boolean) => void
}

const SRAssignDialog = (props: Props) => {
  // ** Props
  const { ticketId, open, setOpen } = props

  const [isLoading, setIsLoading] = useState<boolean>(false);

  // ** Hooks
  const dispatch = useDispatch<AppDispatch>();

  const handleClose = () => setOpen(false)

  const handleConfirmation = (value: string) => {
    if (value === 'yes') {
      setIsLoading(true);
      // call API to Assign ticket
      // dispatch(updateTicket({ id:ticketId, data: { status: 'CLOSED' }}));
      dispatch(assignTicketById(ticketId));
      setIsLoading(false);
    }
    handleClose();
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
            <Typography sx={{ fontSize: '1.125rem' }}>You won't be able to revert ticket!</Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center' }}>
          <LoadingButton loading={isLoading} variant='contained' sx={{ mr: 1.5 }} onClick={() => handleConfirmation('yes')}>
            Yes, Assign me!
          </LoadingButton>
          <Button variant='outlined' color='secondary' onClick={() => handleConfirmation('cancel')}>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default SRAssignDialog
