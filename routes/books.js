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
const Book = require('../entities/book');

// configure multer
const upload = multer({ dest: os.tmpdir() });

const router = express.Router();

router.get('/manage', (req, res) => {
  getConnection()
    .createQueryBuilder()
    .select(['seller.id'])
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
          res.render('./books/manage', {
            title: 'BookBase | Manage my books', user: res.locals.user, books: bookResult,
          });
        })
        .catch((error) => {
          logger.error(`Invalid PUT request to /books${req.path} from ${req.ip} ${error.stack}`);
          res.status(401);
          res.render('error', {
            status: 401,
            message: 'Unauthorized',
            stack: error.stack,
            title: 'Unauthorized',
          });
        });
    })
    .catch((error) => {
      logger.error(`Invalid PUT request to /books${req.path} from ${req.ip} ${error.stack}`);
      res.status(401);
      res.render('error', {
        status: 401,
        message: 'Unauthorized',
        stack: error.stack,
        title: 'Unauthorized',
      });
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
    .where('seller.username = :username', { username: res.locals.user.username })
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
            seller: selectResult.id,
          },
        ])
        .returning('id')
        .execute()
        .then((insertResult) => {
          fs.move(req.file.path, path.join(__dirname, '..', 'public', 'books', 'cover', insertResult.generatedMaps[0].id.toString()))
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

router.put('/update', upload.single('cover'), validator.update(), (req, res) => {
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

  // if no cover was uploaded only update book attributes
  getConnection()
    .createQueryBuilder()
    .select(['seller.id'])
    .from(Seller, 'seller')
    .where('seller.username = :username', { username: res.locals.user.username })
    .getOneOrFail()
    .then((selectResult) => {
      if (!req.file) {
        getConnection()
          .createQueryBuilder()
          .update('Book')
          .set({
            title: req.body.title,
            author: req.body.author,
            isbn: req.body.isbn,
            price: req.body.price,
            description: req.body.description,
          })
          .where('id = :id AND seller = :seller', { id: parseInt(req.query.id, 10), seller: selectResult.id })
          .execute()
          .then(() => {
            res.status(200);
            res.redirect('/books/manage');
          })
          .catch((error) => {
            logger.error(`Invalid PUT request to /books${req.path} from ${req.ip} ${error.stack}`);
            res.status(304);
            res.render('error', {
              status: 304,
              message: 'Not Modified',
              stack: error.stack,
              title: 'Not Modified',
            });
          });
      } else {
        getConnection()
          .createQueryBuilder()
          .update('Book')
          .set({
            title: req.body.title,
            author: req.body.author,
            isbn: req.body.isbn,
            price: req.body.price,
            description: req.body.description,
          })
          .where('id = :id AND seller = :seller', { id: parseInt(req.query.id, 10), seller: selectResult.id })
          .execute()
          .then(() => {
            fs.move(req.file.path, path.join(__dirname, '..', 'public', 'books', 'cover', req.query.id), { overwrite: true })
              .then(() => {
                res.status(200);
                res.redirect('/books/manage');
              });
          })
          .catch((error) => {
            logger.error(`Invalid PUT request to /books${req.path} from ${req.ip} ${error.stack}`);
            res.status(304);
            res.render('error', {
              status: 304,
              message: 'Not Modified',
              stack: error.stack,
              title: 'Not Modified',
            });
          });
      }
    })
    .catch((error) => {
      logger.error(`Invalid PUT request to /books${req.path} from ${req.ip} ${error.stack}`);
      res.status(401);
      res.render('error', {
        status: 401,
        message: 'Unauthorized',
        stack: error.stack,
        title: 'Unauthorized',
      });
    });
});

router.delete('/delete', validator.delete(), (req, res) => {
  const errors = validationResult(req);
  // if inputs are not valid return array of errors
  if (!errors.isEmpty()) {
    logger.error(`Invalid DELETE request to /books${req.path} from ${req.ip} produced the following errors ${JSON.stringify(errors.array())}`);
    res.status(422);
    res.render('error', {
      status: 422,
      message: 'Invalid query parameter',
      stack: JSON.stringify(errors.array()),
      title: 'Invalid query parameter',
    });
  }

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
        .from('Book')
        .where('id = :id AND seller = :seller', { id: parseInt(req.query.id, 10), seller: selectResult.id })
        .execute()
        .then(() => {
          fs.remove(path.join(__dirname, '..', 'public', 'books', 'cover', req.query.id))
            .then(() => {
              res.status(200);
              res.redirect('/books/manage');
            });
        });
    })
    .catch((error) => {
      logger.error(`Invalid PUT request to /books${req.path} from ${req.ip} ${error.stack}`);
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