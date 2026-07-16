// ** MUI Imports
import Grid from '@mui/material/Grid';
import { IconButton, Tooltip } from '@mui/material';
// ** Icon Imports
import Icon from 'src/@core/components/icon';

// ** Types
import { PageHeaderProps } from './types'

const PageHeader = (props: PageHeaderProps) => {
  // ** Props
  const { title, subtitle, downloadReport } = props

  return (
    <>
    <Grid item xs={downloadReport?11:12}>
      {title}
      {subtitle || null}
    </Grid>
    {downloadReport && <Grid item xs={1} style={{ display:'flex', alignItems:'center', justifyContent:'flex-end'}}>
      <Tooltip title="Download Report" placement='top'>
        <IconButton onClick={downloadReport}>
          <Icon icon={"ic:round-file-download"} color="primary" />
        </IconButton>
      </Tooltip>
    </Grid>}
    </>
  )
}

export default PageHeader
