const jwt = require('jsonwebtoken');
const secret = 'asdfe45we45w345wegw345werjktj';

const verifyToken = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized. Token is missing.' });
  }

  jwt.verify(token, secret, (err, info) => {
    if (err) {
      return res.status(403).json({ error: 'Unauthorized. Invalid token.' });
    }
    req.user = info;
    next();
  });
};

module.exports = verifyToken;
