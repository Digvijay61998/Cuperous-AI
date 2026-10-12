import { Icon } from "@iconify/react";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { useState } from "react";

/** Service request references look like SR_Ab12Cd. */
const REF_RE = /\bSR_[A-Za-z0-9_-]{4,}\b/;

type Severity = "success" | "info" | "warning" | "error";

const LOOK: Record<Severity, { bg: string; border: string; fg: string; icon: string }> = {
  success: { bg: "linear-gradient(135deg, #E8F8EE 0%, #D3F2DF 100%)", border: "#7DD3A0", fg: "#14532D", icon: "mdi:check-circle" },
  info: { bg: "linear-gradient(135deg, #EAF3FF 0%, #DCEBFF 100%)", border: "#93C5FD", fg: "#1E3A8A", icon: "mdi:account-clock" },
  warning: { bg: "#FFF7E6", border: "#FCD34D", fg: "#78350F", icon: "mdi:alert-circle" },
  error: { bg: "#FDECEC", border: "#FCA5A5", fg: "#7F1D1D", icon: "mdi:close-circle" },
};

/**
 * System messages from the server (`info` set): an agent joined, the visitor
 * is waiting, a ticket was created. A ticket reference in the text is shown
 * as a separate, copyable "Ticket number" line so it is easy to keep.
 */
export default function StatusNotice({ severity, text }: { severity: string; text: string }) {
  const s: Severity = (["success", "info", "warning", "error"].includes(severity) ? severity : "info") as Severity;
  const look = LOOK[s];
  const ref = (text || "").match(REF_RE)?.[0];
  const [copied, setCopied] = useState(false);
  const waiting = s === "info";

  const copy = () => {
    if (!ref) return;
    void navigator.clipboard?.writeText(ref).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <Box
      role="status"
      sx={{
        display: "flex",
        gap: 1.25,
        alignItems: "flex-start",
        p: 1.5,
        borderRadius: "12px",
        background: look.bg,
        border: `1px solid ${look.border}`,
        color: look.fg,
        boxShadow: "0 2px 6px rgba(0,0,0,0.06)",
        animation: "jcNoticeIn 240ms ease-out",
        "@keyframes jcNoticeIn": { from: { opacity: 0, transform: "translateY(4px)" }, to: { opacity: 1, transform: "none" } },
        "@media (prefers-reduced-motion: reduce)": { animation: "none" },
      }}
    >
      <Box sx={{ position: "relative", mt: "1px", display: "flex" }}>
        <Icon icon={look.icon} fontSize={22} aria-hidden />
        {waiting && (
          <Box
            aria-hidden
            sx={{
              position: "absolute",
              right: -2,
              top: -2,
              width: 8,
              height: 8,
              borderRadius: "50%",
              bgcolor: "#3B82F6",
              animation: "jcPulse 1.4s ease-in-out infinite",
              "@keyframes jcPulse": { "0%,100%": { opacity: 1 }, "50%": { opacity: 0.25 } },
              "@media (prefers-reduced-motion: reduce)": { animation: "none" },
            }}
          />
        )}
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ fontSize: "0.85rem", lineHeight: 1.45, wordBreak: "break-word" }}>{text}</Typography>
        {ref && (
          <Box
            sx={{
              mt: 1,
              display: "inline-flex",
              alignItems: "center",
              gap: 0.5,
              pl: 1.25,
              pr: 0.25,
              py: 0.25,
              borderRadius: "999px",
              bgcolor: "rgba(255,255,255,0.8)",
              border: `1px dashed ${look.border}`,
            }}
          >
            <Typography component="span" sx={{ fontSize: "0.75rem", opacity: 0.8 }}>
              Ticket number
            </Typography>
            <Typography component="span" sx={{ fontSize: "0.85rem", fontWeight: 700, letterSpacing: "0.02em" }}>
              {ref}
            </Typography>
            <Tooltip title={copied ? "Copied" : "Copy"} arrow>
              <IconButton size="small" onClick={copy} aria-label={`Copy ticket number ${ref}`} sx={{ color: "inherit" }}>
                <Icon icon={copied ? "mdi:check" : "mdi:content-copy"} fontSize={14} />
              </IconButton>
            </Tooltip>
          </Box>
        )}
      </Box>
    </Box>
  );
}
