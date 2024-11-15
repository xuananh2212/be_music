const express = require('express');
const path = require('path');
const multer = require('multer');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static'); // Import ffmpeg-static for ffmpeg
const ffprobePath = require('ffprobe-static').path; // Import ffprobe-static for ffprobe
const fs = require('fs');
const { v4: uuidv4 } = require('uuid'); // Import UUID for generating unique identifiers

const router = express.Router();

// Set ffmpeg and ffprobe binary paths
ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);

// Define storage for uploaded files
const storage = multer.diskStorage({
     destination: function (req, file, cb) {
          cb(null, 'src/uploads/');
     },
     filename: function (req, file, cb) {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
          cb(null, uniqueSuffix + path.extname(file.originalname));
     }
});
const upload = multer({
     storage: storage,
     limits: { fileSize: 10 * 1024 * 1024 }, // Limit upload to 10MB
     fileFilter: function (req, file, cb) {
          const filetypes = /jpeg|jpg|png|gif|mp4|mp3/;
          const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
          if (extname) {
               return cb(null, true);
          } else {
               cb(new Error('Accepted file formats: image, video, or audio'));
          }
     }
}).single('file');

// Function to split video into HLS segments with audio quality adjustment
function splitVideoToHLS(inputVideoPath, outputFolder, audioBitrate, uniqueId, callback) {
     const outputPath = path.join(outputFolder, `${uniqueId}.m3u8`);

     // Use ffmpeg to convert the video to HLS format
     ffmpeg(inputVideoPath)
          .output(outputPath)
          .audioBitrate(audioBitrate) // Set audio bitrate for quality adjustment
          .outputOptions([
               '-hls_time', '10',             // Duration of each segment (in seconds)
               '-hls_list_size', '0',         // Ensure the playlist contains all segments
               '-hls_segment_filename', `${outputFolder}/${uniqueId}_%03d.ts` // Segment filename pattern
          ])
          .on('end', function () {
               console.log('HLS conversion complete');
               callback(null);
          })
          .on('error', function (err) {
               console.error('Error during HLS conversion:', err.message);
               callback(err);
          })
          .run();
}

// Route for handling file upload and HLS conversion
router.post('/', (req, res) => {
     upload(req, res, function (err) {
          if (err instanceof multer.MulterError) {
               return res.status(500).json({ error: 'File upload error: ' + err.message });
          } else if (err) {
               return res.status(400).json({ error: 'File error: ' + err.message });
          }
          if (!req.file) {
               return res.status(400).json({ error: 'Please select a file to upload.' });
          }

          const inputVideoPath = req.file.path;
          const outputDir = "src/uploads/hls";
          if (!fs.existsSync(outputDir)) {
               fs.mkdirSync(outputDir, { recursive: true });
          }

          // Generate a unique identifier for this upload session
          const uniqueId = uuidv4();

          // Set desired audio quality (bitrate) based on your requirement
          const audioBitrate = '128k'; // Example: 128 kbps audio quality

          // Convert the video to HLS format
          splitVideoToHLS(inputVideoPath, outputDir, audioBitrate, uniqueId, (err) => {
               if (err) {
                    return res.status(500).json({ error: 'An error occurred during the HLS conversion process.' });
               }

               // Return a success response with the HLS playlist URL
               res.status(200).json({
                    message: 'HLS conversion successful!',
                    playlistUrl: `/uploads/hls/${uniqueId}.m3u8`
               });
          });
     });
});

module.exports = router;