// ** React Imports
import { useEffect, useState } from 'react';

// ** MUI Imports
import Box, { BoxProps } from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
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

// ** Third Party Imports
import { Controller, useForm } from 'react-hook-form';

// ** Icon Imports
import Icon from 'src/@core/components/icon';

// ** Store Imports
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from 'src/store';
import { uploadTemplate } from 'src/store/apps/template';

// ** Components
import TemplateDropzone from './TemplateDropzone';

// ** Utils
import { humanize } from './utils';

const MAX_ZIP_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_THUMB_SIZE = 5 * 1024 * 1024; // 5MB

interface Props {
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

interface FormValues {
  name: string;
  description: string;
  estimatedDuration: string;
}

const defaultValues: FormValues = {
  name: '',
  description: '',
  estimatedDuration: '',
};

const AddTemplateDrawer = ({ open, toggle }: Props) => {
  const dispatch = useDispatch<AppDispatch>();
  const { industries, categories } = useSelector(
    (state: RootState) => state.template.templateParams,
  );

  const [industry, setIndustry] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState<string>('');
  const [zipFile, setZipFile] = useState<File | null>(null);
  const [thumbFile, setThumbFile] = useState<File | null>(null);
  const [zipError, setZipError] = useState<string>('');
  const [thumbError, setThumbError] = useState<string>('');
  const [industryError, setIndustryError] = useState<boolean>(false);
  const [categoryError, setCategoryError] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const {
    reset,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ defaultValues, mode: 'onChange' });

  const resetAll = () => {
    reset(defaultValues);
    setIndustry('');
    setCategory('');
    setTags([]);
    setTagInput('');
    setZipFile(null);
    setThumbFile(null);
    setZipError('');
    setThumbError('');
    setIndustryError(false);
    setCategoryError(false);
  };

  const handleClose = () => {
    resetAll();
    toggle();
  };

  useEffect(() => {
    if (!open) resetAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleZipSelect = (file: File) => {
    setZipError('');
    const isZip =
      file.name.toLowerCase().endsWith('.zip') ||
      file.type === 'application/zip' ||
      file.type === 'application/x-zip-compressed';
    if (!isZip) {
      setZipError('Only .zip files are accepted');
      return;
    }
    if (file.size > MAX_ZIP_SIZE) {
      setZipError('ZIP exceeds the 50MB limit');
      return;
    }
    setZipFile(file);
  };

  const handleThumbSelect = (file: File) => {
    setThumbError('');
    if (!file.type.startsWith('image/')) {
      setThumbError('Thumbnail must be an image');
      return;
    }
    if (file.size > MAX_THUMB_SIZE) {
      setThumbError('Thumbnail exceeds the 5MB limit');
      return;
    }
    setThumbFile(file);
  };

  const addTag = () => {
    const val = tagInput.trim();
    if (val && !tags.includes(val) && tags.length < 20) {
      setTags([...tags, val]);
    }
    setTagInput('');
  };

  const removeTag = (tag: string) => setTags(tags.filter((t) => t !== tag));

  const onSubmit = async (data: FormValues) => {
    // manual validation for non-RHF fields
    let hasError = false;
    if (!industry) {
      setIndustryError(true);
      hasError = true;
    }
    if (!category) {
      setCategoryError(true);
      hasError = true;
    }
    if (!zipFile) {
      setZipError('Template ZIP is required');
      hasError = true;
    }
    if (hasError) return;

    const formData = new FormData();
    formData.append('name', data.name);
    formData.append('description', data.description || '');
    formData.append('industry', industry);
    formData.append('category', category);
    formData.append('tags', JSON.stringify(tags));
    if (data.estimatedDuration) {
      formData.append('estimatedDuration', data.estimatedDuration);
    }

    if (zipFile) formData.append('template', zipFile);
    if (thumbFile) formData.append('thumbnail', thumbFile);

    try {
      setSubmitting(true);
      await dispatch(uploadTemplate(formData)).unwrap();
      handleClose();
    } catch {
      // toast handled in thunk
    } finally {
      setSubmitting(false);
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
        <Typography variant="h6">Upload Template</Typography>
        <IconButton size="small" onClick={handleClose} sx={{ color: 'text.primary' }}>
          <Icon icon="bx:x" fontSize={20} />
        </IconButton>
      </Header>
      <Box sx={{ p: 5 }}>
        <Typography variant="body2" sx={{ mb: 4 }}>
          Upload a production build ZIP (must contain index.html at its root).
        </Typography>
        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Name */}
          <FormControl fullWidth size="small" sx={{ mb: 5 }}>
            <Controller
              name="name"
              control={control}
              rules={{
                required: 'Name is required',
                minLength: { value: 3, message: 'Minimum 3 characters' },
                maxLength: { value: 60, message: 'Maximum 60 characters' },
              }}
              render={({ field: { value, onChange } }) => (
                <TextField
                  value={value}
                  label="Template Name"
                  size="small"
                  onChange={onChange}
                  placeholder="e.g. Doctor Appointment Booking"
                  error={Boolean(errors.name)}
                  inputProps={{ maxLength: 60 }}
                />
              )}
            />
            {errors.name && (
              <FormHelperText sx={{ color: 'error.main' }}>
                {errors.name.message}
              </FormHelperText>
            )}
          </FormControl>

          {/* Description */}
          <FormControl fullWidth size="small" sx={{ mb: 5 }}>
            <Controller
              name="description"
              control={control}
              rules={{ maxLength: { value: 500, message: 'Maximum 500 characters' } }}
              render={({ field: { value, onChange } }) => (
                <TextField
                  value={value}
                  label="Description"
                  size="small"
                  multiline
                  rows={3}
                  onChange={onChange}
                  placeholder="Short description of the template"
                  error={Boolean(errors.description)}
                  inputProps={{ maxLength: 500 }}
                />
              )}
            />
            {errors.description && (
              <FormHelperText sx={{ color: 'error.main' }}>
                {errors.description.message}
              </FormHelperText>
            )}
          </FormControl>

          <Typography variant="caption" color="text.secondary" sx={{display: 'block', mb:5}}>
            Hosted URL is generated automatically after upload and versioning
          </Typography>

          {/* Industry */}
          <FormControl fullWidth size="small" sx={{ mb: 5 }} error={industryError}>
            <InputLabel id="industry-select">Industry</InputLabel>
            <Select
              value={industry}
              label="Industry"
              labelId="industry-select"
              onChange={(e: SelectChangeEvent) => {
                setIndustry(e.target.value);
                setIndustryError(false);
              }}
            >
              {industries?.map((item: string) => (
                <MenuItem key={item} value={item}>
                  {humanize(item)}
                </MenuItem>
              ))}
            </Select>
            {industryError && (
              <FormHelperText>Industry is required</FormHelperText>
            )}
          </FormControl>

          {/* Category */}
          <FormControl fullWidth size="small" sx={{ mb: 5 }} error={categoryError}>
            <InputLabel id="category-select">Category</InputLabel>
            <Select
              value={category}
              label="Category"
              labelId="category-select"
              onChange={(e: SelectChangeEvent) => {
                setCategory(e.target.value);
                setCategoryError(false);
              }}
            >
              {categories?.map((item: string) => (
                <MenuItem key={item} value={item}>
                  {humanize(item)}
                </MenuItem>
              ))}
            </Select>
            {categoryError && (
              <FormHelperText>Category is required</FormHelperText>
            )}
          </FormControl>

          {/* Tags */}
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

          {/* Estimated Duration */}
          <FormControl fullWidth size="small" sx={{ mb: 5 }}>
            <Controller
              name="estimatedDuration"
              control={control}
              render={({ field: { value, onChange } }) => (
                <TextField
                  value={value}
                  label="Estimated Duration"
                  size="small"
                  onChange={onChange}
                  placeholder="e.g. 2 minutes"
                />
              )}
            />
          </FormControl>

          {/* Thumbnail upload */}
          <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>
            Thumbnail (optional)
          </Typography>
          <Box sx={{ mb: 5 }}>
            <TemplateDropzone
              accept="image/*"
              icon="bx:image-add"
              label="Drag & drop a thumbnail image"
              hint="or click to browse (max 5MB)"
              file={thumbFile}
              error={thumbError}
              onFileSelect={handleThumbSelect}
              onClear={() => setThumbFile(null)}
            />
          </Box>

          {/* ZIP upload */}
          <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>
            Template Build (ZIP) *
          </Typography>
          <TemplateDropzone
            accept=".zip"
            icon="bx:archive"
            label="Drag & drop your template ZIP here"
            hint="or click to browse (max 50MB, index.html at root)"
            file={zipFile}
            error={zipError}
            onFileSelect={handleZipSelect}
            onClear={() => setZipFile(null)}
          />

          <Box sx={{ display: 'flex', alignItems: 'center', mt: 6 }}>
            <LoadingButton
              size="large"
              type="submit"
              variant="contained"
              loading={submitting}
              sx={{ mr: 3 }}
            >
              Upload
            </LoadingButton>
            <Button
              size="large"
              variant="outlined"
              color="secondary"
              onClick={handleClose}
            >
              Cancel
            </Button>
          </Box>
        </form>
      </Box>
    </Drawer>
  );
};

export default AddTemplateDrawer;
