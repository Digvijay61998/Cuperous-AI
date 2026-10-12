import TypingIndecator from "./components/TypingIndicator";
import StatusNotice from "./components/StatusNotice";
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
  ScrollBarProps & { ref?: Ref<unknown> }
>(({ theme }) => ({
  padding: theme.spacing(1),
}));

// Defined at module level so its identity is stable across renders. When it
// lived inside ChatLog, every re-render remounted the scroll container and
// reset scrollTop to 0.
const ScrollWrapper = forwardRef<
  HTMLElement,
  { hidden: boolean; children: ReactNode }
>(({ hidden, children }, ref) => {
  if (hidden) {
    return (
      <Box
        ref={ref}
        sx={{ p: 2, height: "100%", overflowY: "auto", overflowX: "hidden" }}
      >
        {children}
      </Box>
    );
  }
  return (
    <PerfectScrollbar
      containerRef={(el: HTMLElement) => {
        if (typeof ref === "function") ref(el);
        else if (ref) ref.current = el;
      }}
      options={{ wheelPropagation: false }}
    >
      {children}
    </PerfectScrollbar>
  );
});

/**
 * True only for messages the visitor sent. Locally echoed messages are tagged
 * `senderRole: "visitor"`; the id check covers any that carry the visitor id.
 * Everything delivered by the server on `chat-message-bot` (bot, AI, flow,
 * agent replies from the dashboard) is NOT the visitor — an agent reply arrives
 * with no senderId, which the old `senderId === visitorId` check matched
 * against an equally-undefined visitorId and drew on the visitor's side.
 */
export function isVisitorMessage(msg: any, visitorId?: string): boolean {
  if (msg?.senderRole) return msg.senderRole === "visitor";
  return !!visitorId && !!msg?.senderId && String(msg.senderId) === String(visitorId);
}

function groupKey(msg: any, fromVisitor: boolean): string {
  if (fromVisitor) return "visitor";
  if (msg?.switchToAgent || msg?.senderRole === "agent") return "agent";
  return `org:${msg?.senderId ?? "bot"}`;
}

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
    // Wait a frame so newly rendered messages (button lists etc.) are laid out
    // before measuring scrollHeight.
    requestAnimationFrame(() => {
      if (chatArea.current) {
        chatArea.current.scrollTop = chatArea.current.scrollHeight;
      }
    });
  };
  // ** Formats chat data based on sender
  const formattedChatData = () => {
    let chatLog: any = [];
    if (messageArray.length) {
      chatLog = messageArray;
    }

    // Group consecutive messages by SIDE + author, WhatsApp-style: the visitor
    // on one side, everything from the org (bot, AI, flow, agent) on the other.
    // Grouping on the raw senderId alone merged the visitor's echoes with agent
    // replies, because both could arrive with no senderId at all.
    const formattedChatLog: any[] = [];
    let msgGroup: any = null;
    chatLog.forEach((msg: any) => {
      const fromVisitor = isVisitorMessage(msg, visitorId);
      const key = groupKey(msg, fromVisitor);
      if (msgGroup && msgGroup.key === key) {
        msgGroup.messages.push(msg);
      } else {
        if (msgGroup) formattedChatLog.push(msgGroup);
        msgGroup = { key, isVisitor: fromVisitor, messages: [msg] };
      }
    });
    if (msgGroup) formattedChatLog.push(msgGroup);

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
      // Visitor = right; bot, AI, flow and agent = left.
      const isSender = item.isVisitor;
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
                    {chat.info && <StatusNotice severity={chat.info} text={chat.value} />}
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
                        disabled={props.ended === true}
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
                        disabled={props.ended === true}
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

  return (
    <>
      {/* Fills the space between header and input (parent is a flex column). */}
      <Box sx={{ flex: 1, minHeight: 0 }}>
        <ScrollWrapper hidden={hidden} ref={chatArea}>
          {renderChats()}

          {(props.agentTyping || props.botTyping) && (
            <Box sx={{ display: "flex", mt: 1.5, ml: 4 }}>
              <TypingIndecator label={props.agentTyping ? "Agent is typing" : "Assistant is typing"} />
            </Box>
          )}

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
