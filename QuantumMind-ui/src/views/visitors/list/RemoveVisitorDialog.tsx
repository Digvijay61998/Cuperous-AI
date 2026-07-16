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
import { removeVisitorFromSegment } from 'src/store/apps/visitor'

type Props = {
  segmentId: string,
  visitorId: string,
  open: boolean
  setOpen: (val: boolean) => void
}

const VisitorRemoveDialog = (props: Props) => {
  // ** Props
  const { visitorId, segmentId, open, setOpen } = props
  
  const [isLoading, setIsLoading] = useState<boolean>(false);
  // ** Hooks
  const dispatch = useDispatch<AppDispatch>();

  const handleClose = () => setOpen(false)

  const handleConfirmation = (value: string) => {
    if (value === 'yes') {
      setIsLoading(true);
      // call API to remove visitor
      dispatch(removeVisitorFromSegment({
        visitorId,
        segmentId,
      }));
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
            <Typography sx={{ fontSize: '1.125rem' }}>You won't be able to revert visitor!</Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center' }}>
          <LoadingButton loading={isLoading} variant='contained' sx={{ mr: 1.5 }} onClick={() => handleConfirmation('yes')}>
            Yes, Remove Visitor!
          </LoadingButton>
          <Button variant='outlined' color='secondary' onClick={() => handleConfirmation('cancel')}>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default VisitorRemoveDialog
