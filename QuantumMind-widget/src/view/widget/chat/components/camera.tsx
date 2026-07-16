import React, { useState, useRef, useCallback } from 'react';
import { Button, Box } from '@mui/material';
import Webcam from 'react-webcam';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../store';

export default function Camera({
  updatemyMessages,
  socket,
  isSender,
  visitorId,
  setIsCameraOpen,
}: any) {
  const { accessToken, languages } = useSelector(
    (state: RootState) => state.bot,
  );
  // *** useref to handle webcam
  const webcamRef = useRef<any>(null);

  // ** hooks
  const [imgSrc, setImgSrc] = useState<any>(null);
  const [imagefile, setImageFile] = useState<Blob | string>();
  const [isShowVideo, setIsShowVideo] = useState(true);
  const [isCapturedImg, setIsCapturedImg] = useState(true);

  // ** capturing the image form webcam
  const capture = useCallback(async () => {
    const imageSrc = webcamRef.current.getScreenshot();
    setImageFile(imageSrc);
    setImgSrc(imageSrc);
    setIsShowVideo(false);
  }, [webcamRef]);

  // ** converting The Base24 Into Blob File

  function getFile(imageSrc: any) {
    const splitDataURI = imageSrc.split(',');
    const byteString =
      splitDataURI[0].indexOf('base64') >= 0
        ? atob(splitDataURI[1])
        : decodeURI(splitDataURI[1]);
    const mimeString = splitDataURI[0].split(':')[1].split(';')[0];

    const ia = new Uint8Array(byteString.length);
    for (let i = 0; i < byteString.length; i++)
      ia[i] = byteString.charCodeAt(i);

    return new Blob([ia], { type: mimeString });
  }

  // *** file uploading to server aswell as to Socket EVENT:"chat-message-bot"

  const uploadFileServer = async () => {
    const file: any = getFile(imagefile);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res: any = await axios.post(`${window.baseUrl}/api/file`, formData, {
        headers: {
          Authorization: 'Bearer ' + accessToken,
        },
      });
      const message = {
        value: `${window.baseUrl}/api${res.data.url}`,
        type: 'image',
        senderId: visitorId,
        time: new Date().toISOString(),
        id: new Date().getTime(),
      };
      socket?.emit('events', {
        event: 'chat-message-bot',
        data: { message: message.value, type: 'image' },
      });
      updatemyMessages(message);
      setIsCapturedImg(false);
      setIsCameraOpen(false);
      console.log('uploadFileServer to server', res);
      return `${window.baseUrl}/api${res.data.url}`;
    } catch (error: any) {
      toast.error(error.response.data.message || error.message || 'Failed...');
      return;
    }
  };

  return (
    <Box sx={{ maxWidth: '100%', borderRadius: 10, margin: '0 auto', mt: 2 }}>
      {isShowVideo ? (
        <>
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            width="100%"
            height={300}
          />
          <div style={{ textAlign: 'center', width: '100%' }}>
            <Button
              onClick={capture}
              type="submit"
              variant="contained"
              size="small"
            >
              Submit
            </Button>
            <Button
              sx={{ m: 1 }}
              onClick={(e: any) => setIsCameraOpen(false)}
              type="submit"
              variant="contained"
              size="small"
            >
              close
            </Button>
          </div>
        </>
      ) : imgSrc && isCapturedImg ? (
        <>
          {' '}
          <img src={imgSrc} />
          <div style={{ textAlign: 'center', width: '100%' }}>
            <Button
              onClick={() => setIsShowVideo(true)}
              type="submit"
              variant="contained"
              size="small"
            >
              Recapture
            </Button>
            <Button
              sx={{ m: 1 }}
              onClick={uploadFileServer}
              type="submit"
              variant="contained"
              size="small"
            >
              Upload
            </Button>
          </div>
        </>
      ) : (
        <></>
      )}
    </Box>
  );
}
