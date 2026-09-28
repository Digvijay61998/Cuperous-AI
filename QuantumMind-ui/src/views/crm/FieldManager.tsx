// ** React Imports
import { useEffect, useState } from 'react';

// ** MUI Imports
import Box, { BoxProps } from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Drawer from '@mui/material/Drawer';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import IconButton from '@mui/material/IconButton';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import { styled } from '@mui/material/styles';
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
  createFieldDefinition,
  deleteFieldDefinition,
  fetchFieldDefinitions,
} from 'src/store/apps/crm';

// ** Utils
import { humanize } from 'src/views/crm/utils';

interface Props {
  open: boolean;
  toggle: () => void;
  entity: 'CONTACT' | 'COMPANY' | 'DEAL';
}

const Header = styled(Box)<BoxProps>(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(3, 4),
  justifyContent: 'space-between',
  backgroundColor: theme.palette.background.default,
}));

const FIELD_TYPES = [
  'TEXT',
  'LONG_TEXT',
  'NUMBER',
  'DATE',
  'CHECKBOX',
  'SELECT',
  'URL',
  'EMAIL',
  'PHONE',
  'USER',
];

// snake_case key derived from a label.
const toKey = (label: string) =>
  label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/^([0-9])/, 'f_$1');

const FieldManager = ({ open, toggle, entity }: Props) => {
  const dispatch = useDispatch<AppDispatch>();
  const defs = useSelector((state: RootState) => state.crm.fieldDefinitions.data);

  const [label, setLabel] = useState<string>('');
  const [type, setType] = useState<string>('TEXT');
  const [showOnTable, setShowOnTable] = useState<boolean>(false);
  const [optionsText, setOptionsText] = useState<string>('');
  const [saving, setSaving] = useState<boolean>(false);

  useEffect(() => {
    if (open) dispatch(fetchFieldDefinitions(entity));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, entity]);

  const reset = () => {
    setLabel('');
    setType('TEXT');
    setShowOnTable(false);
    setOptionsText('');
  };

  const handleAdd = async () => {
    if (!label.trim()) return;
    const payload: Record<string, any> = {
      entity,
      key: toKey(label),
      label: label.trim(),
      type,
      showOnTable,
    };
    if (type === 'SELECT') {
      const options = optionsText
        .split(',')
        .map((o) => o.trim())
        .filter(Boolean)
        .map((l, i) => ({ label: l, position: i }));
      if (options.length === 0) return;
      payload.options = options;
    }
    setSaving(true);
    try {
      await dispatch(createFieldDefinition(payload)).unwrap();
      reset();
    } catch {
      // toast in thunk
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id: string) => {
    dispatch(deleteFieldDefinition({ id, entity }));
  };

  return (
    <Drawer
      open={open}
      anchor="right"
      variant="temporary"
      onClose={toggle}
      ModalProps={{ keepMounted: true }}
      sx={{ '& .MuiDrawer-paper': { width: { xs: 320, sm: 460 } } }}
    >
      <Header>
        <Typography variant="h6">Manage {humanize(entity)} Fields</Typography>
        <IconButton size="small" onClick={toggle} sx={{ color: 'text.primary' }}>
          <Icon icon="bx:x" fontSize={20} />
        </IconButton>
      </Header>

      <Box sx={{ p: 5 }}>
        {/* Existing fields */}
        <Typography variant="body2" sx={{ fontWeight: 600, mb: 2 }}>
          Existing fields
        </Typography>
        {defs.length === 0 ? (
          <Typography variant="body2" color="text.disabled" sx={{ mb: 4 }}>
            No custom fields yet.
          </Typography>
        ) : (
          <Box sx={{ mb: 4 }}>
            {defs.map((d: any) => (
              <Box
                key={d.id}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  py: 1.5,
                  borderBottom: (t) => `1px solid ${t.palette.divider}`,
                }}
              >
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {d.label}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                    <Chip size="small" label={humanize(d.type)} sx={{ fontSize: 10 }} />
                    {d.showOnTable && (
                      <Chip
                        size="small"
                        color="info"
                        label="Column"
                        sx={{ fontSize: 10 }}
                      />
                    )}
                  </Box>
                </Box>
                <Tooltip title="Archive field" arrow placement="top">
                  <IconButton size="small" color="error" onClick={() => handleDelete(d.id)}>
                    <Icon icon="bx:trash" fontSize={18} />
                  </IconButton>
                </Tooltip>
              </Box>
            ))}
          </Box>
        )}

        <Divider sx={{ my: 4 }} />

        {/* Add field */}
        <Typography variant="body2" sx={{ fontWeight: 600, mb: 3 }}>
          Add a field
        </Typography>
        <FormControl fullWidth sx={{ mb: 4 }}>
          <TextField
            size="small"
            label="Label"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            helperText={label ? `key: ${toKey(label)}` : ' '}
          />
        </FormControl>
        <FormControl fullWidth size="small" sx={{ mb: 4 }}>
          <InputLabel id="field-type">Type</InputLabel>
          <Select
            labelId="field-type"
            label="Type"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            {FIELD_TYPES.map((t) => (
              <MenuItem key={t} value={t}>
                {humanize(t)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        {type === 'SELECT' && (
          <FormControl fullWidth sx={{ mb: 4 }}>
            <TextField
              size="small"
              label="Options (comma separated)"
              value={optionsText}
              onChange={(e) => setOptionsText(e.target.value)}
              placeholder="Gold, Silver, Bronze"
            />
          </FormControl>
        )}
        <FormControlLabel
          control={
            <Switch checked={showOnTable} onChange={(e) => setShowOnTable(e.target.checked)} />
          }
          label="Show as a column in the list"
          sx={{ mb: 4, display: 'block' }}
        />
        <Button
          variant="contained"
          size="small"
          onClick={handleAdd}
          disabled={saving}
          startIcon={<Icon icon="bx:plus" />}
        >
          Add Field
        </Button>
      </Box>
    </Drawer>
  );
};

export default FieldManager;
