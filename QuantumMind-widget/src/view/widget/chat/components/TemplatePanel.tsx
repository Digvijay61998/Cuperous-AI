// ** React Imports
import { useEffect, useMemo, useState } from "react";

// ** MUI Imports
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import IconButton from "@mui/material/IconButton";
import Slide from "@mui/material/Slide";
import Typography from "@mui/material/Typography";

// ** Icon Imports
import { Icon } from "@iconify/react";

/** Must match TEMPLATE_FRAME_SOURCE in @quantum/template-sdk. */
const TEMPLATE_FRAME_SOURCE = "jarcube-template";

/** How long the "thanks" state stays up before the panel slides away. */
const CLOSE_DELAY_MS = 900;

interface TemplatePanelProps {
  url: string;
  title?: string;
  botStyles?: any;
  onClose: () => void;
}

/**
 * Renders a hosted template inside the chat panel itself, covering the
 * conversation instead of opening a new browser tab. On mobile especially,
 * sending the customer to a new tab tends to lose them — they never come back
 * to the chat and the bot sits paused.
 *
 * The template signals completion via postMessage (see notifyParent in the
 * template SDK). We then close the panel and reveal the chat, where the bot's
 * follow-up message is already waiting.
 */
const TemplatePanel = (props: TemplatePanelProps) => {
  const { url, title, botStyles, onClose } = props;

  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);

  /**
   * Only accept messages coming from the exact origin we loaded the iframe
   * from. Without this check any page or embedded ad on the host site could
   * post a fake "submitted" and close the panel mid-booking.
   */
  const frameOrigin = useMemo(() => {
    try {
      return new URL(url).origin;
    } catch {
      return null;
    }
  }, [url]);

  useEffect(() => {
    if (!frameOrigin) return;

    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== frameOrigin) return;
      if (event.data?.source !== TEMPLATE_FRAME_SOURCE) return;

      if (event.data.event === "submitted") {
        setSubmitted(true);
        // Let the customer register that it worked before we swap views.
        setTimeout(onClose, CLOSE_DELAY_MS);
      } else if (event.data.event === "close") {
        onClose();
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [frameOrigin, onClose]);

  return (
    <Slide direction="up" in mountOnEnter unmountOnExit timeout={280}>
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          zIndex: 20,
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#fff",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            px: 1.5,
            py: 1,
            flexShrink: 0,
            bgcolor: botStyles?.primaryColor || "#fff",
            color: botStyles?.headerTextColor || "#000",
          }}
        >
          <IconButton
            size="small"
            aria-label="Back to chat"
            onClick={onClose}
            sx={{ color: "inherit" }}
          >
            <Icon icon="mdi:arrow-left" fontSize={20} />
          </IconButton>
          <Typography
            variant="body2"
            noWrap
            sx={{ fontWeight: 600, flexGrow: 1 }}
          >
            {title || "Complete your details"}
          </Typography>
        </Box>

        <Box sx={{ position: "relative", flexGrow: 1, minHeight: 0 }}>
          {loading && !submitted && (
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "#fff",
              }}
            >
              <CircularProgress size={28} />
            </Box>
          )}

          {submitted && (
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                zIndex: 2,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 1,
                backgroundColor: "#fff",
              }}
            >
              <Icon icon="mdi:check-circle" fontSize={44} color="#2e7d32" />
              <Typography variant="body2">Done! Returning to chat…</Typography>
            </Box>
          )}

          <Box
            component="iframe"
            src={url}
            title={title || "Template"}
            onLoad={() => setLoading(false)}
            // allow-same-origin keeps the template on its OWN origin (the
            // backend), which is what lets it call the session API with its
            // cookies. It is not the widget's origin, so the sandbox still
            // isolates it from the host page.
            sandbox="allow-scripts allow-forms allow-same-origin allow-popups"
            referrerPolicy="no-referrer"
            sx={{ width: "100%", height: "100%", border: 0, display: "block" }}
          />
        </Box>
      </Box>
    </Slide>
  );
};

export default TemplatePanel;
