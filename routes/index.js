const express = require('express');

const router = express.Router();

router.get('/', (req, res) => {
  res.render('index', {
    title: 'BookBase', username: res.locals.username, email: res.locals.email, isSeller: res.locals.isSeller,
  });
});

router.get('/register', (req, res) => {
  res.render('register', {
    title: 'BookBase | Register', username: res.locals.username, email: res.locals.email, isSeller: res.locals.isSeller,
  });
});

router.get('/login', (req, res) => {
  res.render('login', {
    title: 'BookBase | Login', username: res.locals.username, email: res.locals.email, isSeller: res.locals.isSeller,
  });
});

router.get('/logout', (req, res) => {
  res.clearCookie('jwtAccessToken');
  res.redirect('/');
});

module.exports = router;
