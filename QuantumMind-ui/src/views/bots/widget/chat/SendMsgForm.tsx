// ** React Imports
import { SyntheticEvent, useRef, useState } from 'react';

// ** MUI Imports
import Box, { BoxProps } from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import { styled } from '@mui/material/styles';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import { toast } from 'react-hot-toast';
import { useSelector } from 'react-redux';
import { RootState } from 'src/store';
import env from 'src/configs/environments';
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
// ** Icon Imports
import { Icon } from '@iconify/react';
import Axios from 'src/helper/Axios';
import axios from 'axios';
import { Stack, Typography } from "@mui/material";

// ** Types

// ** Styled Components
const ChatFormWrapper = styled(Box)<BoxProps>(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  boxShadow: theme.shadows[1],
  padding: theme.spacing(1.25, 1),
  justifyContent: 'space-between',
  borderRadius: theme.shape.borderRadius,
  backgroundColor: theme.palette.background.paper,
}));

const Form = styled('form')(({ theme }) => ({
  padding: theme.spacing(0, 2, 2),
}));

const SendMsgForm = (props: any) => {
  // ** Props
  const { socket, botStyles, visitorId, setIsCameraOpen } = props;
  const { accessToken, languages } = useSelector(
    (state: RootState) => state.preview
  );
  // ** State
  const [msg, setMsg] = useState<string>("");
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const [lang, setLang] = useState<any>({});

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };
  const handleSendMsg = (e: SyntheticEvent) => {
    e.preventDefault();
    const message = {
      value: msg,
      type: "text",
      senderId: 'preview_visitor',
      time: new Date().toISOString(),
      id: new Date().getTime(),
    };
    socket?.emit("events", {
      event: "chat-message-bot",
      data: { message: message.value, language: lang?.code },
    });
    // messageArray.push(message)
    props.updatemyMessages(message);
    setMsg("");
  };

  const handleCameraAction = (e: SyntheticEvent) => {
    e.preventDefault();
    const message = {
      value: true,
      type: "camera",
      senderId: 'preview_visitor',
      time: new Date().toISOString(),
      id: new Date().getTime(),
    };
    props.updatemyMessages(message);
    setIsCameraOpen((pre: boolean)=>!pre);
  };

  const handleUploadImage = async (e: any) => {
    var file = e.target.files[0];
    const imageUrl = await uploadFileServer(e, file);
    const message = {
      value: imageUrl,
      type: "image",
      senderId: 'preview_visitor',
      time: new Date().toISOString(),
      id: new Date().getTime(),
    };
    socket?.emit("events", {
      event: "chat-message-bot",
      data: { message: message.value, type: "image" },
    });
    // messageArray.push(message)
    props.updatemyMessages(message);
  };

  const uploadFileServer = async (e: any, file: any) => {
    if (file.size > 2240032) {
      toast.error("Try to upload less than 2MB");
      return;
    }
    try {
      let formData = new FormData();
      formData.append("file", file);
      const res: any = await Axios.post(`/file`, formData, {
        headers: {
          Authorization: "Bearer " + accessToken,
        },
      });
      return `${process.env.NEXT_PUBLIC_BACKEND_URL}${res.data.url}`;
    } catch (error: any) {
      toast.error(error.response.data.message || error.message || "Failed...");
      return;
    }
  };

  const handleConvertLang = async () => {
    const msgArr: any = msg.split(" ");
    const text: string = msgArr[msgArr.length - 2];
    try {
       const res = await axios.post(
        `https://www.google.com/inputtools/request?text=${text}&itc=${lang.value}&num=13&cp=0&cs=1&ie=utf-8&oe=utf-8&app=demopage`
      );
      if (res.data.length > 1 && res.data[0] === "SUCCESS") {
        const result: string = res.data[1][0][1][0];
        const oldMsg: string = msgArr.slice(0, -2).join(" ");
        const newMsg: string = oldMsg + " " + result + " ";
        setMsg(newMsg);
      }
    } catch (error: any) {
      console.log("TRANSLATE API AXIOS ERROR >>> ", error);
    }
  };

  return (
    <Form
      onSubmit={handleSendMsg}
      sx={{ bottom: 2, position: "absolute", width: "95%" }}
    >
      <ChatFormWrapper>
        <Box sx={{ flexGrow: 1, display: "flex", alignItems: "center" }}>
          <TextField
            fullWidth
            size="small"
            value={msg}
            inputProps={{
              min: 1,
              maxLength: 180,
            }}
            onKeyUp={(e: any) => {
              if (e.keyCode === 32) {
                if (lang !== "") {
                  handleConvertLang();
                }
              }
            }}
            required
            placeholder="Type your message here…"
            onChange={(e) => setMsg(e.target.value)}
            sx={{
              "& .Mui-focused": { boxShadow: 0 },
              "& .MuiOutlinedInput-input": { pl: 0 },
              "& fieldset": { border: "0 !important" },
            }}
          />
        </Box>
        <Box sx={{ display: "flex", alignItems: "center" }}>
          {languages && languages.length > 0 && (
            <Tooltip placement="top" title="Select translate to language" arrow>
              <IconButton
                size="small"
                component="label"
                color="primary"
                id="demo-positioned-button"
                aria-controls={open ? "demo-positioned-menu" : undefined}
                aria-haspopup="true"
                aria-expanded={open ? "true" : undefined}
                onClick={handleClick}
              >
                <Icon icon="mdi:spoken-language" />
              </IconButton>
            </Tooltip>
          )}
          <Menu
            id="demo-positioned-menu"
            aria-labelledby="demo-positioned-button"
            anchorEl={anchorEl}
            open={open}
            onClose={handleClose}
            anchorOrigin={{
              vertical: "top",
              horizontal: "left",
            }}
            sx={{mb: 10}}
            transformOrigin={{
              vertical: "top",
              horizontal: "left",
            }}
          >
            <Stack
              direction="row"
              justifyContent="flex-start"
              alignItems="flex-start"
              width="100%"
            >
              <Typography
                variant="button"
                display="block"
                gutterBottom
                sx={{ p: 1, fontWeight: "bold", textTransform: "unset" }}
              >
                <Icon icon="mdi:language" fontSize={21} color="grey" />
              </Typography>
              <Typography
                variant="button"
                display="block"
                gutterBottom
                sx={{ p: 1, fontWeight: "bold", textTransform: "unset" }}
              >
                Convert into
              </Typography>
            </Stack>
            {languages.map((item: any, index: number) => (
              <MenuItem
                key={index}
                value={item.value}
                selected={item.value === lang.value}
                onClick={(e: any) => {
                  setLang({...item});
                  handleClose();
                }}
                sx={{ textTransform: "capitalize" }}
              >
                {item.label}
              </MenuItem>
            ))}
          </Menu>
          {/* <Tooltip placement="top" title="camera" arrow>
            <IconButton
              size="small"
              component="label"
              // htmlFor="upload-img"
              onClick={(e:any) => handleCameraAction(e)}
              sx={{ color: "text.primary" }}
            >
              <Icon icon="mdi:camera" />
            </IconButton>
          </Tooltip> */}
          <Tooltip placement="top" title="Attachment" arrow>
            <IconButton
              size="small"
              component="label"
              htmlFor="upload-img"
              sx={{ color: "text.primary" }}
            >
              <Icon icon="bx:paperclip" />
              <input
                hidden
                type="file"
                accept="image/*"
                id="upload-img"
                onChange={(e: any) => handleUploadImage(e)}
              />
            </IconButton>
          </Tooltip>
          <IconButton type="submit">
            <Icon
              icon="material-symbols:send"
              color={botStyles?.primaryColor || "blue"}
            />
          </IconButton>
        </Box>
      </ChatFormWrapper>
    </Form>
  );
};

export default SendMsgForm;
