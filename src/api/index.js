import Ffmpeg from 'fluent-ffmpeg';
import express from 'express';
import fs from 'fs';
import fileUpload from 'express-fileupload';
import { path } from '@ffmpeg-installer/ffmpeg';
import { Blob } from 'buffer';
import fetch from 'node-fetch';
import { getVideoDurationInSeconds } from 'get-video-duration';
const app = express();

app.use(fileUpload({ useTempFiles: true }));
app.use(express.json())

Ffmpeg.setFfmpegPath(path);
app.listen("3001", () => {
    console.log("Listening on 3001");
});

// app.post('/api/video/dubbing', (req, res) => {
//     let key = req.body.key;
//     let account_id = req.body.account_id;
//
//     Ffmpeg(`/usr/share/nginx/html/source/public/videos/${account_id}/${key}.mp4`)
//         .noAudio()
//         .on('end', () => console.log('Audio Removed finished'))
//         .on('error', (err) => console.error('Audio Error:', err))
//         .saveToFile(`/usr/share/nginx/html/source/public/videos/${account_id}/${key}_no_audio.mp4`);
//
//     res.json({ message: "Video Completed" });
// })
// app.post('/api/video/convert', (req, res) => {
//     let data = JSON.parse(req.body.data);
//     let key = req.body.key;
//     let account_id = req.body.account_id;
//
//     const audioFiles = [];
//     const delays = [];
//     for (var audio of data.transcription) {
//         // audioFiles.push(`/home/shayannadeem/Downloads/audio_segments/${key}_${audio.start_time}_${audio.end_time}_translated_audio.mp3`);
//         audioFiles.push(`/usr/share/nginx/html/source/public/videos/${account_id}/${key}_${audio.start_time}_${audio.end_time}_translated_audio.mp3`);
//         delays.push(audio.start_time * 1000)
//     }
//
//     const audioInputs = audioFiles.map((file, index) => `[${index + 1}:a]adelay=${delays[index]}[a${index + 1}]`).join(';');
//     const audioMix = audioFiles.map((_, index) => `[a${index + 1}]`).join('');
//
//     console.log(audioInputs);
//     console.log(audioMix);
//     console.log(delays);
//     console.log(audioFiles);
//     console.log("account_id:", account_id);
//     console.log("key:", key);
//
//     Ffmpeg(`/usr/share/nginx/html/source/public/videos/${account_id}/${key}.mp4`)
//         .noAudio()
//         .on('end', () => console.log('Audio Removed finished'))
//         .on('error', (err) => console.error('Audio Error:', err))
//         .saveToFile(`/usr/share/nginx/html/source/public/videos/${account_id}/${key}_no_audio.mp4`);
//
//     setTimeout(() => {
//         let ffmpeg = Ffmpeg();
//         ffmpeg.input(`/usr/share/nginx/html/source/public/videos/${account_id}/${key}_no_audio.mp4`);
//
//         audioFiles.forEach((input) => {
//             ffmpeg.input(input);
//         });
//
//         console.log(`${audioInputs};${audioMix}amix=inputs=${audioFiles.length}[aout]`)
//
//         ffmpeg
//             .complexFilter(`${audioInputs};${audioMix}amix=inputs=${audioFiles.length}[aout]`)
//             .audioCodec('aac')
//             .videoCodec('copy')
//             .outputOptions(["-map 0:v", "-map [aout]", "-c:v copy", "-c:a aac"])
//             .on('end', () => console.log('Processing finished'))
//             .on('error', (err) => console.error('Error:', err))
//             .saveToFile(`/usr/share/nginx/html/source/public/videos/${account_id}/${key}_output.mp4`);
//
//         res.json({ message: "Video Completed" });
//     }, 10000);
// })

app.post('/api/video/create/thumbnail', (req, res) => {
    console.log(req.body.video_path);
    Ffmpeg()
        .input(`/usr/share/nginx/html/source/${req.body.video_path}`)
        .seekInput('00:00:15') // equivalent to -ss in FFmpeg
        .frames(1)
        .videoFilter('thumbnail')
        .on('end', () => {
            console.log('Screenshot taken successfully!');
            res.json({ message: "Screenshot taken successfully" });
        })
        .on('error', (err) => {
            console.error('Error:', err);
        })
        .output(`/usr/share/nginx/html/source/${req.body.video_path.split('.')[0]}_thumbnail.png`)
        .run();
});

app.post('/api/video/duration/get', async (req, res) => {
    let file = req.files?.file;
    if (!file) {
        let duration = await getVideoDurationInSeconds(fs.createReadStream(`/usr/share/nginx/html/source/${req.body.video_path}`))
        console.log(duration);
        res.json({ duration });
    } else {
        let uploadPath = './tmp/' + file.name;

        file.mv(uploadPath, async function(err) {
            if (err)
                return res.status(500).send(err);

            let duration = await getVideoDurationInSeconds(fs.createReadStream(uploadPath))
            console.log(duration);
            res.json({ duration });
        });
    }
});


app.post('/api/video/convert', (req, res) => {
    console.log(req.body)
    Ffmpeg(`/usr/share/nginx/html/source/${req.body.video_path}`)
        .on('end', () => {
            Ffmpeg()
                .input(`/usr/share/nginx/html/source/${req.body.video_path.split('.')[0] + "_no_audio." + req.body.video_path.split('.')[1]}`)
                .videoCodec('copy')
                .input(`/usr/share/nginx/html/source/${req.body.audio_path}`)
                .on('end', () => {
                    console.log('Conversion finished!');
                })
                .on('error', (err) => {
                    console.error('Error:', err);
                })
                .saveToFile(`/usr/share/nginx/html/source/${req.body.output_path}`);
            res.json({ "message": "File converted successfully." });
            console.log("completed")
        }).on('error', (e) => {
            console.log("err", e)
        })
        .noAudio()
        .saveToFile(`/usr/share/nginx/html/source/${req.body.video_path.split('.')[0] + "_no_audio." + req.body.video_path.split('.')[1]}`);
});

app.post('/api/video/compress', (req, res) => {
    let video_path = `/usr/share/nginx/html/source/${req.body.video_path}`;;
    console.log(video_path);
    let outputPath = `/usr/share/nginx/html/source/${req.body.video_path.split('.')[0] + "_compressed." + req.body.video_path.split('.')[1]}`;
    Ffmpeg()
        .input(video_path)
        .videoCodec('libx264')
        .videoBitrate('1500k')
        .addOption('-maxrate', '1500k')
        .addOption('-bufsize', '3000k')
        .audioCodec('aac')
        .audioBitrate('192k')
        .addOption('-fs', '10M')
        .addOption('-preset', 'fast')
        .output(outputPath)
        .on('end', () => {
            console.log('Conversion finished');
            res.json({ "message": "File converted successfully." });
        })
        .on('error', (err) => {
            console.error('Error:', err);
        })
        .run();
    res.json({ "message": "File converted successfully." });
});

export default app;
