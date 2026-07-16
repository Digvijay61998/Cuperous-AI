import * as React from "react";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";

type Props = {
  open: boolean;
  setOpen: any;
  socket: any;
  visitorId: any;
  handleClose: any;
};

export default function SendTranscriptDialog({
  open,
  setOpen,
  socket,
  visitorId,
  handleClose,
}: Props) {
  const [data, setData] = React.useState<any>({
    name: "",
    email: "",
  });
  const saveState = (e: any) => {
    setData({
      ...data,
      [e.target.name]: e.target.value,
    });
  };
  const handleSendTranscript = (e: any) => {
    e.preventDefault();
    socket.emit("send-transcript", {
      data: {
        name: data.name,
        email: data.email,
        visitorId: visitorId,
      },
    });
    setOpen(false);
  };
  return (
    <div>
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle sx={{ m: 0, p: 0, textAlign: "center" }}>
          Send Transcript?
        </DialogTitle>
        <form onSubmit={handleSendTranscript}>
          <DialogContent>
            <DialogContentText sx={{ mt: -2, textAlign: "center" }}>
              Please fill the below fields
            </DialogContentText>

            <TextField
              autoFocus
              margin="dense"
              id="name"
              onChange={saveState}
              name="name"
              label="Enter Name"
              type="text"
              fullWidth
              required
              variant="standard"
            />

            <TextField
              autoFocus
              onChange={saveState}
              margin="dense"
              id="email"
              name="email"
              label="Email Address"
              type="email"
              required
              fullWidth
              variant="standard"
            />
          </DialogContent>
          <DialogActions>
            <Button size="small" onClick={handleClose}>
              Cancel
            </Button>
            <Button variant="contained" size="small" type="submit">
              Send Transcript
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </div>
  );
}
