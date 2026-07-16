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
  inputFieldLabel2?: any;
  startDate?: any;
  endDate?: any;
  handleOnChange?: any;
  compareId?: any;
  setCompareId?: any;
  compareId2?: any;
  setCompareId2?: any;
  platform?: any;
  setPlatform?: any;
  platformMenuList?: string[];
};

export default function MenuAndDateRangeComp({
  menuList,
  inputFieldLabel,
  inputFieldLabel2,
  startDate,
  endDate,
  handleOnChange,
  compareId,
  setCompareId,
  compareId2,
  setCompareId2,
  platform,
  setPlatform,
  platformMenuList=[],
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
      <Grid container spacing={3} className="match-height">
        {menuList && menuList?.length > 0 && (<>
          <Grid item xs={12} md={3}>
            <FormControl size="small" sx={{ width: 200 }}>
              <InputLabel id="menu-select">{inputFieldLabel}</InputLabel>
              <Select
                value={compareId ?? ''}
                size="small"
                id="select-menu"
                sx={{ width: 200 }}
                label={inputFieldLabel}
                labelId="menu-select"
                onChange={(e: any) => setCompareId(e.target.value)}
                inputProps={{ placeholder: inputFieldLabel }}
                MenuProps={MenuProps}
              >
                {menuList.map((item: any, index: number) => (
                  <MenuItem key={index} value={item.id}>
                    {item.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <FormControl size="small" sx={{ width: 200 }}>
              <InputLabel id="menu-select">{"Compare with"}</InputLabel>
              <Select
                // fullWidth
                value={compareId2 ?? ''}
                size="small"
                id="select-menu"
                sx={{ width: 200 }}
                label={"Compare with"}
                labelId="menu-select"
                onChange={(e: any) => setCompareId2(e.target.value)}
                inputProps={{ placeholder: "Compare with" }}
                MenuProps={MenuProps}
              >
                {menuList.map((item: any, index: number) => (
                  <MenuItem key={index} value={item?.id}>
                    {item?.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={3}>
            <FormControl size="small" sx={{ width: 200 }}>
              <InputLabel id="platform-select">{inputFieldLabel2}</InputLabel>
              <Select
                value={platform ?? ''}
                size="small"
                id="select-platform"
                sx={{ width: 200 }}
                label={inputFieldLabel2}
                labelId="platform-select"
                onChange={(e: any) => setPlatform(e.target.value)}
                inputProps={{ placeholder: inputFieldLabel2 }}
                MenuProps={MenuProps}
              >
                {platformMenuList?.map((item: string, index: number) => (
                  <MenuItem key={index} value={item}>
                    {item}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </>)}

        <Grid item xs={12} md={3}>
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
