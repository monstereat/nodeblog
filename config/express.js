const express = require('express');
const glob = require('glob');

const favicon = require('serve-favicon');
const logger = require('morgan');
const moment = require('moment');
const truncate = require('truncate');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const compress = require('compression');
const methodOverride = require('method-override');
const mongoose = require('mongoose');
const passport = require('passport');
const session = require('express-session');
const flash = require('connect-flash');
const messages = require('express-messages');
const MongoStore = require('connect-mongo')(session);  //配合 session使用
const validator = require('express-validator');

var Category = mongoose.model('Category');
var User = mongoose.model('User');

module.exports = (app, config, connection) => {  //把app.js中参数接过来，重命名为connection
  const env = process.env.NODE_ENV || 'development';
  app.locals.ENV = env;
  app.locals.ENV_DEVELOPMENT = env == 'development';

  app.set('views', config.root + '/app/views');
  app.set('view engine', 'jade');
  app.use(function(req, res, next){
    app.locals.pageName = req.path; // 获取请求路径  可以全局使用  用于后台左侧栏变动状态
    app.locals.monent = moment;
    app.locals.truncate = truncate;
  //  console.log(app.locals.pageName);
    //拿到数据放到全局使用  主要用于后台侧边栏
    Category.find({}).sort('-created').exec(function(err, categories){   //拿到数据放到全局使用  主要用于后台侧边栏
      if(err){
        return next(err);
      }
      app.locals.categories = categories;
      next();
    });

  });
  // app.use(favicon(config.root + '/public/img/favicon.ico'));
  app.use(logger('dev'));
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({
    extended: true
  }));
//express-validator 配置 怎么进行错误格式化
  app.use(validator({  //使用validator插件  传入 errorFormatter 告知程序如何进行错误的格式化
        errorFormatter: function(param, msg, value) {
            var namespace = param.split('.'),
                root = namespace.shift(),
                formParam = root;

            while(namespace.length) {
                formParam += '[' + namespace.shift() + ']';
            }

            return {
                param : formParam,
                msg   : msg,
                value : value
            };
        }
    }));

  app.use(cookieParser());
  //评论提交提示 配置  详情github   session 配置
  app.use(session({   //express-session配置
    secret: 'nodeblog',
    resave: false,
    ssaveUninitialized: true,
    cookie: {secure: false},
    store: new MongoStore({ mongooseConnection: connection })
    //connect-mongo 配置  session初始化中新建sotre，默认存储在memory 复用在app中的一个mongodb的链接
  }));
  //passport  配置   中间件配置在session之后
  app.use(passport.initialize());
  app.use(passport.session());

  //新写中间键  在所有模版使用
  app.use(function(req, res, next){
    req.user = null;
    if(req.session.passport && req.session.passport.user){
      User.findById(req.session.passport.user, function(err, user){
        if(err) return next(err);

        user.password = null;
        req.user =  user;

        next();
      })
    }else{
      next();
    }
  });

  app.use(flash());  //connect-flash  配置
  app.use(function(req, res, next){  //express-message 配置
    res.locals.messages = messages(req, res);
    app.locals.user = req.user;   //把session 中 user赋值个app.locals  即可在全部模版中使用
//    console.log(req.session, app.locals.user);  //经过测试 发现已经存在数据库中  把server杀掉，再启动 可以看到有我们的passport
    next();
  });

  app.use(compress());
  app.use(express.static(config.root + '/public'));
  app.use(methodOverride());

  var controllers = glob.sync(config.root + '/app/controllers/**/*.js');
  controllers.forEach((controller) => {
    require(controller)(app);
  });

  app.use((req, res, next) => {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
  });

  if (app.get('env') === 'development') {
    app.use((err, req, res, next) => {
      res.status(err.status || 500);
      res.render('error', {
        message: err.message,
        error: err,
        title: 'error'
      });
    });
  }

  app.use((err, req, res, next) => {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: {},
      title: 'error'
    });
  });
  //错误异常处理


  return app;
};
