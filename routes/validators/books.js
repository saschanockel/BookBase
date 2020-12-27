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

  static update() {
    return [
      body('id')
        .isInt()
        .exists(),
      body('title')
        .isString()
        .isLength({ min: 3, max: 64 })
        .optional(),
      body('author')
        .isString()
        .isLength({ min: 1, max: 64 })
        .optional(),
      body('isbn')
        .isString()
        .isLength({ min: 1, max: 64 })
        .optional(),
      body('price')
        .isDecimal()
        .isLength({ min: 1, max: 8 })
        .optional(),
      body('description')
        .isString()
        .isLength({ min: 1, max: 1024 })
        .optional(),
    ];
  }

  static delete() {
    return [
      body('id')
        .isInt()
        .exists(),
    ];
  }
}

module.exports = BooksValidator;
