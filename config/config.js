
const path = require('path');
const rootPath = path.normalize(__dirname + '/..');
const env = process.env.NODE_ENV || 'development';

const config = {
  development: {
    root: rootPath,
    app: {
      name: 'nodeblog'
    },
    port: process.env.PORT || 3000,
    db: 'mongodb://localhost/nodeblog'
  },

  test: {
    root: rootPath,
    app: {
      name: 'nodeblog'
    },
    port: process.env.PORT || 3000,
    db: 'mongodb://localhost/nodeblog-test'
  },

  production: {
    root: rootPath,
    app: {
      name: 'nodeblog'
    },
    port: process.env.PORT || 3000,
    db: 'mongodb://localhost/nodeblog-production'
  }
};

module.exports = config[env];
