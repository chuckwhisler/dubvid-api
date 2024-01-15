import Ffmpeg from 'fluent-ffmpeg';
import express from 'express';
import fileUpload from 'express-fileupload';
const app = express();

app.use(fileUpload({ useTempFiles: true }));
app.use(express.json())

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
        .output(`/usr/share/nginx/html/source/${req.body.video_path.split('.')[0]}_ss.png`)
        .run();
});

app.post('/api/video/convert', (req, res) => {

    console.log(req.body)
    Ffmpeg(`/usr/share/nginx/html/source/${req.body.video_path}`)
        .on('end', () => {
            Ffmpeg()
                .input(`/usr/share/nginx/html/source/${req.body.video_path.split('.')[0] + "_no_audio." + req.body.video_path.split('.')[1]}`)
                .videoCodec('copy')
                .input(`/usr/share/nginx/html/source/${req.body.audio_path}`)
                .audioCodec('aac')
                .on('end', () => {
                    console.log('Conversion finished!');
                })
                .on('error', (err) => {
                    console.error('Error:', err);
                })
                .saveToFile(`${req.body.output_path}`);
            res.json({ "message": "File converted successfully." });
            console.log("completed")
        }).on('error', (e) => {
            console.log("err", e)
        })
        .noAudio()
        .saveToFile(`/usr/share/nginx/html/source/${req.body.video_path.split('.')[0] + "_no_audio." + req.body.video_path.split('.')[1]}`);
});

export default app;
