// ** MUI Imports
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import Typography from '@mui/material/Typography'
import CardContent from '@mui/material/CardContent'

// ** Types Imports
import { CardStatsVerticalProps } from 'src/@core/components/card-statistics/types'

// ** Icon Import
import Icon from 'src/@core/components/icon'

// ** Custom Components Imports
import CustomAvatar from 'src/@core/components/mui/avatar'
import OptionsMenu from 'src/@core/components/option-menu'
import { CardStatsHorizontalProps } from 'src/@core/components/card-statistics/types'
import { Avatar, Stack } from '@mui/material'
import { IconProps } from '@iconify/react'
import { ThemeColor } from 'src/@core/layouts/types'
import { OptionsMenuType } from 'src/@core/components/option-menu/types'

export  type OverviewType={
  title: string
  stats: string
  subtitle?: string
  avatarIcon: string
  trendNumber: number
  avatarColor?: ThemeColor
  trend?: 'positive' | 'negative'
  avatarIconProps?: Omit<IconProps, 'icon'>
  titleFontSize?: string | undefined
  subFontSize?: string | undefined
  optionsMenuProps?: OptionsMenuType
  handleChange?: any
}
const Overview = (props: OverviewType) => {
  // ** Props
  const {
    title,
    stats,
    avatarIcon,
    trendNumber,
    optionsMenuProps,
    avatarIconProps,
    trend = 'positive',
    avatarColor = 'primary',
    handleChange
  } = props

  return (
    <Card>
      <CardContent 
        sx={{ 
          p: theme => `${theme.spacing(5, 5, 4)} !important`,  
          height:'inherit',
          padding:'0'
        }}
      >
        <Box sx={{ display: 'flex', mb: 5,pl:5 ,pr:5, pt:5, alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <CustomAvatar skin='light' variant='rounded' color={avatarColor} sx={{ width: 42, height: 42 }}>
            {/* <Icon icon={avatarIcon} {...avatarIconProps} /> */}
            <Avatar variant='rounded' src={avatarIcon} />
          </CustomAvatar>
          {optionsMenuProps && (
            <OptionsMenu handleChange={handleChange}  {...optionsMenuProps} />
          )}
        </Box>
        <Typography sx={{fontWeight: 600, ml:5, mb:0.5, color: 'text.secondary' }}>{title}</Typography>
        <Card sx={{ background:'#F0F5FE' , mb:-4}}>
        <Stack direction='column' sx={{ background:'#F0F5FE' , }} >
          <Stack direction='row' >
            <Typography variant='h5' sx={{ mr: 2,ml:5, }}>
              {stats}
            </Typography>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                '& svg': { mr: 1, color: `${trend === 'positive' ? 'success' : 'error'}.main` }
              }}
            >
              <Icon fontSize={16} icon={trend === 'positive' ? 'bx:up-arrow-alt' : 'bx:down-arrow-alt'} />
              <Typography
                variant='body2'
                sx={{ fontWeight: 500, ml:5, color: `${trend === 'positive' ? 'success' : 'error'}.main` }}
              >
                {`${trendNumber}%`}
              </Typography>
            </Box>
          </Stack>
        </Stack>
        </Card>
      </CardContent>
    </Card>
  )
}

export default Overview
