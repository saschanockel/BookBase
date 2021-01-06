const express = require('express');
const { validationResult } = require('express-validator');
const { getConnection, getManager } = require('typeorm');
const jwt = require('jsonwebtoken');
const md5 = require('md5');
const validator = require('./validators/customers');
const { logger } = require('../utils/winston');
const Customer = require('../entities/customer');
const Book = require('../entities/book');
const Order = require('../entities/order');

const router = express.Router();

router.get('/checkout', (req, res) => {
  getConnection()
    .createQueryBuilder()
    .select('customer')
    .from(Customer, 'customer')
    .where('customer.username = :username', { username: res.locals.user.username })
    .getOneOrFail()
    .then(() => {
      if (req.cookies.cart) {
        getConnection()
          .createQueryBuilder()
          .select('book')
          .from(Book, 'book')
          .leftJoinAndSelect('book.seller', 'Book')
          .where('book.id IN (:...ids)', { ids: JSON.parse(req.cookies.cart).books })
          .addOrderBy('book.id', 'DESC')
          .getMany()
          .then((bookResult) => {
            if (bookResult.length !== 0) {
              res.render('./customers/checkout', {
                title: 'BookBase | Checkout', user: res.locals.user, books: bookResult,
              });
            } else {
              res.render('./customers/checkout', {
                title: 'BookBase | Checkout', user: res.locals.user, message: 'There is nothing in your cart, feel free to continue shopping :)',
              });
            }
          })
          .catch((error) => {
            logger.error(`Invalid GET request to /customers${req.path} from ${req.ip} ${error.stack}`);
            res.status(500);
            res.render('error', {
              status: 500,
              message: 'Internal Server Error',
              stack: process.env.NODE_ENV === 'development' ? error.stack : false,
              title: 'Internal Server Error',
            });
          });
      } else {
        res.render('./customers/checkout', {
          title: 'BookBase | Checkout', user: res.locals.user, message: 'There is nothing in your cart, feel free to continue shopping :)',
        });
      }
    })
    .catch((error) => {
      logger.error(`Invalid GET request to /customers${req.path} from ${req.ip} ${error.stack}`);
      res.status(401);
      res.render('error', {
        status: 401,
        message: 'Unauthorized',
        stack: process.env.NODE_ENV === 'development' ? error.stack : false,
        title: 'Unauthorized',
      });
    });
});

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
        stack: process.env.NODE_ENV === 'development' ? error.stack : false,
        title: 'Unauthorized',
      });
    });
});

router.get('/my-orders', (req, res) => {
  getConnection()
    .createQueryBuilder()
    .select('customer')
    .from(Customer, 'customer')
    .where('customer.username = :username', { username: res.locals.user.username })
    .getOneOrFail()
    .then((customerResult) => {
      getConnection()
        .createQueryBuilder()
        .select('order')
        .from(Order, 'order')
        .where('order.customer = :customer', { customer: customerResult.id })
        .addOrderBy('order.id', 'ASC')
        .getMany()
        .then((orderResult) => {
          const orders = [];
          const orderPromises = [];
          orderResult.forEach((order) => {
            orderPromises.push(
              getConnection()
                .createQueryBuilder()
                .relation(Order, 'book')
                .of(order.id)
                .loadMany()
                .then(async (bookResult) => {
                  const sellerPromises = [];
                  bookResult.forEach((book) => {
                    sellerPromises.push(
                      getConnection()
                        .createQueryBuilder()
                        .relation(Book, 'seller')
                        .of(book.id)
                        .loadOne()
                        .then((sellerResult) => {
                        // eslint-disable-next-line no-param-reassign
                          book.seller = sellerResult;
                        })
                        .catch((error) => {
                          logger.error(`Invalid GET request to /customers${req.path} from ${req.ip} ${error.stack}`);
                          res.status(500);
                          res.render('error', {
                            status: 500,
                            message: 'Internal Server Error',
                            stack: process.env.NODE_ENV === 'development' ? error.stack : false,
                            title: 'Internal Server Error',
                          });
                        }),
                    );
                  });

                  await Promise.all(sellerPromises).then(() => {
                    orders.push({ id: order.id, books: bookResult });
                  }).catch((error) => {
                    logger.error(`Invalid GET request to /customers${req.path} from ${req.ip} ${error.stack}`);
                    res.status(500);
                    res.render('error', {
                      status: 500,
                      message: 'Internal Server Error',
                      stack: process.env.NODE_ENV === 'development' ? error.stack : false,
                      title: 'Internal Server Error',
                    });
                  });
                })
                .catch((error) => {
                  logger.error(`Invalid GET request to /customers${req.path} from ${req.ip} ${error.stack}`);
                  res.status(500);
                  res.render('error', {
                    status: 500,
                    message: 'Internal Server Error',
                    stack: process.env.NODE_ENV === 'development' ? error.stack : false,
                    title: 'Internal Server Error',
                  });
                }),
            );
          });

          Promise.all(orderPromises).then(() => {
            if (orders.length !== 0) {
              res.render('./customers/my-orders', {
                title: 'BookBase | My Orders', user: res.locals.user, orders,
              });
            } else {
              res.render('./customers/my-orders', {
                title: 'BookBase | My Orders', user: res.locals.user, message: 'You have no orders yet :(',
              });
            }
          }).catch((error) => {
            logger.error(`Invalid GET request to /customers${req.path} from ${req.ip} ${error.stack}`);
            res.status(500);
            res.render('error', {
              status: 500,
              message: 'Internal Server Error',
              stack: process.env.NODE_ENV === 'development' ? error.stack : false,
              title: 'Internal Server Error',
            });
          });
        })
        .catch((error) => {
          logger.error(`Invalid GET request to /customers${req.path} from ${req.ip} ${error.stack}`);
          res.status(500);
          res.render('error', {
            status: 500,
            message: 'Internal Server Error',
            stack: process.env.NODE_ENV === 'development' ? error.stack : false,
            title: 'Internal Server Error',
          });
        });
    })
    .catch((error) => {
      logger.error(`Invalid GET request to /customers${req.path} from ${req.ip} ${error.stack}`);
      res.status(401);
      res.render('error', {
        status: 401,
        message: 'Unauthorized',
        stack: process.env.NODE_ENV === 'development' ? error.stack : false,
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
  getManager().query(`INSERT INTO customer (username, email, password, securityanswer) VALUES ('${req.body.username}', '${req.body.email}', '${md5(req.body.password)}', '${req.body.securityAnswer}') RETURNING username, email;`).then((insertResult) => {
    res.clearCookie('jwtAccessToken');
    res.cookie('jwtAccessToken', jwt.sign({ username: insertResult[0].username, email: insertResult[0].email, isSeller: false }, process.env.JWT_SECRET));
    res.status(201);
    res.redirect('/');
  }).catch((error) => {
    logger.error(`Invalid POST request to /customers${req.path} from ${req.ip} ${error.stack}`);
    res.status(409);
    res.render('error', {
      status: 409,
      message: 'Conflict',
      stack: process.env.NODE_ENV === 'development' ? error.stack : false,
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
        res.clearCookie('cart');
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
          stack: process.env.NODE_ENV === 'development' ? error.stack : false,
          title: 'Unauthorized',
        });
      });
  }
});

router.post('/forgot-password', validator.forgotPassword(), (req, res) => {
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
      .where('customer.username = :username AND customer.securityanswer = :securityanswer', { username: req.body.username, securityanswer: req.body.securityAnswer })
      .getOneOrFail()
      .then((selectResult) => {
        getConnection()
          .createQueryBuilder()
          .update('Customer')
          .set({
            password: md5(req.body.password),
          })
          .where('username = :username', { username: selectResult.username })
          .execute()
          .then(() => {
            res.clearCookie('jwtAccessToken');
            res.cookie('jwtAccessToken', jwt.sign({ username: selectResult.username, email: selectResult.email, isSeller: false }, process.env.JWT_SECRET));
            res.status(200);
            res.redirect('/');
          })
          .catch((error) => {
            logger.error(`Invalid POST request to /customers${req.path} from ${req.ip} ${error.stack}`);
            res.status(304);
            res.render('error', {
              status: 304,
              message: 'Not Modified',
              stack: process.env.NODE_ENV === 'development' ? error.stack : false,
              title: 'Not Modified',
            });
          });
      })
      .catch((error) => {
        logger.error(`Invalid POST request to /customers${req.path} from ${req.ip} ${error.stack}`);
        res.status(401);
        res.render('error', {
          status: 401,
          message: 'Unauthorized',
          stack: process.env.NODE_ENV === 'development' ? error.stack : false,
          title: 'Unauthorized',
        });
      });
  }
});

router.post('/checkout', (req, res) => {
  getConnection()
    .createQueryBuilder()
    .select(['customer.id'])
    .from(Customer, 'customer')
    .where('customer.username = :username', { username: res.locals.user.username })
    .getOneOrFail()
    .then((customerResult) => {
      getConnection()
        .createQueryBuilder()
        .insert()
        .into('Order')
        .values([
          {
            customer: customerResult.id,
          },
        ])
        .returning('id')
        .execute()
        .then((insertOrderResult) => {
          getConnection()
            .createQueryBuilder()
            .relation(Order, 'book')
            .of(insertOrderResult.generatedMaps[0].id)
            .add(JSON.parse(req.cookies.cart).books)
            .then(() => {
              res.clearCookie('cart');
              res.render('./customers/checkout', {
                title: 'BookBase | Checkout', user: res.locals.user, message: 'Your order has been processed :)',
              });
            })
            .catch((error) => {
              logger.error(`Invalid POST request to /customers${req.path} from ${req.ip} ${error.stack}`);
              res.status(500);
              res.render('error', {
                status: 500,
                message: 'Internal Server Error',
                stack: process.env.NODE_ENV === 'development' ? error.stack : false,
                title: 'Internal Server Error',
              });
            });
        })
        .catch((error) => {
          logger.error(`Invalid POST request to /customers${req.path} from ${req.ip} ${error.stack}`);
          res.status(500);
          res.render('error', {
            status: 500,
            message: 'Internal Server Error',
            stack: process.env.NODE_ENV === 'development' ? error.stack : false,
            title: 'Internal Server Error',
          });
        });
    })
    .catch((error) => {
      logger.error(`Invalid POST request to /customers${req.path} from ${req.ip} ${error.stack}`);
      res.status(401);
      res.render('error', {
        status: 401,
        message: 'Unauthorized',
        stack: process.env.NODE_ENV === 'development' ? error.stack : false,
        title: 'Unauthorized',
      });
    });
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
            creditCardNr: req.body.creditCardNr,
            securityanswer: req.body.securityAnswer,
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
              stack: process.env.NODE_ENV === 'development' ? error.stack : false,
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
          stack: process.env.NODE_ENV === 'development' ? error.stack : false,
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
              stack: process.env.NODE_ENV === 'development' ? error.stack : false,
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
          stack: process.env.NODE_ENV === 'development' ? error.stack : false,
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
        })
        .catch((error) => {
          logger.error(`Invalid DELETE request to /customers${req.path} from ${req.ip} ${error.stack}`);
          res.status(500);
          res.render('error', {
            status: 500,
            message: 'Internal Server Error',
            stack: process.env.NODE_ENV === 'development' ? error.stack : false,
            title: 'Internal Server Error',
          });
        });
    })
    .catch((error) => {
      logger.error(`Invalid DELETE request to /customers${req.path} from ${req.ip} ${error.stack}`);
      res.status(401);
      res.render('error', {
        status: 401,
        message: 'Unauthorized',
        stack: process.env.NODE_ENV === 'development' ? error.stack : false,
        title: 'Unauthorized',
      });
    });
});

module.exports = router;
