const express = require('express');
const { validationResult } = require('express-validator');
const { getConnection, getManager } = require('typeorm');
const jwt = require('jsonwebtoken');
const md5 = require('md5');
const validator = require('./validators/sellers');
const { logger } = require('../utils/winston');
const Seller = require('../entities/seller');
const Book = require('../entities/book');
const Order = require('../entities/order');

const router = express.Router();

router.get('/manage-my-account', (req, res) => {
  getConnection()
    .createQueryBuilder()
    .select('seller')
    .from(Seller, 'seller')
    .where('seller.username = :username', { username: res.locals.user.username })
    .getOneOrFail()
    .then((sellerResult) => {
      res.render('./sellers/manage-my-account', {
        title: 'BookBase | Manage my account', user: res.locals.user, account: sellerResult,
      });
    })
    .catch((error) => {
      logger.error(`Invalid GET request to /sellers${req.path} from ${req.ip} ${error.stack}`);
      res.status(401);
      res.render('error', {
        status: 401,
        message: 'Unauthorized',
        stack: error.stack,
        title: 'Unauthorized',
      });
    });
});

router.get('/my-orders', (req, res) => {
  getConnection()
    .createQueryBuilder()
    .select('seller')
    .from(Seller, 'seller')
    .where('seller.username = :username', { username: res.locals.user.username })
    .getOneOrFail()
    .then((sellerResult) => {
      getConnection()
        .createQueryBuilder()
        .select('book')
        .from(Book, 'book')
        .where('book.seller = :seller', { seller: sellerResult.id })
        .addOrderBy('book.id', 'ASC')
        .getMany()
        .then((bookResult) => {
          const books = [];
          const bookPromises = [];
          bookResult.forEach((book) => {
            bookPromises.push(
              getConnection()
                .createQueryBuilder()
                .relation(Book, 'order')
                .of(book.id)
                .loadMany()
                .then(async (orderResult) => {
                  const customerPromises = [];
                  orderResult.forEach((order) => {
                    customerPromises.push(
                      getConnection()
                        .createQueryBuilder()
                        .relation(Order, 'customer')
                        .of(order.id)
                        .loadOne()
                        .then((customerResult) => {
                          // eslint-disable-next-line no-param-reassign
                          order.customer = customerResult;
                        }),
                    );
                  });

                  await Promise.all(customerPromises).then(() => {
                    books.push({ book, orders: orderResult });
                  });
                }),
            );
          });

          Promise.all(bookPromises).then(() => {
            if (books.length !== 0) {
              console.log(books[0]);
              res.render('./sellers/my-orders', {
                title: 'BookBase | My Orders', user: res.locals.user, books,
              });
            } else {
              res.render('./sellers/my-orders', {
                title: 'BookBase | My Orders', user: res.locals.user, message: 'No one ordered your books yet :(',
              });
            }
          });
        })
        .catch((error) => {
          logger.error(`Invalid GET request to /sellers${req.path} from ${req.ip} ${error.stack}`);
          res.status(500);
          res.render('error', {
            status: 500,
            message: 'Internal Server Error',
            stack: error.stack,
            title: 'Internal Server Error',
          });
        });
    })
    .catch((error) => {
      logger.error(`Invalid GET request to /sellers${req.path} from ${req.ip} ${error.stack}`);
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
    logger.error(`Invalid POST request to /sellers${req.path} from ${req.ip} produced the following errors ${JSON.stringify(errors.array())}`);
    res.status(422);
    res.render('error', {
      status: 422,
      message: 'Invalid form input',
      stack: JSON.stringify(errors.array()),
      title: 'Invalid form input',
    });
  } else {
    getManager().query(`INSERT INTO seller (username, email, password, securityanswer) VALUES ('${req.body.username}', '${req.body.email}', '${md5(req.body.password)}', '${req.body.securityAnswer}') RETURNING username, email;`).then((insertResult) => {
      res.clearCookie('jwtAccessToken');
      res.cookie('jwtAccessToken', jwt.sign({ username: insertResult[0].username, email: insertResult[0].email, isSeller: true }, process.env.JWT_SECRET));
      res.status(201);
      res.redirect('/');
    }).catch((error) => {
      logger.error(`Invalid POST request to /sellers${req.path} from ${req.ip} ${error.stack}`);
      res.status(409);
      res.render('error', {
        status: 409,
        message: 'Conflict',
        stack: error.stack,
        title: 'Conflict',
      });
    });
  }
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
  } else {
    getConnection()
      .createQueryBuilder()
      .select(['seller.username', 'seller.email'])
      .from(Seller, 'seller')
      .where('seller.username = :username AND seller.password = :password', { username: req.body.username, password: md5(req.body.password) })
      .getOneOrFail()
      .then((selectResult) => {
        res.clearCookie('cart');
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
  }
});

router.post('/forgot-password', validator.forgotPassword(), (req, res) => {
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
  } else {
    getConnection()
      .createQueryBuilder()
      .select(['seller.username', 'seller.email'])
      .from(Seller, 'seller')
      .where('seller.username = :username AND seller.securityanswer = :securityanswer', { username: req.body.username, securityanswer: req.body.securityAnswer })
      .getOneOrFail()
      .then((selectResult) => {
        getConnection()
          .createQueryBuilder()
          .update('Seller')
          .set({
            password: md5(req.body.password),
          })
          .where('username = :username', { username: selectResult.username })
          .execute()
          .then(() => {
            res.clearCookie('jwtAccessToken');
            res.cookie('jwtAccessToken', jwt.sign({ username: selectResult.username, email: selectResult.email, isSeller: true }, process.env.JWT_SECRET));
            res.status(200);
            res.redirect('/');
          })
          .catch((error) => {
            logger.error(`Invalid POST request to /sellers${req.path} from ${req.ip} ${error.stack}`);
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
        logger.error(`Invalid POST request to /sellers${req.path} from ${req.ip} ${error.stack}`);
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
    logger.error(`Invalid PUT request to /sellers${req.path} from ${req.ip} produced the following errors ${JSON.stringify(errors.array())}`);
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
      .select(['seller.id'])
      .from(Seller, 'seller')
      .where('seller.username = :username', { username: res.locals.user.username })
      .getOneOrFail()
      .then(() => {
        getConnection()
          .createQueryBuilder()
          .update('Seller')
          .set({
            username: req.body.username,
            email: req.body.email,
            securityanswer: req.body.securityAnswer,
          })
          .where('username = :username', { username: res.locals.user.username })
          .execute()
          .then(() => {
            res.clearCookie('jwtAccessToken');
            res.cookie('jwtAccessToken', jwt.sign({ username: req.body.username, email: req.body.email, isSeller: true }, process.env.JWT_SECRET));
            res.status(200);
            res.redirect('/sellers/manage-my-account');
          })
          .catch((error) => {
            logger.error(`Invalid PUT request to /sellers${req.path} from ${req.ip} ${error.stack}`);
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
        logger.error(`Invalid PUT request to /sellers${req.path} from ${req.ip} ${error.stack}`);
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
    logger.error(`Invalid PUT request to /sellers${req.path} from ${req.ip} produced the following errors ${JSON.stringify(errors.array())}`);
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
      .select(['seller.id'])
      .from(Seller, 'seller')
      .where('seller.username = :username', { username: res.locals.user.username })
      .getOneOrFail()
      .then(() => {
        getConnection()
          .createQueryBuilder()
          .update('Seller')
          .set({
            password: md5(req.body.password),
          })
          .where('username = :username', { username: res.locals.user.username })
          .execute()
          .then(() => {
            res.status(200);
            res.redirect('/sellers/manage-my-account');
          })
          .catch((error) => {
            logger.error(`Invalid PUT request to /sellers${req.path} from ${req.ip} ${error.stack}`);
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
        logger.error(`Invalid PUT request to /sellers${req.path} from ${req.ip} ${error.stack}`);
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
    .select(['seller.id'])
    .from(Seller, 'seller')
    .where('seller.username = :username', { username: res.locals.user.username })
    .getOneOrFail()
    .then((selectResult) => {
      getConnection()
        .createQueryBuilder()
        .delete()
        .from('Seller')
        .where('id = :id', { id: selectResult.id })
        .execute()
        .then(() => {
          res.clearCookie('jwtAccessToken');
          res.status(200);
          res.redirect('/');
        })
        .catch((error) => {
          logger.error(`Invalid DELETE request to /sellers${req.path} from ${req.ip} ${error.stack}`);
          res.status(409);
          res.render('error', {
            status: 409,
            message: 'Conflict, make sure you deleted all books before deleting your account',
            stack: error.stack,
            title: 'Conflict',
          });
        });
    })
    .catch((error) => {
      logger.error(`Invalid DELETE request to /sellers${req.path} from ${req.ip} ${error.stack}`);
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
