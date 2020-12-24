const express = require('express');
const { validationResult } = require('express-validator');
const { getConnection } = require('typeorm');
const validator = require('./validators/customers');
const { logger } = require('../utils/winston');

const router = express.Router();

/* GET users listing. */
router.get('/', (req, res) => {
  res.send('respond with a resource');
});

router.post('/signup', validator.signUp(), (req, res) => {
  const errors = validationResult(req);
  // if inputs are not valid return array of errors
  if (!errors.isEmpty()) {
    logger.error(`Invalid POST request to /customers${req.path} from ${req.ip} produced the following errors ${JSON.stringify(errors.array())}`);
    res.status(400).json({ errors: errors.array() });
  }

  getConnection()
    .createQueryBuilder()
    .insert()
    .into('Customer')
    .values([
      { username: req.body.username, email: req.body.email, password: req.body.password },
    ])
    .execute()
    .then(() => res.redirect('/'));
});

module.exports = router;
