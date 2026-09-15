// ** React Imports
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/router';

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
  fetchTemplateConfig,
  fetchTemplateDetail,
  fetchTemplates,
  updateTemplateInstanceConfig,
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
  const [templateUrl, setTemplateUrl] = useState('');
  const [buttonText, setButtonText] = useState('Open');
  const [buttonIcon, setButtonIcon] = useState('');
  const [bodyText, setBodyText] = useState('');
  const [timeoutMinutes, setTimeoutMinutes] = useState<number>(30);
  const [sessionExpiryMinutes, setSessionExpiryMinutes] = useState<number>(30);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true);
  const [mappings, setMappings] = useState<VariableMapping[]>([]);
  const [saving, setSaving] = useState(false);

  // Config overrides scoped to THIS bot. Editing them here (rather than on the
  // Templates page) keeps the shared catalog defaults untouched for every other
  // bot using the same template.
  const router = useRouter();
  const botId = (router.query.botId as string) || '';
  const [configSchema, setConfigSchema] = useState<any[]>([]);
  const [configValues, setConfigValues] = useState<Record<string, any>>({});

  // Load selectable templates + this node's saved config on open.
  // Drafts are included on purpose: a template only needs a hosted build to be
  // launchable, and during local testing builds are uploaded but not published.
  // Archived ones are excluded since they are intentionally retired.
  useEffect(() => {
    if (open) {
      dispatch(fetchTemplates({ limit: 100 }));
      if (nodeId) dispatch(getNodeDetails(nodeId));
    }
  }, [open, nodeId, dispatch]);

  // Prefill from saved node payload
  useEffect(() => {
    const p = nodeDetails?.payload;
    if (nodeDetails?.id === nodeId && p) {
      setTemplateId(p.templateId || '');
      setTemplateUrl(p.templateUrl || '');
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

  // Resolved config for this bot (defaults + catalog + this bot's overrides).
  useEffect(() => {
    if (!open || !templateId) {
      setConfigSchema([]);
      setConfigValues({});

      return;
    }
    let cancelled = false;
    dispatch(fetchTemplateConfig({ id: templateId, botId }))
      .unwrap()
      .then((res: any) => {
        // The dialog may have been closed or the template switched while this
        // was in flight — applying a stale response would show the wrong values.
        if (cancelled) return;
        setConfigSchema(Array.isArray(res?.configSchema) ? res.configSchema : []);
        setConfigValues(res?.configValues || {});
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [open, templateId, botId, dispatch]);

  const configKeys: string[] =
    templateDetail?.id === templateId && Array.isArray(templateDetail?.configSchema)
      ? templateDetail.configSchema.map((f: any) => f.key)
      : [];

  // A template can only be launched once it has a hosted build. Surfacing this
  // in the picker avoids a node that silently dead-ends at runtime.
  const selectableTemplates = (templates || []).filter(
    (t: any) => t?.status !== 'archived',
  );
  const selectedTemplate = selectableTemplates.find((t: any) => t.id === templateId);

  // The URL the visitor will actually be sent to. A URL typed on the node wins
  // over the template's own hosted URL, so a flow can target a specific S3/CDN
  // deployment without touching the shared catalog entry.
  const effectiveUrl = templateUrl.trim() || selectedTemplate?.hostedUrl || '';
  const missingBuild = Boolean(templateId) && Boolean(selectedTemplate) && !effectiveUrl;

  // Only the scalar field types are editable inline here. Richer types
  // (richtext/image/list/...) still belong on the Templates page, which has the
  // room for them; showing a broken input for those would be worse than hiding.
  const SIMPLE_TYPES = ['text', 'number', 'boolean', 'color', 'select', 'url'];
  const editableFields = configSchema.filter((f: any) =>
    SIMPLE_TYPES.includes(f?.type),
  );

  const setConfigValue = (key: string, value: any) =>
    setConfigValues((prev) => ({ ...prev, [key]: value }));

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
          templateUrl: templateUrl.trim(),
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

    // Persist the per-bot overrides alongside the node. Failure here must not
    // discard the node changes already saved above, so it is awaited but its
    // rejection is contained (the thunk already toasts the reason).
    if (templateId && botId && editableFields.length > 0) {
      await dispatch(
        updateTemplateInstanceConfig({ id: templateId, botId, configValues }),
      )
        .unwrap()
        .catch(() => undefined);
    }

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
            {selectableTemplates.length === 0 && (
              <MenuItem disabled value="">
                No templates available
              </MenuItem>
            )}
            {selectableTemplates.map((t: any) => (
              <MenuItem key={t.id} value={t.id}>
                {t.name}
                {t.status && t.status !== 'published' ? ` (${t.status})` : ''}
                {!t.hostedUrl ? ' — no build' : ''}
              </MenuItem>
            ))}
          </Select>
          {missingBuild && (
            <Typography variant="caption" color="error" sx={{ mt: 1 }}>
              This template has no hosted build yet. Upload a ZIP on the Templates page first,
              or paste the hosted URL below.
            </Typography>
          )}
        </FormControl>

        {/* Hosted URL used by the launch button */}
        <TextField
          fullWidth
          size="small"
          sx={{ mb: 1 }}
          label="Template URL"
          placeholder={selectedTemplate?.hostedUrl || 'https://cdn.example.com/my-template/index.html'}
          value={templateUrl}
          onChange={(e) => setTemplateUrl(e.target.value)}
        />
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 4 }}>
          {effectiveUrl
            ? `Launch URL: ${effectiveUrl}`
            : 'Leave empty to use the URL stored on the template.'}
        </Typography>

        {/* Per-bot config overrides */}
        {editableFields.length > 0 && (
          <Box sx={{ mb: 4 }}>
            <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
              Customise for this bot
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Overrides apply only to this bot. Other bots keep the template defaults.
            </Typography>
            <Stack spacing={3} sx={{ mt: 3 }}>
              {editableFields.map((f: any) => {
                const value = configValues[f.key] ?? f.defaultValue ?? '';
                if (f.type === 'boolean') {
                  return (
                    <FormControlLabel
                      key={f.key}
                      label={f.label || f.key}
                      control={
                        <Switch
                          checked={Boolean(configValues[f.key] ?? f.defaultValue)}
                          onChange={(e) => setConfigValue(f.key, e.target.checked)}
                        />
                      }
                    />
                  );
                }
                if (f.type === 'select') {
                  return (
                    <FormControl key={f.key} fullWidth size="small">
                      <InputLabel id={`cfg-${f.key}`}>{f.label || f.key}</InputLabel>
                      <Select
                        labelId={`cfg-${f.key}`}
                        label={f.label || f.key}
                        value={value}
                        onChange={(e) => setConfigValue(f.key, e.target.value)}
                      >
                        {(f.options || []).map((opt: any) => {
                          const val = typeof opt === 'string' ? opt : opt.value;
                          const lbl = typeof opt === 'string' ? opt : opt.label || opt.value;

                          return (
                            <MenuItem key={val} value={val}>
                              {lbl}
                            </MenuItem>
                          );
                        })}
                      </Select>
                    </FormControl>
                  );
                }

                return (
                  <TextField
                    key={f.key}
                    fullWidth
                    size="small"
                    label={f.label || f.key}
                    helperText={f.helpText}
                    type={
                      f.type === 'number'
                        ? 'number'
                        : f.type === 'color'
                          ? 'color'
                          : 'text'
                    }
                    value={value}
                    onChange={(e) =>
                      setConfigValue(
                        f.key,
                        f.type === 'number'
                          ? e.target.value === ''
                            ? ''
                            : Number(e.target.value)
                          : e.target.value,
                      )
                    }
                  />
                );
              })}
            </Stack>
          </Box>
        )}

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
