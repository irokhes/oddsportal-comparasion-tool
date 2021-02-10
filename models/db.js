const mongoose = require('mongoose');
// const logger = require('../utils/logging');
const config = require('../config');

const connect = async () => {
  mongoose.Promise = global.Promise;
  console.log('MONGON URi ', config.db.uri);
  const connection = await mongoose.connect(config.db.uri,
    { useNewUrlParser: true, useCreateIndex: true, useFindAndModify: false }).catch((err) => {
    console.error('Error while attempting to connect to database:');
    console.error(err);
    process.exit(1);
  });
  return connection;
};
const close = () => mongoose.connection.close(() => {
  console.log('Mongoose default connection disconnected through app termination');
  process.exit(0);
});

module.exports = { connect, close };
