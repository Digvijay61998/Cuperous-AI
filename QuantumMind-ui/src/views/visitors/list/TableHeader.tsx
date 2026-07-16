// ** MUI Imports
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import { useState } from 'react';

// ** Icon Imports
import Icon from 'src/@core/components/icon';

interface TableHeaderProps {
  value: string;
  segmentId?: string;
  handleFilter: (val: string) => void;
}
const ALPHA_NUMERIC_DASH_REGEX = /^[a-zA-Z0-9-]+$/;

const TableHeader = (props: TableHeaderProps) => {
  // ** Props
  const { segmentId='', handleFilter, value } = props;
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
      <span style={{ fontSize:'1.25rem', fontWeight: 500 }}>Visitor List</span>
      <Box
        sx={{ gap: 4, display: 'flex', flexWrap: 'wrap', alignItems: 'center' }}
      >
      {segmentId ? 
        <TextField
          size="small"
          value={value}
          placeholder="Search Visitor"
          onChange={(e) => handleFilter(e.target.value)}
        />
        :
        <>
          <TextField
            size="small"
            value={query}
            placeholder="Search Visitor"
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
        </>
      }
      </Box>
    </Box>
  );
};

export default TableHeader;
