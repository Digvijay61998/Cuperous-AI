// ** MUI Imports
import Box from '@mui/material/Box'
import Link from '@mui/material/Link'
import { Theme } from '@mui/material/styles'
import Typography from '@mui/material/Typography'
import useMediaQuery from '@mui/material/useMediaQuery'

const FooterContent = () => {
  // ** Var
  const hidden = useMediaQuery((theme: Theme) => theme.breakpoints.down('md'))

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-around' }}>
      <Typography sx={{ mr: 2 }}>
        {`Copyright © `}
        <Link target='_blank' href='#'>
          BizBot 
        </Link>
       <span> </span> {new Date().getFullYear()}
      </Typography>
    </Box>
  )
}

export default FooterContent
