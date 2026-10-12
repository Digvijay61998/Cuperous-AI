import { Icon } from "@iconify/react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";

type Props = {
  notice?: string;
  botStyles?: any;
  starting: boolean;
  onStartNew: () => void;
};

/**
 * Ended_State (crm-incident-handover R14.6): the chat is closed. Shown in
 * place of the message input, with one "Start new chat" action (R14.9).
 * `role="status"` so screen readers announce the change.
 */
export default function EndedPanel({ notice, botStyles, starting, onStartNew }: Props) {
  return (
    <Box
      role="status"
      aria-live="polite"
      sx={{
        flexShrink: 0,
        px: 2,
        py: 1.5,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 1,
        borderTop: "1px solid rgba(0,0,0,0.08)",
        backgroundColor: "background.paper",
      }}
    >
      <Typography variant="body2" sx={{ color: "text.secondary", textAlign: "center" }}>
        {notice || "This chat has ended."}
      </Typography>
      <Button
        variant="contained"
        disabled={starting}
        onClick={onStartNew}
        sx={{ textTransform: "unset", backgroundColor: botStyles?.primaryColor, color: botStyles?.headerTextColor }}
        startIcon={starting ? <CircularProgress size={16} color="inherit" /> : <Icon icon="mdi:message-plus" fontSize={20} />}
      >
        Start new chat
      </Button>
    </Box>
  );
}
