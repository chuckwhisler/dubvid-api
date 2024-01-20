import Ffmpeg from 'fluent-ffmpeg';
import express from 'express';
import fileUpload from 'express-fileupload';
import { path } from '@ffmpeg-installer/ffmpeg';
import { getVideoDurationInSeconds } from 'get-video-duration';
const app = express();

let data = {
    "audio_duration_seconds": 55.68145124716553,
    "elevenlabs_api_key": "d1f44deb41da0cf32ce9f3f4adf55caf",
    "spoken_language": "en",
    "transcription": [
        {
            "end_time": 2.96,
            "start_time": 0.38,
            "transcript": " ChatGPT literally blew up the internet."
        },
        {
            "end_time": 7.6,
            "start_time": 3.36,
            "transcript": " They amassed whopping 1 million users in just 5 days after release."
        },
        {
            "end_time": 10.06,
            "start_time": 8.06,
            "transcript": " It's one of the most craziest things I've witnessed."
        },
        {
            "end_time": 12.02,
            "start_time": 10.3,
            "transcript": " And then reality hit."
        },
        {
            "end_time": 17.22,
            "start_time": 12.32,
            "transcript": " I tried it a few hours after they launched and the initial experience was absolutely insane."
        },
        {
            "end_time": 20.5,
            "start_time": 17.76,
            "transcript": " When I used it today, the quality has clearly dropped."
        },
        {
            "end_time": 23.42,
            "start_time": 20.82,
            "transcript": " Much more restrictive, much more generic outputs,"
        },
        {
            "end_time": 29.02,
            "start_time": 23.78,
            "transcript": " way less capable of providing that almost magical experience of how the f*** did you do that?"
        },
        {
            "end_time": 30.24,
            "start_time": 29.3,
            "transcript": " There's a reason for that."
        },
        {
            "end_time": 33.22,
            "start_time": 30.5,
            "transcript": " The OpenAI team had to put a ton of limitations in place."
        },
        {
            "end_time": 36.38,
            "start_time": 33.6,
            "transcript": " In the beginning, people were asking you how to create explosives,"
        },
        {
            "end_time": 38.14,
            "start_time": 36.8,
            "transcript": " how to write SQL injections."
        },
        {
            "end_time": 42.74,
            "start_time": 38.6,
            "transcript": " Someone even made it list banking sites around the world with well-known vulnerabilities"
        },
        {
            "end_time": 45.1,
            "start_time": 42.94,
            "transcript": " and then have it write exploits they could use."
        },
        {
            "end_time": 47.04,
            "start_time": 45.42,
            "transcript": " Obviously, that couldn't continue."
        },
        {
            "end_time": 51.42,
            "start_time": 47.62,
            "transcript": " And now we're left with a much less dangerous and much less impressive tool."
        },
        {
            "end_time": 53.88,
            "start_time": 51.8,
            "transcript": " Though I'm still pretty pumped about the potential."
        },
        {
            "end_time": 55.16,
            "start_time": 54.3,
            "transcript": " Let's see where this goes."
        }
    ],
    "voice_name": "Clyde"
}
app.use(fileUpload({ useTempFiles: true }));
app.use(express.json())

Ffmpeg.setFfmpegPath(path);
app.listen("3001", () => {
    console.log("Listening on 3001");
});

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

app.post('/api/video/convert/audio', (req, res) => {
    let data = req.body.data;
    let key = req.body.key;
    let account_id = req.body.account_id;

    console.log(req.body);
    // const audioFiles = [];
    // const delays = [];
    // for (var audio of data.transcription) {
    //     audioFiles.push(`/usr/share/nginx/html/source/${account_id}/${key}_${audio.start_time}_${audio.end_time}_translated_audio.mp3`);
    //     delays.push(audio.start_time * 1000)
    // }
    //
    // const audioInputs = audioFiles.map((file, index) => `[${index + 1}:a]adelay=${delays[index]}[a${index + 1}]`).join(';');
    // const audioMix = audioFiles.map((_, index) => `[a${index + 1}]`).join('');
    //
    // Ffmpeg()
    //     .input(`/usr/share/nginx/html/source/${account_id}/${key}.mp4`)
    //     .input(audioFiles.map((file, index) => `-i ${file}`).join(' '))
    //     .complexFilter(`${audioInputs};${audioMix}amix=inputs=${audioFiles.length}[aout]`)
    //     .audioCodec('aac')
    //     .videoCodec('copy')
    //     .on('end', () => console.log('Processing finished'))
    //     .on('error', (err) => console.error('Error:', err))
    //     .save(`/usr/share/nginx/html/source/${account_id}/${key}_output.mp4`);
    //
    res.json({ message: "Video Completed" });
})

app.post('/api/video/convert', (req, res) => {
    console.log(req.body)
    Ffmpeg(`/usr/share/nginx/html/source/${req.body.video_path}`)
        .inputOptions(['-async', '1'])
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

export default app;
