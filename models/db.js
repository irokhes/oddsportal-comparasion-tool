const mongoose = require('mongoose');
// const logger = require('../utils/logging');
const config = require('../config');
const Odds = require('./odds');

// const connect = () => {
//   mongoose.Promise = global.Promise;
//   console.log('MONGON URi ', config.db.uri);
//   const connection = mongoose.connect(config.db.uri, { useNewUrlParser: true });
//   connection
//     .then((db) => {
//       console.log(
//         `Successfully connected to ${config.db.uri} MongoDB cluster in ${config.env
//         } mode.`,
//       );
//       return db;
//     })
//     .catch((err) => {
//       if (err.message.code === 'ETIMEDOUT') {
//         console.log('Attempting to re-establish database connection.');
//         mongoose.connect(config.db.uri);
//       } else {
//         console.error('Error while attempting to connect to database:');
//         console.error(err);
//         process.exit(1);
//       }
//     });
// };

const connect = async () => {
  mongoose.Promise = global.Promise;
  console.log('MONGON URi ', config.db.uri);
  const connection = await mongoose.connect(config.db.uri, { useNewUrlParser: true }).catch((err) => {
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
