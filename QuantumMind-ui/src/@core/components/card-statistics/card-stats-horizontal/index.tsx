// ** MUI Imports
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import Typography from '@mui/material/Typography'
import CardContent from '@mui/material/CardContent'
import CardActions from "@mui/material/CardActions"
// ** Types Imports
import { CardStatsHorizontalProps } from 'src/@core/components/card-statistics/types'

// ** Theme config
import { Mode } from 'src/@core/layouts/types'
// ** Icon Import
import Icon from 'src/@core/components/icon'

// ** Custom Component Imports
import CustomAvatar from 'src/@core/components/mui/avatar'
import {randomNumberGenerate} from 'src/helper';
import { Avatar } from '@mui/material'
import { relative } from 'path'

const CardStatsHorizontal = (props: CardStatsHorizontalProps) => {
  // ** Props
  const {
    title,
    stats,
    mode,
    subtitle,
    avatarIcon,
    trendNumber,
    avatarIconProps,
    trend = 'positive',
    avatarColor = 'primary',
    titleFontSize,
    subFontSize
  } = props

  return (
    <Card sx={{boxShadow:'rgba(0, 0, 0, 0.16) 0px 3px 6px, rgba(0, 0, 0, 0.23) 0px 3px 6px'}}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
        <Typography sx={{ mb: 1.75, color: 'text.secondary', fontSize: titleFontSize }}>{title}</Typography>
            <Box sx={{position:'relative'}}> <Typography variant='h5' sx={{ mr: 2.5 , display:'inline-block'}}>
                {stats}
              </Typography>
              <Typography variant='body2' sx={{ mt: 1,display:'inline-block', color: `${trend === 'negative' ? 'error' : ''}.main` }}>
                {`(${trend === 'negative' ? '-' : '+'}${trendNumber}%)`}
              </Typography>
              </Box> 
          </Box>
          <CustomAvatar skin='light' variant='rounded' color={avatarColor} sx={{ width: 42, height: 42 }}>
            {/* <Icon icon={avatarIcon} {...avatarIconProps} /> */}
            <Avatar src={avatarIcon} />
          </CustomAvatar>
        </Box>
       
      </CardContent>
      <CardActions sx={{ justifyContent: 'flex-start',
      // backgroundColor:mode === 'light' ? '#F0F5FE' : 'gray',
      backgroundColor:'#F0F5fe',
       display : "flex", alignItems : "center", height : "40px" }}>
        <Typography variant='body2' sx={{fontSize: subFontSize, margin : "20px auto 0 5px"}}>{subtitle}</Typography>
      </CardActions>
    </Card>
  )
}

export default CardStatsHorizontal
