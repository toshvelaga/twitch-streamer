import express, { Request, Response } from 'express';
import cors from 'cors';

import { ChildProcess, spawn } from 'child_process';
// const child_process = require('child_process');
import { Server } from 'socket.io';
import { ffmpeg2, youtubeSettings, inputSettings } from './ffmpeg';

console.log(ffmpeg2);

const app = express();
app.use(cors());
app.use(express.json({ limit: '200mb' }));
app.use(
  express.urlencoded({ limit: '200mb', extended: true, parameterLimit: 50000 })
);

app.get('/', (req: Request, res: Response) => {
  res.send('Application works!');
});

const PORT = process.env.PORT || 5100
const WS_PORT: number = Number(process.env.PORT) || 3100
app.listen(PORT, () => {
  console.log('Application started on port ', PORT);
});
console.log(WS_PORT)
const io = new Server(WS_PORT, {
  /* options */
  cors: {
    origin: '*',
  },
})

io.on('connection', (socket) => {
  console.log(`socket connected to ${socket.id}`)

  const socketQueryParams = socket.handshake.query
  // ingestion address + streamname
  const youtubeDestinationUrl = `rtmp://a.rtmp.youtube.com/live2/kk9m-v71b-ta1a-4e2p-cys6`

  const ffmpegInput = inputSettings.concat(
    youtubeSettings(youtubeDestinationUrl),
    // twitchSettings(twitch),
    // facebookSettings(facebook),
    // customRtmpSettings(customRTMP)
  )

  // console.log(ffmpegInput)

  // const ffmpeg = child_process.spawn(
  //   'ffmpeg',
  //   ffmpeg2(youtube, twitch, facebook)
  // )
  const ffmpeg = spawn('ffmpeg', ffmpegInput)

  // If FFmpeg stops for any reason, close the WebSocket connection.
  ffmpeg.on('close', (code: any, signal: any) => {
    console.log(
      'FFmpeg child process closed, code ' + code + ', signal ' + signal
    )
    // ws.terminate()
  })

  // Handle STDIN pipe errors by logging to the console.
  // These errors most commonly occur when FFmpeg closes and there is still
  // data to write.  If left unhandled, the server will crash.
  ffmpeg.stdin.on('error', (e: any) => {
    console.log('FFmpeg STDIN Error', e)
  })

  // FFmpeg outputs all of its messages to STDERR.  Let's log them to the console.
  ffmpeg.stderr.on('data', (data: any) => {
    console.log('FFmpeg STDERR:', data.toString())
  })

  // When data comes in from the WebSocket, write it to FFmpeg's STDIN.
  socket.on('message', (msg) => {
    console.log('DATA', msg)
    ffmpeg.stdin.write(msg)
  })

  // If the client disconnects, stop FFmpeg.
  socket.conn.on('close', (e) => {
    console.log('kill: SIGINT')
    ffmpeg.kill('SIGINT')
  })
})
