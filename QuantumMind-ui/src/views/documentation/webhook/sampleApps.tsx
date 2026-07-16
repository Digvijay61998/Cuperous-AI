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

const SampleAppsPara = (props: Props) => {
    // ** Props
    const { drawerWidth, value } = props;

    return (
        <>
            <Box component="main" sx={{ flexGrow:1, px:2 }}>
            
                <Box sx={{ pb:5 }} id='Sample Apps'>
                    <Typography variant='h4' sx={{ pb:'1rem', fontWeight:'600' }}>
                        Sample Apps
                    </Typography>
                    <Typography paragraph>
                        We provide sample apps on GitHub, which you can set up and repurpose, or which you can use to quickly test your Webhooks configuration.
                    </Typography>
                </Box>

                <Box sx={{ pb:5 }} id='Setting up the Sample App'>
                    <Typography variant='h6' sx={{ pb:'1rem', fontWeight:'600' }} >
                        Setting up the Sample App
                    </Typography>
                    <Typography paragraph>
                        Let's walk through setting up a sample app on Heroku:
                    </Typography>
                    <List sx={{ listStyleType: 'disc', pl: 4 }}>
                        <ListItem sx={{ display: 'list-item' }}>
                            Create a free Heroku account if you don't already have one, then sign into it.
                        </ListItem>
                        <ListItem sx={{ display: 'list-item' }}>
                            While signed in, go to GitHub and deploy the app to Heroku. The app name you choose will be a part of your Callback URL, so choose something you can remember. Deploying will take a few seconds.
                        </ListItem>
                        <ListItem sx={{ display: 'list-item' }}>
                            In a new browser tab, go to your app's App Dashboard Settings, and copy your app's App Secret.
                        </ListItem>
                        <ListItem sx={{ display: 'list-item' }}>
                            In your Heroku app's settings, set up two config vars: APP_SECRET and TOKEN. Assign (paste) your App Secret to the APP_SECRET config var, and assign any string to TOKEN. We will include this string in any verification requests when you configure the Webhooks product in the App Dashboard (the app will validate the request on its own).
                        </ListItem>
                    </List>


                    <Typography paragraph>
                        Your app should now be ready to go. Before you return to your App Dashboard to configure the Webhooks product:
                    </Typography>
                    <List sx={{ listStyleType: 'disc', pl: 4 }}>
                        <ListItem sx={{ display: 'list-item' }}>
                            View your Heroku app in a web browser. You should see an empty array ([]). This page will display newly received update notification data, so reload it throughout testing.
                        </ListItem>
                        <ListItem sx={{ display: 'list-item' }}>
                            Your app's Callback URL will be your Heroku app's URL with /facebook added to the end. You will need this Callback URL during product configuration.
                        </ListItem>
                        <ListItem sx={{ display: 'list-item' }}>
                            Copy the TOKEN value you set above; you'll also need this during product configuration.
                        </ListItem>
                    </List>

                    <Typography variant='subtitle1' sx={{ fontWeight:'bold' }}>
                        What's in the Heroku sample app?
                    </Typography>
                    <Typography paragraph>
                        The app uses Node.js and these packages:
                    </Typography>
                    <List sx={{ listStyleType: 'disc', pl: 4 }}>
                        <ListItem sx={{ display: 'list-item' }}>body-parser (for parsing JSON)</ListItem>
                        <ListItem sx={{ display: 'list-item' }}>express (for routes)</ListItem>
                        <ListItem sx={{ display: 'list-item' }}>express-x-hub (for SHA1 support)</ListItem>
                    </List>
                </Box>
                
                <Box sx={{ pb:5 }} id='Verifying the Sample App'>
                    <Typography variant='h6' sx={{ pb:'1rem', fontWeight:'600' }} >
                        Verifying the Sample App
                    </Typography>
                    <Typography paragraph>
                        You can easily verify that your sample app can receive Webhook events.
                    </Typography>
                    <List sx={{ listStyleType: 'disc', pl: 4 }}>
                        <ListItem sx={{ display: 'list-item' }}>Under the Webhooks product in your App Dashboard, click the Test button for any of the Webhook fields.</ListItem>
                        <ListItem sx={{ display: 'list-item' }}>A pop-up dialog will appear showing a sample of what will be sent. Click Send to My Server.</ListItem>
                        <ListItem sx={{ display: 'list-item' }}>You should now see the Webhook information at the Heroku app's URL, or use curl {`https://<your-subdomain>.herokuapp.com`} in a terminal window.</ListItem>
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
                    'Sample Apps', 
                    'Setting up the Sample App', 
                    'Verifying the Sample App',
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

export default SampleAppsPara;