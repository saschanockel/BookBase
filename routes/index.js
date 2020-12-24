const express = require('express');

const router = express.Router();

/* GET home page. */
router.get('/', (req, res) => {
  res.render('index', { title: 'BookBase' });
});

/* GET register page. */
router.get('/account', (req, res) => {
  res.render('account', { title: 'BookBase | Account' });
});

module.exports = router;
