// ** MUI Imports
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";

// ** Icon Imports
import { Icon } from "@iconify/react";

interface TemplateLauncherProps {
  message: string;
  buttonText?: string;
  url: string;
  botStyles?: any;
  onOpen?: (url: string, title: string) => void;
}

/**
 * The in-chat card for a ChatTypeEnum.TEMPLATE message. Tapping it opens the
 * template over the conversation (see TemplatePanel) rather than navigating
 * away.
 *
 * Falls back to a normal new-tab link when no handler is wired, so the message
 * is never a dead end.
 */
const TemplateLauncher = (props: TemplateLauncherProps) => {
  const { message, buttonText, url, botStyles, onOpen } = props;

  // Defend against a malformed/hostile URL reaching an href or iframe src:
  // javascript: and data: URLs must never be launched from a bot message.
  let safeUrl: string | null = null;
  try {
    const parsed = new URL(url);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      safeUrl = parsed.toString();
    }
  } catch {
    safeUrl = null;
  }

  const label = buttonText || "Open";

  const handleClick = () => {
    if (!safeUrl) return;
    if (onOpen) {
      onOpen(safeUrl, message || label);
    } else {
      window.open(safeUrl, "_blank", "noopener,noreferrer");
    }
  };

  if (!safeUrl) return null;

  return (
    <Box
      sx={{
        maxWidth: "100%",
        p: 1.5,
        borderRadius: "8px",
        backgroundColor: "#fff",
        boxShadow: "0 1px 4px rgba(0,0,0,0.12)",
      }}
    >
      {message && (
        <Typography
          variant="body2"
          sx={{ mb: 1.25, whiteSpace: "pre-wrap", color: "#2f2f2f" }}
        >
          {message}
        </Typography>
      )}
      <Button
        fullWidth
        size="small"
        variant="contained"
        disableElevation
        onClick={handleClick}
        endIcon={<Icon icon="mdi:arrow-right" fontSize={16} />}
        sx={{
          textTransform: "none",
          backgroundColor: botStyles?.primaryColor || "#757de8",
          color: botStyles?.headerTextColor || "#fff",
          "&:hover": {
            backgroundColor: botStyles?.primaryColor || "#757de8",
            filter: "brightness(0.94)",
          },
        }}
      >
        {label}
      </Button>
    </Box>
  );
};

export default TemplateLauncher;
