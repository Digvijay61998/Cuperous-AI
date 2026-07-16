import React from 'react'
// ** MUI Imports
import Grid from '@mui/material/Grid'
import Link from '@mui/material/Link'
import { useTheme } from '@mui/material/styles'
import Typography from '@mui/material/Typography'

// ** Custom Components Imports
import PageHeader from 'src/@core/components/page-header'

// ** Styled Component Import
import ApexChartWrapper from 'src/@core/styles/libs/react-apexcharts'
import DatePickerWrapper from 'src/@core/styles/libs/react-datepicker'

//** Bots Reports Components */
import QuestionPerformance from 'src/views/reports/questions/QuestionPerformance'


// ** MUI Imports
import Card from '@mui/material/Card'
import Checkbox from '@mui/material/Checkbox'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import { DataGrid } from '@mui/x-data-grid'
import Icon from 'src/@core/components/icon'


import { UsersType } from 'src/types/apps/userTypes'

// ** Third Party Styles Import
import 'chart.js/auto'

   
interface CellType {
    row: UsersType;
  }
function QuestionReports() {

    // ** Hook
    const theme = useTheme()

    const [pageSize, setPageSize] = React.useState<number>(10);
    const test = [{ _id: "46756454" }];
    // Vars
    const whiteColor = '#fff'
    const areaChartBlue = '#2c9aff'
    const barChartYellow = '#00a7ff'
    const horizontalBarInfo = '#26c6da'
    const warningColorShade = '#ffbd1f'
    const areaChartBlueLight = '#84d0ff'
    const areaChartGreyLight = '#edf1f4'
    const borderColor = theme.palette.divider
    const labelColor = theme.palette.text.disabled
    const legendColor = theme.palette.text.secondary
    const lineChartYellow = '#d4e157'
    const lineChartPrimary = '#8082FF'
    const lineChartWarning = '#ff9800'

    const label = { inputProps: { 'aria-label': 'Checkbox demo' } };

    return (
        <ApexChartWrapper>
            <DatePickerWrapper>
                <Grid container spacing={6} className='match-height'>
                    <Grid item xs={12}>
                        <Card sx={{ px:6, py:2 }}>
                            <Grid container spacing={6} className="match-height">
                                <PageHeader
                                    title={
                                        <Typography variant='h5'>
                                            <Link href='https://github.com/apexcharts/react-apexcharts' target='_blank'>
                                                Question Reports
                                            </Link>
                                        </Typography>
                                    }
                                    subtitle={<Typography variant='body2'>Question Reports in details</Typography>}
                                />
                            </Grid>
                        </Card>
                    </Grid>

                    <Grid item xs={12}>
                        <QuestionPerformance yellow={barChartYellow} labelColor={labelColor} borderColor={borderColor} />
                    </Grid>

                    <Grid item xs={12}>
                        <Card>

                            <Divider sx={{ m: '0 !important' }} />
                            {/* <TableHeader
                                value={value}
                                handleFilter={handleFilter}
                                toggle={toggleAddUserDrawer}
                            /> */}
                            <DataGrid
                                autoHeight
                                getRowId={(row: any) => row?._id  || row?.id}
                                rows={test}
                                columns={[
                                    {
                                        flex: 0.07,
                                        minWidth: 50,
                                        field: 'data',
                                        headerName: 'check',
                                        renderCell: (params: any) => {
                                            return (
                                                <>
                                                    <Checkbox {...label} />
                                                </>
                                            )
                                        },
                                    },
                                    {
                                        flex: 0.25,
                                        minWidth: 200,
                                        field: 'name',
                                        headerName: 'Unanswser Question',
                                    },
                                    {
                                        flex: 0.2,
                                        field: '',
                                        minWidth: 80,
                                        headerName: 'Bot',
                                    },
                                    {
                                        flex: 0.2,
                                        field: 'createdAt',
                                        minWidth: 120,
                                        headerName: 'Asked On',
                                        renderCell: (params: any) => new Date(params.value).toLocaleString()

                                    },
                                    {
                                        flex: 0.1,
                                        minWidth: 90,
                                        sortable: false,
                                        field: 'actions',
                                        headerName: 'Actions',
                                        renderCell: (params: any) => {
                                            return (
                                                <>
                                                    <IconButton
                                                        aria-label="Edit"
                                                        size="small"
                                                        sx={{ mr: 2 }}
                                                        // onClick={() => handleDelete(row)}
                                                    >
                                                        <Icon icon="bx:trash" fontSize={20} />

                                                    </IconButton>
                                                </>
                                            )
                                        },
                                    },
                                ]}
                                pageSize={pageSize}
                                disableSelectionOnClick
                                rowsPerPageOptions={[10, 25, 50]}
                                onPageSizeChange={(newPageSize: number) => setPageSize(newPageSize)}
                            />
                        </Card>
                    </Grid>

                </Grid>
            </DatePickerWrapper>
        </ApexChartWrapper>
    )
}
export default QuestionReports