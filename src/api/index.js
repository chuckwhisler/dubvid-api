import Ffmpeg from 'fluent-ffmpeg';
import express from 'express';
import fileUpload from 'express-fileupload';
import { path } from '@ffmpeg-installer/ffmpeg';
import { getVideoDurationInSeconds } from 'get-video-duration';
const app = express();

app.use(fileUpload({ useTempFiles: true }));
app.use(express.json())

Ffmpeg.setFfmpegPath(path);
app.listen("3001", () => {
    console.log("Listening on 3001");
});

app.post('/api/video/convert', (req, res) => {
    let data = JSON.parse(req.body.data);
    let key = req.body.key;
    let account_id = req.body.account_id;

    const audioFiles = [];
    const delays = [];
    for (var audio of data.transcription) {
        // audioFiles.push(`/home/shayannadeem/Downloads/audio_segments/${key}_${audio.start_time}_${audio.end_time}_translated_audio.mp3`);
        audioFiles.push(`/usr/share/nginx/html/source/public/videos/${account_id}/${key}_${audio.start_time}_${audio.end_time}_translated_audio.mp3`);
        delays.push(audio.start_time * 1000)
    }

    const audioInputs = audioFiles.map((file, index) => `[${index + 1}:a]adelay=${delays[index]}[a${index + 1}]`).join(';');
    const audioMix = audioFiles.map((_, index) => `[a${index + 1}]`).join('');

    console.log(audioInputs);
    console.log(audioMix);
    console.log(delays);
    console.log(audioFiles);

    let ffmpeg = Ffmpeg();
    Ffmpeg().input(`/usr/share/nginx/html/source/public/videos/${account_id}/${key}.mp4`)
        .noAudio()
        .on('end', () => console.log('Audio Removed finished'))
        .on('error', (err) => console.error('Error:', err))
        .saveToFile(`/usr/share/nginx/html/source/public/videos/${account_id}/${key}_no_audio.mp4`);

    setTimeout(() => {
        ffmpeg.input(`/usr/share/nginx/html/source/public/videos/${account_id}/${key}_no_audio.mp4`);

        audioFiles.forEach((input) => {
            ffmpeg.input(input);
        });

        console.log(`${audioInputs};${audioMix}amix=inputs=${audioFiles.length}[aout]`)

        ffmpeg
            .complexFilter(`${audioInputs};${audioMix}amix=inputs=${audioFiles.length}[aout]`)
            .audioCodec('aac')
            .videoCodec('copy')
            .outputOptions(["-map 0:v", "-map [aout]", "-c:v copy", "-c:a aac"])
            .on('end', () => console.log('Processing finished'))
            .on('error', (err) => console.error('Error:', err))
            .saveToFile(`/usr/share/nginx/html/source/public/videos/${account_id}/${key}_output.mp4`);

        res.json({ message: "Video Completed" });
    }, 5000);
})

app.post('/api/video/create/thumbnail', (req, res) => {
    console.log(req.body.video_path);
    Ffmpeg()
        .input(`/usr/share/nginx/html/source/${req.body.video_path}`)
        .seekInput('00:00:15') // equivalent to -ss in FFmpeg
        .frames(1)
        .videoFilter('scale=220:114:force_original_aspect_ratio=decrease,pad=220:114:-1:-1:color=black')
        .on('end', () => {
            console.log('Screenshot taken successfully!');
        })
        .on('error', (err) => {
            console.error('Error:', err);
        })
        .output(`/usr/share/nginx/html/source/${req.body.video_path.split('.')[0]}_thumbnail.png`)
        .run();
});

app.post('/api/video/duration/get', async (req, res) => {
    console.log(req.body)
    let duration = await getVideoDurationInSeconds(`/usr/share/nginx/html/source/${req.body.video_path}`)
    res.json({ duration });
});


// app.post('/api/video/convert', (req, res) => {
//     console.log(req.body)
//     Ffmpeg(`/usr/share/nginx/html/source/${req.body.video_path}`)
//         .inputOptions(['-async', '1'])
//         .on('end', () => {
//             Ffmpeg()
//                 .input(`/usr/share/nginx/html/source/${req.body.video_path.split('.')[0] + "_no_audio." + req.body.video_path.split('.')[1]}`)
//                 .videoCodec('copy')
//                 .input(`/usr/share/nginx/html/source/${req.body.audio_path}`)
//                 .on('end', () => {
//                     console.log('Conversion finished!');
//                 })
//                 .on('error', (err) => {
//                     console.error('Error:', err);
//                 })
//                 .saveToFile(`/usr/share/nginx/html/source/${req.body.output_path}`);
//             res.json({ "message": "File converted successfully." });
//             console.log("completed")
//         }).on('error', (e) => {
//             console.log("err", e)
//         })
//         .noAudio()
//         .saveToFile(`/usr/share/nginx/html/source/${req.body.video_path.split('.')[0] + "_no_audio." + req.body.video_path.split('.')[1]}`);
// });

export default app;
