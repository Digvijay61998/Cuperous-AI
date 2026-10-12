import { useEffect, useRef, useState } from "react";
import useMediaQuery from "@mui/material/useMediaQuery";
import { AppDispatch, RootState } from "../store";
import Widget from "../view/widget";

import { useDispatch, useSelector } from "react-redux";
import io from "socket.io-client";
import { getBotMetadata, handleConversationEnded } from "../store/bot/bot";
import pushNotification from "../utils/notification";
import Alert from "/sound/alert.mp3";

type styleProps={
  customStyleMobile: any;
  customStyleDesktop: any;
}
export default function App(props: any) {
  const [isChatBotOpen, setIsChatBotOpen] = useState<boolean>(false);
  const botId = window.botId;
  const isMobile = useMediaQuery("(max-width:480px)");

  useEffect(() => {
    if (window.isOpenChat) setIsChatBotOpen(window.isOpenChat);
  }, [window.isOpenChat]);
  const [isBotOpen, setIsBotOpen] = useState(false);
  const socketRef = useRef<any>(null);
  const [visitorAccessToken, setVisitorAccessToken] = useState("");
  const dispatch = useDispatch<AppDispatch>();

  const {
    accessToken,
    botStyles,
    botSettings,
    botName,
    offersArr,
    adsArr,
    widgetToken,
    isLocation
  } = useSelector((state: RootState) => state.bot);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [loadingBot, setLoadingBot] = useState(false);
  const defaultObj: any = {
    isShowForm: false,
    isShowAds: false,
    isShowChats: false,
    isShowOffer: false,
  };
  const [isShow, setIsShow] = useState<any>(defaultObj);
  useEffect(() => {
    if (botId) {
      dispatch(getBotMetadata(botId));
    }
  }, [botId, dispatch]);

  useEffect(() => {
    if (
      (offersArr && offersArr?.cards?.length > 0) ||
      (adsArr && adsArr.length > 0)
    ) {
      setIsShow({
        isShowForm: false,
        isShowAds: true,
        isShowChats: false,
      });
      return;
    }
  }, [offersArr, adsArr]);
  const [newMessages, setNewMessages] = useState<any>([]);
  const [isCameraOpen, setIsCameraOpen] = useState<boolean>(false);
  /** When the agent last signalled typing; null = not typing. */
  const [agentTypingAt, setAgentTypingAt] = useState<number | null>(null);
  useEffect(() => {
    if (agentTypingAt == null) return;
    const t = setTimeout(() => setAgentTypingAt(null), 5000);
    return () => clearTimeout(t);
  }, [agentTypingAt]);
  /**
   * The visitor just sent something to the bot: show "…" until the reply
   * arrives (or 20 s, so a lost reply never leaves the dots spinning). Not
   * while a person handles the chat: then only their real typing signal
   * shows the dots.
   */
  const [botTypingAt, setBotTypingAt] = useState<number | null>(null);
  const withAgentRef = useRef(false);
  useEffect(() => {
    if (botTypingAt == null) return;
    const t = setTimeout(() => setBotTypingAt(null), 20000);
    return () => clearTimeout(t);
  }, [botTypingAt]);
  useEffect(() => {
    async function handleConnectSocket() {
      const serviceIP: any = window.baseUrl;

      setVisitorAccessToken(accessToken);
      const socket = io(serviceIP, {
        path: "/socket.io/jarcube",
        auth: {
          token: accessToken,
        },
      });
      socketRef.current = socket;
      socket.on("connect", () => {
        console.log("Connected", socket.id);
        setIsShow({ ...isShow, isShowChats: true });
      });

      socket.onAny((event: any, args: any) => {
        // console.log(`Socket Event: ${event}`, args);
      });

      socket.on("publish-ads", () => {
        // console.log("publish ads event called");
        updateMyMessages({
          type: "ads",
          value: adsArr,
          time: new Date().getTime(),
        });
        pushNotification(adsArr?.title, "Advertisement", "ads");
      });

      socket.on("publish-offer", () => {
        // console.log("publish offer event called");
        updateMyMessages({
          type: "offer",
          value: offersArr,
          time: new Date().getTime(),
        });
        pushNotification(offersArr?.title, "Offers", "offer");
      });

      socket.on("publish-feedback", () => {
        setIsFeedbackOpen(true);
        pushNotification(
          "Please give us your valuable feedback",
          "Feedback",
          "feedback"
        );
      });

      // The agent handling the chat is typing (crm-incident-handover R8.8).
      // Only sent when the bot's typingIndicator setting is on. Cleared 5 s
      // after the last signal, or when their message arrives.
      socket.on("typing", (payload: any) => {
        if (!payload?.typing) return;
        setAgentTypingAt(Date.now());
      });

      socket.on("chat-message-bot", (response: any) => {
        setAgentTypingAt(null);
        setBotTypingAt(null);
        const m = response?.message;
        if (m?.switchToAgent || m?.senderRole === "agent") withAgentRef.current = true;
        else if (m?.handledByAgent === false && m?.senderRole === "bot") withAgentRef.current = false;
        newArrivedMessage(response.message);
        setIsShow({ ...isShow, isShowChats: true });
        // if switchToAgent is true then show agent in notification
        if (response?.message?.switchToAgent) {
          // set this value in sessionStorage
          sessionStorage.setItem("switchToAgent", "true");
        }
        // get value from session storage switchToAgent
        const switchToAgent = sessionStorage.getItem("switchToAgent");
        if (response?.message?.value && switchToAgent) {
          pushNotification(
            response.message.value,
            "Agent",
            response.message.type
          );
        } else if (response?.message?.value && !switchToAgent) {
          pushNotification(
            response.message.value,
            "Bot",
            response.message.type
          );
        }
      });
      // The conversation was closed (crm-incident-handover R14.2, R14.5):
      // switch to the Ended_State and remember it for reloads (R14.7).
      socket.on("conversation-ended", (payload: any) => {
        setAgentTypingAt(null);
        setBotTypingAt(null);
        dispatch(handleConversationEnded(payload));
      });
      socket.on("disconnect", () => {
        console.log("Disconnected");
      });
    }

    if (accessToken) {
      handleConnectSocket();
    }

    return () => {
      socketRef?.current?.disconnect();
    };
  }, [accessToken]);

  useEffect(() => {
    setIsBotOpen(isChatBotOpen);
  }, [isChatBotOpen]);

  const mdAbove = true;
  const soundAlert = new Audio(Alert);

  const newArrivedMessage = (message: any) => {
    // play sound on new message if isSound is true else not
 

    setNewMessages((prevMessages: any) => [...prevMessages, message]);
  };
  const updateMyMessages = (message: any) => {
    // dispatch(addMessage(message));
    setNewMessages((prevMessages: any) => [...prevMessages, message]);
    // Something the visitor sent (text, button, quick reply): the bot is on it.
    const fromVisitor = message?.senderRole === "visitor" && message?.type !== "camera";
    if (fromVisitor && !withAgentRef.current) setBotTypingAt(Date.now());
  };
  /** "Start new chat" (R14.9): the new conversation starts with an empty log. */
  const resetMessages = () => {
    setNewMessages([]);
    setBotTypingAt(null);
    withAgentRef.current = false;
  };
  // check if browser is safari or not
  const isSafari = () => {
    const ua = navigator.userAgent.toLowerCase();
    if (ua.indexOf("safari") !== -1) {
      if (ua.indexOf("chrome") > -1) {
        return false;
      } else {
        return true;
      }
    }
  };

const [customPosition, setCustomPosition] = useState<any>({
  right: isMobile ? 0 : 20,
  bottom: isMobile ? 20 : isSafari() ? 50 : 40,
})
const mobileStyle={
  width: "100vw",
  height: "100vh",
  margin: "0 auto",
}
const desktopStyle= {
  width: "460px",
  height: "85vh",
  right: 20,
  bottom: isSafari() ? 100 :40,
}
const [customStyle, setCustomStyle] = useState<any>(isMobile ? mobileStyle : desktopStyle)
  const hidden = true;
  useEffect(()=>{
    if(botStyles?.widgetPosition === 'left'){
      setCustomPosition({
        left: isMobile ? "0px" : "5px",
        bottom: isMobile ? "0px" : "20px",
      })
     let styles: styleProps = {
        customStyleDesktop: {
          width: "460px",
          height: "85vh",
          left: 20,
          bottom: 40,
        },
        customStyleMobile: {
          width: "100vw",
          height: "100vh",
          margin: "0 auto",
        }
    }
    setCustomStyle(isMobile ? styles.customStyleMobile : styles.customStyleDesktop)

  }

  },[botStyles, isMobile])
  const customProps = {
    isBotOpen,
    loadingBot,
    mdAbove,
    setIsBotOpen,
    socket: socketRef.current,
    updatemyMessages: updateMyMessages,
    visitorAccessToken,
    botSettings,
    botName,
    botId,
    isFeedbackOpen,
    setIsFeedbackOpen,
    setLoadingBot,
    isChatBotOpen,
    customStyle,
    customPosition,
    hidden,
    botStyles,
    offersArr,
    adsArr,
    isShow,
    setIsShow,
    accessToken,
    widgetToken,
    newMessages,
    isCameraOpen,
    setIsCameraOpen,
    soundAlert,
    isLocation,
    agentTyping: agentTypingAt != null,
    botTyping: botTypingAt != null && agentTypingAt == null,
    resetMessages,
  };

  return (
    <div id="jarcube-widget"
    >
      {botSettings &&
        Object?.keys(botSettings).length > 0 &&
        Object?.keys(botStyles) && <Widget {...props} {...customProps} />}
    </div>
  );
}
