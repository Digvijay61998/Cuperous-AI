// ** MUI Imports
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';

// ** Icon Imports
import Icon from 'src/@core/components/icon';

interface TableHeaderProps {
  title: string;
  value: string;
  buttonName: string;
  toggle: () => void;
  handleFilter: (val: string) => void;
}

const TableHeader = (props: TableHeaderProps) => {
  // ** Props
  const { title, buttonName, handleFilter, toggle, value } = props;

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
        <div style={{ fontSize:'1.25rem', fontWeight: 500 }}>{title}</div>
        <TextField
          size="small"
          value={value}
          placeholder="Search Name..."
          onChange={(e) => handleFilter(e.target.value)}
        />
      </Box>
      
      <Box
        sx={{ gap: 4, display: 'flex', flexWrap: 'wrap', alignItems: 'center' }}
      >
        <Button onClick={toggle} variant="contained">
          {buttonName}
        </Button>
      </Box>
    </Box>
  );
};

export default TableHeader;
