var express = require('express');
var path = require('path');
const multer = require('multer');
var router = express.Router();
// Định nghĩa nơi lưu trữ file
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
          fileSize: 10 * 1024 * 1024   // Giới hạn file upload (10MB)
     },
     fileFilter: function (req, file, cb) {
          const filetypes = /jpeg|jpg|png|gif|mp4|mp3/;
          const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
          if (extname) {
               return cb(null, true);
          } else {
               cb(new Error('Tải lên tệp được chấp nhận chỉ định định dạng hình ảnh, video hoặc âm thanh'));
          }
     }
}).single('file');

router.post('/', (req, res) => {
     upload(req, res, function (err) {
          if (err instanceof multer.MulterError) {
               return res.status(500).json({ error: 'Lỗi khi upload file: ' + err.message });
          } else if (err) {
               return res.status(400).json({ error: 'Lỗi file: ' + err.message });
          }
          if (!req.file) {
               return res.status(400).json({ error: 'Vui lòng chọn một file để upload.' });
          }
          res.status(200).json({
               message: 'File đã được tải lên thành công!',
               fileName: req.file.filename,
               filePath: `/uploads/${req.file.filename}`  // Đường dẫn để truy cập file
          });
     });
});

module.exports = router;