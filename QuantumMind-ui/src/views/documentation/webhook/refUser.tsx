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

const RefUserPara = (props: Props) => {
    // ** Props
    const { drawerWidth, value } = props;

    return (
        <>
            <Box component="main" sx={{ flexGrow:1, px:2 }}>
            
                <Box sx={{ pb:5 }} id='Webhook'>
                    <Typography variant='h4' sx={{ pb:'1rem', fontWeight:'600' }}>
                        User
                    </Typography>
                    <Typography paragraph>
                        Webhooks allows you to receive real-time HTTP notifications of changes to specific objects in the Facebook Social Graph. For example, we could send you a notification when any of your app Users change their email address or whenever they comment on your Facebook Page. This prevents you from having to query the Graph API for changes to objects that may or may not have happened, and helps you avoid reaching your rate limit.
                    </Typography>
                    <Alert severity='info'>
                        Webhooks for Payments and Webhooks for Messenger have slightly differently configuration steps. If you are setting up a Webhook for either of these products, please refer to their respective documents for setup instructions.
                    </Alert>
                </Box>

                <Box sx={{ pb:5 }} id='Objects, Fields, and Values'>
                    <Typography variant='h6' sx={{ pb:'1rem', fontWeight:'600' }} >
                        Objects, Fields, and Values
                    </Typography>
                    <Typography paragraph>
                        There are many types of objects in the Facebook Social Graph, such as User objects and Page objects, so whenever you configure a Webhook you must first choose an object type. Since different objects have different fields, you must then subscribe to specific fields for that object type. Whenever there's a change to the value of any object field you have subscribed to, we'll send you a notification.
                    </Typography>
                    <Typography paragraph>
                        Notifications are sent to you as HTTP POST requests and contain a JSON payload that describes the change. For example, let's say you set up a User Webhook and subscribed to the Photos field. If one of your app's Users uploads a photo, we'd send you a notification that would look like this:
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

                <Box sx={{ pb:5 }} id='HTTPS Server'>
                    <Typography variant='h6' sx={{ pb:'1rem', fontWeight:'600' }} >
                        HTTPS Server
                    </Typography>
                    <Typography paragraph>
                        Webhooks are sent using HTTPS, so your server must must be able to receive and process HTTPS requests, and it must have a valid TLS/SSL certificate installed. Self-signed certificates are not supported.
                    </Typography>
                </Box>
                
                <Box sx={{ pb:5 }} id='App Review'>
                    <Typography variant='h6' sx={{ pb:'1rem', fontWeight:'600' }} >
                        App Review
                    </Typography>
                    <Typography paragraph>
                        Webhooks does not require App Review. However, in order to receive Webhooks notifications of changes to objects when your app is in Live mode, your app must have been granted relevant permissions to access those objects. See Permissions below.
                    </Typography>
                </Box>
                
                <Box sx={{ pb:5 }} id='Permissions'>
                    <Typography variant='h6' sx={{ pb:'1rem', fontWeight:'600' }} >
                        Permissions
                    </Typography>
                    <Typography paragraph>
                        Before an app can be made public, it typically must go through App Review. During review, apps can request approval for specific permissions, which control the types of data the app can access when using the Graph API.
                    </Typography>
                    <Typography paragraph>
                        Although the Webhooks product does not require App Review, it does respect permissions. This means that even if you set up a Webhook and subscribe to specific fields on an object type, you won't receive notifications of any changes to an object of that type unless:
                    </Typography>
                    <List sx={{ listStyleType: 'disc', pl: 4 }}>
                        <ListItem sx={{ display: 'list-item' }}>your app has been approved for the permission(s) that corresponds to that type of data, and</ListItem>
                        <ListItem sx={{ display: 'list-item' }}>the object that owns the data has granted your app permission to access that data (e.g., a User allowing your app to access their Feed)</ListItem>
                    </List>
                </Box>
                
                <Box sx={{ pb:5 }} id='Development Mode'>
                    <Typography variant='h6' sx={{ pb:'1rem', fontWeight:'600' }} >
                        Development Mode
                    </Typography>
                    <Typography paragraph>
                        Apps in development mode will not receive live webhooks notifications. While an app is in development mode, only test notifications initiated through the app dashboard will be sent.
                    </Typography>
                    <Typography paragraph>
                        Note that development mode behavior is different for Messenger Webhooks Events. Refer to the Webhooks for Messenger document for details.
                    </Typography>
                </Box>
                
                <Box sx={{ pb:5 }} id='Setup'>
                    <Typography variant='h6' sx={{ pb:'1rem', fontWeight:'600' }} >
                        Setup
                    </Typography>
                    <Typography paragraph>
                        To use Webhooks, you will need to set up an endpoint on a secure (HTTPS) server, then add and configure the Webhooks product in your app's dashboard. The rest of these documents explain how to complete both of these steps.
                    </Typography>
                    <Typography paragraph>
                        Ready? Let's get started!
                    </Typography>
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
                    'Webhook', 
                    'Objects, Fields, and Values', 
                    'HTTPS Server', 
                    'App Review', 
                    'Permissions', 
                    'Development Mode',
                    'Setup'
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

export default RefUserPara;