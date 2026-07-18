// ** React Imports
import { useState } from 'react';

// ** MUI Imports
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';

// ** Icon Imports
import Icon from 'src/@core/components/icon';

interface TableHeaderProps {
  value: string;
  toggle: () => void;
  handleFilter: (val: string) => void;
}

const TableHeader = (props: TableHeaderProps) => {
  const { handleFilter, toggle } = props;
  const [query, setQuery] = useState<string>('');

  const handleSearch = () => {
    handleFilter(query.trim());
  };

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
      <Box sx={{ gap: 4, display: 'flex', flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: '1.25rem', fontWeight: 500 }}>Templates</span>
        <TextField
          size="small"
          value={query}
          placeholder="Search templates"
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={(e: any) => {
            if (e.key === 'Enter') handleSearch();
          }}
        />
        <Button
          onClick={handleSearch}
          sx={{ ml: 1 }}
          variant="contained"
          startIcon={<Icon icon="ic:round-search" />}
        >
          Search
        </Button>
      </Box>
      <Box sx={{ gap: 4, display: 'flex', flexWrap: 'wrap', alignItems: 'center' }}>
        <Button
          variant="contained"
          onClick={toggle}
          startIcon={<Icon icon="bx:upload" />}
        >
          Upload Template
        </Button>
      </Box>
    </Box>
  );
};

export default TableHeader;
