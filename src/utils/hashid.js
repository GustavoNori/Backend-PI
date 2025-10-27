require('dotenv').config();

const Hashids = require('hashids');
const salt = process.env.HASHID_SALT || 'caso nao ache';

const minLength = 8;

const hashids = new Hashids(salt, minLength);
const encode = (id) => hashids.encode(id);
const decode = (hash) => {
  const [decodedId] = hashids.decode(hash);
  return decodedId;
};

module.exports = { encode, decode };