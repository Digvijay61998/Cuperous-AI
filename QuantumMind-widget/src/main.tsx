import ReactDOM from "react-dom/client";
import "react-slideshow-image/dist/styles.css";
import App from "./App";
import "./index.css";
declare global {
  interface Window {
    botId: string;
    baseUrl: string;
    socketUrl: string;
    isOpenChat: boolean;
  }
}
const chatbot = () => {
  let isRootId = document.getElementById("root");
  if (!isRootId) {
    let element = document.createElement("div");
    element.id = "root";
    document.body.appendChild(element);
  }
  let isRoot = document?.getElementById("jarcube-widget-root");
  if (isRoot) {
    return ReactDOM.createRoot(
      document.getElementById("jarcube-widget-root") as HTMLElement
    ).render(
      <>
        <App />
      </>
    );
  } else {
    let element = document.createElement("div");
    element.id = "jarcube-widget-root";
    document.body.appendChild(element);
    return ReactDOM.createRoot(
      document.getElementById("jarcube-widget-root") as HTMLElement
    ).render(
      <>
        <App />
      </>
    );
  }
};

export default chatbot;

window.botId = "6a57ca1368c861f4cbccd254";
// window.baseUrl = "https://bizback.bizmorphic.com";
window.baseUrl = "http://localhost:4000"
window.isOpenChat = true;
ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <>
    <App />
  </>
);
