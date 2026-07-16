import React from "react";
import {
  Stack,
  TextField,
  Typography,
  Button,
  CircularProgress,
} from "@mui/material";
import ChatbotImage from "./ChatbotImage";
type Props = {
  handleStartConversation: any;
  saveState: any;
  loading: boolean;
  handleSkipConversation: any;
};

export default function Form({
  handleStartConversation,
  saveState,
  loading,
  handleSkipConversation,
}: Props) {
  return (
    <div style={{
      margin:"1 auto",
      textAlign:"center",
    }}>
      {/* <ChatbotImage /> */}
      <Typography
        sx={{
          textAlign: "center",
          color: "#ffa100",
          fontWeight: "500",
          fontFamily: "'Montserrat', sans-serif",
          fontSize: "0.95rem",
          mb: 0.5,
        }}
      >
        Complete you information
      </Typography>
      <form
        style={{
          height: "100%",
          maxWidth: "80%",
          overflowY: "auto",
          margin: "0 auto",
        }}
        onSubmit={handleStartConversation}
      >
        <Stack
          direction="column"
          alignItems="space-between"
          justifyContent="center"
          width="90%"
          height="100%"
          margin="0 auto"
        >
          <TextField
            label="Name"
            size="small"
            fullWidth
            placeholder="Enter your name..."
            sx={{ mb: 2 }}
            name="name"
            onChange={saveState}
            type="text"
            required
          />
          <TextField
            label="Mobile No"
            size="small"
            fullWidth
            placeholder="Enter your mobile no..."
            sx={{ mb: 2 }}
            name="phone"
            onChange={saveState}
            type="number"
          />
          <TextField
            label="Email Address"
            size="small"
            fullWidth
            placeholder="Enter you email address"
            name="email"
            onChange={saveState}
            type="email"
            required
          />
          <br />
          {loading ? (
            <div style={{ width: "100%", textAlign: "center" }}>
              <CircularProgress color="primary" />
            </div>
          ) : (
            <>
              <Button
                type="submit"
                variant="contained"
                sx={{ textTransform: "capitalize" }}
              >
                Start Conversation
              </Button>
              <Button
                onClick={handleSkipConversation}
                sx={{ textTransform: "capitalize", mt: 1, fontWeight: "bold" }}
              >
                Skip
              </Button>
            </>
          )}
        </Stack>
      </form>
    </div>
  );
}
