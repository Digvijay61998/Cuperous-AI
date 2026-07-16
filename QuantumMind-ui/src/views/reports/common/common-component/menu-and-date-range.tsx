import React, { forwardRef } from 'react';
import DatePicker from 'react-datepicker';
import InputAdornment from '@mui/material/InputAdornment';
import format from 'date-fns/format';
import Icon from 'src/@core/components/icon';

import { Grid, TextField, MenuItem } from '@mui/material';
type Props = {
    menuList?: any[];
    inputFieldLabel?: any;
    id?: any;
    setId?: any;
    startDate?: any;
    endDate?: any;
    handleOnChange?: any;
    compareId?: any;
    setCompareId?: any;
    isCompare?: boolean;
    compareInputLabel?:string
};

export default function MenuAndDateRangeComp({
  menuList,
  inputFieldLabel,
  id,
  setId,
  startDate,
  endDate,
  handleOnChange,
  compareId,
  setCompareId,
  isCompare,
  compareInputLabel
}: Props) {
  const CustomInput = forwardRef(({ ...props }: any, ref) => {
    const startDate = format(props.start, 'MM/dd/yyyy');
    const endDate =
      props.end !== null ? ` - ${format(props.end, 'MM/dd/yyyy')}` : null;

    const value = `${startDate}${endDate !== null ? endDate : ''}`;

    return (
      <TextField
        {...props}
        size="small"
        sx={{ width: 190 }}
        value={value}
        inputRef={ref}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Icon icon="bx:calendar-alt" />
            </InputAdornment>
          ),
          endAdornment: (
            <InputAdornment position="end">
              <Icon icon="bx:chevron-down" />
            </InputAdornment>
          ),
        }}
      />
    );
  });
  return (
   <>
   {
    isCompare ? (
      <>
       <div>
      <Grid container spacing={6} className="match-height">
      {menuList && menuList.length > 0 && (
          <Grid item xs={6} md={4}>
            <TextField
              size="small"
              sx={{ width: 200 }}
              select
              label={inputFieldLabel}
              value={id ?? ''}
              onChange={(e: any) => setId(e.target.value)}
              id="form-layouts-collapsible-select"
            >
              {menuList.map((item: any, index: number) => (
                <MenuItem key={index} value={item.id}>
                  {item.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
        )}
     
        {menuList && menuList.length > 0 && (
          <Grid item xs={6} md={4}>
            <TextField
              size="small"
              sx={{ width: 200 }}
              select
              label={ compareInputLabel}
              value={compareId ?? ''}
              onChange={(e: any) => setCompareId(e.target.value)}
              id="form-layouts-collapsible-select"
            >
              {menuList.map((item: any, index: number) => (
                <MenuItem key={index} value={item.id}>
                  {item.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
        )}

        <Grid item xs={12} md={4}>
          <DatePicker
            selectsRange
            id="chartjs-bar"
            endDate={endDate}
            selected={startDate}
            startDate={startDate}
            onChange={handleOnChange}
            placeholderText="Click to select a date"
            customInput={
              <CustomInput
                start={startDate || new Date()}
                end={endDate || null}
              />
            }
          />
        </Grid>
      </Grid>
    </div>
      </>
    ): <>
     <div>
      <Grid container spacing={6} className="match-height">
        {menuList && menuList.length > 0 && (
          <Grid item xs={12} md={6}>
            <TextField
              size="small"
              sx={{ width: 200 }}
              select
              label={inputFieldLabel}
              value={id ?? ''}
              onChange={(e: any) => setId(e.target.value)}
              id="form-layouts-collapsible-select"
            >
              {menuList.map((item: any, index: number) => (
                <MenuItem key={index} value={item.id}>
                  {item.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
        )}

        <Grid item xs={12} md={6}>
          <DatePicker
            selectsRange
            id="chartjs-bar"
            endDate={endDate}
            selected={startDate}
            startDate={startDate}
            onChange={handleOnChange}
            placeholderText="Click to select a date"
            customInput={
              <CustomInput
                start={startDate || new Date()}
                end={endDate || null}
              />
            }
          />
        </Grid>
      </Grid>
    </div>
    </>
   }
   </>
  );
}
