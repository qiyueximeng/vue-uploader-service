var path = require('path')
var express = require('express')
var app = express()

var cookieParser = require('cookie-parser')
var logger = require('morgan')
var createError = require('http-errors')

/* build-in middlewares */
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use('/static', express.static(path.join(__dirname, 'public')))

/* third party middlewares */
app.use(cookieParser())
app.use(logger('dev'))

/* owner middlewares */
app.use(require('./middlewares/cors.middleware'))

/* routers */
app.use('/', require('./routes/index'))
app.use('/upload', require('./routes/upload'))

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
})

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.json()
});

module.exports = app;
