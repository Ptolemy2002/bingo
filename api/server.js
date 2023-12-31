require("dotenv").config();
require("app-module-path").addPath(__dirname);

const createError = require('http-errors');
const { createServer } = require('http');
const { Server } = require('socket.io');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const swaggerUi = require('swagger-ui-express');
const swaggerFile = require('services/swagger_output.json');
const cors = require('cors');

const indexRouter = require('routes/index');
const apiRouter = require('routes/api/v1/index');

const app = express();

// Set up Socket.IO
const socketServer = createServer(app);
const socketPort = process.env.SOCKET_PORT || 3000;

const io = new Server(socketServer, {
    cors: {
        origin: '*',
    }
});

io.on('connection', (socket) => {
    console.log(`Socket user connected: ${socket.id}`);
    
    socket.on('disconnect', () => {
        console.log(`Socket user disconnected: ${socket.id}`);
    });

    socket.on('ping', (callback) => {
        callback('pong');
    });
});

socketServer.listen(socketPort, () => {
    console.log(`Socket.IO server listening on port ${socketPort}`);
});

// Connect to MongoDB
mongoose.connect(process.env.MONGO_CONNECTION_STRING, { useNewUrlParser: true })
    .then(() =>  console.log('Successfully connected to MongoDB'))
    .catch((err) => console.error(err));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));
app.use("/api/v1/docs", swaggerUi.serve, swaggerUi.setup(swaggerFile, {explorer: true}));
app.use(cors());

app.use('/', indexRouter);
app.use('/api/v1', apiRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error', {err});
});

module.exports = {app, io};
