const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const mongoose = require('mongoose');
const User = mongoose.model('User');
//配置详情在 npm passport 文档中
module.exports.init = function () {  //封装成函数 做为返回值可在外部初始化
    // console.log('passport.local.init');
    //策咯配置
  passport.use(new LocalStrategy({ //LocalStrategy 配置
      usernameField: 'email',
      passwordField: 'password'
  }, function(email, password, done) {
      // console.log('passport.local.find:', email);

      User.findOne({ email: email }, function (err, user) {
          // console.log('passport.local.find:', user, err);
          if (err) {
              return done(err);
          }
          if (!user) {
              return done(null, false);
          }
          if (!user.verifyPassword(password)) {
              return done(null, false);
          }

          return done(null, user);
      });
  }));
  //会话配置
  passport.serializeUser(function(user, done) {
      // console.log('passport.local.serializeUser:', user);
      done(null, user._id);
  });

  passport.deserializeUser(function(id, done) {
      // console.log('passport.local.deserializeUser:', id);
      User.findById(id, function (err, user) {
          done(err, user);
      });
  });
};
