// ** MUI Imports
import { Ref, useState, forwardRef, ReactElement } from 'react'
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';

// ** Icon Imports
import Icon from 'src/@core/components/icon';

import Chip from '@mui/material/Chip'
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import Switch from '@mui/material/Switch'
import Dialog, { DialogProps } from '@mui/material/Dialog'

import MenuItem from '@mui/material/MenuItem'
import TextField from '@mui/material/TextField'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import InputLabel from '@mui/material/InputLabel'
import FormControl from '@mui/material/FormControl'
import CardContent from '@mui/material/CardContent'
import Fade, { FadeProps } from '@mui/material/Fade'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import FormControlLabel from '@mui/material/FormControlLabel'
import Select, { SelectChangeEvent } from '@mui/material/Select'
import CardHeader from '@mui/material/CardHeader';
import Divider from 'src/@core/theme/overrides/divider';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from 'src/store';
import segments, { addsegment } from 'src/store/apps/segments'
import { LoadingButton } from '@mui/lab';

interface TableHeaderProps {
  value: string;
  toggle: () => void;
  handleFilter: (val: string) => void;
}

const TableHeader = (props: TableHeaderProps) => {
  // ** Props
  const { handleFilter, toggle, value } = props;

  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [fullWidth, setFullWidth] = useState(true);
  const [maxWidth, setMaxWidth] = useState<DialogProps['maxWidth']>('sm');
  const [show, setShow] = useState<boolean>(false)
  const [languages, setLanguages] = useState<string[]>([])

  const handleChange = (event: SelectChangeEvent<typeof languages>) => {
    const {
      target: { value }
    } = event
    setLanguages(typeof value === 'string' ? value.split(',') : value)
  }

  const [input, setInput] = useState('')
  const dispatch = useDispatch<AppDispatch>();
  const handleSubmit = (name: any) => {
    setIsLoading(true);
    // const data = {name:name}
    dispatch(addsegment(name));
    setIsLoading(false);
    setShow(false)
};


  // const handleSubmit = ({
  //   apiData,
  // }) => {

    

  // }

  const Transition = forwardRef(function Transition(
    props: FadeProps & { children?: ReactElement<any, any> },
    ref: Ref<unknown>
  ) {
    return <Fade ref={ref} {...props} />
  })

  return (
    <Box
      sx={{
        p: 6,
        gap: 4,
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      
      <span style={{fontSize: '1.25rem', fontWeight: 500, color : "#000000" }}>Segments List</span>
      
      <Box
        sx={{ gap: 4, display: 'flex', flexWrap: 'wrap', alignItems: 'center' }}
      >

        <TextField
          size="small"
          value={value}
          placeholder="Search Segments"
          onChange={(e) => handleFilter(e.target.value)}
        />

        <Button sx={{ backgroundColor : "primary.main" }} variant="contained" onClick={() => setShow(true)}>
          Add Segments
        </Button>
      </Box>

      <Dialog
        
        open={show}
        fullWidth={fullWidth}
        maxWidth={maxWidth}
        scroll='body'
        onClose={() => setShow(false)}
        
        onBackdropClick={() => setShow(false)}
      >
        <DialogContent  sx={{ pb: 8, px: { xs: 8, sm: 15 }, pt: { xs: 8, sm: 12.5 }, position: 'relative' }}>
          <IconButton
            size='small'
            onClick={() => setShow(false)}
            sx={{ position: 'absolute', right: '1rem', top: '1rem' }}
          >
            <Icon icon='bx:x' />
          </IconButton>
          <Box sx={{ mb: 8, textAlign: 'center' }}>
            <Typography variant='h6' sx={{ mb: 3 }}>
              Add new segment
            </Typography>

            {/* <Typography variant='body2'>Updating user details will receive a privacy audit.</Typography> */}
          </Box>
          <Grid container spacing={6}>
            <Grid item sm={12} xs={12}>
              <TextField size="small" fullWidth label='Segment Name' placeholder='Segment Name'
              onChange={event => setInput(event.target.value)} />
            </Grid>
            
          </Grid>
        </DialogContent>
        <DialogActions sx={{ pb: { xs: 8, sm: 12.5 }, justifyContent: 'center' }}>
          <LoadingButton loading={isLoading} variant='contained' sx={{ mr: 1 }} onClick={() => handleSubmit(input)}>
            Submit
          </LoadingButton>
          <Button variant='outlined' color='secondary' onClick={() => setShow(false)}>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TableHeader;
