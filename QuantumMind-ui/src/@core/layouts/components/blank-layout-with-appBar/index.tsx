// ** Next Import
import Link from 'next/link'

// ** MUI Imports
import AppBar from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import { styled, useTheme } from '@mui/material/styles'

// ** Configs
import themeConfig from 'src/configs/themeConfig'

// ** Logo
import Logo from 'src/@core/components/logo'

// ** Hook
import { useSettings } from 'src/@core/hooks/useSettings'

const StyledLink = styled('a')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  textDecoration: 'none',
  marginRight: theme.spacing(8)
}))

const BlankLayoutAppBar = () => {
  // ** Hooks & Vars
  const theme = useTheme()
  const { settings } = useSettings()
  const { skin } = settings

  return (
    <AppBar
      color='default'
      position='sticky'
      elevation={skin === 'bordered' ? 0 : 3}
      sx={{
        backgroundColor: 'background.paper',
        ...(skin === 'bordered' && { borderBottom: `1px solid ${theme.palette.divider}` })
      }}
    >
      <Toolbar
        sx={{
          justifyContent: 'space-between',
          p: theme => `${theme.spacing(0, 6)} !important`,
          minHeight: `${(theme.mixins.toolbar.minHeight as number) - (skin === 'bordered' ? 1 : 0)}px !important`
        }}
      >
        <Link href='/' passHref>
          <StyledLink>
            <Logo width={32} height={32} />
            <Typography
              variant='h5'
              sx={{
                ml: 2,
                lineHeight: 1,
                fontWeight: 700,
                letterSpacing: '-0.45px',
                textTransform: 'capitalize',
                fontSize: '1.75rem !important'
              }}
            >
              {themeConfig.templateName}
            </Typography>
          </StyledLink>
        </Link>
      </Toolbar>
    </AppBar>
  )
}

export default BlankLayoutAppBar
