// ** React Imports
import { forwardRef, useState } from 'react'

// ** MUI Imports
import Card from '@mui/material/Card'
import TextField from '@mui/material/TextField'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import InputAdornment from '@mui/material/InputAdornment'
import MenuItem from '@mui/material/MenuItem'
import Grid from '@mui/material/Grid'

// ** Third Party Imports
import format from 'date-fns/format'
import { Bar } from 'react-chartjs-2'
import DatePicker from 'react-datepicker'
import { ChartData, ChartOptions } from 'chart.js'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

// ** Types
import { DateType } from 'src/types/forms/reactDatepickerTypes'

interface BarProp {
  yellow: string
  labelColor: string
  borderColor: string
}

const ServiceRequestByBot = (props: BarProp) => {
  // ** Props
  const { yellow, labelColor, borderColor } = props

  // ** States
  const [endDate, setEndDate] = useState<DateType>(null)
  const [startDate, setStartDate] = useState<DateType>(new Date())

  const options: ChartOptions<'bar'> = {
    
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 500 },
    scales: {
      x: {
        grid: {
          borderColor,
          drawBorder: false,
          color: borderColor
        },
        ticks: { color: labelColor }
      },
      y: {
        min: 0,
        max: 400,
        grid: {
          borderColor,
          drawBorder: false,
          color: borderColor
        },
        ticks: {
          stepSize: 100,
          color: labelColor
        }
      }
    },
    plugins: {
      legend: { 
        display: true,
        align: 'end',
        position: 'top',
        labels: { color: labelColor }
      }
    }
  }

  const data: ChartData<'bar'> = {
    labels: [
      '7/12',
      '8/12',
      '9/12',
      '10/12',
      '11/12',
      '12/12',
      '13/12',
      '14/12',
      
    ],
    datasets: [
      {
        maxBarThickness: 15,
        label: 'Total',
        backgroundColor: '#FCD835',
        borderColor: 'transparent',
        borderRadius: { topRight: 15, topLeft: 15 },
        data: [275, 90, 190, 205, 125, 85, 55, 87, 127, 150, 230, 280, 190]
      },
      {
        maxBarThickness: 15,
        label: 'Completed',
        backgroundColor: '#00D4BD',
        borderColor: 'transparent',
        borderRadius: { topRight: 15, topLeft: 15 },
        data: [275, 90, 190, 205, 125, 85, 55, 87, 127, 150, 230, 280, 190]
      },

      {
        maxBarThickness: 15,
        label: 'Expired',
        backgroundColor: '#32475cde',
        borderColor: 'transparent',
        borderRadius: { topRight: 15, topLeft: 15 },
        data: [275, 90, 190, 205, 125, 85, 55, 87, 127, 150, 230, 280, 190]
      },

      
    ]
  }

  const CustomInput = forwardRef(({ ...props }: any, ref) => {
    const startDate = format(props.start, 'MM/dd/yyyy')
    const endDate = props.end !== null ? ` - ${format(props.end, 'MM/dd/yyyy')}` : null

    const value = `${startDate}${endDate !== null ? endDate : ''}`

    return (
      <TextField
        {...props}
        size='small'
        value={value}
        inputRef={ref}
        InputProps={{
          startAdornment: (
            <InputAdornment position='start'>
              <Icon icon='bx:calendar-alt' />
            </InputAdornment>
          ),
          endAdornment: (
            <InputAdornment position='end'>
              <Icon icon='bx:chevron-down' />
            </InputAdornment>
          )
        }}
      />
    )
  })

  const handleOnChange = (dates: any) => {
    const [start, end] = dates
    setStartDate(start)
    setEndDate(end)
  }

  return (
    <Card>
      <CardHeader
        title='Visitors Handled By Bots'
        sx={{
          flexDirection: ['column', 'row'],
          alignItems: ['flex-start', 'center'],
          '& .MuiCardHeader-action': { mb: 0 },
          '& .MuiCardHeader-content': { mb: [2, 0] }
        }}
        action={
          
          <>
          <Grid container spacing={6} className='match-height'>
            <Grid item xs={12} md={6}>
               
              <TextField size="small" fullWidth select
              label='Bots'
              defaultValue=''
              id='form-layouts-collapsible-select'
              
              >
              <MenuItem value='Right'>Right</MenuItem>
              <MenuItem value='Left'>Left</MenuItem>
              
              </TextField>
            </Grid>
       
            <Grid item xs={12} md={6}>
              <DatePicker
                selectsRange
                id='chartjs-bar'
                endDate={endDate}
                selected={startDate}
                startDate={startDate}
                onChange={handleOnChange}
                placeholderText='Click to select a date'
                customInput={<CustomInput start={startDate} end={endDate} />}
              />
            </Grid>
          </Grid>
            </>
        }
      />
      <CardContent>
        <Bar data={data} height={400} options={options} />
      </CardContent>
    </Card>
  )
}

export default ServiceRequestByBot
