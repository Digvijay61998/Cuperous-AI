export function formatAmPm(date: Date) {
    var hours: number = date.getHours();
    var minutes: any = date.getMinutes();
    var ampm: string = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    minutes = minutes < 10 ? '0'+ minutes : minutes;
    var strTime = hours + ':' + minutes + ' ' + ampm;
    return strTime;
  }

 export const langList: any = [
    { value:"da", label:"danish", },
    { value:"nl", label:"dutch" },
    { value:"hi", label:"Hindi" },
    { value:"en", label:"english" },
    { value:"fi", label:"finnish" },
    { value:"fr", label:"french" },
    { value:"de", label:"german" },
    { value:"hu", label:"hungarian" },
    { value:"it", label:"italian" },
    { value:"nb", label:"norwegian" },
    { value:"pt", label:"portuguese" },
    { value:"ro", label:"romanian" },
    { value:"ru", label:"russian" },
    { value:"es", label:"spanish" },
    { value:"sv", label:"swedish" },
    { value:"tr", label:"turkish" },
    {value:"km", label:"Khmer"},
    
  ];


