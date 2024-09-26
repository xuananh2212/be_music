var express = require('express');
var path = require('path');
const multer = require('multer');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static'); // Import ffmpeg-static for ffmpeg
const ffprobePath = require('ffprobe-static').path; // Import ffprobe-static for ffprobe
const fs = require('fs');
const { v4: uuidv4 } = require('uuid'); // Import UUID for generating unique identifiers
var router = express.Router();

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
     limits: {
          fileSize: 10 * 1024 * 1024   // Limit upload to 10MB
     },
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

// Function to get video duration with enhanced logging
function getVideoDuration(inputVideoPath, callback) {
     ffmpeg.ffprobe(inputVideoPath, function (err, metadata) {
          if (err) {
               console.error("FFprobe error:", err.message);
               callback(err, null);
          } else {
               // Check if duration is available
               const duration = metadata && metadata.format && metadata.format.duration;
               if (!duration) {
                    console.error("FFprobe did not return a valid duration.");
                    return callback(new Error("Duration not found in metadata"), null);
               }
               console.log(`Total Duration Retrieved: ${duration} seconds`); // Debugging
               callback(null, parseFloat(duration.toFixed(2))); // Ensure duration is precise and rounded
          }
     });
}

function splitVideoToMp3(inputVideoPath, outputFolder, segmentDuration, uniqueId, callback) {
     // Use uniqueId to ensure filenames are unique for each upload session
     ffmpeg(inputVideoPath)
          .output(`${outputFolder}/${uniqueId}_output%03d.mp3`) // Unique filenames for each part
          .format('mp3') // Output format is mp3
          .outputOptions([
               '-f', 'segment',               // Split the audio into segments
               '-segment_time', segmentDuration, // Duration of each segment
               '-reset_timestamps', '1'       // Reset timestamps for each segment
          ])
          .on('end', function () {
               console.log('Splitting audio into mp3 complete');
               callback(null);
          })
          .on('error', function (err) {
               console.error('Error occurred during splitting:', err.message);
               callback(err);
          })
          .run();
}

function copyVideoToMp3(inputVideoPath, outputFilePath, callback) {
     ffmpeg(inputVideoPath)
          .output(outputFilePath) // Single output file
          .format('mp3') // Output format is mp3
          .on('end', function () {
               console.log('Audio copied successfully as a single part.');
               callback(null);
          })
          .on('error', function (err) {
               console.error('Error occurred during audio copying:', err.message);
               callback(err);
          })
          .run();
}

// Route for handling file upload and splitting video to mp3
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
          const originalFilePath = `/uploads/${req.file.filename}`; // Original file path
          const outputDir = "src/uploads/parts";
          if (!fs.existsSync(outputDir)) {
               fs.mkdirSync(outputDir, { recursive: true });
          }

          // Check file extension
          const fileExtension = path.extname(req.file.originalname).toLowerCase();

          // If the file is not mp3 or mp4, return the original file without splitting
          if (fileExtension !== '.mp3' && fileExtension !== '.mp4') {
               return res.status(200).json({
                    message: 'File format is not mp3 or mp4. Returning the original file.',
                    filePath: originalFilePath,
                    parts: [
                         {
                              file: originalFilePath,
                              startTime: 0,
                              endTime: null // Since there's no splitting, no endTime
                         }
                    ]
               });
          }

          // Generate a unique identifier for this upload session
          const uniqueId = uuidv4();

          const segmentDuration = 30; // Each segment is 30 seconds long

          // Get total duration of the video
          getVideoDuration(inputVideoPath, (err, totalDuration) => {
               if (err) {
                    console.error('Error fetching video duration:', err.message);
                    return res.status(500).json({ error: 'Error fetching video duration: ' + err.message });
               }

               // If totalDuration is less than or equal to segmentDuration, copy as one part
               if (totalDuration <= segmentDuration) {
                    const outputFilePath = path.join(outputDir, `${uniqueId}_output001.mp3`); // Single output file
                    copyVideoToMp3(inputVideoPath, outputFilePath, (err) => {
                         if (err) {
                              return res.status(500).send('An error occurred while copying the audio.');
                         }

                         // Return a success response with a single part and the original file
                         res.status(200).json({
                              message: 'Audio is shorter than segment duration and has been copied as a single part!',
                              filePath: originalFilePath, // Include original file
                              totalDuration: totalDuration,
                              parts: [
                                   {
                                        file: `/uploads/parts/${uniqueId}_output001.mp3`,
                                        startTime: 0,
                                        endTime: totalDuration
                                   }
                              ]
                         });
                    });
               } else {
                    // Split the video into mp3 segments
                    splitVideoToMp3(inputVideoPath, outputDir, segmentDuration, uniqueId, (err) => {
                         if (err) {
                              return res.status(500).send('An error occurred during the audio splitting process.');
                         }

                         // Return a success response and list the mp3 files with their start and end times
                         fs.readdir(outputDir, (err, files) => {
                              if (err) {
                                   return res.status(500).send('Error reading the output directory.');
                              }

                              // Filter files that match the unique ID for this session
                              const uniqueFiles = files.filter(file => file.startsWith(uniqueId));

                              // Calculate start and end times for each part
                              const parts = uniqueFiles.map((file, index) => {
                                   const startTime = index * segmentDuration;
                                   const endTime = Math.min((index + 1) * segmentDuration, totalDuration);
                                   return {
                                        file: `/uploads/parts/${file}`,
                                        startTime: startTime,
                                        endTime: endTime
                                   };
                              });

                              res.status(200).json({
                                   message: 'Audio has been split successfully into mp3 parts!',
                                   filePath: originalFilePath,
                                   totalDuration: totalDuration,
                                   parts: parts
                              });
                         });
                    });
               }
          });
     });
});

module.exports = router;
