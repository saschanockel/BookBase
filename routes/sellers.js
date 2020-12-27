const express = require('express');
const { validationResult } = require('express-validator');
const { getConnection, getManager } = require('typeorm');
const jwt = require('jsonwebtoken');
const md5 = require('md5');
const validator = require('./validators/sellers');
const { logger } = require('../utils/winston');
const Seller = require('../entities/seller');

const router = express.Router();

router.post('/register', validator.register(), (req, res) => {
  const errors = validationResult(req);
  // if inputs are not valid return array of errors
  if (!errors.isEmpty()) {
    logger.error(`Invalid POST request to /sellers${req.path} from ${req.ip} produced the following errors ${JSON.stringify(errors.array())}`);
    res.status(422);
    res.render('error', {
      status: 422,
      message: 'Invalid form input',
      stack: JSON.stringify(errors.array()),
      title: 'Invalid form input',
    });
  }

  getManager().query(`INSERT INTO seller (username, email, password) VALUES ('${req.body.username}', '${req.body.email}', '${md5(req.body.password)}') RETURNING username, email;`).then((insertResult) => {
    res.clearCookie('jwtAccessToken');
    res.cookie('jwtAccessToken', jwt.sign({ username: insertResult[0].username, email: insertResult[0].email, isSeller: true }, process.env.JWT_SECRET));
    res.status(201);
    res.redirect('/');
  }).catch((error) => {
    logger.error(`Invalid POST request to /sellers${req.path} from ${req.ip} ${error.stack}`);
    res.status(409);
    res.render('error', {
      status: 409,
      message: 'Conflict ',
      stack: error.stack,
      title: 'Conflict ',
    });
  });
});

router.post('/login', validator.login(), (req, res) => {
  const errors = validationResult(req);
  // if inputs are not valid return array of errors
  if (!errors.isEmpty()) {
    logger.error(`Invalid POST request to /sellers${req.path} from ${req.ip} produced the following errors ${JSON.stringify(errors.array())}`);
    res.status(422);
    res.render('error', {
      status: 422,
      message: 'Invalid form input',
      stack: JSON.stringify(errors.array()),
      title: 'Invalid form input',
    });
  }

  getConnection()
    .createQueryBuilder()
    .select(['seller.username', 'seller.email'])
    .from(Seller, 'seller')
    .where('seller.username = :username AND seller.password = :password', { username: req.body.username, password: md5(req.body.username) })
    .getOneOrFail()
    .then((selectResult) => {
      res.clearCookie('jwtAccessToken');
      res.cookie('jwtAccessToken', jwt.sign({ username: selectResult.username, email: selectResult.email, isSeller: true }, process.env.JWT_SECRET));
      res.status(200);
      res.redirect('/');
    })
    .catch((error) => {
      logger.error(`Invalid POST request to /sellers${req.path} from ${req.ip} ${error.stack}`);
      res.status(401);
      res.render('error', {
        status: 401,
        message: 'Unauthorized',
        stack: error.stack,
        title: 'Unauthorized',
      });
    });
});

module.exports = router;
