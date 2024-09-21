var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cors = require('cors');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var apiRouter = require('./routes/index');



var app = express();
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors());
console.log("path.join(__dirname, 'uploads')", path.join(__dirname, 'uploads'))
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api', apiRouter);
// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});
// Phục vụ các file trong thư mục 'uploads'





// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.json({
    message: err.message
  });
});

module.exports = app;
