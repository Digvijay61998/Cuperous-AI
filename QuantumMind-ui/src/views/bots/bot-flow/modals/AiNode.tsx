// ** React Imports

// ** MUI Imports
import Dialog from '@mui/material/Dialog';
import Divider from '@mui/material/Divider';
// ** Icon Imports
import Icon from 'src/@core/components/icon';
import React from "react"
import { DialogContent, Stack, TextField, Typography } from '@mui/material';
import BotUserInputEditor from 'src/views/bots/bot-components/BotUserInputEditor';
import BotNodeDialogTitle from './common';
import ViewInJson from '../view-node-in-json';
import Autocomplete from "@mui/material/Autocomplete";
import { useState } from 'react';
import axios from 'axios';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';


export default function index(props: any) {
    const [serches, setSearches] = useState<any>([])
    const [filesSelected, setFilesSelected] = useState<any>([])
    const [filesPerNode, setFilesPerNode] = useState<any>([])
    const [filesPerBot, setFilesPerBot] = useState<any>([])
    const [prevSelected, setPrevSelected] = useState<any>([])
    const {
      open,
      title,
      setTitle,
      fullScreen,
      handleClose,
      nodeType, setOpen, nodes, nodeId, setNodes, edges, botId
    } = props;

    const handleSearchChange = async (e : any)=>{
        setTitle(e)
        const response = await axios.post(process.env.NEXT_PUBLIC_API_URL + '/api/trainingdata/search', 
        JSON.stringify({
          botId : botId,
          search : e
        }), {
          headers: {
            'Content-Type': 'application/json'
          }
        });
        console.log("[ search response ]", response.data);
        setSearches(response.data.map((item : any) =>{
          item["label"] = item.fielname
          return item
        }))
        
    }

    const getFilesPerBot = async () =>{
      const response = await axios.post(process.env.NEXT_PUBLIC_API_URL + '/api/trainingdata/bot/' + botId, 
      JSON.stringify({
      }), {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      setFilesPerBot(response.data.map((item : any) =>{
        item["label"] = item.fielname
        return item
      }))
      console.log("LOG FOR FILES PER BOT", response);
    }

    const getFilesPerNode = async ()=>{
      const response = await axios.get(process.env.NEXT_PUBLIC_API_URL + '/api/trainingdata/node/' + nodeId, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      setFilesPerNode(response.data.flat().map((item : any) =>{
        item["label"] = item.fielname
        return item
      }))
      // setFilesSelected(response.data.flat().map((item : any) =>{
      //   item["label"] = item.fielname
      //   return item
      // }))
    }

    const selectFile = (e : any ,params : any, fromNodeSelction : boolean) =>{
      console.log("LOG PARAMS", params);
      if (!e.target.checked) {
        setFilesSelected((prev : any)=>prev.filter((file : any) => file !== params._id))
        fromNodeSelction && setPrevSelected((prev : any)=>prev.filter((file : any) => file !== params._id))
      } else {
        setFilesSelected((prev : any)=>{
          return [...prev, params._id]
        })
        fromNodeSelction && setPrevSelected((prev : any)=>{
          return [...prev, params._id]
        })
      }
    }    

    React.useEffect(() => {
      getFilesPerNode()
      getFilesPerBot()
    }, [])
    
    React.useEffect(()=>{
      const filterdFilesPerBOt = filesPerNode.length ? filesPerBot.filter((item: any)=>{
        return !filesPerNode.some((i: any) => i._id === item._id)
      }) : filesPerBot
      setSearches([...filterdFilesPerBOt])
      setFilesSelected([...filesPerNode.map((file: any)=> file._id)])
    }, [filesPerBot, filesPerNode])

    return (
      <div>
        <Dialog
          fullScreen={fullScreen}
          open={open}
          // onClose={handleClose}
          aria-labelledby="responsive-dialog-bot"
          PaperProps={{ sx: { position: 'fixed', top: 15, right: 15, m: 0 } }}
        >
          <BotNodeDialogTitle id="responsive-dialog-bot" onClose={handleClose}>
            <Stack direction="row" alignItems="center" gap={1}>
              <Icon icon="bxs:user" fontSize={24} />
             <Stack direction='column' justifyContent='flex-start' alignItems='flex-start'>
             <Typography> AI Node <ViewInJson/> </Typography>
            <Typography variant='caption'>Node Id: <strong>{props.nodeId}</strong></Typography>
             </Stack>
            </Stack>
            <div style={{ padding: '16px 0 0 0' }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search For The File Needed"
                value={title || ""}
                onChange={(event) => handleSearchChange(event.target.value || '')}
              />
              <div style={{display : "flex", justifyContent : "start", alignItems : "start", fontSize : "0.9rem"}} >
                Files Selected : {filesSelected.length}
              </div>
              <div style={{display : "flex", justifyContent : "start", alignItems : "start", flexDirection : "column", margin : "0.5em auto 0 0.5em",height : '200px', overflow : "scroll"}} >
                <>
                  {filesPerNode.length && prevSelected.length ?<span>Previously Selected Files</span> : <></>}
                  {
                    filesPerNode.length ? ( filesSelected.length ? filesPerNode.map((search : any)=>{
                      return <ListItem disablePadding >
                        <FormControlLabel label={search.filename} control={<Checkbox defaultChecked={true && filesSelected.filter((file : any) => file === search._id).length > 0} onClick={(e)=>selectFile(e, search, true)} />} />
                    </ListItem>
                    }) : <></> ) : <span></span>
                  }
                </>
                <>
                <span>Files from Bot</span>
                {
                  serches.length ? serches.map((search : any)=>{
                    return <ListItem disablePadding >
                      <FormControlLabel value={filesSelected.filter((file : any) => file === search._id).length > 0} control={<Checkbox onClick={(e)=>selectFile(e, search, false)} />} label={search.filename} />
                  </ListItem>
                  }) : <span>No Files Found</span>
                }
                </>
              </div>
            </div>
          </BotNodeDialogTitle>
          <Divider style={{ margin: 0 }} />
  
          <DialogContent sx={{ p: 4, background: '#fff' }}>
            <BotUserInputEditor
              {...props}
              forAi={true}
              nodes={nodes}
              files={filesSelected}
              edges={edges}
            />
          </DialogContent>
        </Dialog>
      </div>
    );
  }
  