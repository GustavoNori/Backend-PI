const { decode } = require('../utils/hashid');

const decodeId = (paramName = 'id') => {

  return (req, res, next) => {
    const hashedId = req.params[paramName];

    if (!hashedId) {
      return res.status(400).json({ error: 'Missing ID parameter.' });
    }

const id = decode(hashedId);

    if (id === undefined) {
      return res.status(404).json({ error: 'Resource not found.' });
    }

    req.params[paramName] = id;
    next();
  };
}; 

module.exports = decodeId;