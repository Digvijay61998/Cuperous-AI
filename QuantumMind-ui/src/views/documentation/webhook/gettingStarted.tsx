// ** MUI Imports
import { Ref,useCallback, useState, useEffect, ReactElement } from 'react'
import { useDispatch, useSelector } from 'react-redux';

import { Alert, Box, Typography } from "@mui/material";
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField'
import Divider from '@mui/material/Divider';

// ** Icon Imports
import { RootState, AppDispatch } from 'src/store';
import ListItem from '@mui/material/ListItem';
import List from '@mui/material/List';


interface Props {
    drawerWidth: any;
    value?: any;
}

const getSampleNotification = `{
    "entry": [
        {
        "time": 1520383571,
        "changes": [
            {
            "field": "photos",
            "value": {
                "verb": "update",
                "object_id": "10211885744794461"
            }
            }
        ],
        "id": "10210299214172187",
        "uid": "10210299214172187"
        }
    ],
    "object": "user"
}`;

const GettingStartedPara = (props: Props) => {
    // ** Props
    const { drawerWidth, value } = props;

    return (
        <>
            <Box component="main" sx={{ flexGrow:1, px:2 }}>
            
                <Box sx={{ pb:5 }} id='Getting Started'>
                    <Typography variant='h4' sx={{ pb:'1rem', fontWeight:'600' }}>
                        Getting Started
                    </Typography>
                    <Typography paragraph>
                        This document explains how to set up a Webhook that will notify you whenever your app's Users publish any changes to their User photos. Once you understand how to set up this Webhook you will know how to set up all Webhooks.
                    </Typography>
                    <Typography paragraph>
                        Setting up any Webhook requires you to:
                    </Typography>
                    <List sx={{ listStyleType: 'disc', pl: 4 }}>
                        <ListItem sx={{ display: 'list-item' }}>Create an endpoint on a secure server that can process HTTPS requests.</ListItem>
                        <ListItem sx={{ display: 'list-item' }}>Configure the Webhooks product in your app's App Dashboard.</ListItem>
                    </List>
                    <Typography paragraph>
                        These steps are explained in detail below.
                    </Typography>
                </Box>

                <Box sx={{ pb:5 }} id='Creating an Endpoint'>
                    <Typography variant='h6' sx={{ pb:'1rem', fontWeight:'600' }} >
                        Creating an Endpoint
                    </Typography>
                    <Typography paragraph>
                        Your endpoint must be able to process two types of HTTPS requests: Verification Requests and Event Notifications. Since both requests use HTTPs, your server must have a valid TLS or SSL certificate correctly configured and installed. Self-signed certificates are not supported.
                    </Typography>
                    <Typography paragraph>
                        The sections below explain what will be in each type of request and how to respond to them. Alternatively, you can use our sample app which is already configured to process these requests.
                    </Typography>
                </Box>

                <Box sx={{ pb:5 }} id='Verification Requests'>
                    <Typography variant='h6' sx={{ pb:'1rem', fontWeight:'600' }} >
                        Verification Requests
                    </Typography>
                    <Typography paragraph>
                        Webhooks are sent using HTTPS, so your server must must be able to receive and process HTTPS requests, and it must have a valid TLS/SSL certificate installed. Self-signed certificates are not supported.
                    </Typography>
                    
                    <Typography variant='subtitle2'>
                        Sample Notification
                    </Typography>
                    <TextField
                      fullWidth
                      multiline
                      minRows={6}
                      spellCheck={false}
                      variant="filled"
                      sx={{
                        '& .MuiOutlinedInput-root': { alignItems: 'baseline' },
                      }}
                      value={getSampleNotification}
                    ></TextField>
                </Box>
                
                <Box sx={{ pb:5 }} id='Event Notifications'>
                    <Typography variant='h6' sx={{ pb:'1rem', fontWeight:'600' }} >
                        Event Notifications
                    </Typography>
                    <Typography paragraph>
                        Webhooks does not require App Review. However, in order to receive Webhooks notifications of changes to objects when your app is in Live mode, your app must have been granted relevant permissions to access those objects. See Permissions below.
                    </Typography>
                    
                    <Alert severity='info'>
                        Webhooks for Payments and Webhooks for Messenger have slightly differently configuration steps. If you are setting up a Webhook for either of these products, please refer to their respective documents for setup instructions.
                    </Alert>
                </Box>
                
                <Box sx={{ pb:5 }} id='Configuring the Webhooks Product'>
                    <Typography variant='h6' sx={{ pb:'1rem', fontWeight:'600' }} >
                        Configuring the Webhooks Product
                    </Typography>
                    <Typography paragraph>
                        Apps in development mode will not receive live webhooks notifications. While an app is in development mode, only test notifications initiated through the app dashboard will be sent.
                    </Typography>
                    <Typography paragraph>
                        Note that development mode behavior is different for Messenger Webhooks Events. Refer to the Webhooks for Messenger document for details.
                    </Typography>
                </Box>
                
                <Box sx={{ pb:5 }} id='Next Steps'>
                    <Typography variant='h6' sx={{ pb:'1rem', fontWeight:'600' }} >
                        Next Steps
                    </Typography>
                    <Typography paragraph>
                        Now that you know how to set up Webhooks, you may want to refer our additional documents that describe the extra steps involved when setting up Webhooks for specific products:
                    </Typography>
                    
                    <List sx={{ listStyleType: 'disc', pl: 4 }}>
                        <ListItem sx={{ display: 'list-item' }}>
                            Webhooks for Ad Accounts
                        </ListItem>
                        <ListItem sx={{ display: 'list-item' }}>
                            Webhooks for Certificate Transparency
                        </ListItem>
                        <ListItem sx={{ display: 'list-item' }}>
                            Webhooks for Instagram
                        </ListItem>
                        <ListItem sx={{ display: 'list-item' }}>
                            Webhooks for Leads
                        </ListItem>
                        <ListItem sx={{ display: 'list-item' }}>
                            Webhooks for Messenger
                        </ListItem>
                        <ListItem sx={{ display: 'list-item' }}>
                            Webhooks for Pages
                        </ListItem>
                        <ListItem sx={{ display: 'list-item' }}>
                            Webhooks for Payments
                        </ListItem>
                        <ListItem sx={{ display: 'list-item' }}>
                            Webhooks for WhatsApp
                        </ListItem>
                    </List>
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
                    'Getting Started', 
                    'Creating an Endpoint', 
                    'Verification Requests', 
                    'Event Notifications', 
                    'Configuring the Webhooks Product', 
                    'Next Steps'
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

export default GettingStartedPara;