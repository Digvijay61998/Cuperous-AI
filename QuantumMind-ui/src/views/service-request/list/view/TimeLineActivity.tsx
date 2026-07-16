// ** MUI Import
import Box from '@mui/material/Box'
import Avatar from '@mui/material/Avatar'
import Divider from '@mui/material/Divider'
import { styled } from '@mui/material/styles'
import TimelineDot from '@mui/lab/TimelineDot'
import TimelineItem from '@mui/lab/TimelineItem'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import TimelineContent from '@mui/lab/TimelineContent'
import TimelineSeparator from '@mui/lab/TimelineSeparator'
import TimelineConnector from '@mui/lab/TimelineConnector'
import MuiTimeline, { TimelineProps } from '@mui/lab/Timeline'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

// Styled Timeline component
const Timeline = styled(MuiTimeline)<TimelineProps>({
  paddingLeft: 0,
  paddingRight: 0,
  '& .MuiTimelineItem-root': {
    width: '100%',
    '&:before': {
      display: 'none'
    }
  }
})

// Styled component for the image of a shoe
const ImgShoe = styled('img')(({ theme }) => ({
  borderRadius: theme.shape.borderRadius
}))

const TimelineLeft = ({activity}:any) => {

    function colorChange(status:string) {
        if (['CREATED','RESOLVED'].includes(status)) {
            return "success";
        } else if (status === 'DEFERRED') {
            return "error";
        } else if (status === 'ASSIGNED') {
            return "primary";
        } else {
            return "secondary";
        }
    }

  return (
    <Timeline>
      {activity?.length>0 && activity?.map((item:any,index:number) => { 
        return(
            <TimelineItem key={index}>
                <TimelineSeparator>
                    <TimelineDot color={colorChange(item?.status)} />
                    <TimelineConnector />
                </TimelineSeparator>
                <TimelineContent sx={{ '& svg': { verticalAlign: 'bottom', mx: 4 } }}>
                    <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Typography variant='body2' sx={{ mr: 2, fontWeight: 600, color: 'text.primary' }}>
                            {item?.status}
                        </Typography>
                        <Typography variant='caption'>
                            {new Date(item?.date).toLocaleDateString('en-US', {
                                hour: 'numeric',
                                minute: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                            })}
                        </Typography>
                    </Box>
                    <Typography variant='body2' sx={{ color: 'text.primary' }}>
                        <span>{item?.message}</span>
                    </Typography>
                </TimelineContent>
            </TimelineItem>
        );
      })}

    </Timeline>
  )
}

export default TimelineLeft
