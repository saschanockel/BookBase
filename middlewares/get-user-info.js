const jwt = require('jsonwebtoken');

module.exports = function getUserInfo(req, res, next) {
  if (req.cookies.jwtAccessToken) {
    res.locals.user = jwt.decode(req.cookies.jwtAccessToken);
  }

  next();
};
