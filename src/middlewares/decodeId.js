const { decode } = require('../utils/hashid');

const decodeId = (paramName = 'id') => {
  return (req, res, next) => {
    const hashedId = req.params[paramName];
    
    console.log('=== DECODE ID MIDDLEWARE ===');
    console.log('Param name:', paramName);
    console.log('Hashed ID:', hashedId);

    if (!hashedId) {
      console.log('ERROR: Missing ID parameter');
      return res.status(400).json({ error: 'Missing ID parameter.' });
    }

    const id = decode(hashedId);
    console.log('Decoded ID:', id);
    
if (id === undefined) {
  console.log('ERROR: Invalid ID');
  req.params[paramName] = null; // 
  return next();
}

    req.params[paramName] = id;
    console.log('ID successfully decoded and set');
    next();
  };
}; 

module.exports = decodeId;