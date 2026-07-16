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

const createSampleRequest = `curl -F "object=user" \\
    -F "callback_url=https://your-clever-domain-name.com/webhooks" \\
    -F "fields=photos" \\
    -F "verify_token=your-verify-token" \\
    -F "access_token=your-app-access-token" \\
    "https://graph.facebook.com/188559381496048/subscriptions"`;
const createSampleResponse = `{
    "success": "true"
}`;

const getSampleRequest = `GET graph.facebook.com/188559381496048/subscriptions`;
const getSampleResponse = `{
    "data": [
        {
            "object": "user",
            "callback_url": "https://your-clever-domain-name.com/webhooks",
            "active": true,
            "fields": [
                {
                    "name": "photos",
                    "version": "v2.10"
                },
                {
                    "name": "feed",
                    "version": "v2.10"
                }
            ]
        }
    ]
}`;

const SubscriptionEdgePara = (props: Props) => {
    // ** Props
    const { drawerWidth, value } = props;

    return (
        <>
            <Box component="main" sx={{ flexGrow:1, px:2 }}>
            
                <Box sx={{ pb:5 }} id='Subscription Edge'>
                    <Typography variant='h4' sx={{ pb:'1rem', fontWeight:'600' }}>
                        Subscription Edge
                    </Typography>
                    <Typography paragraph>
                        You can use the Graph API's /app/subscriptions edge to configure and manage your app's Webhooks product. Refer to our /app/subscriptions documentation to see which operations you can perform with this edge, and any permissions they require. This document only covers a few common operations.
                    </Typography>
                </Box>

                <Box sx={{ pb:5 }} id='Creating Subscriptions'>
                    <Typography variant='h6' sx={{ pb:'1rem', fontWeight:'600' }} >
                        Creating Subscriptions
                    </Typography>
                    <Typography paragraph>
                        To subscribe to an object and its fields, send a POST request to the /app/subscriptions edge and include the following parameters:
                    </Typography>
                    <List sx={{ listStyleType: 'disc', pl: 4 }}>
                        <ListItem sx={{ display: 'list-item' }}>object — The type of object you want to set up field subscriptions for (e.g., user).</ListItem>
                        <ListItem sx={{ display: 'list-item' }}>callback_url — Your endpoint's URL.</ListItem>
                        <ListItem sx={{ display: 'list-item' }}>verify_token — A string that we will include whenever we send you a verification request.</ListItem>
                        <ListItem sx={{ display: 'list-item' }}>fields — The fields you want to subscribe to (e.g., photos).</ListItem>
                    </List>
                    <Typography paragraph>
                        For example, if your app's ID were 188559381496048 and you want to be notified when your app's user publish a new photo, you could do this:
                    </Typography>

                    <Typography variant='subtitle1' sx={{ fontWeight:'bold' }}>
                        Sample Request
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
                      value={createSampleRequest}
                    ></TextField>
                    <br /><br />
                    
                    <Typography variant='subtitle1' sx={{ fontWeight:'bold' }}>
                        Sample Response
                    </Typography>
                    <TextField
                      fullWidth
                      multiline
                      label="If successful:"
                      minRows={3}
                      spellCheck={false}
                      variant="filled"
                      sx={{
                        '& .MuiOutlinedInput-root': { alignItems: 'baseline' },
                      }}
                      value={createSampleResponse}
                    ></TextField>
                </Box>

                <Box sx={{ pb:5 }} id='Getting Subscription Information'>
                    <Typography variant='h6' sx={{ pb:'1rem', fontWeight:'600' }} >
                        Getting Subscription Information
                    </Typography>
                    <Typography paragraph>
                        To see the object and field subscriptions that you have set up for your app, send a GET request the /app/subscriptions edge. For example, if your app's ID were 188559381496048, you could do this:
                    </Typography>

                    <Typography variant='subtitle1' sx={{ fontWeight:'bold' }}>
                        Sample Request
                    </Typography>
                    <TextField
                      fullWidth
                      multiline
                      minRows={1}
                      spellCheck={false}
                      variant="filled"
                      sx={{
                        '& .MuiOutlinedInput-root': { alignItems: 'baseline' },
                      }}
                      value={getSampleRequest}
                    ></TextField>
                    <br /><br />
                    
                    <Typography variant='subtitle1' sx={{ fontWeight:'bold' }}>
                        Sample Response
                    </Typography>
                    <TextField
                      fullWidth
                      multiline
                      minRows={3}
                      spellCheck={false}
                      variant="filled"
                      sx={{
                        '& .MuiOutlinedInput-root': { alignItems: 'baseline' },
                      }}
                      value={getSampleResponse}
                    ></TextField>
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
                    'Subscription Edge', 
                    'Creating Subscriptions', 
                    'Getting Subscription Information'
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

export default SubscriptionEdgePara;