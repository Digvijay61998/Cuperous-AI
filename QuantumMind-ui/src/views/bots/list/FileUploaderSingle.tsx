// ** React Imports
import { useState, SyntheticEvent } from 'react'

// ** MUI Imports
import Box from '@mui/material/Box'
import Link from '@mui/material/Link'
import { styled, useTheme } from '@mui/material/styles'
import Typography, { TypographyProps } from '@mui/material/Typography'
import Papa from "papaparse";

// ** Third Party Imports
import { useDropzone } from 'react-dropzone'

interface FileProp {
  name: string
  type: string
  size: number
}

// Styled component for the upload image inside the dropzone area
const Img = styled('img')(({ theme }) => ({
  width: 300,
  [theme.breakpoints.up('md')]: {
    marginRight: theme.spacing(15.75)
  },
  [theme.breakpoints.down('md')]: {
    width: 250,
    marginBottom: theme.spacing(4)
  },
  [theme.breakpoints.down('sm')]: {
    width: 200
  }
}))

// Styled component for the heading inside the dropzone area
const HeadingTypography = styled(Typography)<TypographyProps>(({ theme }) => ({
  marginBottom: theme.spacing(5),
  [theme.breakpoints.down('sm')]: {
    marginBottom: theme.spacing(4)
  }
}))
interface bulkFileProps {
  file: any;
  setFile: any;
}
const FileUploaderSingle = (props:bulkFileProps) => {
  const { file, setFile } = props;
  // ** State
  const [files, setFiles] = useState<File[]>([])
  // ** Hook
  const theme = useTheme()
  const { acceptedFiles, getRootProps, getInputProps } = useDropzone({
    multiple: false,
    accept: {
      // accept only .json file 
      'text/json': ['.json']
    },
    onDrop: (acceptedFiles: File[]) => {
      setFiles(acceptedFiles)
      setFile(acceptedFiles[0])
    }
  })
console.log('files', files )
  const handleLinkClick = (event: SyntheticEvent) => {
    event.preventDefault()
  }

  const img = files.map((file: FileProp) => (
    <div key={file.name} className='single-file'>{file.name}</div>
  ))

  return (
    <Box {...getRootProps({ className: 'dropzone' })} 
    // sx={acceptedFiles.length ? { height: 450 } : {}}
    style={{
      display:'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      padding: "1rem",
      margin: "1rem 0",
      borderRadius: '6px',
      border: '2px dashed rgba(93, 89, 98, 0.22)'
    }}
    >
      <input {...getInputProps()} />
      <Box sx={{ display: 'flex', flexDirection: ['column', 'column', 'row'], alignItems: 'center' }}>
        {/* <Img alt='Upload img' src={/images/misc/upload-{theme.palette.mode}.png} /> */}
        <Box sx={{ display: 'flex', flexDirection: 'column', textAlign: ['center', 'center', 'inherit'] }}>
          {/* <HeadingTypography variant='h5'>Drop files here or click to upload.</HeadingTypography> */}
          <Typography color='textSecondary'>
            Drop your json file here or click{' '}
            <Link href='/' onClick={handleLinkClick}>
              browse
            </Link>{' '}
            thorough your machine
          </Typography>
        </Box>
      </Box>
      {files.length ? img : null}
    </Box>
  )
}

export default FileUploaderSingle