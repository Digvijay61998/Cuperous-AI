// ** React Imports

// ** MUI Imports
import { useEffect, useState } from "react";
import MuiAvatar from "@mui/material/Avatar";
import Badge from "@mui/material/Badge";
import Box, { BoxProps } from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import { styled } from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import { fetchVisitor } from "../../../store/bot/bot";
import CircularProgress from "@mui/material/CircularProgress";
// ** Icon Imports
import { Icon } from "@iconify/react";
import Tooltip from "@mui/material/Tooltip";

// ** Custom Components Import
import ChatLog from "./ChatLog";
import SendMsgForm from "./SendMsgForm";
import { deepOrange, deepPurple } from "@mui/material/colors";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "../../../store";
import { Button, Stack, TextField } from "@mui/material";
import { toast } from "react-hot-toast";
import MoreOptions from "./components/more-options";
import { clearMessages } from "../../../store/bot/bot";
import AdsSlider from "../ads/Ads";
import Offers from "../offers";
import Form from "./components/Form";
import Gallery from "./components/Gallery";
import Alert from "/sound/alert.mp3";

import SendTranscriptDialog from "./components/SendTranscript";
import ChatbotImage from "./components/ChatbotImage";
// ** Styled Components

const ChatContent = (props: any) => {
  // ** Props
  const {
    hidden,
    setIsBotOpen,
    socket,
    updatemyMessages,
    visitorAccessToken,
    botStyles,
    botSettings,
    botName,
    botId,
    setLoadingBot,
    offersArr,
    adsArr,
    isShow,
    setIsShow,
    accessToken,
    widgetToken,
    newMessages: messageArray,
    isLocation,
  } = props;

  type dataType = {
    name: string;
    email: string;
    phone: number;
  };

  const getLocation = async (onSuccess: any, onError?: any) => {
    const errorFun = onError
      ? onError
      : (error: GeolocationPositionError) => {
          onSuccess();
        };
    if (navigator.permissions) {
      const permissions = await navigator?.permissions?.query({
        name: "geolocation",
      });
      console.log("Location permission status: ", permissions.state);
    }
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(onSuccess, errorFun, {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      });
    } else {
      onSuccess();
    }
  };

  const clientHeight = document?.getElementById("bizbot-widget")?.clientHeight;
  const dispatch = useDispatch<AppDispatch>();
  // const { messages: messageArray } = useSelector(
  //   (state: RootState) => state.bot
  // );
  const [data, setData] = useState<dataType>({
    name: "",
    email: "",
    phone: 0,
  });
  const saveState = (e: any) => {
    setData({ ...data, [e.target.name]: e.target.value });
  };

  const [loading, setLoading] = useState(false);
  const handleStartConversation = async (e: any) => {
    e.preventDefault();
    const handleSubmit = async (location: any) => {
      setLoading(true);
      setIsShow({
        isShowForm: false,
        isShowAds: false,
        isShowChats: false,
      });
      try {
        await dispatch(
          fetchVisitor({
            data: {
              ...data,
              location: {
                longitude: location?.coords?.longitude,
                latitude: location?.coords?.latitude,
              },
            },
            token: widgetToken,
          })
        );
        localStorage.setItem("visitorData", JSON.stringify(data));
        setIsShow({
          isShowForm: false,
          isShowAds: false,
          isShowChats: true,
        });
        setLoading(false);
      } catch (error: any) {
        setLoading(false);
        console.log({ error });
        setIsShow({
          isShowForm: true,
          isShowAds: false,
          isShowChats: false,
        });
      }
    };
    // allow geolocation in safari browser
    if (isLocation) {
      getLocation(handleSubmit);
    } else {
      setLoading(true);
      setIsShow({
        isShowForm: false,
        isShowAds: false,
        isShowChats: false,
      });
      try {
        await dispatch(
          fetchVisitor({
            data: { ...data },
            token: widgetToken,
          })
        );
        localStorage.setItem("visitorData", JSON.stringify(data));
        setIsShow({
          isShowForm: false,
          isShowAds: false,
          isShowChats: true,
        });
        setLoading(false);
      } catch (error: any) {
        setLoading(false);
        console.log({ error });
        setIsShow({
          isShowForm: true,
          isShowAds: false,
          isShowChats: false,
        });
      }
    }
  };

  const handleSkipConversation = async (e: any) => {
    e.preventDefault();
    const handleSkip = async (location: any) => {
      setLoading(true);
      setIsShow({
        isShowForm: false,
        isShowAds: false,
        isShowChats: false,
      });
      try {
        await dispatch(
          fetchVisitor({
            data: {
              location: {
                longitude: location?.coords?.longitude,
                latitude: location?.coords?.latitude,
              },
            },
            token: widgetToken,
          })
        );

        setIsShow({
          isShowForm: false,
          isShowAds: false,
          isShowChats: true,
        });
        setLoading(false);
      } catch (error: any) {
        setLoading(false);
        setIsShow({
          isShowForm: true,
          isShowAds: false,
          isShowChats: false,
        });
        console.log({ error });
      }
    };
    if (isLocation) {
      getLocation(handleSkip);
    } else {
      setLoading(true);
      setIsShow({
        isShowForm: false,
        isShowAds: false,
        isShowChats: false,
      });
      try {
        dispatch(
          fetchVisitor({
            token: widgetToken,
          })
        );

        setIsShow({
          isShowForm: false,
          isShowAds: false,
          isShowChats: true,
        });
        setLoading(false);
      } catch (error: any) {
        setLoading(false);
        setIsShow({
          isShowForm: true,
          isShowAds: false,
          isShowChats: false,
        });
        console.log({ error });
      }
    }
  };

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };
  const handleClearChat = (e: any) => {
    dispatch(clearMessages());
    handleClose();
  };
  const handleRestartChat = (e: any) => {
    setIsBotOpen(false);
  };
  const { visitorId } = useSelector((state: RootState) => state.bot);

  const [isLoading, setIsLoading] = useState(false);
  const handleStartChat = async () => {
    const startChat = async (location: any) => {
      setIsShow({
        isShowForm: false,
        isShowAds: false,
        isShowChats: false,
      });
      setIsLoading(true);
      if (!accessToken) {
        if (botId && dispatch) {
          let visitorData: string | null = localStorage.getItem("visitorData");
          if (visitorData && visitorData !== "undefined") {
            setLoadingBot(true);
            const parseVisitorData = JSON.parse(visitorData);
            await dispatch(
              fetchVisitor({
                token: widgetToken,
                data: {
                  ...parseVisitorData,
                  location: {
                    longitude: location?.coords?.longitude,
                    latitude: location?.coords?.latitude,
                  },
                },
              })
            );
            setLoadingBot(false);
            setIsShow({
              isShowForm: false,
              isShowAds: false,
              isShowChats: true,
            });
            setIsLoading(false);

            return;
          }
          if (visitorData === "undefined" || visitorData === null) {
            setIsShow({
              isShowForm: true,
              isShowAds: false,
              isShowChats: false,
            });
            setIsLoading(false);
            return;
          }
        }
      } else {
        setIsShow({
          isShowForm: false,
          isShowAds: false,
          isShowChats: true,
        });
        setIsLoading(false);
      }
    };
    if (isLocation) {
      getLocation(startChat);
    } else {
      setIsShow({
        isShowForm: false,
        isShowAds: false,
        isShowChats: false,
      });
      setIsLoading(true);
      if (!accessToken) {
        if (botId && dispatch) {
          let visitorData: string | null = localStorage.getItem("visitorData");
          if (visitorData && visitorData !== "undefined") {
            setLoadingBot(true);
            const parseVisitorData = JSON.parse(visitorData);
            await dispatch(
              fetchVisitor({
                token: widgetToken,
                data: {
                  ...parseVisitorData,
                },
              })
            );
            setLoadingBot(false);
            setIsShow({
              isShowForm: false,
              isShowAds: false,
              isShowChats: true,
            });
            setIsLoading(false);

            return;
          }
          if (visitorData === "undefined" || visitorData === null) {
            setIsShow({
              isShowForm: true,
              isShowAds: false,
              isShowChats: false,
            });
            setIsLoading(false);
            return;
          }
        }
      } else {
        setIsShow({
          isShowForm: false,
          isShowAds: false,
          isShowChats: true,
        });
        setIsLoading(false);
      }
    }
  };

  let visitorData: string | null = localStorage.getItem("visitorData");
  let isVisitorStored: boolean = false;
  if (visitorData && visitorData !== "undefined") {
    isVisitorStored = true;
  }
  const [openSendTranscriptDialog, setOpenSendTranscriptDialog] =
    useState<boolean>(false);
  const handleOpenSendTranscriptDialog = () => {
    setOpenSendTranscriptDialog(true);
  };
  const handleCloseSendTranscriptDialog = () => {
    setOpenSendTranscriptDialog(false);
  };
  const renderContent = () => {
    return (
      <Box
        sx={{
          maxWidth: "100%",
          height: clientHeight ? clientHeight - 170 : "90%",
          backgroundColor: "#f5f8fb",
          borderRadius: "5px",
          pb: 1,
          margin: "0 auto",
          // overflow: isShow.isShowAds ? "auto" : "hidden",
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            py: 3,
            px: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            bgcolor: botStyles?.primaryColor || "#fff",
            color: botStyles?.headerTextColor || "#000",
            borderRadius: '5px 5px 0 0'
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                cursor: "pointer",
              }}
            >
              <Badge
                overlap="circular"
                anchorOrigin={{
                  vertical: "bottom",
                  horizontal: "right",
                }}
                sx={{ mr: 2 }}
                badgeContent={
                  <Box
                    component="span"
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      color: `paper.main`,
                      boxShadow: (theme) =>
                        `0 0 0 2px ${theme.palette.background.paper}`,
                      backgroundColor: `paper.main`,
                    }}
                  />
                }
              >
                <MuiAvatar
                  src={botStyles?.avatar || "/logo.png"}
                  alt={botSettings?.botName}
                  sx={{ width: "2.375rem", height: "2.375rem" }}
                />
              </Badge>
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  width: "100%",
                }}
              >
                <Typography
                  sx={{
                    fontWeight: 600,
                    fontSize: "1rem",
                    color: botStyles?.headerTextColor || "#000",
                    textTransform: "unset",
                  }}
                >
                  {botName}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: botStyles?.headerTextColor || "#000",
                    opacity: 0.75,
                  }}
                >
                  Handling by Bot
                </Typography>
              </Box>
            </Box>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center" }}>
            <>
              <Tooltip title="Home" placement="top" arrow>
                <IconButton
                  onClick={(e: any) => {
                    if (messageArray.length > 0) {
                      setIsShow({
                        isShowForm: false,
                        isShowAds: true,
                        isShowChats: false,
                        isShowOffer: false,
                      });
                    } else {
                      setIsShow({
                        isShowForm: false,
                        isShowAds: true,
                        isShowChats: false,
                        isShowOffer: false,
                      });
                    }
                  }}
                  size="small"
                  sx={{
                    color: botStyles?.headerTextColor || "red",
                    opacity: 8,
                  }}
                >
                  <Icon icon="ic:round-home" fontSize={24} fontWeight="bold" />
                </IconButton>
              </Tooltip>
              {/* <Tooltip title="Offers" placement="top" arrow>
                <IconButton
                  onClick={(e: any) =>
                    setIsShow({
                      isShowForm: false,
                      isShowAds: false,
                      isShowChats: false,
                      isShowOffer: true,
                    })
                  }
                  size="small"
                  sx={{
                    color: botStyles?.headerTextColor || "red",
                    opacity: 8,
                  }}
                >
                  <Icon icon="bxs:offer" fontSize={24} fontWeight="bold" />
                </IconButton>
              </Tooltip> */}

              <Tooltip title="More" placement="top" arrow>
                <IconButton
                  id="more-option-button"
                  aria-controls={open ? "more-option-menu" : undefined}
                  aria-haspopup="true"
                  aria-expanded={open ? "true" : undefined}
                  onClick={handleClick}
                  size="small"
                  sx={{
                    color: botStyles?.headerTextColor || "text.secondary",
                    opacity: 8,
                  }}
                >
                  <Icon
                    icon="ic:outline-more-vert"
                    fontSize={25}
                    fontWeight="bold"
                  />
                </IconButton>
              </Tooltip>
              <MoreOptions
                anchorEl={anchorEl}
                open={open}
                handleClose={handleClose}
                handleClearChat={handleClearChat}
                handleCloseChat={handleRestartChat}
                handleOpenSendTranscriptDialog={handleOpenSendTranscriptDialog}
                isShow={isShow}
                messageArray={messageArray}
                {...props}
              />
            </>
          </Box>
        </Box>

        {isLoading ||
          (!isShow.isShowAds &&
            !isShow.isShowForm &&
            !isShow.isShowChats &&
            !isShow.isShowOffer && (
              <Stack
                direction="column"
                alignItems="space-between"
                justifyContent="center"
                width="100%"
                height={clientHeight ? clientHeight - 170 : "65%"}
                margin="0 auto"
              >
                <div style={{ width: "100%", textAlign: "center" }}>
                  <ChatbotImage />
                  {messageArray.length > 0 || isVisitorStored ? (
                    <Stack
                      direction="row"
                      justifyContent="center"
                      alignItems="center"
                      width="100%"
                      marginTop="2rem"
                    >
                      <Button
                        variant="contained"
                        sx={{ textTransform: "unset" }}
                        onClick={handleStartChat}
                        startIcon={
                          <Icon icon="mdi:message-group" fontSize={20} />
                        }
                      >
                        continue Conversation
                      </Button>
                    </Stack>
                  ) : (
                    <Form
                      loading={loading}
                      handleSkipConversation={handleSkipConversation}
                      handleStartConversation={handleStartConversation}
                      saveState={saveState}
                    />
                  )}
                </div>
              </Stack>
            ))}
        {isShow.isShowAds && (
          <div
            style={{
              height: "85%",
              width: "100%",
              overflowY: "auto",
              position: "relative",
            }}
          >
            {adsArr?.posters && adsArr.posters.length > 0 ? (
              <>
                <AdsSlider adsSlideArray={adsArr} {...props} />
                <Stack
                  direction="row"
                  justifyContent="center"
                  alignItems="center"
                  width="100%"
                  marginTop="2rem"
                >
                  {messageArray.length > 0 ? (
                    <Button
                      variant="contained"
                      sx={{ textTransform: "unset" }}
                      onClick={handleStartChat}
                      startIcon={
                        <Icon icon="mdi:message-group" fontSize={20} />
                      }
                    >
                      continue Conversation
                    </Button>
                  ) : (
                    <>
                      <ChatbotImage />
                      <Button
                        variant="contained"
                        sx={{ textTransform: "unset" }}
                        onClick={handleStartChat}
                        startIcon={
                          <Icon icon="mdi:message-group" fontSize={20} />
                        }
                      >
                        Start Conversation
                      </Button>
                    </>
                  )}
                </Stack>
              </>
            ) : messageArray.length > 0 ? (
              <Stack
                direction="row"
                justifyContent="center"
                alignItems="center"
                width="100%"
                marginTop="2rem"
              >
                {messageArray?.length > 0 && (
                  <Button
                    variant="contained"
                    sx={{ textTransform: "unset" }}
                    onClick={handleStartChat}
                    startIcon={<Icon icon="mdi:message-group" fontSize={20} />}
                  >
                    continue Conversation
                  </Button>
                )}
              </Stack>
            ) : (
              <Form
                loading={loading}
                handleSkipConversation={handleSkipConversation}
                handleStartConversation={handleStartConversation}
                saveState={saveState}
              />
            )}
          </div>
        )}
        {isShow.isShowOffer && (
          <div style={{ height: "85%", overflowY: "auto" }}>
            <Offers offersArray={offersArr} {...props} />
            <Stack
              direction="row"
              justifyContent="center"
              alignItems="center"
              width="100%"
              marginTop="2rem"
            >
         
                <Button
                  variant="contained"
                  sx={{ textTransform: "unset" }}
                  onClick={handleStartChat}
                  startIcon={<Icon icon="mdi:message-group" fontSize={20} />}
                >
                  Start Conversation
             </Button>
            </Stack>
          </div>
        )}
        {isShow.isShowForm && !isShow.isShowChats && (
          <Form
            loading={loading}
            handleSkipConversation={handleSkipConversation}
            handleStartConversation={handleStartConversation}
            saveState={saveState}
          />
        )}
        {isShow.isShowChats && !isShow.isShowForm && (
          <>
            <ChatLog
              hidden={hidden}
              botStyles={botStyles}
              updatemyMessages={updatemyMessages}
              socket={socket}
              {...props}
            />

            <SendMsgForm
              updatemyMessages={updatemyMessages}
              visitorAccessToken={visitorAccessToken}
              socket={socket}
              botStyles={botStyles}
              {...props}
            />
          </>
        )}
        {isShow.isShowAds && (
          <footer
            style={{
              position: "absolute",
              bottom: "0",
              textAlign: "center",
              width: "100%",
              fontFamily: "'Montserrat', sans-serif",
              fontSize: "0.8rem",
            }}
          >
            Powered by <a href="#">bizbot.works</a>
          </footer>
        )}
        <SendTranscriptDialog
          open={openSendTranscriptDialog}
          handleClose={handleCloseSendTranscriptDialog}
          setOpen={setOpenSendTranscriptDialog}
          socket={socket}
          visitorId={visitorId}
        />
      </Box>
    );
  };
  return renderContent();
};

export default ChatContent;
