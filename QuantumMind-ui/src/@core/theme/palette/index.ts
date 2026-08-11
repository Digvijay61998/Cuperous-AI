// ** Type Imports
import { PaletteMode } from '@mui/material'
import { Skin } from 'src/@core/layouts/types'

const DefaultPalette = (mode: PaletteMode, skin: Skin) => {
  // ** Vars
  // const whiteColor = '#cb494a'
  // #d8eeff
  // 00a7ff
  const whiteColor = '#fff'
  const lightColor = '50, 71, 92'
  const darkColor = '219, 219, 235'
  const darkPaperBgColor = '#2B2C40'
  const mainColor = mode === 'light' ? lightColor : darkColor

  // ** JarCube brand colours, sampled from public/logo.png.
  // The logo is a linear gradient running left-to-right across the mark:
  //   far-left speed lines  #C700FF  (violet)
  //   body of the cube      #8A00FF  (purple — the single most common pixel colour)
  //   top-right facet       #48A5FE  (sky blue)
  const brandViolet = '#C700FF'
  const brandPurple = '#8A00FF'
  const brandPurpleDark = '#6E00D6'
  const brandBlue = '#48A5FE'
  const brandGradient = `linear-gradient(90deg, ${brandViolet} 0%, ${brandPurple} 55%, ${brandBlue} 100%)`

  const defaultBgColor = () => {
    if (skin === 'bordered' && mode === 'light') {
      return whiteColor
    } else if (skin === 'bordered' && mode === 'dark') {
      return darkPaperBgColor
    } else if (mode === 'light') {
      return '#F5F5F9'
    } else return '#232333'
  }

  return {
    customColors: {
      // dark: darkColor,
      dark: '#fff',
      // main: mainColor,
      main: '#fff',
      light: lightColor,
      lightPaperBg: whiteColor,
      darkPaperBg: darkPaperBgColor,
      sideBarBg:  mode === 'light' ? '#fff' : '#232333',
      bodyBg: mode === 'light' ? '#F5F5F9' : '#232333', // Same as palette.background.default but doesn't consider bordered skin
      trackBg: mode === 'light' ? '#EBEEF0' : '#444463',
      tooltipBg: mode === 'light' ? '#233446' : '#6b6c9d',
      tableHeaderBg: mode === 'light' ? '#F3F4F6' : '#353649',

      // ** Brand gradient, sampled directly from the JarCube logo (public/logo.png).
      // The mark is a left-to-right ramp: violet #C700FF -> purple #8A00FF -> sky blue #48A5FE.
      logoGradientStart: brandViolet,
      logoGradientMid: brandPurple,
      logoGradientEnd: brandBlue,
      logoGradient: brandGradient
    },
    botColor:{
      purple: '#00a7ff',
      grey: '#8592A3',
      green: '#71DD37',
      red: '#FF3E1D',
      yellow: '#FFAB00',
      blue: '#03C3EC',
      navyblue: '#3f51b5',
    },
    mode: mode,
    common: {
      black: '#000',
      white: whiteColor
    },
    primary: {
      light: '#8082FF',
      main: '#2241FF',
      dark: '#fff',
      contrastText: whiteColor
    },
    // ** Secondary is the JarCube brand colour, taken from the logo gradient.
    // Previously this was the blue '##2241FF' — note the double '#', which made it an
    // invalid CSS colour, so every `secondary.main` consumer silently fell back to the
    // MUI default purple. Now it resolves to the logo's dominant purple.
    secondary: {
      light: brandViolet,
      main: brandPurple,
      dark: brandPurpleDark,
      contrastText: whiteColor
    },
    error: {
      light: '#FF5B3F',
      main: '#FF3E1D',
      dark: '#fff',
      contrastText: whiteColor
    },
    warning: {
      light: '#FFB826',
      main: '#FFAB00',
      dark: '#fff',
      contrastText: whiteColor
    },
    info: {
      light: '#29CCEF',
      main: '#03C3EC',
      dark: '#03B1D7',
      contrastText: whiteColor
    },
    success: {
      light: '#86E255',
      main: '#71DD37',
      dark: '#67C932',
      contrastText: whiteColor
    },
    grey: {
      50: '#FAFAFA',
      100: '#F5F5F5',
      200: '#EEEEEE',
      300: '#E0E0E0',
      400: '#BDBDBD',
      500: '#9E9E9E',
      600: '#757575',
      700: '#616161',
      800: '#424242',
      900: '#212121',
      A100: '#F5F5F5',
      A200: '#EEEEEE',
      A400: '#BDBDBD',
      A700: '#616161'
    },
    text: {
      primary: `rgba(${mainColor}, 0.87)`,
      secondary: `rgba(${mainColor}, 0.6)`,
      disabled: `rgba(${mainColor}, 0.38)`
    },
    divider: `rgba(${mainColor}, 0.12)`,
    background: {
      paper: mode === 'light' ? whiteColor : darkPaperBgColor,
      default: defaultBgColor()
    },
    action: {
      active: `rgba(${mainColor}, 0.54)`,
      hover: `rgba(${mainColor}, 0.04)`,
      selected: `rgba(${mainColor}, 0.08)`,
      disabled: `rgba(${mainColor}, 0.26)`,
      disabledBackground: `rgba(${mainColor}, 0.12)`,
      focus: `rgba(${mainColor}, 0.12)`
    }
  }
}

export default DefaultPalette
