// ** React Imports
import { useEffect, useState } from 'react'

// ** MUI Imports
import Drawer from '@mui/material/Drawer'
import Select, { SelectChangeEvent } from '@mui/material/Select';
import Button from '@mui/material/Button'
import MenuItem from '@mui/material/MenuItem'
import { styled } from '@mui/material/styles'
import TextField from '@mui/material/TextField'
import IconButton from '@mui/material/IconButton'
import InputLabel from '@mui/material/InputLabel'
import Typography from '@mui/material/Typography'
import Box, { BoxProps } from '@mui/material/Box'
import FormControl from '@mui/material/FormControl'
import FormHelperText from '@mui/material/FormHelperText'
import { Chip, OutlinedInput } from '@mui/material'

// ** Third Party Imports
import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'
import { useForm, Controller } from 'react-hook-form'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

// ** Store Imports
import { useDispatch, useSelector } from 'react-redux'
import { AppDispatch, RootState } from 'src/store'

// ** Actions Imports
import { addNewAgent } from 'src/store/apps/agent'
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

interface SidebarAddNewAgentType {
  open: boolean
  toggle: () => void
}

interface AgentData {
  email: string
  activeHours: string
  name: string
  password: string
}

const showErrors = (field: string, valueLen: number, min: number) => {
  if (valueLen === 0) {
    return `${field} field is required`
  } else if (valueLen > 0 && valueLen < min) {
    return `${field} must be at least ${min} characters`
  } else {
    return ''
  }
}

const Header = styled(Box)<BoxProps>(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(3, 4),
  justifyContent: 'space-between',
  backgroundColor: theme.palette.background.default
}))

const schema = yup.object().shape({
  email: yup.string().email().required(),
  name: yup
    .string()
    .min(3, obj => showErrors('First Name', obj.value.length, obj.min))
    .required(),
  password: yup
    .string()
    .min(3, obj => showErrors('Password', obj.value.length, obj.min))
    .required()
})

const defaultValues = {
  email: '',
  activeHours: '',
  name: '',
  password: '',
}

const SidebarAddNewAgent = (props: SidebarAddNewAgentType) => {
  // ** Props
  const { open, toggle } = props

  const [tag, setTag] = useState<any[]>([]);

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

  // ** Hooks
  const dispatch = useDispatch<AppDispatch>();
  const tagList = useSelector((state: RootState) => state.tags.list);

  // useEffect(() => {
  //   dispatch(gettag());
  // }, []);

  const {
    reset,
    control,
    setValue,
    handleSubmit,
    formState: { errors }
  } = useForm({
    defaultValues,
    mode: 'onChange',
    resolver: yupResolver(schema)
  })

  const onSubmit = (data: any) => {
    let result = tag.map(a => a?._id || a);
    dispatch(addNewAgent({ ...data, tags:result}));
    setTag([]);
    toggle();
    reset();
  }

  const handleClose = () => {
    setTag([]);
    toggle();
    reset();
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
        <Typography variant='h6'>Add Agent</Typography>
        <IconButton size='small' onClick={handleClose} sx={{ color: 'text.primary' }}>
          <Icon icon='bx:x' fontSize={20} />
        </IconButton>
      </Header>
      <Box sx={{ p: 5 }}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <FormControl fullWidth sx={{ mb: 6 }}>
            <Controller
              name='name'
              control={control}
              rules={{ required: true }}
              render={({ field: { value, onChange } }) => (
                <TextField
                  value={value}
                  label='Full Name'
                  onChange={onChange}
                  placeholder='enter the full name'
                  error={Boolean(errors.name)}
                />
              )}
            />
            {errors.name && <FormHelperText sx={{ color: 'error.main' }}>{errors.name.message}</FormHelperText>}
          </FormControl>
          
          <FormControl fullWidth sx={{ mb: 6 }}>
            <Controller
              name='email'
              control={control}
              rules={{ required: true }}
              render={({ field: { value, onChange } }) => (
                <TextField
                  type='email'
                  value={value}
                  label='Email'
                  onChange={onChange}
                  placeholder='enter the valid email id'
                  error={Boolean(errors.email)}
                />
              )}
            />
            {errors.email && <FormHelperText sx={{ color: 'error.main' }}>{errors.email.message}</FormHelperText>}
          </FormControl>

          <FormControl fullWidth sx={{ mb: 6 }}>
            <Controller
              name='password'
              control={control}
              rules={{ required: true }}
              render={({ field: { value, onChange } }) => (
                <TextField
                  value={value}
                  label='Password'
                  type='password'
                  onChange={onChange}
                  placeholder='enter the password'
                  error={Boolean(errors.password)}
                />
              )}
            />
            {errors.password && <FormHelperText sx={{ color: 'error.main' }}>{errors.password.message}</FormHelperText>}
          </FormControl>

          {/* <FormControl fullWidth sx={{ mb: 6 }}>
            <Controller
              name='activeHours'
              control={control}
              rules={{ required: true }}
              render={({ field: { value, onChange } }) => (
                <TextField
                  value={value}
                  label='Active Hours'
                  onChange={onChange}
                  placeholder='enter the active hours'
                  error={Boolean(errors.activeHours)}
                />
              )}
            />
            {errors.activeHours && <FormHelperText sx={{ color: 'error.main' }}>{errors.activeHours.message}</FormHelperText>}
          </FormControl> */}

          <FormControl fullWidth sx={{ mb:6 }}>
            <InputLabel id="select-multiple-chip-label">Tags</InputLabel>
            <Select
              labelId="select-multiple-chip-label"
              id='select-multiple-tag'
              multiple
              value={tag}
              onChange={handleChange}
              input={<OutlinedInput id="select-multiple-chip" label="Tags" />}
              inputProps={{ placeholder: 'Select Tags' }}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((value:any) => {
                    let obj = tagList.find(x => x._id === value);
                    return (<Chip key={value} label={obj?.name} color='primary'/>);
                  })}
                </Box>
              )}
              MenuProps={MenuProps}
            >
              {tagList?.map((tagItem: any, index:number) => (
                <MenuItem 
                  key={index} 
                  value={tagItem._id}
                >
                  {tagItem?.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

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

export default SidebarAddNewAgent
