// ** MUI Imports
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';

// ** Icon Imports
import Icon from 'src/@core/components/icon';

interface TableHeaderProps {
  value: string;
  toggle: () => void;
  handleFilter: (val: string) => void;
}

const TableHeader = (props: TableHeaderProps) => {
  // ** Props
  const { handleFilter, toggle, value } = props;

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
        <div style={{ fontSize:'1.25rem', fontWeight: 500 }}>Agent List</div>
        <TextField
          size="small"
          value={value}
          placeholder="Search Agent"
          onChange={(e) => handleFilter(e.target.value)}
        />
      </Box>
      
      <Box
        sx={{ gap: 4, display: 'flex', flexWrap: 'wrap', alignItems: 'center' }}
      >
        <Button 
          onClick={toggle} 
          variant="contained" 
          size="small"
        >
          Add Agent
        </Button>
    
      </Box>
    </Box>
  );
};

export default TableHeader;
