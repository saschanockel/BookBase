const { body } = require('express-validator');

class SellersValidator {
  static login() {
    return [
      body('username')
        .isString()
        .exists(),
      body('password')
        .isString()
        .exists(),
    ];
  }

  static register() {
    return [
      body('username')
        .isString()
        .isAlphanumeric()
        .isLength({ min: 3, max: 16 })
        .exists(),
      body('email')
        .isString()
        .isEmail()
        .isLength({ min: 5, max: 64 })
        .custom((value, { req }) => {
          if (value !== req.body.confirmEmail) {
            throw new Error('Emails do not match');
          } else {
            return value;
          }
        })
        .exists(),
      body('password')
        .isString()
        .isLength({ min: 8, max: 64 })
        .custom((value, { req }) => {
          if (value !== req.body.confirmPassword) {
            throw new Error('Passwords do not match');
          } else {
            return value;
          }
        })
        .exists(),
    ];
  }

  static updateMyAccount() {
    return [
      body('username')
        .isString()
        .isAlphanumeric()
        .isLength({ min: 3, max: 16 })
        .optional(),
      body('email')
        .isString()
        .isEmail()
        .isLength({ min: 5, max: 64 })
        .custom((value, { req }) => {
          if (value !== req.body.confirmEmail) {
            throw new Error('Emails do not match');
          } else {
            return value;
          }
        })
        .optional(),
    ];
  }

  static changeMyPassword() {
    return [
      body('password')
        .isString()
        .isLength({ min: 8, max: 64 })
        .custom((value, { req }) => {
          if (value !== req.body.confirmPassword) {
            throw new Error('Passwords do not match');
          } else {
            return value;
          }
        })
        .exists(),
    ];
  }
}

module.exports = SellersValidator;
