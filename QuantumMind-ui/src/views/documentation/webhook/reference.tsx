// ** MUI Imports
import { Ref,useCallback, useState, useEffect, ReactElement } from 'react'
import { useDispatch, useSelector } from 'react-redux';
import { styled } from '@mui/material/styles';
import { Box, Typography } from "@mui/material";
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField'
import Divider from '@mui/material/Divider';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell, { tableCellClasses } from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';

interface Props {
    drawerWidth: any;
    value?: any;
}

const StyledTableCell = styled(TableCell)(({ theme }) => ({
    [`&.${tableCellClasses.head}`]: {
      backgroundColor: 'grey',
      color: theme.palette.common.white,
    },
    [`&.${tableCellClasses.body}`]: {
      fontSize: 14,
    },
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
    '&:nth-of-type(odd)': {
      backgroundColor: theme.palette.action.hover,
    },
    // hide last border
    '&:last-child td, &:last-child th': {
      border: 0,
    },
}));

const ReferencePara = (props: Props) => {
    // ** Props
    const { drawerWidth, value } = props;

    return (
        <>
            <Box component="main" sx={{ flexGrow:1, px:2 }}>
            
                <Box sx={{ pb:5 }} id='Reference'>
                    <Typography variant='h4' sx={{ pb:'1rem', fontWeight:'600' }}>
                        Reference
                    </Typography>
                    <Typography paragraph>
                        This is a full list of Webhooks topics.
                    </Typography>

                    <Typography variant='subtitle1' sx={{ fontWeight:'bold' }}>
                        Webhooks Topics
                    </Typography>
                    <TableContainer component={Paper}>
                        <Table sx={{ minWidth: 450 }} aria-label="simple table">
                            <TableHead>
                                <TableRow>
                                    <StyledTableCell>Topic</StyledTableCell>
                                    <StyledTableCell>Description</StyledTableCell>
                                </TableRow>
                            </TableHead>

                            <TableBody>
                                <StyledTableRow sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                    <StyledTableCell component="th" scope="row">
                                        Ad Account
                                    </StyledTableCell>
                                    <StyledTableCell>
                                        List of Ad account fields you can subscribe to.
                                    </StyledTableCell>
                                </StyledTableRow>

                                <StyledTableRow sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                    <StyledTableCell component="th" scope="row">
                                        Application
                                    </StyledTableCell>
                                    <StyledTableCell>
                                        Category of updates that are sent to a specific app
                                    </StyledTableCell>
                                </StyledTableRow>

                                <StyledTableRow sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                    <StyledTableCell component="th" scope="row">
                                        Certificate Transparency
                                    </StyledTableCell>
                                    <StyledTableCell>
                                        Category of updates related to Certificate Transparency
                                    </StyledTableCell>
                                </StyledTableRow>
                                
                                <StyledTableRow sx={{ '&:last-child td, &:last-child th': { border: 0 } }} >
                                    <StyledTableCell component="th" scope="row">
                                        Instagram
                                    </StyledTableCell>
                                    <StyledTableCell>
                                        Category of updates relating to activity on Instagram user
                                    </StyledTableCell>
                                </StyledTableRow>
                                
                                <StyledTableRow sx={{ '&:last-child td, &:last-child th': { border: 0 } }} >
                                    <StyledTableCell component="th" scope="row">
                                        Page
                                    </StyledTableCell>
                                    <StyledTableCell>
                                        Full list of page profile fields you can subscribe to. Fields of this topic require at least one page admin to grant the 'manage_pages' permission to your app. The page admin also needs to have at least moderator privileges in order to receive all content.
                                    </StyledTableCell>
                                </StyledTableRow>
                                
                                <StyledTableRow sx={{ '&:last-child td, &:last-child th': { border: 0 } }} >
                                    <StyledTableCell component="th" scope="row">
                                        Permissions
                                    </StyledTableCell>
                                    <StyledTableCell>
                                        Category of updates relating to a user's granting or revoking a permission to your app
                                    </StyledTableCell>
                                </StyledTableRow>
                                
                                <StyledTableRow sx={{ '&:last-child td, &:last-child th': { border: 0 } }} >
                                    <StyledTableCell component="th" scope="row">
                                        User
                                    </StyledTableCell>
                                    <StyledTableCell>
                                        Full list of user profile fields that you can subscribe to.
                                    </StyledTableCell>
                                </StyledTableRow>
                                
                                <StyledTableRow sx={{ '&:last-child td, &:last-child th': { border: 0 } }} >
                                    <StyledTableCell component="th" scope="row">
                                        Whatsapp Business Account
                                    </StyledTableCell>
                                    <StyledTableCell>
                                        Category of updates relating to a WhatsApp business account.
                                    </StyledTableCell>
                                </StyledTableRow>
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Box>
            </Box>
            <Box
                sx={{
                width: drawerWidth,
                flexShrink: 0,
                [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box' },
                }}
            >
                <Typography sx={{ mb: 1, fontWeight: 600, color: 'text.secondary' }}>On This Page</Typography>
                <Box sx={{ overflow: 'auto' }}>
                {[
                    'Reference',
                ].map((text, index) => (
                    <Box key={index}>
                    <Typography 
                        component={'a'} 
                        href={`#${text}`}
                        sx={{ mb: 2, fontSize: 13, }}
                        rel="noopener noreferrer"
                    >
                        {text}
                    </Typography>
                    </Box>
                ))}
                </Box>
            </Box>
        </>
    );
};

export default ReferencePara;