// ** React Imports
import { useEffect, useState } from 'react';

// ** MUI Imports
import Box, { BoxProps } from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Drawer from '@mui/material/Drawer';
import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';
import IconButton from '@mui/material/IconButton';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import { styled } from '@mui/material/styles';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { LoadingButton } from '@mui/lab';
import { toast } from 'react-hot-toast'

// ** Icon Imports
import Icon from 'src/@core/components/icon';

// ** Store Imports
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from 'src/store';
import {
  fetchTemplateDetail,
  updateTemplateConfig,
  updateTemplate,
  uploadTemplateVersion,
} from 'src/store/apps/template';

// ** Components
import TemplateDropzone from './TemplateDropzone';

// ** Utils
import { humanize } from './utils';

const MAX_ZIP_SIZE = 50 * 1024 * 1024;

type ConfigField = {
  key: string;
  type: string;
  label?: string;
  defaultValue?: any;
  group?: string;
  options?: string[];
};

/**
 * Normalise a stored/default config value into the shape the field control
 * expects. Booleans are coerced to real booleans (manifests may store 'true'
 * as a string) so untouched boolean fields don't fail validation; all other
 * field types are string-backed controls.
 */
const coerceConfigValue = (field: ConfigField, raw: any): any => {
  const type = field.type || 'text';
  if (type === 'boolean') {
    if (typeof raw === 'boolean') return raw;
    if (typeof raw === 'number') return raw !== 0;
    if (typeof raw === 'string') {
      return ['true', '1', 'yes', 'y', 'on'].includes(raw.trim().toLowerCase());
    }
    return false;
  }
  if (raw === undefined || raw === null) return '';
  return typeof raw === 'string' ? raw : String(raw);
};

interface Props {
  templateId: string;
  open: boolean;
  toggle: () => void;
}

const Header = styled(Box)<BoxProps>(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(3, 4),
  justifyContent: 'space-between',
  backgroundColor: theme.palette.background.default,
}));

const EditTemplateDrawer = ({ templateId, open, toggle }: Props) => {
  const dispatch = useDispatch<AppDispatch>();
  const { industries, categories } = useSelector(
    (state: RootState) => state.template.templateParams,
  );
  const detail = useSelector(
    (state: RootState) => state.template.selectedTemplateDetail,
  );

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [industry, setIndustry] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [estimatedDuration, setEstimatedDuration] = useState('');
  const [zipFile, setZipFile] = useState<File | null>(null);
  const [changelog, setChangelog] = useState('');
  const [zipError, setZipError] = useState('');
  const [saving, setSaving] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);
  const [uploadingVersion, setUploadingVersion] = useState(false);
  const [configDraft, setConfigDraft] = useState<Record<string, any>>({});
  const [configErrors, setConfigErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open && templateId) {
      dispatch(fetchTemplateDetail(templateId));
    }
  }, [open, templateId, dispatch]);

  useEffect(() => {
    if (detail && Object.keys(detail).length && detail.id === templateId) {
      setName(detail.name || '');
      setDescription(detail.description || '');
      setIndustry(detail.industry || '');
      setCategory(detail.category || '');
      setTags(detail.tags || []);
      setEstimatedDuration(detail.estimatedDuration || '');

      const schema = Array.isArray(detail.configSchema)
        ? (detail.configSchema as ConfigField[])
        : [];
      const merged: Record<string, any> = {};
      schema.forEach((field) => {
        merged[field.key] = coerceConfigValue(
          field,
          detail?.configValues?.[field.key] ?? field.defaultValue,
        );
      });
      setConfigDraft(merged);
      setConfigErrors({});
    }
  }, [detail, templateId]);

  const handleClose = () => {
    setZipFile(null);
    setChangelog('');
    setZipError('');
    setTagInput('');
    setConfigErrors({});
    toggle();
  };

  const configSchema = Array.isArray(detail?.configSchema)
    ? (detail.configSchema as ConfigField[])
    : [];

  const groupedConfigSchema = configSchema.reduce<Record<string, ConfigField[]>>((acc, field) => {
    const group = field.group || 'General';
    if (!acc[group]) acc[group] = [];
    acc[group].push(field);
    return acc;
  }, {});

  const handleConfigChange = (field: ConfigField, value: any) => {
    setConfigDraft((prev) => ({ ...prev, [field.key]: value }));
    setConfigErrors((prev) => ({ ...prev, [field.key]: '' }));
  };

  const validateConfigDraft = (): boolean => {
    const nextErrors: Record<string, string> = {};

    configSchema.forEach((field) => {
      const value = configDraft[field.key];
      const type = field.type || 'text';

      if ((type === 'text' || type === 'image' || type === 'select') && typeof value !== 'string') {
        nextErrors[field.key] = 'Expected a text value';
      }

      if (type === 'number') {
        const text = typeof value === 'string' ? value.trim() : value;
        if (
          text === '' ||
          text === null ||
          text === undefined ||
          !Number.isFinite(Number(text))
        ) {
          nextErrors[field.key] = 'Expected a valid number';
        }
      }

      if (type === 'boolean' && typeof value !== 'boolean') {
        nextErrors[field.key] = 'Expected true/false';
      }

      if (type === 'color') {
        const text = typeof value === 'string' ? value.trim() : '';
        if (!/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(text)) {
          nextErrors[field.key] = 'Expected #RGB or #RRGGBB';
        }
      }

      if (type === 'select' && Array.isArray(field.options) && field.options.length > 0) {
        if (!field.options.includes(String(value))) {
          nextErrors[field.key] = 'Select one of the allowed options';
        }
      }
    });

    setConfigErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSaveConfig = async () => {
    if (!validateConfigDraft()) return;

    try {
      setSavingConfig(true);
      await dispatch(
        updateTemplateConfig({
          id: templateId,
          data: { configValues: configDraft },
        }),
      ).unwrap();
    } catch {
      // handled in thunk
    } finally {
      setSavingConfig(false);
    }
  };

  const renderConfigField = (field: ConfigField) => {
    const type = field.type || 'text';
    const value = configDraft[field.key];
    const errorText = configErrors[field.key];

    if (type === 'boolean') {
      return (
        <FormControl fullWidth size="small" error={Boolean(errorText)} sx={{ mb: 3 }}>
          <InputLabel id={`cfg-${field.key}`}>{field.label || humanize(field.key)}</InputLabel>
          <Select
            value={String(Boolean(value))}
            label={field.label || humanize(field.key)}
            labelId={`cfg-${field.key}`}
            onChange={(e: SelectChangeEvent) =>
              handleConfigChange(field, e.target.value === 'true')
            }
          >
            <MenuItem value="true">True</MenuItem>
            <MenuItem value="false">False</MenuItem>
          </Select>
          {errorText && <FormHelperText>{errorText}</FormHelperText>}
        </FormControl>
      );
    }

    if (type === 'select') {
      const options = Array.isArray(field.options) ? field.options : [];
      return (
        <FormControl fullWidth size="small" error={Boolean(errorText)} sx={{ mb: 3 }}>
          <InputLabel id={`cfg-${field.key}`}>{field.label || humanize(field.key)}</InputLabel>
          <Select
            value={value ?? ''}
            label={field.label || humanize(field.key)}
            labelId={`cfg-${field.key}`}
            onChange={(e: SelectChangeEvent) => handleConfigChange(field, e.target.value)}
          >
            {options.map((opt) => (
              <MenuItem key={opt} value={opt}>
                {opt}
              </MenuItem>
            ))}
          </Select>
          {errorText && <FormHelperText>{errorText}</FormHelperText>}
        </FormControl>
      );
    }

    return (
      <FormControl fullWidth size="small" error={Boolean(errorText)} sx={{ mb: 3 }}>
        <TextField
          size="small"
          type={type === 'number' ? 'number' : 'text'}
          label={field.label || humanize(field.key)}
          value={value ?? ''}
          onChange={(e) => handleConfigChange(field, e.target.value)}
          placeholder={type === 'image' ? 'https://...' : undefined}
        />
        {errorText && <FormHelperText>{errorText}</FormHelperText>}
      </FormControl>
    );
  };

  const addTag = () => {
    const val = tagInput.trim();
    if (val && !tags.includes(val) && tags.length < 20) setTags([...tags, val]);
    setTagInput('');
  };
  const removeTag = (tag: string) => setTags(tags.filter((t) => t !== tag));

  const handleZipSelect = (file: File) => {
    setZipError('');
    if (!file.name.toLowerCase().endsWith('.zip')) {
      setZipError('Only .zip files are accepted');
      return;
    }
    if (file.size > MAX_ZIP_SIZE) {
      setZipError('ZIP exceeds the 50MB limit');
      return;
    }
    setZipFile(file);
  };

  const handleSaveMetadata = async () => {
    setSaving(true);
    await dispatch(
      updateTemplate({
        id: templateId,
        data: {
          name,
          description,
          industry,
          category,
          tags,
          estimatedDuration,
        },
      }),
    );
    setSaving(false);
    handleClose();
  };

  const handleCopyHostedUrl = async () => {
    const url = detail?.hostedUrl || '';
    if (!url) {
      toast.error('Hosted URL is not available yet');
      return;
  }

  try {
    await navigator.clipboard.writeText(url);
    toast.success('Hosted URL is not available yet');
   } catch {
    toast.error('Failed to copy hosted URL');
   }
  };

  const handleUploadVersion = async () => {
    if (!zipFile) {
      setZipError('Select a ZIP to upload a new version');
      return;
    }
    const formData = new FormData();
    formData.append('template', zipFile);
    formData.append('changelog', changelog);
    try {
      setUploadingVersion(true);
      await dispatch(
        uploadTemplateVersion({ id: templateId, data: formData }),
      ).unwrap();
      setZipFile(null);
      setChangelog('');
    } catch {
      // handled in thunk
    } finally {
      setUploadingVersion(false);
    }
  };

  return (
    <Drawer
      open={open}
      anchor="right"
      variant="temporary"
      onClose={handleClose}
      ModalProps={{ keepMounted: true }}
      sx={{ '& .MuiDrawer-paper': { width: { xs: 320, sm: 450 } } }}
    >
      <Header>
        <Typography variant="h6">Edit Template</Typography>
        <IconButton size="small" onClick={handleClose} sx={{ color: 'text.primary' }}>
          <Icon icon="bx:x" fontSize={20} />
        </IconButton>
      </Header>
      <Box sx={{ p: 5 }}>
        {/* Current version info */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            mb: 4,
            color: 'text.secondary',
          }}
        >
          <Icon icon="bx:git-branch" fontSize={18} />
          <Typography variant="body2">
            Current version: <strong>v{detail?.currentVersion || '1.0.0'}</strong>
          </Typography>
        </Box>

        <FormControl fullWidth size="small" sx={{ mb: 5 }}>
          <TextField
            value={name}
            label="Template Name"
            size="small"
            onChange={(e) => setName(e.target.value)}
            inputProps={{ maxLength: 60 }}
          />
        </FormControl>

        <FormControl fullWidth size="small" sx={{ mb: 5 }}>
          <TextField
            value={description}
            label="Description"
            size="small"
            multiline
            rows={3}
            onChange={(e) => setDescription(e.target.value)}
            inputProps={{ maxLength: 500 }}
          />
        </FormControl>

        <FormControl fullWidth size="small" sx={{ mb: 5 }}>
          <InputLabel id="edit-industry-select">Industry</InputLabel>
          <Select
            value={industry}
            label="Industry"
            labelId="edit-industry-select"
            onChange={(e: SelectChangeEvent) => setIndustry(e.target.value)}
          >
            {industries?.map((item: string) => (
              <MenuItem key={item} value={item}>
                {humanize(item)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth size="small" sx={{ mb: 5 }}>
          <InputLabel id="edit-category-select">Category</InputLabel>
          <Select
            value={category}
            label="Category"
            labelId="edit-category-select"
            onChange={(e: SelectChangeEvent) => setCategory(e.target.value)}
          >
            {categories?.map((item: string) => (
              <MenuItem key={item} value={item}>
                {humanize(item)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth size="small" sx={{ mb: 2 }}>
          <TextField
            size="small"
            label="Tags"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyPress={(e: any) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addTag();
              }
            }}
            placeholder="Type a tag and press Enter"
          />
        </FormControl>
        {tags.length > 0 && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 4 }}>
            {tags.map((tag) => (
              <Chip
                key={tag}
                label={tag}
                size="small"
                onDelete={() => removeTag(tag)}
                sx={{ fontSize: 11 }}
              />
            ))}
          </Box>
        )}

        <FormControl fullWidth size="small" sx={{ mb: 5 }}>
          <TextField
            value={estimatedDuration}
            label="Estimated Duration"
            size="small"
            onChange={(e) => setEstimatedDuration(e.target.value)}
            placeholder="e.g. 2 minutes"
          />
        </FormControl>

        <FormControl fullWidth size="small" sx={{ mb: 5 }}>
          <TextField
            value={detail?.hostedUrl || ''}
            label="Hosted Template URL"
            size="small"
            inputProps={{readOnly: true}}
            placeholder="Generated after upload"
          />
        <Box sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1}}>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
            Generated by backend on create/version upload.
          </Typography>
          <Button size="small" onClick={handleCopyHostedUrl} disabled={!detail?.hostedUrl}>
            Copy URL
          </Button>
        </Box>
        </FormControl>

        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
          <LoadingButton
            variant="contained"
            loading={saving}
            onClick={handleSaveMetadata}
            sx={{ mr: 3 }}
          >
            Save Changes
          </LoadingButton>
          <Button variant="outlined" color="secondary" onClick={handleClose}>
            Cancel
          </Button>
        </Box>

        <Divider sx={{ my: 4 }} />

        {configSchema.length > 0 && (
          <>
            <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>
              Dynamic Template Configuration
            </Typography>
            <Typography
              variant="caption"
              color="text.disabled"
              sx={{ display: 'block', mb: 2 }}
            >
              These values are served by the runtime config endpoint and used by the hosted template.
            </Typography>

            {Object.entries(groupedConfigSchema).map(([group, fields]) => (
              <Box key={group} sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 2 }}>
                  {group}
                </Typography>
                {fields.map((field) => (
                  <Box key={field.key}>{renderConfigField(field)}</Box>
                ))}
              </Box>
            ))}

            <LoadingButton
              variant="contained"
              color="success"
              loading={savingConfig}
              onClick={handleSaveConfig}
              sx={{ mb: 2 }}
            >
              Save Configuration
            </LoadingButton>

            <Divider sx={{ my: 4 }} />
          </>
        )}

        {/* New version upload */}
        <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>
          Upload New Version
        </Typography>
        <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mb: 2 }}>
          Uploading a build creates a new version and updates the hosted URL.
        </Typography>
        <TemplateDropzone
          accept=".zip"
          icon="bx:archive"
          label="Drag & drop the new build ZIP here"
          hint="or click to browse (max 50MB, index.html at root)"
          file={zipFile}
          error={zipError}
          onFileSelect={handleZipSelect}
          onClear={() => setZipFile(null)}
        />
        <FormControl fullWidth size="small" sx={{ my: 2 }}>
          <TextField
            size="small"
            label="Changelog"
            value={changelog}
            onChange={(e) => setChangelog(e.target.value)}
            placeholder="What changed in this version?"
          />
        </FormControl>
        <LoadingButton
          variant="contained"
          color="info"
          loading={uploadingVersion}
          onClick={handleUploadVersion}
          startIcon={<Icon icon="bx:upload" />}
        >
          Upload Version
        </LoadingButton>
      </Box>
    </Drawer>
  );
};

export default EditTemplateDrawer;
