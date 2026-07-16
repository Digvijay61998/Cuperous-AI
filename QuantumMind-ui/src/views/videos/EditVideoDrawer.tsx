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

// ** Icon Imports
import Icon from 'src/@core/components/icon';

// ** Store Imports
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from 'src/store';

// ** Actions Imports
import { fetchVideoDetail, updateVideo } from 'src/store/apps/video';

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

interface SideEditVideoDrawerType {
  videoId: string;
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

const defaultValues = {
  title: '',
  subtitle:'',
  url: '',
  description: '',
};

const SideEditVideoDrawer = (props: SideEditVideoDrawerType) => {
  // ** Props
  const { videoId, open, toggle } = props;

  // ** Hooks
  const dispatch = useDispatch<AppDispatch>();

  const [title, setTitle] = useState<string>('');
  const [subTitle, setSubTitle] = useState<string>('');
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [videoCategoriesList, setVideoCategoriesList] = useState<any>([]);

  const { videoCategory, selectedVideoDetail } = useSelector((state: RootState) => state.video);

  const handleCategoryChange = useCallback((e: SelectChangeEvent) => {
    setCategory(e.target.value);
  }, []);
  
  useEffect(() => {
    dispatch(fetchVideoDetail(videoId));
  }, [videoId]);

  useEffect(() => {
    setVideoCategoriesList(videoCategory?.data);
  }, [videoCategory]);

  useEffect(() => {
    if (Object.keys(selectedVideoDetail).length) {
      setTitle(selectedVideoDetail?.title || '');
      setSubTitle(selectedVideoDetail?.subtitle || '');
      setVideoUrl(selectedVideoDetail?.url || '');
      setDescription(selectedVideoDetail?.description || '');
      setCategory(selectedVideoDetail?.category || '');
    }
  }, [selectedVideoDetail]);
  
  const handleClose = () => {
    setTitle('');
    setSubTitle('');
    setVideoUrl('');
    setDescription('');
    setCategory('');
    toggle();
  };

  const handleSubmit = (event: any) => {
    event.preventDefault();
    dispatch(updateVideo({ 
      id: videoId,
      data: {
        title: title,
        subTitle: subTitle,
        videoUrl: videoUrl,
        description: description,
        category: category, 
      }
    }));
    handleClose();
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
        <Typography variant="h6">Edit Video</Typography>
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
          Video URL can be edited here for the tutorial guide.
        </Typography>
        <br />
        <form onSubmit={handleSubmit}>
          <FormControl fullWidth size="small" sx={{ mb: 6 }}>
            <TextField
              value={title}
              label="Title"
              size="small"
              onChange={(e) => setTitle(e.target.value)}
              placeholder="enter Title"
              inputProps={{ maxLength: 30 }}
            />
          </FormControl>
          <FormControl fullWidth size="small" sx={{ mb: 6 }}>
            <TextField
              value={subTitle}
              label="Subtitle"
              size="small"
              onChange={(e) => setSubTitle(e.target.value)}
              placeholder="enter subtitle"
              inputProps={{ maxLength: 40 }}
            />
          </FormControl>
          <FormControl fullWidth size="small" sx={{ mb: 6 }}>
            <TextField
              type="url"
              value={videoUrl}
              label="URL"
              size="small"
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="enter the valid url"
            />
          </FormControl>
          <FormControl fullWidth size="small" sx={{ mb: 6 }}>
            <TextField
              type="description"
              value={description}
              size="small"
              label="Description"
              onChange={(e) => setDescription(e.target.value)}
              placeholder="enter description"
              inputProps={{ maxLength: 100 }}
            />
          </FormControl>
          <FormControl fullWidth size="small" sx={{ mb: 6 }}>
            <InputLabel id="category-select">Category</InputLabel>
            <Select
              fullWidth
              value={category}
              size="small"
              id="select-category"
              label="Category"
              labelId="category-select"
              onChange={handleCategoryChange}
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

export default SideEditVideoDrawer;
