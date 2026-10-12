// ** React Imports
import { useEffect, useState } from 'react';

// ** MUI Imports
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

// ** Icon Imports
import Icon from 'src/@core/components/icon';

// ** Store & Actions
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from 'src/store';
import {
  createSavedView,
  deleteSavedView,
  fetchSavedViews,
} from 'src/store/apps/crm';

interface Props {
  entity: 'CONTACT' | 'COMPANY' | 'DEAL' | 'SERVICE_REQUEST';
  currentFilters: Record<string, any>;
  onApply: (filters: Record<string, any>) => void;
}

const SavedViewsBar = ({ entity, currentFilters, onApply }: Props) => {
  const dispatch = useDispatch<AppDispatch>();
  const views = useSelector((state: RootState) => state.crm.savedViews.data);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [shared, setShared] = useState(false);

  useEffect(() => {
    dispatch(fetchSavedViews(entity));
  }, [dispatch, entity]);

  const handleSave = async () => {
    const n = name.trim();
    if (!n) return;
    await dispatch(createSavedView({ entity, name: n.slice(0, 120), filters: currentFilters, shared }));
    setOpen(false);
    setName('');
    setShared(false);
  };

  const handleDelete = (id: string) => {
    dispatch(deleteSavedView({ id, entity }));
  };

  return (
    <Box
      sx={{
        px: 6,
        py: 3,
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        flexWrap: 'wrap',
      }}
    >
      <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>
        Saved views:
      </Typography>
      {(views || []).length === 0 && (
        <Typography variant="caption" color="text.disabled">
          none yet
        </Typography>
      )}
      {(views || []).map((view: any) => (
        <Tooltip key={view.id} title={view.shared ? 'Shared with your organization' : 'Only you'} arrow>
          <Chip
            size="small"
            label={view.name}
            icon={view.shared ? <Icon icon="bx:group" fontSize={14} /> : undefined}
            onClick={() => onApply(view.filters || {})}
            onDelete={view.isOwner ? () => handleDelete(view.id) : undefined}
            variant="outlined"
          />
        </Tooltip>
      ))}
      <Button
        size="small"
        variant="text"
        onClick={() => setOpen(true)}
        startIcon={<Icon icon="bx:bookmark" />}
      >
        Save current
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Save this view</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            size="small"
            label="Name"
            value={name}
            inputProps={{ maxLength: 120 }}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void handleSave();
            }}
            sx={{ mt: 2 }}
          />
          <FormControlLabel
            sx={{ mt: 2 }}
            control={<Switch checked={shared} onChange={(e) => setShared(e.target.checked)} />}
            label="Share with my organization"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" disabled={!name.trim()} onClick={() => void handleSave()}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SavedViewsBar;
