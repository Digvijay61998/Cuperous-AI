declare module '@mui/material/styles' {
  interface Palette {
    customColors: {
      dark: string
      main: string
      light: string
      bodyBg: string
      sideBarBg: string
      trackBg: string
      tooltipBg: string
      darkPaperBg: string
      lightPaperBg: string
      tableHeaderBg: string

      /**
       * Brand gradient sampled from the JarCube logo (public/logo.png).
       * The mark runs left-to-right violet -> purple -> sky blue.
       */
      logoGradient: string
      logoGradientStart: string
      logoGradientMid: string
      logoGradientEnd: string
    },
    botColor: {
      purple: string 
      grey: string 
      green: string 
      red: string 
      yellow: string 
      blue: string 
      navyblue: string 
    }
  }
  interface PaletteOptions {
    customColors?: {
      dark?: string
      main?: string
      light?: string
      bodyBg?: string
      sideBarBg?: string
      trackBg?: string
      tooltipBg: string
      darkPaperBg?: string
      lightPaperBg?: string
      tableHeaderBg?: string

      /** Brand gradient sampled from the JarCube logo (public/logo.png). */
      logoGradient?: string
      logoGradientStart?: string
      logoGradientMid?: string
      logoGradientEnd?: string
    },
    botColor?:{
      purple?: string 
      grey?: string 
      green?: string 
      red?: string 
      yellow?: string 
      blue?: string 
      navyblue?: string 
    }
  }
}

export {}
