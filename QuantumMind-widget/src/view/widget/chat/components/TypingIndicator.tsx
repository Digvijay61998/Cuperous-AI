import Box from "@mui/material/Box";

/**
 * "…" bubble shown while the bot is preparing a reply or the agent is typing.
 * The dots use the existing `tidot` bounce animation (index.css); motion is
 * turned off for visitors who ask for reduced motion.
 */
export default function TypingIndecator({ label = "Typing" }: { label?: string }) {
  return (
    <Box
      role="status"
      aria-live="polite"
      aria-label={label}
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        px: 1.5,
        py: 1,
        borderRadius: "16px 16px 16px 4px",
        bgcolor: "#F1F3F7",
        boxShadow: "0 1px 2px rgba(0,0,0,0.08)",
        "& .tidot": { width: 7, height: 7, mr: 0, bgcolor: "#8a8a8b" },
        "@media (prefers-reduced-motion: reduce)": { "& .tidot": { animation: "none" } },
      }}
    >
      <span className="tidot" />
      <span className="tidot" />
      <span className="tidot" />
    </Box>
  );
}
