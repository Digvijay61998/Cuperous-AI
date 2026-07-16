// ** React Imports
import { useEffect, useState } from 'react';

// ** MUI Imports
import Box, { BoxProps } from '@mui/material/Box';
import Button from '@mui/material/Button';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import { SelectChangeEvent } from '@mui/material/Select';
import { styled } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import { fetchImportBots } from 'src/store/apps/bots';
// ** Third Party Imports

// ** Icon Imports
import Icon from 'src/@core/components/icon';

// ** Store Imports
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from 'src/store';

// ** Actions Imports
import toast from 'react-hot-toast';
import FileUploaderSingle from 'src/views/bots/list/FileUploaderSingle';
// import { gettag } from 'src/store/apps/tags'
import {
    fetchLanguages
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

interface SidebarAddImportType {
  open: boolean;
  toggle: () => void;
  setOpen: any
}

const Header = styled(Box)<BoxProps>(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(3, 4),
  justifyContent: 'space-between',
  backgroundColor: theme.palette.background.default,
}));

const SidebarAddImportBots = (props: SidebarAddImportType) => {
  // ** Props
  const { open, toggle, setOpen } = props;

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [tag, setTag] = useState<any[]>([]);
  const [language, setLanguage] = useState<string>('');
const [file, setFile] = useState<any>(null)

  // ** Hooks
  const dispatch = useDispatch<AppDispatch>();
  const tagList = useSelector((state: RootState) => state.tags.list);
  const {languages: langList, isLoadingImportBot} = useSelector(
    (state: RootState) => state?.bots,
  );
  useEffect(() => {
    dispatch(fetchLanguages());
  }, []);

  const onSubmit = (event: any) => {
    event.preventDefault();
    if(file){
//  make it binary and send it to api
        let formData = new FormData();
        formData.append('file', file);
        dispatch(fetchImportBots(formData))
        setOpen(false)
    } else {
      toast.error('Please upload file');
    }
  };

  const handleClose = () => {
    setTag([]);
    setLanguage('');
   setFile(null)
    toggle();
    setOpen(false)
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
        <Typography variant="h6">Import Single/Multiple Bots</Typography>
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
           You can only upload json file that you get when you export the bot/bots
          </Typography>

          <FileUploaderSingle file={file} setFile={setFile} />

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

export default SidebarAddImportBots;
