// ** React Imports
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

// ** MUI Imports
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import Divider from '@mui/material/Divider';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import IconButton from '@mui/material/IconButton';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { LoadingButton } from '@mui/lab';

// ** Icon
import Icon from 'src/@core/components/icon';

// ** Store
import { AppDispatch, RootState } from 'src/store';
import {
  getNodeDetails,
  nodeUpdate,
} from 'src/store/apps/bot-flow';
import {
  fetchTemplateDetail,
  fetchTemplates,
} from 'src/store/apps/template';

// ** Common dialog title
import BotNodeDialogTitle from './common';

interface VariableMapping {
  templateKey: string;
  source: 'attribute' | 'static';
  value: string;
}

export default function OpenTemplate(props: any) {
  const { open, title, setTitle, fullScreen, handleClose, nodeId } = props;
  const dispatch = useDispatch<AppDispatch>();

  const templates = useSelector(
    (state: RootState) => state.template.templateListData.data,
  );
  const templateDetail = useSelector(
    (state: RootState) => state.template.selectedTemplateDetail,
  );
  const nodeDetails = useSelector(
    (state: RootState) => state.flow.nodeDetails,
  );

  const [templateId, setTemplateId] = useState('');
  const [buttonText, setButtonText] = useState('Open');
  const [buttonIcon, setButtonIcon] = useState('');
  const [bodyText, setBodyText] = useState('');
  const [timeoutMinutes, setTimeoutMinutes] = useState<number>(30);
  const [sessionExpiryMinutes, setSessionExpiryMinutes] = useState<number>(30);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true);
  const [mappings, setMappings] = useState<VariableMapping[]>([]);
  const [saving, setSaving] = useState(false);

  // Load published templates + this node's saved config on open
  useEffect(() => {
    if (open) {
      dispatch(fetchTemplates({ status: 'published', limit: 100 }));
      if (nodeId) dispatch(getNodeDetails(nodeId));
    }
  }, [open, nodeId, dispatch]);

  // Prefill from saved node payload
  useEffect(() => {
    const p = nodeDetails?.payload;
    if (nodeDetails?.id === nodeId && p) {
      setTemplateId(p.templateId || '');
      setButtonText(p.buttonText || 'Open');
      setButtonIcon(p.buttonIcon || '');
      setTimeoutMinutes(p.timeoutMinutes ?? 30);
      setSessionExpiryMinutes(p.sessionExpiryMinutes ?? 30);
      setAnalyticsEnabled(p.analyticsEnabled !== false);
      setMappings(p.variableMappings || []);
      const savedBody = nodeDetails?.responses?.[0]?.value;
      if (savedBody) setBodyText(savedBody);
    }
  }, [nodeDetails, nodeId]);

  // When a template is picked, load its config schema for the variable keys
  useEffect(() => {
    if (templateId) dispatch(fetchTemplateDetail(templateId));
  }, [templateId, dispatch]);

  const configKeys: string[] =
    templateDetail?.id === templateId && Array.isArray(templateDetail?.configSchema)
      ? templateDetail.configSchema.map((f: any) => f.key)
      : [];

  const addMapping = () =>
    setMappings([...mappings, { templateKey: '', source: 'attribute', value: '' }]);
  const removeMapping = (i: number) =>
    setMappings(mappings.filter((_, idx) => idx !== i));
  const updateMapping = (i: number, patch: Partial<VariableMapping>) =>
    setMappings(mappings.map((m, idx) => (idx === i ? { ...m, ...patch } : m)));

  const handleSave = async () => {
    setSaving(true);
    await dispatch(
      nodeUpdate({
        id: nodeId,
        title: title || nodeDetails?.title,
        payload: {
          templateId,
          buttonText,
          buttonIcon,
          timeoutMinutes: Number(timeoutMinutes),
          sessionExpiryMinutes: Number(sessionExpiryMinutes),
          analyticsEnabled,
          variableMappings: mappings.filter((m) => m.templateKey),
        },
        responses: bodyText ? [{ type: 'text', value: bodyText }] : [],
      }),
    );
    setSaving(false);
    handleClose();
  };

  return (
    <Dialog
      fullScreen={fullScreen}
      open={open}
      aria-labelledby="open-template-dialog"
      PaperProps={{ sx: { position: 'fixed', top: 10, right: 10, m: 0, width: 440 } }}
    >
      <BotNodeDialogTitle id="open-template-dialog" onClose={handleClose}>
        <Stack direction="row" alignItems="center" gap={1}>
          <Icon icon="material-symbols-light:web-sharp" fontSize={24} />
          <Stack direction="column" alignItems="flex-start">
            <Typography>OPEN TEMPLATE</Typography>
            <Typography variant="caption">
              Node Id: <strong>{nodeId}</strong>
            </Typography>
          </Stack>
        </Stack>
        <div style={{ padding: '16px 0 0 0' }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Type Block Title"
            value={title || ''}
            onChange={(e) => setTitle(e.target.value || '')}
          />
        </div>
      </BotNodeDialogTitle>
      <Divider style={{ margin: 0 }} />
      <DialogContent sx={{ p: 4, background: '#fff' }}>
        {/* Template picker */}
        <FormControl fullWidth size="small" sx={{ mb: 4 }}>
          <InputLabel id="tmpl-select">Template</InputLabel>
          <Select
            labelId="tmpl-select"
            label="Template"
            value={templateId}
            onChange={(e) => setTemplateId(e.target.value)}
          >
            {templates?.length === 0 && (
              <MenuItem disabled value="">
                No published templates
              </MenuItem>
            )}
            {templates?.map((t: any) => (
              <MenuItem key={t.id} value={t.id}>
                {t.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Message + button */}
        <TextField
          fullWidth
          size="small"
          label="Message shown with the button"
          multiline
          rows={2}
          sx={{ mb: 4 }}
          value={bodyText}
          onChange={(e) => setBodyText(e.target.value)}
          placeholder="e.g. Tap below to book your appointment"
        />
        <Stack direction="row" spacing={2} sx={{ mb: 4 }}>
          <TextField
            size="small"
            label="Button Text"
            value={buttonText}
            onChange={(e) => setButtonText(e.target.value)}
            sx={{ flex: 1 }}
          />
          <TextField
            size="small"
            label="Button Icon (iconify)"
            value={buttonIcon}
            onChange={(e) => setButtonIcon(e.target.value)}
            sx={{ flex: 1 }}
            placeholder="bx:calendar"
          />
        </Stack>

        {/* Dynamic variables */}
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            Dynamic Variables
          </Typography>
          <Button
            size="small"
            startIcon={<Icon icon="bx:plus" />}
            onClick={addMapping}
            disabled={!templateId}
          >
            Add
          </Button>
        </Box>
        {mappings.map((m, i) => (
          <Stack direction="row" spacing={1} sx={{ mb: 2 }} key={i} alignItems="center">
            <FormControl size="small" sx={{ flex: 1.2 }}>
              <Select
                displayEmpty
                value={m.templateKey}
                onChange={(e) => updateMapping(i, { templateKey: e.target.value })}
              >
                <MenuItem value="" disabled>
                  Template field
                </MenuItem>
                {configKeys.map((k) => (
                  <MenuItem key={k} value={k}>
                    {k}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ flex: 1 }}>
              <Select
                value={m.source}
                onChange={(e) =>
                  updateMapping(i, { source: e.target.value as 'attribute' | 'static' })
                }
              >
                <MenuItem value="attribute">Attribute</MenuItem>
                <MenuItem value="static">Static</MenuItem>
              </Select>
            </FormControl>
            <TextField
              size="small"
              sx={{ flex: 1.2 }}
              placeholder={m.source === 'attribute' ? 'attribute name' : 'value'}
              value={m.value}
              onChange={(e) => updateMapping(i, { value: e.target.value })}
            />
            <IconButton size="small" color="error" onClick={() => removeMapping(i)}>
              <Icon icon="bx:trash" fontSize={18} />
            </IconButton>
          </Stack>
        ))}

        <Divider sx={{ my: 3 }} />

        {/* Timing + analytics */}
        <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
          <TextField
            size="small"
            type="number"
            label="Timeout (min)"
            value={timeoutMinutes}
            onChange={(e) => setTimeoutMinutes(Number(e.target.value))}
            sx={{ flex: 1 }}
            helperText="Opened but not completed"
          />
          <TextField
            size="small"
            type="number"
            label="Link expiry (min)"
            value={sessionExpiryMinutes}
            onChange={(e) => setSessionExpiryMinutes(Number(e.target.value))}
            sx={{ flex: 1 }}
            helperText="Link valid duration"
          />
        </Stack>
        <FormControlLabel
          control={
            <Switch
              checked={analyticsEnabled}
              onChange={(e) => setAnalyticsEnabled(e.target.checked)}
            />
          }
          label="Analytics enabled"
        />

        <Box sx={{ mt: 4 }}>
          <LoadingButton
            fullWidth
            variant="contained"
            loading={saving}
            disabled={!templateId}
            onClick={handleSave}
          >
            Save
          </LoadingButton>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
