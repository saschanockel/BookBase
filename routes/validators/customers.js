const { body } = require('express-validator');

/**
 * Utility class for supplying parameter checks
 */
class CustomersValidator {
  /**
   * provide validation for signIn
   *
   * @return {ValidationChain[]}
   */
  static signIn() {
    return [
      body('username')
        .isString()
        .exists(),
      body('password')
        .isString()
        .exists(),
    ];
  }

  /**
   * provide validation for signUp
   *
   * @return {ValidationChain[]}
   */
  static signUp() {
    return [
      body('username')
        .isAlphanumeric()
        .isLength({ min: 3, max: 16 })
        .exists(),
      body('email')
        .isEmail()
        .isLength({ max: 64 })
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

  /**
   * provide validation for update
   *
   * @return {any[]}
   */
  static update() {
    return [
      body('id')
        .isInt()
        .exists(),
      body('firstName')
        .isString()
        .isLength({ min: 1, max: 128 })
        .optional(),
      body('lastName')
        .isString()
        .isLength({ min: 1, max: 128 })
        .optional(),
      body('email')
        .isEmail()
        .isLength({ max: 64 })
        .custom((value, { req }) => {
          if (value !== req.body.confirmEmail) {
            throw new Error('Emails do not match');
          } else {
            return value;
          }
        })
        .optional(),
      body('username')
        .isAlphanumeric()
        .isLength({ min: 3, max: 16 })
        .optional(),
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
        .optional(),
      body('zip')
        .isString()
        .isLength({ min: 1, max: 32 })
        .optional(),
      body('city')
        .isString()
        .isLength({ min: 1, max: 128 })
        .optional(),
      body('address')
        .isString()
        .isLength({ min: 1, max: 128 })
        .optional(),
    ];
  }
}

module.exports = CustomersValidator;
