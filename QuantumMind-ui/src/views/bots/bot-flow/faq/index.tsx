import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Modal from '@mui/material/Modal';
import { TextField } from '@mui/material'
const style = {
    position: 'absolute' as 'absolute',
    top: '20%',
    right: '-8%',
    transform: 'translate(-50%, -50%)',
    width: 400,
    bgcolor: 'background.paper',
    border: '2px solid #000',
    boxShadow: 24,
    p: 4,
};
type Props = {
    open: boolean,
    setOpen: any
}

export default function BasicModal(props: Props) {
    const { open, setOpen } = props
    const handleOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);

    return (
        <div>
            <Modal
                open={open}
                onClose={handleClose}
                aria-labelledby="modal-modal-title"
                aria-describedby="modal-modal-description"
              
            >
                <Box sx={style}>
                    <Typography id="modal-modal-title" variant="h6" component="h2">
                        User Input
                    </Typography>
                    <br />
                    <TextField label="input message" size="small" fullWidth />
                    <br />
                    <br/>
                    <div style={{ margin: "0 auto", textAlign: "center" }}> <Button variant="contained">Save</Button></div>
                </Box>
            </Modal>
        </div>
    );
}
