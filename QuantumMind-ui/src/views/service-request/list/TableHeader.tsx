// ** MUI Imports
import { Ref, useState, forwardRef, ReactElement } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';

// ** Icon Imports
import Icon from 'src/@core/components/icon';

import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import Switch from '@mui/material/Switch';
import Dialog from '@mui/material/Dialog';

import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import CardContent from '@mui/material/CardContent';
import Fade, { FadeProps } from '@mui/material/Fade';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import FormControlLabel from '@mui/material/FormControlLabel';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from 'src/store';
import { CreateTicketData } from 'src/store/apps/service-request';
import { LoadingButton } from '@mui/lab';

interface TableHeaderProps {
  value: string;
  toggle: () => void;
  handleFilter: (val: string) => void;
}

const TableHeader = (props: TableHeaderProps) => {
  // ** Props
  const { handleFilter, toggle, value } = props;

  const [show, setShow] = useState<boolean>(false);
  const [languages, setLanguages] = useState<string[]>([]);

  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleChange = (event: SelectChangeEvent<typeof languages>) => {
    const {
      target: { value },
    } = event;
    setLanguages(typeof value === 'string' ? value.split(',') : value);
  };

  const [subject, setSubject] = useState<string>('');
  const [bot, setBot] = useState<any>(['6371cfc856f648d5e13a8d00']);
  const [agents, setAgents] = useState<any>([]);
  const [priority, setPriority] = useState<string>('');

  const [data, setData] = useState({
    bot: bot,
    subject: 'subject',
    agents: agents,
    priority: priority,
    //admin: '6368a94a4802d4e895e23afe',
  });

  const dispatch = useDispatch<AppDispatch>();
  const handleSubmit = (e: any) => {
    // const data = {name:name}

    // e.preventDefault();

    setIsLoading(true)
    dispatch(CreateTicketData(data));
    setIsLoading(false);
    setShow(false);
  };

  const Transition = forwardRef(function Transition(
    props: FadeProps & { children?: ReactElement<any, any> },
    ref: Ref<unknown>,
  ) {
    return <Fade ref={ref} {...props} />;
  });

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
      <span style={{ fontSize: '1.25rem', fontWeight: 500, color : "black" }}>Service Request List</span>

      <Box
        sx={{ gap: 4, display: 'flex', flexWrap: 'wrap', alignItems: 'center' }}
      >
        <TextField
          size="small"
          value={value}
          placeholder="Search subject"
          onChange={(e) => handleFilter(e.target.value)}
        />
        {/* <Button variant="contained" onClick={() => setShow(true)}>
          Add Tickets
        </Button> */}
      </Box>

      {/* <Dialog
        open={show}
        scroll="body"
        onClose={() => setShow(false)}
        onBackdropClick={() => setShow(false)}
      >
        <DialogContent
          sx={{
            pb: 8,
            px: { xs: 12, sm: 15 },
            pt: { xs: 8, sm: 12.5 },
            position: 'relative',
          }}
        >
          <IconButton
            size="small"
            onClick={() => setShow(false)}
            sx={{ position: 'absolute', right: '1rem', top: '1rem' }}
          >
            <Icon icon="bx:x" />
          </IconButton>
          <Box sx={{ mb: 8, textAlign: 'center' }}>
            <Typography variant="h5" sx={{ mb: 3 }}>
              Add Tickets
            </Typography>
          </Box>
          <Grid container spacing={6}>
            <Grid item sm={12} xs={12}>
              <TextField
                size="small"
                fullWidth
                label="Ticket Subject"
                placeholder="Ticket Subject"
                onChange={(e: any) => setSubject(e.target.value)}
              />
            </Grid>
          </Grid>
          <br />
          <Grid container spacing={6}>
            <Grid item sm={12} xs={12}>
              <TextField
                size="small"
                fullWidth
                label="Visitors Email"
                placeholder="Visitors Email"
              />
            </Grid>
          </Grid>
          <br />
          <Grid container spacing={6}>
            <Grid item sm={12} xs={12}>
              <TextField
                size="small"
                fullWidth
                select
                label="Create a ticket"
                defaultValue=""
                id="form-layouts-collapsible-select"
                placeholder="Create a ticket"
              >
                <MenuItem value="With in the same grou">
                  With in the same group
                </MenuItem>
                <MenuItem value="In another group">In another group</MenuItem>
              </TextField>
            </Grid>
          </Grid>

          <br />
          <Grid container spacing={6}>
            <Grid item sm={12} xs={12}>
              <TextField
                size="small"
                fullWidth
                select
                label="Priority"
                defaultValue=""
                id="form-layouts-collapsible-select"
                placeholder="Priority"
                onChange={(e: any) => setPriority(e.target.value)}
              >
                <MenuItem value="HIGH">HIGH</MenuItem>
                <MenuItem value="MEDIUM">MEDIUM</MenuItem>
                <MenuItem value="LOW">LOW</MenuItem>
              </TextField>
            </Grid>
          </Grid>

          <br />
          <Grid container spacing={6}>
            <Grid item sm={12} xs={12}>
              <TextField
                fullWidth
                multiline
                minRows={2}
                label="Message"
                placeholder="Message"
                onChange={(e: any) => setAgents(e.target.value)}
                sx={{ '& .MuiOutlinedInput-root': { alignItems: 'baseline' } }}
                InputProps={{}}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions
          sx={{ pb: { xs: 8, sm: 12.5 }, justifyContent: 'center' }}
        >
          <LoadingButton
            variant="contained"
            loading={isLoading}
            sx={{ mr: 1 }}
            onClick={() => handleSubmit(data)}
          >
            Submit
          </LoadingButton>
          <Button
            variant="outlined"
            color="secondary"
            onClick={() => setShow(false)}
          >
            Cancel
          </Button>
        </DialogActions>
      </Dialog> */}
    </Box>
  );
};

export default TableHeader;
