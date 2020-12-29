const express = require('express');
const { validationResult } = require('express-validator');
const { getConnection, getManager } = require('typeorm');
const jwt = require('jsonwebtoken');
const md5 = require('md5');
const validator = require('./validators/customers');
const { logger } = require('../utils/winston');
const Customer = require('../entities/customer');

const router = express.Router();

router.get('/manage-my-account', (req, res) => {
  getConnection()
    .createQueryBuilder()
    .select('customer')
    .from(Customer, 'customer')
    .where('customer.username = :username', { username: res.locals.user.username })
    .getOneOrFail()
    .then((customerResult) => {
      res.render('./customers/manage-my-account', {
        title: 'BookBase | Manage my account', user: res.locals.user, account: customerResult,
      });
    })
    .catch((error) => {
      logger.error(`Invalid GET request to /customers${req.path} from ${req.ip} ${error.stack}`);
      res.status(401);
      res.render('error', {
        status: 401,
        message: 'Unauthorized',
        stack: error.stack,
        title: 'Unauthorized',
      });
    });
});

router.post('/register', validator.register(), (req, res) => {
  const errors = validationResult(req);
  // if inputs are not valid return array of errors
  if (!errors.isEmpty()) {
    logger.error(`Invalid POST request to /customers${req.path} from ${req.ip} produced the following errors ${JSON.stringify(errors.array())}`);
    res.status(422);
    res.render('error', {
      status: 422,
      message: 'Invalid form input',
      stack: JSON.stringify(errors.array()),
      title: 'Invalid form input',
    });
  }

  getManager().query(`INSERT INTO customer (username, email, password) VALUES ('${req.body.username}', '${req.body.email}', '${md5(req.body.password)}') RETURNING username, email;`).then((insertResult) => {
    res.clearCookie('jwtAccessToken');
    res.cookie('jwtAccessToken', jwt.sign({ username: insertResult[0].username, email: insertResult[0].email, isSeller: false }, process.env.JWT_SECRET));
    res.redirect(201, '/');
  }).catch((error) => {
    logger.error(`Invalid POST request to /customers${req.path} from ${req.ip} ${error.stack}`);
    res.status(409);
    res.render('error', {
      status: 409,
      message: 'Conflict',
      stack: error.stack,
      title: 'Conflict',
    });
  });
});

router.post('/login', validator.login(), (req, res) => {
  const errors = validationResult(req);
  // if inputs are not valid return array of errors
  if (!errors.isEmpty()) {
    logger.error(`Invalid POST request to /customers${req.path} from ${req.ip} produced the following errors ${JSON.stringify(errors.array())}`);
    res.status(422);
    res.render('error', {
      status: 422,
      message: 'Invalid form input',
      stack: JSON.stringify(errors.array()),
      title: 'Invalid form input',
    });
  } else {
    getConnection()
      .createQueryBuilder()
      .select(['customer.username', 'customer.email'])
      .from(Customer, 'customer')
      .where('customer.username = :username AND customer.password = :password', { username: req.body.username, password: md5(req.body.password) })
      .getOneOrFail()
      .then((selectResult) => {
        res.clearCookie('jwtAccessToken');
        res.cookie('jwtAccessToken', jwt.sign({ username: selectResult.username, email: selectResult.email, isSeller: false }, process.env.JWT_SECRET));
        res.status(200);
        res.redirect('/');
      })
      .catch((error) => {
        logger.error(`Invalid POST request to /customers${req.path} from ${req.ip} ${error.stack}`);
        res.status(401);
        res.render('error', {
          status: 401,
          message: 'Unauthorized',
          stack: error.stack,
          title: 'Unauthorized',
        });
      });
  }
});

router.put('/update-my-account', validator.updateMyAccount(), (req, res) => {
  const errors = validationResult(req);
  // if inputs are not valid return array of errors
  if (!errors.isEmpty()) {
    logger.error(`Invalid PUT request to /customers${req.path} from ${req.ip} produced the following errors ${JSON.stringify(errors.array())}`);
    res.status(422);
    res.render('error', {
      status: 422,
      message: 'Invalid form input',
      stack: JSON.stringify(errors.array()),
      title: 'Invalid form input',
    });
  } else {
    getConnection()
      .createQueryBuilder()
      .select(['customer.id'])
      .from(Customer, 'customer')
      .where('customer.username = :username', { username: res.locals.user.username })
      .getOneOrFail()
      .then(() => {
        getConnection()
          .createQueryBuilder()
          .update('Customer')
          .set({
            username: req.body.username,
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            email: req.body.email,
            zip: req.body.zip,
            city: req.body.city,
            address: req.body.address,
          })
          .where('username = :username', { username: res.locals.user.username })
          .execute()
          .then(() => {
            res.clearCookie('jwtAccessToken');
            res.cookie('jwtAccessToken', jwt.sign({ username: req.body.username, email: req.body.email, isSeller: false }, process.env.JWT_SECRET));
            res.status(200);
            res.redirect('/customers/manage-my-account');
          })
          .catch((error) => {
            logger.error(`Invalid PUT request to /customers${req.path} from ${req.ip} ${error.stack}`);
            res.status(304);
            res.render('error', {
              status: 304,
              message: 'Not Modified',
              stack: error.stack,
              title: 'Not Modified',
            });
          });
      })
      .catch((error) => {
        logger.error(`Invalid PUT request to /customers${req.path} from ${req.ip} ${error.stack}`);
        res.status(401);
        res.render('error', {
          status: 401,
          message: 'Unauthorized',
          stack: error.stack,
          title: 'Unauthorized',
        });
      });
  }
});

router.put('/change-my-password', validator.changeMyPassword(), (req, res) => {
  const errors = validationResult(req);
  // if inputs are not valid return array of errors
  if (!errors.isEmpty()) {
    logger.error(`Invalid PUT request to /customers${req.path} from ${req.ip} produced the following errors ${JSON.stringify(errors.array())}`);
    res.status(422);
    res.render('error', {
      status: 422,
      message: 'Invalid form input',
      stack: JSON.stringify(errors.array()),
      title: 'Invalid form input',
    });
  } else {
    getConnection()
      .createQueryBuilder()
      .select(['customer.id'])
      .from(Customer, 'customer')
      .where('customer.username = :username', { username: res.locals.user.username })
      .getOneOrFail()
      .then(() => {
        getConnection()
          .createQueryBuilder()
          .update('Customer')
          .set({
            password: md5(req.body.password),
          })
          .where('username = :username', { username: res.locals.user.username })
          .execute()
          .then(() => {
            res.status(200);
            res.redirect('/customers/manage-my-account');
          })
          .catch((error) => {
            logger.error(`Invalid PUT request to /customers${req.path} from ${req.ip} ${error.stack}`);
            res.status(304);
            res.render('error', {
              status: 304,
              message: 'Not Modified',
              stack: error.stack,
              title: 'Not Modified',
            });
          });
      })
      .catch((error) => {
        logger.error(`Invalid PUT request to /customers${req.path} from ${req.ip} ${error.stack}`);
        res.status(401);
        res.render('error', {
          status: 401,
          message: 'Unauthorized',
          stack: error.stack,
          title: 'Unauthorized',
        });
      });
  }
});

router.delete('/delete-my-account', (req, res) => {
  getConnection()
    .createQueryBuilder()
    .select(['customer.id'])
    .from(Customer, 'customer')
    .where('customer.username = :username', { username: res.locals.user.username })
    .getOneOrFail()
    .then((selectResult) => {
      getConnection()
        .createQueryBuilder()
        .delete()
        .from('Customer')
        .where('id = :id', { id: selectResult.id })
        .execute()
        .then(() => {
          res.clearCookie('jwtAccessToken');
          res.status(200);
          res.redirect('/');
        });
    })
    .catch((error) => {
      logger.error(`Invalid DELETE request to /customers${req.path} from ${req.ip} ${error.stack}`);
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
