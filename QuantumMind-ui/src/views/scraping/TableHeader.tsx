// ** MUI Imports
import { Ref,useCallback, useState, useEffect, ReactElement } from 'react'
import { useDispatch, useSelector } from 'react-redux';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';

// ** Icon Imports
import TextField from '@mui/material/TextField'
import Divider from '@mui/material/Divider';
import { RootState, AppDispatch } from 'src/store';


interface TableHeaderProps {
  value: string;
  toggle: any;
  handleFilter: (val: string) => void;
}

const TableHeader = (props: TableHeaderProps) => {
  // ** Props
  const {handleFilter,toggle,value } = props;

    
  return (
      <>
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
      
      <span style={{fontSize: '1.25rem', fontWeight: 500 }}>{value}</span>
      
      <Box
        sx={{ gap: 4, display: 'flex', flexWrap: 'wrap', alignItems: 'center' }}
      >
            <TextField
          size="small"
          
          placeholder="Search Name..."
          onChange={(e) => handleFilter(e.target.value)}
        />
    
          {toggle &&  <Button variant="contained" onClick={toggle}>
          Add Scraping
        </Button>}
    
      </Box>
    </Box>
     <Divider sx={{ m: '0 !important' }} />
      </>
  );
};

export default TableHeader;