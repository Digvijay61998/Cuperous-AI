declare module '@mui/material/styles' {
  interface Palette {
    customColors: {
      dark: string
      main: string
      light: string
      bodyBg: string
      trackBg: string
      tooltipBg: string
      darkPaperBg: string
      lightPaperBg: string
      tableHeaderBg: string
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
      trackBg?: string
      tooltipBg: string
      darkPaperBg?: string
      lightPaperBg?: string
      tableHeaderBg?: string
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
