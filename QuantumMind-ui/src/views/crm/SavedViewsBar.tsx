// ** React Imports
import { useEffect } from 'react';

// ** MUI Imports
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
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
  entity: 'CONTACT' | 'COMPANY' | 'DEAL';
  currentFilters: Record<string, any>;
  onApply: (filters: Record<string, any>) => void;
}

const SavedViewsBar = ({ entity, currentFilters, onApply }: Props) => {
  const dispatch = useDispatch<AppDispatch>();
  const views = useSelector((state: RootState) => state.crm.savedViews.data);

  useEffect(() => {
    dispatch(fetchSavedViews(entity));
  }, [dispatch, entity]);

  const handleSave = () => {
    const name = window.prompt('Name this view');
    if (!name || !name.trim()) return;
    dispatch(
      createSavedView({ entity, name: name.trim(), filters: currentFilters, shared: false }),
    );
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
        <Chip
          key={view.id}
          size="small"
          label={view.name}
          onClick={() => onApply(view.filters || {})}
          onDelete={view.isOwner ? () => handleDelete(view.id) : undefined}
          variant="outlined"
        />
      ))}
      <Button
        size="small"
        variant="text"
        onClick={handleSave}
        startIcon={<Icon icon="bx:bookmark" />}
      >
        Save current
      </Button>
    </Box>
  );
};

export default SavedViewsBar;
