// ** React Imports
import { useEffect, useState } from 'react';

// ** MUI Imports
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

// ** Icon Imports
import Icon from 'src/@core/components/icon';

// ** Store & Actions
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from 'src/store';
import { applyFieldValues, fetchFieldValues } from 'src/store/apps/crm';

// ** Components
import FieldManager from 'src/views/crm/FieldManager';

interface Props {
  entity: 'CONTACT' | 'COMPANY' | 'DEAL';
  recordId: string;
}

const CustomFieldsPanel = ({ entity, recordId }: Props) => {
  const dispatch = useDispatch<AppDispatch>();
  const { data, loading } = useSelector((state: RootState) => state.crm.fieldValues);

  const [values, setValues] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState<boolean>(false);
  const [manageOpen, setManageOpen] = useState<boolean>(false);

  useEffect(() => {
    if (recordId) dispatch(fetchFieldValues({ entity, recordId }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entity, recordId]);

  const closeManage = () => {
    setManageOpen(false);
    if (recordId) dispatch(fetchFieldValues({ entity, recordId }));
  };

  useEffect(() => {
    const initial: Record<string, any> = {};
    (data || []).forEach((def: any) => {
      initial[def.id] = def.value ?? '';
    });
    setValues(initial);
  }, [data]);

  const setValue = (id: string, v: any) => setValues((prev) => ({ ...prev, [id]: v }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await dispatch(applyFieldValues({ entity, recordId, values })).unwrap();
      dispatch(fetchFieldValues({ entity, recordId }));
    } catch {
      // toast in thunk
    } finally {
      setSaving(false);
    }
  };

  const renderInput = (def: any) => {
    const value = values[def.id] ?? '';
    switch (def.type) {
      case 'LONG_TEXT':
        return (
          <TextField
            fullWidth
            size="small"
            label={def.label}
            multiline
            rows={2}
            value={value}
            onChange={(e) => setValue(def.id, e.target.value)}
          />
        );
      case 'NUMBER':
        return (
          <TextField
            fullWidth
            size="small"
            type="number"
            label={def.label}
            value={value}
            onChange={(e) => setValue(def.id, e.target.value)}
          />
        );
      case 'DATE':
        return (
          <TextField
            fullWidth
            size="small"
            type="date"
            label={def.label}
            value={value ? String(value).slice(0, 10) : ''}
            onChange={(e) => setValue(def.id, e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        );
      case 'CHECKBOX':
        return (
          <FormControlLabel
            control={
              <Switch
                checked={Boolean(value)}
                onChange={(e) => setValue(def.id, e.target.checked)}
              />
            }
            label={def.label}
          />
        );
      case 'SELECT':
        return (
          <FormControl fullWidth size="small">
            <InputLabel id={`f-${def.id}`}>{def.label}</InputLabel>
            <Select
              labelId={`f-${def.id}`}
              label={def.label}
              value={value || ''}
              onChange={(e) => setValue(def.id, e.target.value)}
            >
              <MenuItem value="">
                <em>None</em>
              </MenuItem>
              {(def.options || []).map((opt: any) => (
                <MenuItem key={opt.id} value={opt.id}>
                  {opt.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        );
      default:
        return (
          <TextField
            fullWidth
            size="small"
            label={def.label}
            value={value}
            onChange={(e) => setValue(def.id, e.target.value)}
          />
        );
    }
  };

  let content: JSX.Element;
  if (loading) {
    content = (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress size={28} />
      </Box>
    );
  } else if (!data || data.length === 0) {
    content = (
      <Box sx={{ textAlign: 'center', py: 6 }}>
        <Icon icon="bx:slider-alt" fontSize={48} />
        <Typography variant="body2" color="text.disabled" sx={{ mt: 2 }}>
          No custom fields defined for {entity.toLowerCase()}s yet.
        </Typography>
      </Box>
    );
  } else {
    content = (
      <>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4, mb: 5 }}>
          {data.map((def: any) => (
            <Box key={def.id}>{renderInput(def)}</Box>
          ))}
        </Box>
        <Button
          variant="contained"
          size="small"
          onClick={handleSave}
          disabled={saving}
          startIcon={<Icon icon="bx:save" />}
        >
          Save Fields
        </Button>
      </>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
        <Button
          size="small"
          variant="outlined"
          color="secondary"
          onClick={() => setManageOpen(true)}
          startIcon={<Icon icon="bx:cog" />}
        >
          Manage Fields
        </Button>
      </Box>
      {content}
      <FieldManager open={manageOpen} toggle={closeManage} entity={entity} />
    </Box>
  );
};

export default CustomFieldsPanel;
