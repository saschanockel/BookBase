// load env variables
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const yn = require('yn');

// load modules
const express = require('express');
const { createConnection } = require('typeorm');

// load middlewares
const createError = require('http-errors');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const { httpLogger, logger } = require('./utils/winston');

// create routers
const indexRouter = require('./routes');
const customersRouter = require('./routes/customers');

// setup db connection
createConnection({
  type: process.env.DB_TYPE,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [
    path.join(__dirname, 'entities', '*.js'),
  ],
  synchronize: true,
  logging: ['error', 'query'],
  logger: 'file',
  extra: {
    ssl: yn(process.env.DB_SSL),
  },
}).catch((error) => logger.error(`[database] ${error.message}\n${error.stack}`));

const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// set public paths
app.use(express.static(path.join(__dirname, 'public')));

app.use(morgan('combined', { stream: httpLogger.stream }));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// setup routes
app.use('/', indexRouter);
app.use('/customers', customersRouter);

// catch 404 and forward to error handler
app.use((req, res, next) => {
  next(createError(404));
});

// error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = process.env.NODE_ENV === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error', {
    status: err.status || 500,
    message: res.locals.message,
    stack: res.locals.error.stack,
    title: res.locals.message,
  });
});

module.exports = app;
