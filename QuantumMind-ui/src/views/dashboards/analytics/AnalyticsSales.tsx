// ** Custom Component Import
import Overview from 'src/@core/components/card-statistics/overview'
import { OverviewType } from 'src/@core/components/card-statistics/overview'

const AnalyticsSales = (props:OverviewType) => {
  return (
    <Overview
      {...props}
    />
  )
}

export default AnalyticsSales
