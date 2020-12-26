const jwt = require('jsonwebtoken');

module.exports = function getUserInfo(req, res, next) {
  if (req.cookies.jwtAccessToken) {
    const jwtAccessToken = jwt.decode(req.cookies.jwtAccessToken);
    res.locals.username = jwtAccessToken.username;
    res.locals.email = jwtAccessToken.email;
    res.locals.isSeller = jwtAccessToken.isSeller;
  }

  next();
};
