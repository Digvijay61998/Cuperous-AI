// ** React Imports
import { useCallback, useEffect, useRef, useState } from 'react';

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

import { OutlinedInput, Chip } from '@mui/material';
import { handleStartScraping } from 'src/store/apps/scraper';
import { toast } from 'react-hot-toast';
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

interface SideAddScrapeDrowerType {
  open: boolean;
  toggle: () => void;
  tagList: any;
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
  url: yup.string().required().url(),
  title: yup
    .string()
    .min(3, (obj) => showErrors('Title', obj.value.length, obj.min))
    .required(),
});

const defaultValues = {
  url: '',
};

const SideAddScraperDrower = (props: SideAddScrapeDrowerType) => {
  // ** Props
  const { open, toggle, tagList } = props;
  const urlRef = useRef<any>(null);
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
  const [tags, setTags] = useState<any[]>([]);

  const handleChange = (event: SelectChangeEvent<typeof tags>) => {
    const {
      target: { value },
    } = event;
    // setTag(value);
    setTags(
      // On autofill we get a stringified value.
      typeof value === 'string' ? value.split(',') : value,
    );
  };

  useEffect(() => {
    SetvideoCategoriesList(videoCategoryStore?.data);
  }, [videoCategoryStore]);






  const [url, setUrl] = useState<string>('');

  const pattern = new RegExp(
    '^(https?:\\/\\/)?' + // protocol
      '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name
      '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
      '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
      '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
      '(\\#[-a-z\\d_]*)?$', // fragment locator
    'i'
  );
  const handleSubmit = (e: any) => {
    e.preventDefault();

    // check is url is valid

    if (url && tags.length > 0) {
      if (pattern.test(url)) {
        dispatch(handleStartScraping({ url }));
      }else{
        toast('Please Provide Valid Url', { icon: '👍' });
      }
    } else {
      toast('Please Provide Url or tags', { icon: '👍' });
    }
  };
  const handleClose = () => {
    toggle();
    setUrl('');
    setTags([]);
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
        <Typography variant="h6">Add website Url</Typography>
        <IconButton
          size="small"
          onClick={handleClose}
          sx={{ color: 'text.primary' }}
        >
          <Icon icon="bx:x" fontSize={20} />
        </IconButton>
      </Header>
      <Box sx={{ p: 5 }}>
        <form onSubmit={handleSubmit}>
          <Typography variant="body2">
            You can Provide The website Url using that we will collect some data
            provide Title, links and Articals using NLP.
          </Typography>
          <TextField
            fullWidth
            label="Website Url"
            variant="outlined"
            onChange={(e: any) => setUrl(e.target.value)}
            required
            value={url}
            sx={{ mb: 3 }}
          />
          <FormControl fullWidth sx={{ mb: 6 }}>
            <InputLabel id="select-multiple-chip-label">Tags</InputLabel>
            <Select
              labelId="select-multiple-chip-label"
              id="select-multiple-tag"
              multiple
              required
              value={tags}
              onChange={handleChange}
              input={<OutlinedInput id="select-multiple-chip" label="Tags" />}
              inputProps={{ placeholder: 'Select Tags' }}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((value: any) => {
                    let obj = tagList.find((x: any) => x._id === value);
                    return (
                      <Chip key={value} label={obj?.name} color="primary" />
                    );
                  })}
                </Box>
              )}
              MenuProps={MenuProps}
            >
              {tagList?.map((tagItem: any, index: number) => (
                <MenuItem key={index} value={tagItem._id}>
                  {tagItem?.name}
                </MenuItem>
              ))}
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

export default SideAddScraperDrower;
