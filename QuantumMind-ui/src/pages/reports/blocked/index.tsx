import React from 'react'
// ** MUI Imports
import Grid from '@mui/material/Grid'
import Link from '@mui/material/Link'
import Typography from '@mui/material/Typography'
import { useTheme } from '@mui/material/styles'

// ** Custom Components Imports
import PageHeader from 'src/@core/components/page-header'

// ** Styled Component Import
import ApexChartWrapper from 'src/@core/styles/libs/react-apexcharts'
import DatePickerWrapper from 'src/@core/styles/libs/react-datepicker'

//** Bots Reports Components */
import TotalBlockReports from 'src/views/reports/blocked/TotalBlockContact'
import SingleBotPerformance from 'src/views/reports/blocked/SingleBot'
import BlockedPerformance from 'src/views/reports/blocked/BlockedPerformance'
import AverageTime from 'src/views/reports/bots/AverageTime'


import Card from '@mui/material/Card';
import Divider from '@mui/material/Divider';
import { DataGrid } from '@mui/x-data-grid';
import IconButton from '@mui/material/IconButton';
import Icon from 'src/@core/components/icon';
import Checkbox from '@mui/material/Checkbox';

// ** Third Party Styles Import
import 'chart.js/auto'
function BlockedReports() {

    // ** Hook
    const theme = useTheme()

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

    
    const [pageSize, setPageSize] = React.useState<number>(10);
    const test = [{ _id: "46756454" }];
    
    const label = { inputProps: { 'aria-label': 'Checkbox demo' } };
    return (
        <ApexChartWrapper>
            <DatePickerWrapper>
                <Grid container spacing={6} className='match-height'>
                    <PageHeader
                        title={
                            <Typography variant='h5'>
                                <Link href='https://github.com/apexcharts/react-apexcharts' target='_blank'>
                                    Blocked Contact Reports
                                </Link>
                            </Typography>
                        }
                        subtitle={<Typography variant='body2'>Block Contact Reports in details</Typography>}
                    />

                    <Grid item xs={12} md={4}>
                        <TotalBlockReports />
                    </Grid>

                    <Grid item xs={12} md={8}>
                        <SingleBotPerformance
                            labelColor={labelColor}
                            info={horizontalBarInfo}
                            borderColor={borderColor}
                            legendColor={legendColor}
                            warning={warningColorShade}
                        />
                    </Grid>

                    <Grid item xs={12}>
                        <BlockedPerformance yellow={barChartYellow} labelColor={labelColor} borderColor={borderColor} />
                    </Grid>

                    <Grid item xs={12}>
                        {/* <AverageTime 
                    white={whiteColor}
                    labelColor={labelColor}
                    success={lineChartYellow}
                    borderColor={borderColor}
                    legendColor={legendColor}
                    primary={lineChartPrimary}
                    warning={lineChartWarning}
                /> */}

                        <Card>

                            <Divider sx={{ m: '0 !important' }} />
                            {/* <TableHeader
    value={value}
    handleFilter={handleFilter}
    toggle={toggleAddUserDrawer}
/> */}
                            <DataGrid
                                autoHeight
                                getRowId={(row: any) => row?._id || row?.id}
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
                                        headerName: 'Bot Name',
                                    },
                                    {
                                        flex: 0.2,
                                        field: '',
                                        minWidth: 80,
                                        headerName: 'Blocked By Agent',
                                    },
                                    {
                                        flex: 0.2,
                                        field: 'createdAt',
                                        minWidth: 120,
                                        headerName: 'Blocked By Location',
                                        renderCell: (params: any) => new Date(params.value).toLocaleString()

                                    },
                                    {
                                        flex: 0.2,
                                        field: 'created',
                                        minWidth: 120,
                                        headerName: 'Blocked By Text',
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
export default BlockedReports