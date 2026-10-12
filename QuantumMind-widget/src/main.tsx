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

// Standalone preview for `npm run dev` only. In the library build (plugin.js)
// this must not run: importing the plugin would otherwise overwrite the host
// page's botId and render into the host's own #root (e.g. a React app).
if (import.meta.env.DEV) {
  window.botId = "6aca92373a422dd81a27a673";
  // window.baseUrl = "https://jacube.engage.com";
  window.baseUrl = "http://localhost:4000";
  window.isOpenChat = true;
  ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    <>
      <App />
    </>
  );
}
