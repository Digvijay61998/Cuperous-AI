
import { createContext, useState, ReactNode, useEffect } from 'react'


// ** ThemeConfig Import
import themeConfig from 'src/configs/themeConfig'

export type ColorSpecificSettings = {
      purple?: string 
      grey?: string 
      green?: string 
      red?: string 
      yellow?: string 
      blue?: string 
      navyblue?: string 
  }
interface botColorProps {
    children: ReactNode
    colorSettings?:ColorSpecificSettings | void
  }


  const initialSettings: ColorSpecificSettings = {
    // purple: themeConfig.botColor.purple,
    // grey: themeConfig.botColor.grey,
    // green: themeConfig.botColor.green,
    // red: themeConfig.botColor.red,
    // yellow: themeConfig.botColor.yellow,
    // blue: themeConfig.botColor.blue,
    // navyblue: themeConfig.botColor.navyblue 
    purple: '#00a7ff',
      grey: '#8592A3',
      green: '#71DD37',
      red: '#FF3E1D',
      yellow: '#FFAB00',
      blue: '#03C3EC',
      navyblue: '#3f51b5',
  }