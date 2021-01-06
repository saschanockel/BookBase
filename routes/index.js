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
      if (bookResult.length !== 0) {
        res.render('index', {
          title: 'BookBase | Shop', user: res.locals.user, books: bookResult,
        });
      } else {
        res.render('index', {
          title: 'BookBase | Shop', user: res.locals.user, message: 'No books yet, be the first to sell some!',
        });
      }
    })
    .catch((error) => {
      logger.error(`Error while getting shop listing ${error.stack}`);
      res.status(500);
      res.render('error', {
        status: 500,
        message: 'Internal Server Error',
        stack: process.env.NODE_ENV === 'development' ? error.stack : false,
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

router.get('/imprint', (req, res) => {
  res.render('imprint', {
    title: 'BookBase | Imprint', user: res.locals.user,
  });
});

router.get('/privacy-policy', (req, res) => {
  res.render('privacy-policy', {
    title: 'BookBase | Privacy policy', user: res.locals.user,
  });
});

router.post('/logout', (req, res) => {
  res.clearCookie('cart');
  res.clearCookie('jwtAccessToken');
  res.status(204);
  res.redirect('/');
});

module.exports = router;
