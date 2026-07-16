function sendNotification(message: any, user: any, type: any) {
  //  only send notification when user is not on focus
  if (document.hasFocus()) {
    return;
  }
  const notification = new Notification("New message from BizBot Chatbot", {
    icon:
      type === "image"
        ? message
        : type === "audio"
        ? "/images/icons/audio.png"
        : type === "video"
        ? "/images/icons/video.png"
        : type === "location"
        ? "/images/icons/location.png"
        : type === "ads" || type === "offer"
        ? "/images/icons/ads.png"
        : type === "gallery"
        ? "/images/icons/gallery.png"
        : type === "feedback"
        ? "/images/icons/feedback.png"
        : "/images/icons/msg.png",
    body: `${user}: ${message}`,
  });
  notification.onclick = (e: any) => {
    //  check if the window is open then focus on it
    if (window?.focus) {
      window.focus();
      
    }
    
  };
}

export default function pushNotification(message: any, user: any, type: any) {
  if (user) {
    if (!("Notification" in window)) {
      alert("This browser does not support system notifications!");
    } else if (Notification.permission === "granted") {
      sendNotification(message, user, type);
    } else if (Notification.permission !== "denied") {
      Notification.requestPermission((permission) => {
        if (permission === "granted") {
          sendNotification(message, user, type);
        }
        if (permission === "denied") {
          console.log("Notification permission denied");
        }
      });
    }
  }
}

