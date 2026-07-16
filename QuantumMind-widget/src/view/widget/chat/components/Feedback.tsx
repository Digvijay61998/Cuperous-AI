import React, { useState } from "react";
import Rating from "@mui/material/Rating";
import Stack from "@mui/material/Stack";
import { Alert, Button, TextField, Typography } from "@mui/material";
import { toast } from "react-hot-toast";

export default function Feedback({ socket, setIsFeedbackOpen, botStyles }: any) {
  const [data, setData] = useState({
    rating: 0,
    comment: "",
  });
  const [alertMessage, setAlertMessage] = useState<string>("")
  const handleFeedback = (e: any) => {
    e.preventDefault();
    if (data.rating > 0) {
      socket.emit("submit-feedback", { data });
      setIsFeedbackOpen(false);
      setAlertMessage("")
    }else{
        setAlertMessage("Please give rating...")
    }
  };
  const saveState = (e: any) => {
    setData({ ...data, [e.target.name]: e.target.value });
  };
  const buttonStyle = {
    textTransform: "capitalize",
    color: botStyles?.buttonTextColor || "default",
    backgroundColor: botStyles?.buttonColor,
    "&:hover": {
      backgroundColor: "blue",
      color: "#fff",
    },
    borderColor: botStyles.buttonColor,
    mb: 0.2,
  };
  return (
    <form
      onSubmit={handleFeedback}
      style={{
        padding: "0.5rem",
        boxShadow: "0 0 3px grey",
        marginTop: "0.5rem",
        borderRadius: "0.3rem",
      }}
    >
        {alertMessage && <Alert severity="warning" >{alertMessage}</Alert>}
      <Stack
        spacing={1}
        direction="column"
        width="90%"
        margin="0 auto"
        justifyContent="center"
        alignItems="center"
      >
        <Typography
          variant="overline"
          display="block"
          gutterBottom
          sx={{ fontSize: "1.1rem", color: "#000" }}
        >
          Feedback
        </Typography>
        <Rating
          name="rating"
          onChange={saveState}
          defaultValue={0}
          precision={1}
          size="large"
        />
        <TextField
          multiline
          rows={3}
          fullWidth
          inputProps={{
            maxLength: "180"
          }}
          onChange={saveState}
          name="comment"
          placeholder="Add your feedback message..."
        />
        <Button type="submit" variant="contained" size="small"  sx={buttonStyle}>
          Submit
        </Button>
      </Stack>
    </form>
  );
}
