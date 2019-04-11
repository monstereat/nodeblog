const express = require('express');
const config = require('./config/config');
const glob = require('glob');
const mongoose = require('mongoose');

mongoose.connect(config.db);
const db = mongoose.connection;
db.on('error', () => {
  throw new Error('unable to connect to database at ' + config.db);
});

const models = glob.sync(config.root + '/app/models/*.js');
models.forEach(function (model) {
  require(model);
});
const app = express();

module.exports = require('./config/express')(app, config,db);//把db传到express初始化里面
module.exports = require('./config/passport').init();  //应用入口启用passport 配置
app.listen(config.port, () => {
  console.log('Express server listening on port ' + config.port);
});
