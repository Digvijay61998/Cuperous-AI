// ** React Imports
import { useCallback, useEffect, useState } from 'react';

// ** MUI Imports
import Drawer from '@mui/material/Drawer';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import { styled } from '@mui/material/styles';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import InputLabel from '@mui/material/InputLabel';
import Typography from '@mui/material/Typography';
import Box, { BoxProps } from '@mui/material/Box';
import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';

// ** Third Party Imports
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { useForm, Controller } from 'react-hook-form';

// ** Icon Imports
import Icon from 'src/@core/components/icon';

// ** Store Imports
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from 'src/store';

// ** Actions Imports
import { addNewVideo } from 'src/store/apps/video';

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 250,
    },
  },
};

interface SideAddVideoDrowerType {
  open: boolean;
  toggle: () => void;
}

interface AgentData {
  url: string;
  activeHours: string;
  title: string;
}

const showErrors = (field: string, valueLen: number, min: number) => {
  if (valueLen === 0) {
    return `${field} field is required`;
  } else if (valueLen > 0 && valueLen < min) {
    return `${field} must be at least ${min} characters`;
  } else {
    return '';
  }
};

const Header = styled(Box)<BoxProps>(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(3, 4),
  justifyContent: 'space-between',
  backgroundColor: theme.palette.background.default,
}));

const schema = yup.object().shape({
  url: yup.string().required(),
  title: yup
    .string()
    .min(3, (obj) => showErrors('Title', obj.value.length, obj.min))
    .required(),
});

const defaultValues = {
  title: '',
  subtitle:'',
  url: '',
  description: '',
};

const SideAddVideoDrower = (props: SideAddVideoDrowerType) => {
  // ** Props
  const { open, toggle } = props;

  // ** Hooks
  const dispatch = useDispatch<AppDispatch>();
  const [status, setStatus] = useState<string>('');
  const [videoCategoriesList, SetvideoCategoriesList] = useState<any>([]);

  const videoCategoryStore = useSelector(
    (state: RootState) => state.video.videoCategory,
  );
  const handleStatusChange = useCallback((e: SelectChangeEvent) => {
    setStatus(e.target.value);
  }, []);

  useEffect(() => {
    SetvideoCategoriesList(videoCategoryStore?.data);
  }, [videoCategoryStore]);

  const {
    reset,
    control,
    setValue,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues,
    mode: 'onChange',
    resolver: yupResolver(schema),
  });

  const onSubmit = (data: any) => {
    dispatch(addNewVideo({ ...data, category: status }));
    toggle();
    reset();
  };

  const handleClose = () => {
    toggle();
    reset();
  };

  return (
    <Drawer
      open={open}
      anchor="right"
      variant="temporary"
      onClose={handleClose}
      ModalProps={{ keepMounted: true }}
      sx={{ '& .MuiDrawer-paper': { width: { xs: 300, sm: 400 } } }}
    >
      <Header>
        <Typography variant="h6">Add Video</Typography>
        <IconButton
          size="small"
          onClick={handleClose}
          sx={{ color: 'text.primary' }}
        >
          <Icon icon="bx:x" fontSize={20} />
        </IconButton>
      </Header>
      <Box sx={{ p: 5 }}>
        <Typography variant="body2">
          Video URL can be added here for the tutorial guide.
        </Typography>
        <br />
        <form onSubmit={handleSubmit(onSubmit)}>
          <FormControl fullWidth size="small" sx={{ mb: 6 }}>
            <Controller
              name="title"
              control={control}
              rules={{ required: true }}
              render={({ field: { value, onChange } }) => (
                <TextField
                  value={value}
                  label="Title"
                  size="small"
                  onChange={onChange}
                  placeholder="enter Title"
                  error={Boolean(errors.title)}
                  inputProps={{ maxLength: 30 }}
                />
              )}
            />
            {errors.title && (
              <FormHelperText sx={{ color: 'error.main' }}>
                {errors.title.message}
              </FormHelperText>
            )}
          </FormControl>
          <FormControl fullWidth size="small" sx={{ mb: 6 }}>
            <Controller
              name="subtitle"
              control={control}
              rules={{ required: true }}
              render={({ field: { value, onChange } }) => (
                <TextField
                  value={value}
                  label="subtitle"
                  size="small"
                  onChange={onChange}
                  placeholder="enter subtitle"
                  error={Boolean(errors.subtitle)}
                  inputProps={{ maxLength: 40 }}
                />
              )}
            />
            {errors.subtitle && (
              <FormHelperText sx={{ color: 'error.main' }}>
                {errors.subtitle.message}
              </FormHelperText>
            )}
          </FormControl>
          <FormControl fullWidth size="small" sx={{ mb: 6 }}>
            <Controller
              name="url"
              control={control}
              rules={{ required: true }}
              render={({ field: { value, onChange } }) => (
                <TextField
                  type="url"
                  value={value}
                  label="url"
                  size="small"
                  onChange={onChange}
                  placeholder="enter the valid url"
                  error={Boolean(errors.url)}
                />
              )}
            />
            {errors.url && (
              <FormHelperText sx={{ color: 'error.main' }}>
                {errors.url.message}
              </FormHelperText>
            )}
          </FormControl>
          <FormControl fullWidth size="small" sx={{ mb: 6 }}>
            <Controller
              name="description"
              control={control}
              rules={{ required: true }}
              render={({ field: { value, onChange } }) => (
                <TextField
                  type="description"
                  value={value}
                  size="small"
                  label="Description"
                  onChange={onChange}
                  placeholder="enter description"
                  error={Boolean(errors.description)}
                  inputProps={{ maxLength: 100 }}
                />
              )}
            />
            {errors.description && (
              <FormHelperText sx={{ color: 'error.main' }}>
                {errors.description.message}
              </FormHelperText>
            )}
          </FormControl>
          <FormControl fullWidth size="small" sx={{ mb: 6 }}>
            <InputLabel id="category-select">Category</InputLabel>
            <Select
              fullWidth
              value={status}
              size="small"
              id="select-category"
              label="Category"
              labelId="category-select"
              onChange={handleStatusChange}
              inputProps={{ placeholder: 'Select Category' }}
              MenuProps={MenuProps}
            >
              {videoCategoriesList?.map((item: any) => {
                return <MenuItem value={item}>{item}</MenuItem>;
              })}
            </Select>
          </FormControl>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Button
              size="large"
              type="submit"
              variant="contained"
              sx={{ mr: 3 }}
            >
              Submit
            </Button>
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

export default SideAddVideoDrower;
