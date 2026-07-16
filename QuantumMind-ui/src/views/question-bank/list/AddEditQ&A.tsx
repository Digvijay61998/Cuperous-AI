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
import { Chip, FormGroup, OutlinedInput, Paper } from '@mui/material';

// ** Icon Imports
import Icon from 'src/@core/components/icon';

// ** Store Imports
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from 'src/store';
import { addNewQA, updateQA } from 'src/store/apps/question-bank';
import { deleteUnansweredQuestions, fetchLanguages } from 'src/store/apps/bots';
import toast from 'react-hot-toast';
// import { gettag } from 'src/store/apps/tags'

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

const ListItems = styled('li')(({ theme }) => ({
  margin: theme.spacing(0.5),
}));

interface SidebarAddNewQAType {
  open: boolean;
  toggle: () => void;
  data: any;
}

const Header = styled(Box)<BoxProps>(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(3, 4),
  justifyContent: 'space-between',
  backgroundColor: theme.palette.background.default,
}));

const SidebarAddNewQA = (props: SidebarAddNewQAType) => {
  // ** Props
  const { open, toggle, data } = props;

  const [question, setQuestion] = useState<string>('');
  const [answers, setAnswers] = useState<any>(['']);
  const [chipData, setChipData] = useState<Array<string>>([]);
  const [keywordsNew, setKeywordsNew] = useState<string>('');
  const [tag, setTag] = useState<any[]>([]);
  const [language, setLanguage] = useState<any>({});
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

  useEffect(() => {
    if (data.method) {
      setQuestion(data?.question);
      setAnswers(data?.answers?.length>0 ? data?.answers : [""]);
      setChipData(data?.keywords);
      let tags = [];
      if (data?.tags.length > 0) {
        tags = data.tags.map((a: any) => a?.name || a);
      }
      setTag(tags);
      let langData = '';
      if (data?.language) {
        langData = langList.find((l: any) => l.label === data.language);
      }
      setLanguage(langData);
    }
  }, [data]);
  const handleDelete = (deleteIndex: number) => () => {
    setChipData((chips) =>
      chips.filter((chip, index) => index !== deleteIndex),
    );
  };

  const onSubmit = (event: any) => {
    event.preventDefault();
    let resultTag = tag.map((a) => a?._id || a);
    if (answers.length > 0) {
      if (data.method === 'add') {
        dispatch(
          addNewQA({
            question: question,
            answers: answers,
            tags: resultTag,
            questionLanguage: language,
            keywords: chipData,
          }),
        );
        if (data.botId) {
          dispatch(
            deleteUnansweredQuestions({
              botId: data.botId,
              questionId: data.id,
              showToast: false,
            }),
          );
        }
      } else if (data.method === 'edit') {
        dispatch(
          updateQA({
            id: data.id,
            data: {
              question: question,
              answers: answers,
              tags: resultTag,
              questionLanguage: language,
              keywords: chipData,
            },
          }),
        );
      }
      setQuestion('');
      setAnswers(['']);
      setKeywordsNew('');
      setTag([]);
      setLanguage({});
      setChipData([]);
      toggle();
    } else {
      toast.error('Please add at least one answer!');
    }
  };

  const handleClose = () => {
    setQuestion('');
    setAnswers(['']);
    setKeywordsNew('');
    setTag([]);
    setLanguage({});
    setChipData([]);
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
        <Typography variant="h6">
          {data.method === 'add' ? 'Add Q&A' : 'Edit Q&A'}
        </Typography>
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
          Your question and answers will get added to the question bank
        </Typography>
        <br />

        <form onSubmit={onSubmit}>
          <div style={{ color: '#32475c99' }}>Tags * :</div>
          <FormControl required fullWidth sx={{ mt: 1, mb: 4 }} size="small">
            {/* <InputLabel id="select-multiple-chip-label">Tags</InputLabel> */}

            <Select
              required
              labelId="select-multiple-chip-label"
              id="select-multiple-tag"
              multiple
              value={tag}
              size="small"
              displayEmpty
              onChange={handleChange}
              // input={<OutlinedInput id="select-multiple-chip" label="Tags" />}
              inputProps={{ placeholder: 'Select Tags' }}
              renderValue={(selected) => (
                <>
                  {selected?.length > 0 ? (
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
                  ) : (
                    <div
                      style={{
                        color: '#b4bcc3',
                        fontWeight: '400',
                        fontSize: '1rem',
                      }}
                    >
                      select the tags
                    </div>
                  )}
                </>
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

          <div style={{ color: '#32475c99' }}>Language * :</div>
          <FormControl required fullWidth sx={{ mt: 1, mb: 4 }} size="small">
            {/* <InputLabel id="select-multiple-chip-label">Language</InputLabel> */}

            <Select
              required
              labelId="select-multiple-chip-label"
              id="select-multiple-language"
              value={language}
              size="small"
              displayEmpty
              onChange={handleChangeLang}
              // input={
              //   <OutlinedInput id="select-multiple-chip" label="Language" />
              // }
              inputProps={{ placeholder: 'Select Language' }}
              renderValue={(selected) => (
                <>
                  {selected? (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected?.label}
                    </Box>
                  ) : (
                    <div
                      style={{
                        color: '#b4bcc3',
                        fontWeight: '400',
                        fontSize: '1rem',
                      }}
                    >
                      select the language
                    </div>
                  )}
                </>
              )}
              MenuProps={MenuProps}
            >
              {langList?.map((langItem: any, index: number) => (
                <MenuItem key={index} value={langItem}>
                  {langItem?.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <div style={{ color: '#32475c99' }}>Question * :</div>
          <FormControl required fullWidth sx={{ mt: 1, mb: 4 }}>
            <TextField
              multiline
              required
              minRows={3}
              value={question}
              onChange={(e: any) => setQuestion(e.target.value)}
              placeholder="enter the question"
            />
          </FormControl>

          <div style={{ color: '#32475c99' }}>Answers * :</div>
          {answers.length > 0 &&
            answers?.map((data: string, index: number) => {
              return (
                <FormGroup key={index} row style={{ flexWrap: 'nowrap' }}>
                  <TextField
                    required
                    fullWidth
                    sx={{ fontSize: '11px', py: 1 }}
                    size={'small'}
                    multiline
                    minRows={2}
                    variant="outlined"
                    value={data}
                    placeholder="enter the answer"
                    onChange={(event) => {
                      let val = event.target.value || '';
                      let list: any = [...answers];
                      list[index] = val;
                      setAnswers(list);
                    }}
                  />
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'flex-start',
                      position: 'absolute',
                      right: '14px',
                    }}
                  >
                    <IconButton
                      onClick={() => {
                        let list: any = [...answers];
                        list.splice(index, 1);
                        setAnswers(list);
                      }}
                      disabled={answers.length <= 1}
                      color="error"
                    >
                      <Icon icon="bi:trash" fontSize={18} />
                    </IconButton>
                  </div>
                </FormGroup>
              );
            })}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: '1rem',
            }}
          >
            <IconButton
              onClick={() => {
                setAnswers([...answers, '']);
              }}
              disabled={answers?.length >= 10}
              color="primary"
            >
              <Icon
                icon="material-symbols:add-circle-outline-rounded"
                fontSize={20}
              />
            </IconButton>
          </div>

          <Paper
            elevation={0}
            sx={{
              display: 'flex',
              justifyContent: 'flex-start',
              flexWrap: 'wrap',
              listStyle: 'none',
              p: 0.5,
              m: 0,
              mb: 4,
              background: 'transparent',
            }}
            component="ul"
          >
            <div style={{ color: '#32475c99' }}>Keywords :&nbsp;</div>
            {chipData.map((data, index) => {
              return (
                <ListItems key={index}>
                  <Chip
                    size="small"
                    sx={{ fontWeight: 'light', fontSize: '11px' }}
                    color="primary"
                    label={data}
                    onDelete={handleDelete(index)}
                  />
                </ListItems>
              );
            })}
            <FormGroup row style={{ flexWrap: 'nowrap' }}>
              <Chip
                // color='primary'
                sx={{ fontSize: '11px' }}
                label={
                  <TextField
                    sx={{ width: 100, fontSize: '11px' }}
                    variant="standard"
                    value={keywordsNew}
                    onChange={(event) => {
                      setKeywordsNew(event.target.value || '');
                    }}
                  />
                }
              />
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <IconButton
                  onClick={() => {
                    setChipData([...chipData, keywordsNew]);
                    setKeywordsNew('');
                  }}
                  disabled={keywordsNew === ''}
                  color="primary"
                >
                  <Icon icon="carbon:add-filled" fontSize={18} />
                </IconButton>
              </div>
            </FormGroup>
          </Paper>

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

export default SidebarAddNewQA;
