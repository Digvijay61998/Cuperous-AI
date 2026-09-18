// ** React Imports
import { useState } from 'react';

// ** MUI Imports
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';

// ** Icon Imports
import Icon from 'src/@core/components/icon';

interface CrmTableHeaderProps {
  title: string;
  searchPlaceholder?: string;
  addLabel?: string;
  handleFilter: (val: string) => void;
  toggle?: () => void;
}

const CrmTableHeader = (props: CrmTableHeaderProps) => {
  const {
    title,
    searchPlaceholder = 'Search',
    addLabel,
    handleFilter,
    toggle,
  } = props;
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
        <span style={{ fontSize: '1.25rem', fontWeight: 500 }}>{title}</span>
        <TextField
          size="small"
          value={query}
          placeholder={searchPlaceholder}
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
      {addLabel && toggle && (
        <Box sx={{ gap: 4, display: 'flex', flexWrap: 'wrap', alignItems: 'center' }}>
          <Button
            variant="contained"
            onClick={toggle}
            startIcon={<Icon icon="bx:plus" />}
          >
            {addLabel}
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default CrmTableHeader;
