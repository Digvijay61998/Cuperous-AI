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
import { LoadingButton } from '@mui/lab'

type Props = {
  applicationId: string,
  open: boolean,
  setOpen: (val: boolean) => void,
  icon?: string,
  title: string,
  body: string,
  buttonNameYes?: string,
  handleYes: (id: string) => void,
  buttonNameNo?: string,
}

const DeleteDialog = (props: Props) => {
  // ** Props
  const { 
    applicationId, 
    open, 
    setOpen,
    icon='bx:error-circle',
    title,
    body,
    buttonNameYes='Yes',
    handleYes,
    buttonNameNo='Cancel' 
  } = props

  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleClose = () => setOpen(false)

  const handleConfirmation = (value: string) => {
    if (value === 'yes') {
      setIsLoading(true);
      handleYes(applicationId);
      setIsLoading(false);
    }
    handleClose();
  }

  return (
    <Dialog fullWidth open={open} onClose={handleClose} sx={{ '& .MuiPaper-root': { width: '100%', maxWidth: 512 } }}>
      <DialogContent sx={{ pb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
          <Box sx={{ mb: 4, maxWidth: '85%', textAlign: 'center', '& svg': { mb: 2, color: 'warning.main' } }}>
            <Icon icon={icon} fontSize='5rem' />
            <Typography variant='h5' sx={{ color: 'text.secondary' }}>
              {title}
            </Typography>
          </Box>
          <Typography sx={{ fontSize: '1.125rem' }}>{body}</Typography>
        </Box>
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'center' }}>
        <LoadingButton loading={isLoading} variant='contained' sx={{ mr: 1.5 }} onClick={() => handleConfirmation('yes')}>
          {buttonNameYes}
        </LoadingButton>
        <Button variant='outlined' color='secondary' onClick={() => handleConfirmation('cancel')}>
          {buttonNameNo}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default DeleteDialog
