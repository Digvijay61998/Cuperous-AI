// ** React Imports
import { useEffect, useState } from 'react';

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
import { Chip, OutlinedInput } from '@mui/material';

// ** Third Party Imports
import * as yup from 'yup';

// ** Icon Imports
import Icon from 'src/@core/components/icon';

// ** Store Imports
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from 'src/store';

// ** Actions Imports
import FileUploaderSingle from './FileUploaderSingle';
import { addNewBulkQA } from 'src/store/apps/question-bank';
import toast from 'react-hot-toast';
import { LoadingButton } from '@mui/lab';
// import { gettag } from 'src/store/apps/tags'
import {
  downloadUnansweredQuestions,
  fetchLanguages,
} from 'src/store/apps/bots';

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

interface SidebarAddNewBulkQAType {
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

const SidebarAddNewBulkQA = (props: SidebarAddNewBulkQAType) => {
  // ** Props
  const { open, toggle } = props;

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [tag, setTag] = useState<any[]>([]);
  const [language, setLanguage] = useState<string>('');
  const [bulkQA, setBulkQA] = useState<any[]>([]);

  const handleChange = (event: SelectChangeEvent<typeof tag>) => {
    const {
      target: { value },
    } = event;
    // setTag(value);
    setTag(
      // On autofill we get a stringified value.
      typeof value === 'string' ? value.split(',') : value,
    );
  };
  const handleChangeLang = (event: SelectChangeEvent<typeof language>) => {
    const {
      target: { value },
    } = event;
    setLanguage(value);
    // setLanguage(
    //   // On autofill we get a stringified value.
    //   typeof value === 'string' ? value.split(',') : value,
    // );
  };
  // ** Hooks
  const dispatch = useDispatch<AppDispatch>();
  const tagList = useSelector((state: RootState) => state.tags.list);
  const langList: any = useSelector(
    (state: RootState) => state?.bots?.languages,
  );
  useEffect(() => {
    dispatch(fetchLanguages());
  }, []);

  const onSubmit = (event: any) => {
    event.preventDefault();
    let result = tag.map((a) => a?._id || a);
    if (bulkQA.length > 0) {
      dispatch(
        addNewBulkQA({
          tags: result,
          questionLanguage: language,
          questions: bulkQA,
        }),
      );
      setTag([]);
      setLanguage('');
      setBulkQA([]);
      toggle();
    } else {
      toast.error('Please upload file');
    }
  };

  const handleClose = () => {
    setTag([]);
    setLanguage('');
    setBulkQA([]);
    toggle();
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
        <Typography variant="h6">Add Bulk Q&A</Typography>
        <IconButton
          size="small"
          onClick={handleClose}
          sx={{ color: 'text.primary' }}
        >
          <Icon icon="bx:x" fontSize={20} />
        </IconButton>
      </Header>
      <form onSubmit={onSubmit}>
        <Box sx={{ p: 5 }}>
          <Typography variant="body2">
            You can upload bulk question and answer by csv file.
          </Typography>

          <Typography variant="body2">
            Get all unanswered questions
            <LoadingButton
              loading={isLoading}
              size="small"
              onClick={(e: any) => {
                e.preventDefault();
                setIsLoading(true);
                dispatch(downloadUnansweredQuestions());
                setIsLoading(false);
              }}
            >
              Download
            </LoadingButton>
          </Typography>
          <br />
          <FormControl required fullWidth sx={{ mb: 6 }} size="small">
            <InputLabel id="select-multiple-chip-label">Tags</InputLabel>

            <Select
              required
              labelId="select-multiple-chip-label"
              id="select-multiple-tag"
              multiple
              value={tag}
              size="small"
              onChange={handleChange}
              input={<OutlinedInput id="select-multiple-chip" label="Tags" />}
              inputProps={{ placeholder: 'Select Tags' }}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((value: any) => {
                    // let obj = tagList.find(x => x._id === value);
                    return (
                      <Chip
                        key={value}
                        sx={{ fontSize: '11px' }}
                        label={value}
                        color="primary"
                      />
                    );
                  })}
                </Box>
              )}
              MenuProps={MenuProps}
            >
              {tagList?.map((tagItem: any, index: number) => (
                <MenuItem key={index} value={tagItem.name}>
                  {tagItem?.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl required fullWidth sx={{ mb: 6 }} size="small">
            <InputLabel id="select-multiple-chip-label">Language</InputLabel>

            <Select
              required
              labelId="select-multiple-chip-label"
              id="select-multiple-language"
              value={language}
              size="small"
              onChange={handleChangeLang}
              input={
                <OutlinedInput id="select-multiple-chip" label="Language" />
              }
              inputProps={{ placeholder: 'Select Language' }}
              // renderValue={(selected) => (
              //   <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              //     {selected.map((value:any) => {
              //       let obj = langList.find(x => x.value === value);
              //       return (<Chip key={value} sx={{fontSize: '11px'}} label={obj?.label} color='primary'/>);
              //     })}
              //   </Box>
              // )}
              MenuProps={MenuProps}
            >
              {langList?.map((langItem: any, index: number) => (
                <MenuItem key={index} value={langItem}>
                  {langItem?.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Typography variant="body2">
            Note: Add precisely only three headings ("question", "answers" and"keywords") respectively. 
            And more than one answer and keyword can be separated by commas (','). 
            Sample CSV file{' '}
            <a href="/sampleBulkQA.csv" download="SampleBulkQA" target="_blank">
              download
            </a>.
          </Typography>

          <FileUploaderSingle bulkQA={bulkQA} setBulkQA={setBulkQA} />

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
        </Box>
      </form>
    </Drawer>
  );
};

export default SidebarAddNewBulkQA;
