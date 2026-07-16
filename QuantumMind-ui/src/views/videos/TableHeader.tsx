// ** MUI Imports
import { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
// ** Icon Imports
import Icon from 'src/@core/components/icon';

const ALPHA_NUMERIC_DASH_REGEX = /^[a-zA-Z0-9-]+$/;
interface TableHeaderProps {
  value: string;
  toggle: () => void;
  handleFilter: (val: string) => void;
}

const TableHeader = (props: TableHeaderProps) => {
  // ** Props
  const {handleFilter,toggle,value } = props;
  const [query, setQuery] = useState<any>('');
  const handleSearchQuestion = (e: any) => {
    const val = query;
    if (val !== '' && !ALPHA_NUMERIC_DASH_REGEX.test(val)) {
      return;
    }
    handleFilter(val);
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
      <Box
        sx={{ gap: 4, display: 'flex', flexWrap: 'wrap', alignItems: 'center' }}
      >
        <span style={{fontSize: '1.25rem', fontWeight: 500 }}>Videos</span>
        <TextField
          size="small"
          value={query}
          placeholder="Search Videos"
          // onChange={(e: any) => setQuery(e.target.value)}
          onChange={(e: any) => {
            const val = e.target.value;
            if (val !== "" && !ALPHA_NUMERIC_DASH_REGEX.test(val)) {
              return;
            }
            setQuery(val);
          }}
          onKeyPress={(e: any) => {
            if (e.key === 'Enter') {
              handleSearchQuestion(e);
            }
          }}
        />
        <Button
          onClick={handleSearchQuestion}
          sx={{ ml: 1 }}
          // size="small"
          variant="contained"
          startIcon={<Icon icon="ic:round-search" />}
        >
          Search
        </Button>
      </Box>
      <Box
        sx={{ gap: 4, display: 'flex', flexWrap: 'wrap', alignItems: 'center' }}
      >
        <Button variant="contained" onClick={toggle}>
          Add Video
        </Button>
      </Box>
    </Box>
  );
};

export default TableHeader;