import React from 'react';
import { Grid, Stack, Tooltip, IconButton, Switch } from '@mui/material';
import Icon from 'src/@core/components/icon';
import classes from './botStyle.module.css';
type Props = {
  botStyleData: any;
  saveStateStyling: any;
};

export default function BotDesign({ botStyleData, saveStateStyling }: Props) {
  return (
    <>
      <Grid container>
        <Grid item xs={12} sm={4}>
          <Grid container>
            <Grid item xs={6}>
              <span>
                Text Color
                <Tooltip title="This color will goes to text" placement='top' arrow>
                  <IconButton>
                    <Icon
                      icon="material-symbols:info-outline-rounded"
                      fontSize={20}
                    />
                  </IconButton>
                </Tooltip>
              </span>
            </Grid>
            <Grid item xs={4} >
              <input
                value={botStyleData?.textColor}
                onChange={saveStateStyling}
                name="textColor"
                type="color"
                id={classes.style2}
              />
              <label
                htmlFor="style2"
                style={{ backgroundColor: botStyleData?.textColor }}
              ></label>
            </Grid>
          </Grid>
        </Grid>

        {/* primary color */}
         <Grid item xs={12} sm={6}>
          <Grid container>
            <Grid item xs={6}>
              <span>
                Text Color
                <Tooltip title="This color will goes to text" placement='top' arrow>
                  <IconButton>
                    <Icon
                      icon="material-symbols:info-outline-rounded"
                      fontSize={20}
                    />
                  </IconButton>
                </Tooltip>
              </span>
            </Grid>
            <Grid item xs={6}>
              <input
                value={botStyleData?.textColor}
                onChange={saveStateStyling}
                name="textColor"
                type="color"
                id={classes.style2}
              />
              <label
                htmlFor="style2"
                style={{ backgroundColor: botStyleData?.textColor }}
              ></label>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </>
  );
}
