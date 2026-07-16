// ** React Imports
import { ChangeEvent, MouseEvent, useState, SyntheticEvent } from 'react'

// ** MUI Imports
import Box, { BoxProps } from '@mui/material/Box'
import Card from '@mui/material/Card'
import Grid from '@mui/material/Grid'
import CardHeader from '@mui/material/CardHeader'
import Typography from '@mui/material/Typography'
import CardContent from '@mui/material/CardContent'
import { styled } from '@mui/material/styles'
import MuiDrawer, { DrawerProps } from '@mui/material/Drawer'
// ** Type Import
import { Settings } from 'src/@core/context/settingsContext'

// ** Hook Import
import { useSettings } from 'src/@core/hooks/useSettings'

interface State {
  password: string
  showPassword: boolean
}

type Props={
  handleBotConfigColor:(color:string) => void
}

function ColorSchemeConfig(props: Props){
  const {handleBotConfigColor}=props
  // ** States
  const [values, setValues] = useState<State>({
    password: '',
    showPassword: false
  })
  const [confirmPassValues, setConfirmPassValues] = useState<State>({
    password: '',
    showPassword: false
  })

  // const handleChange = (prop: keyof State) => (event: ChangeEvent<HTMLInputElement>) => {
  //   setValues({ ...values, [prop]: event.target.value })
  // }

  const handleConfirmPassChange = (prop: keyof State) => (event: ChangeEvent<HTMLInputElement>) => {
    setConfirmPassValues({ ...confirmPassValues, [prop]: event.target.value })
  }
  const handleClickShowPassword = () => {
    setValues({ ...values, showPassword: !values.showPassword })
  }

  const handleClickConfirmPassShow = () => {
    setConfirmPassValues({ ...confirmPassValues, showPassword: !confirmPassValues.showPassword })
  }

  const handleMouseDownPassword = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
  }


  const Toggler = styled(Box)<BoxProps>(({ theme }) => ({
    right: 0,
    top: '50%',
    display: 'flex',
    cursor: 'pointer',
    position: 'fixed',
    padding: theme.spacing(2),
    zIndex: theme.zIndex.modal,
    transform: 'translateY(-50%)',
    color: theme.palette.common.white,
    backgroundColor: theme.palette.primary.main,
    borderTopLeftRadius: theme.shape.borderRadius,
    borderBottomLeftRadius: theme.shape.borderRadius
  }))
  
  const Drawer = styled(MuiDrawer)<DrawerProps>(({ theme }) => ({
    width: 400,
    zIndex: theme.zIndex.modal,
    '& .MuiFormControlLabel-root': {
      marginRight: '0.6875rem'
    },
    '& .MuiDrawer-paper': {
      border: 0,
      width: 400,
      zIndex: theme.zIndex.modal,
      boxShadow: theme.shadows[9]
    }
  }))

  const ColorBox = styled(Box)<BoxProps>(({ theme }) => ({
    width: 45,
    height: 45,
    cursor: 'pointer',
    margin: theme.spacing(2.5, 1.75, 1.75),
    borderRadius: theme.shape.borderRadius,
    transition: 'margin .25s ease-in-out, width .25s ease-in-out, height .25s ease-in-out, box-shadow .25s ease-in-out',
    '&:hover': {
      boxShadow: theme.shadows[4]
    }
  }))

    const { settings, saveSettings } = useSettings()

    const {
      
      themeColor,
      
    } = settings
  
    const handleChange = (field: keyof Settings, value: Settings[keyof Settings]): void => {
      saveSettings({ ...settings, [field]: value })
    }


  return (

    <Grid container spacing={5}>
      <Grid item xs={8}>
        
            <form onSubmit={e => e.preventDefault()}>
              <Grid container spacing={5}>

                <Grid item xs={12}> 
                  <Typography>Color Scheme</Typography>
                  <Box sx={{ display: 'flex' }}>
                    <ColorBox
                      onClick={() => handleBotConfigColor('#00a7ff')}
                      sx={{
                        backgroundColor: '#00a7ff',borderRadius: "50%",cursor:"pointer",
                        ...(themeColor === 'primary'
                          ? { width: 33, height: 33, m: theme => theme.spacing(1.5, 0.75, 0) }
                          : {})
                      }}
                    />
                    <ColorBox
                      onClick={() => handleBotConfigColor( '#8592A3')}
                      sx={{
                        backgroundColor: '#8592A3',borderRadius: "50%",cursor:"pointer",
                        ...(themeColor === 'primary'
                          ? { width: 33, height: 33, m: theme => theme.spacing(1.5, 0.75, 0) }
                          : {})
                      }}
                    />
                    <ColorBox
                      onClick={() => handleBotConfigColor( '#71DD37')}
                      
                      sx={{
                        backgroundColor: '#71DD37',borderRadius: "50%",cursor:"pointer",
                        ...(themeColor === 'primary'
                          ? { width: 33, height: 33, m: theme => theme.spacing(1.5, 0.75, 0) }
                          : {})
                      }}
                    />
                    <ColorBox
                      onClick={() => handleBotConfigColor( '#FF3E1D')}
                      
                      sx={{
                        backgroundColor: '#FF3E1D',borderRadius: "50%",cursor:"pointer",
                        ...(themeColor === 'primary'
                          ? { width: 33, height: 33, m: theme => theme.spacing(1.5, 0.75, 0) }
                          : {})
                      }}
                    />
                    <ColorBox
                      onClick={() => handleBotConfigColor( '#FFAB00')}
                      
                      sx={{
                        backgroundColor: '#FFAB00',borderRadius: "50%",cursor:"pointer",
                        ...(themeColor === 'primary'
                          ? { width: 33, height: 33, m: theme => theme.spacing(1.5, 0.75, 0) }
                          : {})
                      }}
                    />
                    <ColorBox
                      onClick={() => handleBotConfigColor( '#03C3EC')}
                      
                      sx={{
                        backgroundColor: '#03C3EC',borderRadius: "50%",cursor:"pointer",
                        ...(themeColor === 'primary'
                          ? { width: 33, height: 33, m: theme => theme.spacing(1.5, 0.75, 0) }
                          : {})
                      }}
                    />
                  </Box>
                </Grid>
            
              </Grid>
            </form>
          
      </Grid>
    </Grid>
  )
}

export default ColorSchemeConfig
