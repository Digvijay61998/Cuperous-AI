// ** React Imports
import { useEffect, useState } from 'react';

// ** MUI Imports
import { Chip, OutlinedInput, Paper } from '@mui/material';
import Box, { BoxProps } from '@mui/material/Box';
import Button from '@mui/material/Button';
import Drawer from '@mui/material/Drawer';
import FormControl from '@mui/material/FormControl';
import IconButton from '@mui/material/IconButton';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import { styled } from '@mui/material/styles';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

// ** Icon Imports
import Icon from 'src/@core/components/icon';

// ** Store Imports
import toast from 'react-hot-toast';
import { useDispatch, useSelector } from 'react-redux';
import env from 'src/configs/environments';
import Axios from 'src/helper/Axios';
import { AppDispatch, RootState } from 'src/store';
import { addNewAds, updateAds } from 'src/store/apps/advertisement';
import { gettag } from 'src/store/apps/tags';

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

interface SidebarAddNewAdsType {
  open: boolean
  toggle: () => void
  data: any
}

const Header = styled(Box)<BoxProps>(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(3, 4),
  justifyContent: 'space-between',
  backgroundColor: theme.palette.background.default
}))

const SidebarAddNewAds = (props: SidebarAddNewAdsType) => {
  // ** Props
  const { open, toggle, data } = props

  const [name, setName] = useState<string>('');
  const [posters, setPosters] = useState<any>([{
    image:'',
    tag:'',
    link:''
  }]);

  const [bot, setBot] = useState<string[]>([]);
  const handleChange = (event: SelectChangeEvent<typeof bot>) => {
    const {
      target: { value },
    } = event;
    // setBot(value);
    setBot(
      // On autofill we get a stringified value.
      typeof value === 'string' ? value.split(',') : value,
    );
  };

  // ** Hooks
  const dispatch = useDispatch<AppDispatch>();
  const botList = useSelector((state: RootState) => state.bots.list);
  const tagList = useSelector((state: RootState) => state.tags.list);
  useEffect(() => {
    dispatch(gettag());
  }, []);

  useEffect(() => {
    if (data.method=== 'edit') {
      setName(data.title);
      setPosters(data.posters || [{
        image:'',
        tag:'',
        link:'' 
      }]);
      let bots = [];
      if (data?.assignedToBots.length>0) {
        bots=data.assignedToBots.map((a:any) => a?._id || a)
      }
      setBot(bots);
    }
  }, [data]);

  const uploadFileServer = async (e: any, file: any) => {
    if (file.size > 2240032) {
      toast.error('Try to upload less than 2MB');
      return;
    }
    try {
      let formData = new FormData();
      formData.append('file', file);
      const res: any = await Axios.post('/file', formData);
      return res.data.url;
    } catch (error: any) {
      toast.error(error.response.data.message || error.message || 'Failed...');
      return;
    }
  };

  const handleUploadImage = async (
    e: any,
    index: number,
    dataObj: any,
  ) => {
    var file = e.target.files[0];
    const imageUrl = await uploadFileServer(e, file);
    let list: any = [...posters];
    list[index] = {
      ...dataObj,
      image: `${env.baseurl}/api${imageUrl}`,
    };
    setPosters(list);
  };

  const onSubmit = (event: any) => {
    event.preventDefault();
    if(posters.length > 0) {
      if(data.method === 'add') {
        dispatch(addNewAds({ 
          title:name,
          posters: posters,
          assignedToBots:bot,
        }));
      } else if(data.method === 'edit') {
        dispatch(updateAds({
          id: data?._id || data.id,
          data: {
            title:name,
            posters:posters,
            assignedToBots:bot,
          }
        }));
      }
      setName("");
      setPosters([{
        image:'',
        tag:'',
        link:''
      }]);
      setBot([]);
      toggle();
    } else {
      toast.error("Provide at least one poster!");
    }
  }

  const handleClose = () => {
    setName("");
    setPosters([{
      image:'',
      tag:'',
      link:''
    }]);
    setBot([]);
    toggle();
  }

  return (
    <Drawer
      open={open}
      anchor='right'
      variant='temporary'
      onClose={handleClose}
      ModalProps={{ keepMounted: true }}
      sx={{ '& .MuiDrawer-paper': { width: { xs: 300, sm: 400 } } }}
    >
      <Header>
        <Typography variant='h6'>
          {data.method === 'add'? "Add Advertisement":"Edit Advertisement"}
        </Typography>
        <IconButton size='small' onClick={handleClose} sx={{ color: 'text.primary' }}>
          <Icon icon='bx:x' fontSize={20} />
        </IconButton>
      </Header>
      <Box sx={{ p: 5 }}>
        <Typography variant='body2' >Your image and link will get displayed as poster at chatbot widget with maximum 10 posters</Typography>
        <br />
        <form onSubmit={onSubmit}>

          <FormControl required fullWidth sx={{ mb: 6 }}>
            <TextField
              required
              size='small'
              value={name}
              label='Advertisement Title'
              inputProps={{
                maxLength: 60,
              }}
              onChange={(e:any) => setName(e.target.value)}
              placeholder='maximum 60 characters'
            />
          </FormControl>

          <FormControl required fullWidth sx={{ mb:6 }} size='small'>
            <InputLabel id="select-multiple-chip-label">Bots</InputLabel>
            
            <Select
              required
              labelId="select-multiple-chip-label"
              id='select-multiple-bots'
              multiple
              value={bot}
              size="small"
              onChange={handleChange}
              input={<OutlinedInput id="select-multiple-chip" label="Bots" />}
              inputProps={{ placeholder: 'Select Bots' }}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((value:any) => {
                    let obj:any = botList.find((x:any) => x._id === value);
                    return (<Chip key={value} sx={{fontSize: '11px'}} label={obj?.name} color='primary'/>);
                  })}
                </Box>
              )}
              MenuProps={MenuProps}
            >
              {botList?.map((botItem: any, index:number) => (
                <MenuItem 
                  key={index} 
                  value={botItem._id}
                >
                  {botItem?.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <div style={{ color:'#32475c99' }}>Posters * :</div>
          {posters.length >0 && posters?.map((dataObj:any, index:number) => {
            return (
              <div
                key={index}
                style={{
                  display : 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  padding:'5px'
                }}
              >
                <Paper
                  elevation={3}
                  style={{
                    display : 'flex',
                    flexDirection:'column',
                    // backgroundColor:'#dcdcdc',
                    border : '1px solid #dcdcdc',
                    borderRadius: '4px',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                  }}
                >
                  <div style={{ display: 'flex', padding: '5px' }}>
                    <Button
                      variant="contained"
                      component="label"
                      style={{ width: 300, height: 200, overflow: 'hidden' }}
                      sx={{ bgcolor: '#A2A2A2' }}
                    >
                      <div
                        style={{
                          backgroundImage: `url(${dataObj.image})`,
                          backgroundRepeat: 'no-repeat',
                          backgroundSize: 'cover',
                          backgroundPosition: 'center center',
                          width: 300,
                          height: 250,
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',

                            alignItems: 'center',
                            width: 300,
                            height: 250,
                          }}
                        >
                          <Icon icon="bx:camera" />
                          <span>Upload Photo</span>
                          <input
                            hidden
                            accept="image/*"
                            onChange={(e: any) =>
                              handleUploadImage(e, index, dataObj)
                            }
                            type="file"
                          />
                        </div>
                      </div>
                    </Button>
                  </div>
                  
                  <FormControl required fullWidth sx={{ p:'5px' }} size='small'>
                    <Select
                      required
                      id='select-tag'
                      value={dataObj.tag}
                      size="small"
                      displayEmpty
                      onChange={(event) => {
                        let val = event.target.value || '';
                        let list:any = [...posters];
                        list[index] = {
                          ...dataObj,
                          tag: val
                        }
                        setPosters(list);
                      }}
                      inputProps={{ placeholder: 'Select Tag' }}
                      renderValue={(selected) => (
                        <>
                          {selected? (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                              {selected}
                            </Box>
                          ) : (
                            <div
                              style={{
                                color: '#b4bcc3',
                                fontWeight: '400',
                                fontSize: '1rem',
                              }}
                            >
                              select the tag
                            </div>
                          )}
                        </>
                      )}
                      MenuProps={MenuProps}
                    >
                      {tagList?.map((tagItem: any, index:number) => (
                        <MenuItem 
                          key={index} 
                          value={tagItem?.name}
                        >
                          {tagItem?.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  
                  <TextField
                    required
                    fullWidth
                    type={'url'}
                    size={'small'}
                    variant="outlined"
                    sx={{ p:'5px'}}
                    placeholder='enter the valid url'
                    value={dataObj.link}
                    onChange={(event) => {
                      let val = event.target.value || '';
                      let list:any = [...posters];
                      list[index] = {
                        ...dataObj,
                        link: val
                      }
                      setPosters(list);
                    }}
                  />
                </Paper>
                <div style={{ display:'flex', justifyContent:'center',alignItems:'center' }}>
                  <IconButton
                    onClick={() => {
                      let list:any = [...posters]
                      list.splice(index, 1)
                      setPosters(list);
                    }}
                    disabled={posters.length <= 1}
                    color='error'
                  >
                    <Icon icon="bi:trash" fontSize={18} />
                  </IconButton>
                </div>
              </div>
            );
          })}
          <div style={{ display:'flex', justifyContent:'center',alignItems:'center', marginBottom:'1rem' }}>
            <IconButton
              onClick={() => {
                setPosters([
                  ...posters,
                  {
                    image:'',
                    tag:'',
                    link:''
                  },
                ]);
              }}
              disabled={posters?.length >= 10}
              color='primary'
            >
              <Icon icon="material-symbols:add-circle-outline-rounded" fontSize={20} />
            </IconButton>
          </div>

          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Button size='large' type='submit' variant='contained' sx={{ mr: 3 }}>
              Submit
            </Button>
            <Button size='large' variant='outlined' color='secondary' onClick={handleClose}>
              Cancel
            </Button>
          </Box>
        </form>
      </Box>
    </Drawer>
  )
}

export default SidebarAddNewAds
