const express = require('express');

const router = express.Router();

router.get('/', (req, res) => {
  res.render('index', {
    title: 'BookBase', user: res.locals.user,
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
