import React, { forwardRef } from 'react';
import DatePicker from 'react-datepicker';
import InputAdornment from '@mui/material/InputAdornment';
import format from 'date-fns/format';
import Icon from 'src/@core/components/icon';
import { Grid, TextField, MenuItem, FormControl, InputLabel, Select } from '@mui/material';

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      // width: 250,
    },
  },
};

type Props = {
    menuList?: any[];
    inputFieldLabel?: any;
    id?: any;
    setId?: any;
    startDate?: any;
    endDate?: any;
    handleOnChange?: any
};

export default function MenuAndDateRangeComp({
  menuList,
  inputFieldLabel,
  id,
  setId,
  startDate,
  endDate,
  handleOnChange,
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
    <div>
      <Grid container spacing={6} className="match-height">
        {menuList && menuList.length > 0 && (
          <Grid item xs={12} md={6}>
            <FormControl size="small" sx={{ width: 200 }}>
              <InputLabel id="menu-select">{inputFieldLabel}</InputLabel>
              <Select
                value={id ?? ''}
                size="small"
                id="select-menu"
                sx={{ width: 200 }}
                label={inputFieldLabel}
                labelId="menu-select"
                onChange={(e: any) => setId(e.target.value)}
                inputProps={{ placeholder: inputFieldLabel }}
                MenuProps={MenuProps}
              >
                {menuList.map((item: any, index: number) => (
                  <MenuItem key={index} value={item?.id}>
                    {item?.title}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
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
  );
}
