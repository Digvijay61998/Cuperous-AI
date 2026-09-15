// ** React Imports
import {
  forwardRef,
  ReactElement,
  ReactNode,
  Ref,
  useEffect,
  useRef,
  useState,
} from "react";

// ** MUI Imports
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Slide from "@mui/material/Slide";
import { styled } from "@mui/material/styles";
import { TransitionProps } from "@mui/material/transitions";
// ** Icon Imports
import { Icon } from "@iconify/react";
// ** Third Party Components
import Alert from "@mui/material/Alert";
import PerfectScrollbarComponent, {
  ScrollBarProps,
} from "react-perfect-scrollbar";
// ** Custom Components Imports

// ** Utils Imports
import Audio from "./components/Audio";
import ButtonsReply from "./components/ButtonsReply";
import Feedback from "./components/Feedback";
import Gallery from "./components/Gallery";
import Image from "./components/Image";
import Message from "./components/Message";
import QuickReply from "./components/QuickReply";
import TemplateLauncher from "./components/TemplateLauncher";
// ** Types Imports
import AdsSlider from "../ads/Ads";
import Offers from "../offers";
import Map from "./components/Map";
import Video from "./components/Video";
import AlertSound from "/sound/alert.mp3";

import Camera from "./components/camera";
import { useSelector } from "react-redux";
import { RootState } from "../../../store";


const PerfectScrollbar = styled(PerfectScrollbarComponent)<
  ScrollBarProps & { ref: Ref<unknown> }
>(({ theme }) => ({
  padding: theme.spacing(1),
}));

const ChatLog = (props: any) => {
  // ** Props
  const {
    hidden,
    botStyles,
    visitorId,
    newMessages: messageArray,
    soundAlert
  } = props;
const {isSoundOn} = useSelector((state: RootState)=> state.bot)
  // ** Ref
  const chatArea = useRef<any>(null);
  // ** Scroll to chat bottom
  const scrollToBottom = () => {
    if (chatArea.current) {
      // @ts-ignore

      // scroll bottom of chat
      chatArea.current.scrollTop = chatArea.current.scrollHeight;
    }
  };
  // ** Formats chat data based on sender
  const formattedChatData = () => {
    let chatLog: any = [];
    if (messageArray.length) {
      chatLog = messageArray;
    }

    const formattedChatLog: any[] = [];
    let chatMessageSenderId = messageArray[0]?.senderId
      ? messageArray[0].senderId
      : "bot";
    let msgGroup: any = {
      senderId: chatMessageSenderId,
      messages: [],
    };
    chatLog.forEach((msg: any, index: number) => {
      if (chatMessageSenderId === msg.senderId) {
        msgGroup.messages.push(msg);
      } else {
        chatMessageSenderId = msg.senderId;

        formattedChatLog.push(msgGroup);
        msgGroup = {
          senderId: chatMessageSenderId,
          messages: [msg],
        };
      }
      if (index === chatLog.length - 1) formattedChatLog.push(msgGroup);
    });

    return formattedChatLog;
  };
  useEffect(() => {
    if (messageArray && messageArray.length) {
      scrollToBottom();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messageArray]);

  const [openWebView, setOpenWebView] = useState(false);
  const [webViewUrl, setWebViewUrl] = useState("");

  function handleButtonFunction(type: string, value: string) {
    if (type === "webview") {
      setWebViewUrl(value);
      setOpenWebView(true);
    }
  }

  const handlePlaySound = () => {
    if (isSoundOn) {
      soundAlert.play();
    }
  };

  const renderChats = () => {
    return formattedChatData().map((item: any, index: number) => {
      const isSender = item.senderId === visitorId;
      return (
        <Box
          key={index}
          sx={{
            display: "flex",
            flexDirection: !isSender ? "row" : "row-reverse",
            mb: index !== formattedChatData().length - 1 ? 4 : undefined,
            mt: 1.5,
          }}
        >
          <div>
            <Avatar
              alt={isSender ? "V" : "B"}
              sx={{
                width: 20,
                height: 20,
                m: 1,
                mt: -2,
                p: 0.4,
                bgcolor: isSender ? "#757de8" : "#ff6333",
              }}
            >
              {isSender ? (
                <Icon icon="mdi:user" fontSize={20} />
              ) : (
                <Icon icon="mdi:user" fontSize={20} />
              )}
            </Avatar>
          </div>

          <Box
            className="chat-body"
            sx={{ maxWidth: ["calc(100% - 1.75rem)", "90%", "90 %"],
          }}
          >
            {item.messages.map((chat: any, index: number) => {
              return (
                <Box key={index} sx={{ 
                  "&:not(:last-of-type)": { mb: 1 }
                  }}>
                  <div>
                    {chat.info && (
                      <Alert severity={chat.info}>{chat.value}</Alert>
                    )}
                    {chat.type === "text" &&
                      !chat?.info &&
                      chat?.value &&
                      chat?.value.length > 0 && (
                        <Message
                          isSender={isSender}
                          botStyles={botStyles}
                          message={chat.value}
                        />
                      )}

                    {chat.type === "buttons" && (
                      <ButtonsReply
                        socket={props.socket}
                        updatemyMessages={props.updatemyMessages}
                        botStyles={botStyles}
                        isSender={isSender}
                        buttons={chat.buttons || []}
                        message={chat.value || ""}
                        visitorId={visitorId}
                      />
                    )}
                    {chat.type === "quick_reply" && (
                      <QuickReply
                        botStyles={botStyles}
                        socket={props.socket}
                        updatemyMessages={props.updatemyMessages}
                        isSender={isSender}
                        buttons={chat.buttons || []}
                        message={chat.value || ""}
                        visitorId={visitorId}
                        handleButtonFunction={handleButtonFunction}
                      />
                    )}
                    {chat.type === "image" && (
                      <Image isSender={isSender} image={chat.value || ""} />
                    )}
                    {chat.type === "audio" && <Audio link={chat.value} />}
                    {chat.type === "video" && (
                      <Video link={chat.value} type={chat.format || "mp4"} />
                    )}
                    {chat.type === "maps" && <Map location={chat.location} />}
                    {chat.type === "template" && chat.template?.url && (
                      <TemplateLauncher
                        botStyles={botStyles}
                        message={chat.value || ""}
                        buttonText={chat.template?.buttonText}
                        url={chat.template.url}
                        onOpen={props.onOpenTemplate}
                      />
                    )}
                    {chat.type === "ads" && (
                      <AdsSlider adsSlideArray={chat?.value} {...props} />
                    )}
                    {chat.type === "offer" && (
                      <Offers offersArray={chat.value} {...props} />
                    )}

                    <div style={{ width: "100%", marginLeft: "-1rem" }}>
                      {chat.type === "gallery" && (
                        <Gallery galleryArray={chat?.buttons} {...props} />
                      )}
                    </div>
                  </div>
                </Box>
              );
            })}
            {
              !isSender && handlePlaySound() 
            }
          </Box>
        </Box>
      );
    });
  };

  const ScrollWrapper = ({ children }: { children: ReactNode }) => {
    if (hidden) {
      return (
        <Box
          ref={chatArea}
          sx={{ p: 2, height: "100%", overflowY: "auto", overflowX: "hidden" }}
        >
          {children}
        </Box>
      );
    } else {
      return (
        <PerfectScrollbar ref={chatArea} options={{ wheelPropagation: false }}>
          {children}
        </PerfectScrollbar>
      );
    }
  };
  return (
    <>
      <Box sx={{ height: "calc(100% - 8.4375rem)" }}>
        <ScrollWrapper>
          {renderChats()}

          {props.isFeedbackOpen && (
            <Feedback socket={props.socket} {...props} />
          )}

          {props.isCameraOpen && (
            <Camera
              updatemyMessages={props.updatemyMessages}
              socket={props.socket}
              visitorId={visitorId}
              {...props}
            />
          )}
        </ScrollWrapper>
      </Box>
    </>
  );
};

export default ChatLog;
