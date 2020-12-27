const { body } = require('express-validator');

class BooksValidator {
  static add() {
    return [
      body('title')
        .isString()
        .isLength({ min: 3, max: 64 })
        .exists(),
      body('author')
        .isString()
        .isLength({ min: 1, max: 64 })
        .exists(),
      body('isbn')
        .isString()
        .isLength({ min: 1, max: 64 })
        .exists(),
      body('price')
        .isDecimal()
        .isLength({ min: 1, max: 8 })
        .exists(),
      body('description')
        .isString()
        .isLength({ min: 1, max: 1024 })
        .exists(),
    ];
  }
}

module.exports = BooksValidator;
