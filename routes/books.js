const express = require('express');
const { validationResult } = require('express-validator');
const { getConnection } = require('typeorm');
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const os = require('os');
const validator = require('./validators/books');
const { logger } = require('../utils/winston');
const Seller = require('../entities/seller');

// configure multer
const upload = multer({ dest: os.tmpdir() });

const router = express.Router();

router.get('/manage', (req, res) => {
  res.render('./books/manage', {
    title: 'BookBase | Manage my books', username: res.locals.username, email: res.locals.email, isSeller: res.locals.isSeller,
  });
});

router.post('/add', upload.single('cover'), validator.add(), (req, res) => {
  const errors = validationResult(req);
  // if inputs are not valid return array of errors
  if (!errors.isEmpty()) {
    logger.error(`Invalid POST request to /books${req.path} from ${req.ip} produced the following errors ${JSON.stringify(errors.array())}`);
    res.status(422);
    res.render('error', {
      status: 422,
      message: 'Invalid form input',
      stack: JSON.stringify(errors.array()),
      title: 'Invalid form input',
    });
  }

  // if no cover was uploaded return error
  if (!req.file) {
    logger.error(`Invalid POST request to /books${req.path} from ${req.ip} no cover was provided`);
    res.status(400);
    res.render('error', {
      status: 400,
      message: 'No cover provided',
      title: 'No cover provided',
    });
  }

  getConnection()
    .createQueryBuilder()
    .select(['seller.id'])
    .from(Seller, 'seller')
    .where('seller.username = :username', { username: res.locals.username })
    .getOneOrFail()
    .then((selectResult) => {
      getConnection()
        .createQueryBuilder()
        .insert()
        .into('Book')
        .values([
          {
            title: req.body.title,
            author: req.body.author,
            isbn: req.body.isbn,
            price: req.body.price,
            description: req.body.description,
            cover: req.file.filename,
            seller: selectResult.id,
          },
        ])
        .execute()
        .then(() => {
          fs.move(req.file.path, path.join(__dirname, '..', 'public', 'books', 'cover', req.file.filename))
            .then(() => {
              res.status(201);
              res.redirect('/books/manage');
            });
        })
        .catch((error) => {
          logger.error(`Invalid POST request to /books${req.path} from ${req.ip} ${error.stack}`);
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
      logger.error(`Invalid POST request to /books${req.path} from ${req.ip} ${error.stack}`);
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
