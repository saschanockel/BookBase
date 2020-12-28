const express = require('express');
const { getConnection } = require('typeorm');
const Book = require('../entities/book');
const { logger } = require('../utils/winston');

const router = express.Router();

router.get('/', (req, res) => {
  getConnection()
    .createQueryBuilder()
    .select('book')
    .from(Book, 'book')
    .leftJoinAndSelect('book.seller', 'Book')
    .addOrderBy('book.id', 'DESC')
    .getMany()
    .then((bookResult) => {
      res.render('index', {
        title: 'BookBase | Shop', user: res.locals.user, books: bookResult,
      });
    })
    .catch((error) => {
      logger.error(`Error while getting shop listing ${error.stack}`);
      res.status(500);
      res.render('error', {
        status: 500,
        message: 'Internal Server Error',
        stack: error.stack,
        title: 'Internal Server Error',
      });
    });
});

router.get('/register', (req, res) => {
  res.render('register', {
    title: 'BookBase | Register', user: res.locals.user,
  });
});

router.get('/login', (req, res) => {
  res.render('login', {
    title: 'BookBase | Login', user: res.locals.user,
  });
});

router.post('/logout', (req, res) => {
  res.clearCookie('jwtAccessToken');
  res.status(204);
  res.redirect('/');
});

module.exports = router;
