import React, { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import logo from './logo.svg';
import './App.css';

const App: React.FC = () => {
  const videoRef = React.createRef<HTMLVideoElement>();
  let socket = io('ws://localhost:3100', {
    transports: ['websocket'],
  });
  const [stream, setStream] = useState<MediaStream>();

  const handleStartRecording = () => {
    if (socket === undefined) {
      socket = io('ws://localhost:3100', {
        transports: ['websocket'],
      });
    }
    console.log(socket);
  };

  const recorderInit = () => {
    let liveStream = (videoRef.current as any).captureStream(30);

    let mediaRecorder = new MediaRecorder(liveStream!, {
      mimeType: 'video/webm;codecs=h264',
      videoBitsPerSecond: 3 * 1024 * 1024,
    });

    console.log(mediaRecorder, mediaRecorder.ondataavailable);
    mediaRecorder.ondataavailable = (e: any) => {
      console.log('sending chunks', e.data, socket);
      socket.send(e.data);
    };
    mediaRecorder.start(1000);
  };

  const getStream = async () => {
    if (stream && videoRef.current) return;
    // const mediaStream = await navigator.mediaDevices.getUserMedia({
    //   audio: true,
    //   video: {
    //     height: { min: 720, max: 1280 },
    //     width: { min: 1080, max: 1920 },
    //     frameRate: { min: 15, ideal: 24, max: 30 },
    //     facingMode: 'user',
    //   }
    // }
    // )
    const mediaStream = await navigator.mediaDevices.getDisplayMedia({
      audio: true,
      video: {
        height: 1080,
        width: 1920,
        frameRate: { ideal: 24, max: 30 },
      },
    });
    setStream(mediaStream);
    if (videoRef.current) {
      console.log(videoRef.current);
      videoRef.current.srcObject = mediaStream;
    }
    // stream.current.replaceVideoTrack(stream.current.getVideoTracks()[0])
    // stream.current.replaceAudioTrack(stream.current.getAudioTracks()[0])
  };

  useEffect(() => {
    getStream();
  }, [videoRef]);

  return (
    <div className="App">
      <header className="App-header">
        <video width={200} height={200} className="video-container" ref={videoRef} autoPlay playsInline muted={true} />
        <button onClick={recorderInit}>init</button>
        <button onClick={handleStartRecording}>start recording</button>
      </header>
    </div>
  );
};

export default App;
