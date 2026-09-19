// ** MUI Imports
import { LoadingButton } from '@mui/lab';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Link from 'next/link';
// ** Icon Imports
import Icon from 'src/@core/components/icon';
import { AppDispatch } from 'src/store';
import { fetchExportBots } from 'src/store/apps/bots';
interface TableHeaderProps {
  value: string;
  toggle: () => void;
  handleFilter: (val: string) => void;
  isDisplay?: boolean;
  selectExportBots: any;
  isLoadingExportBot:any;
  isLoadingImportBot: any
  dispatch: AppDispatch;
  setOpen: any
  disableCreate?: boolean;
  disableReason?: string;
}

const TableHeader = (props: TableHeaderProps) => {
  // ** Props
  const { handleFilter, toggle, value, isDisplay, selectExportBots, dispatch, isLoadingExportBot, setOpen, isLoadingImportBot, disableCreate, disableReason } = props;
const handleExport = () =>{
    dispatch(fetchExportBots(selectExportBots))
}
  return (
    <Box
      sx={{
        p: 6,
        gap: 4,
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <Box
        sx={{ gap: 4, display: 'flex', flexWrap: 'wrap', alignItems: 'center' }}
      >
        <span style={{ fontSize: '1.25rem', fontWeight: 500 }}>Bot List</span>
        <TextField
          size="small"
          value={value}
          placeholder="Search Bot"
          onChange={(e) => handleFilter(e.target.value)}
        />
      </Box>

      {isDisplay && (
        <Box
          sx={{
            gap: 4,
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
          }}
        >
      
          {disableCreate ? (
            <Tooltip title={disableReason || ''}>
              <span>
                <Button
                  variant="outlined"
                  size="small"
                  disabled
                  startIcon={<Icon icon={'material-symbols:add'} />}
                >
                  Create Bot
                </Button>
              </span>
            </Tooltip>
          ) : (
            <Link href="/bots/create/">
              <Button
                variant="outlined"
                size="small"
                startIcon={<Icon icon={'material-symbols:add'} />}
              >
                Create Bot
              </Button>
            </Link>
          )}
          <LoadingButton 
          loading={isLoadingImportBot}
            variant="contained"
            size="small"
            onClick={(e: any)=> setOpen(true)}
            startIcon={<Icon icon={'tabler:packge-import'} />}
          >
            Import Bots
          </LoadingButton>
          <LoadingButton 
            variant="outlined"
            size="small"
            startIcon={<Icon icon={'material-symbols:upload'} />}
          >
            Upload Pdf
          </LoadingButton>

          {selectExportBots && selectExportBots.length > 0 && (
            <LoadingButton
              variant="outlined"
              size="small"
              loading={isLoadingExportBot}
              onClick={handleExport}
              startIcon={<Icon icon={'tabler:packge-export'} />}
            >
              Export Bots
            </LoadingButton>
          )}
        </Box>
      )}
    </Box>
  );
};

export default TableHeader;
