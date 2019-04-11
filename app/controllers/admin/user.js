var express = require('express'),
 router = express.Router(),
 mongoose = require('mongoose'),
 md5 = require('md5'),
 passport = require('passport'),
 User = mongoose.model('User');

 module.exports = (app) => {
   app.use('/admin/users', router);
 };

//用于权限校验    写中间键以便在其他地方使用  在category 和 post 中使用
module.exports.requireLogin = function(req, res, next){
  if(req.user){
    next();
  }else{
    req.flash('err','只有登陆用户才能访问');
    res.redirect('/admin/users/login');
  }
};

router.get('/login', (req, res, next) => {
  res.render('admin/user/login', {
    pretty: true,
  });
});

//post 方法     验证请求
router.post('/login', passport.authenticate('local', {
  failureRedirect: '/admin/users/login',
  failureFlash: '用户名或密码错误',
}),
function(req, res, next){
  console.log('user login success: ', req.body);
  res.redirect('/admin/posts');
});

router.get('/register', (req, res, next) => {
  res.render('admin/user/register', {
    pretty: true,
  });
});
//post 方法
router.post('/register', (req, res, next) => {
  req.checkBody('email', '邮箱不能为空').notEmpty().isEmail();
  req.checkBody('password', '密码不能为空').notEmpty();
  req.checkBody('confirmPassword', '两次密码不匹配').notEmpty().equals(req.body.password);

  var errors = req.validationErrors();
    if (errors) {
        console.log(errors);
        return res.render('admin/user/register', req.body);
    }

    var user = new User({
      name: req.body.email.split('@').shift(),
      email: req.body.email,
      password: md5(req.body.password),
      created: new Date(),
    });

    user.save(function (err, user){
      if(err){
        console.log('admin/user/register error:', err);
        req.flash('info', '用户注册失败');
        res.render('admin/user/register');
      }else{
        req.flash('info', '用户注册成功');
        res.redirect('/admin/users/login');
      }
    });
  // res.render('admin/user/login', {
  //   pretty: true,
  // });
});

router.get('/password', (req, res, next) => {
  // User.find(function(err, users){
  //   //return res.jsonp(users);
  //   res.render('admin/index', {
  //     pretty: true,
  //   });
  // });
    res.render('admin/user/password', {
      pretty: true,
    });
});
//提交数据
router.post('/password', passport.authenticate('local', {  //在路由中认证用户
  failureRedirect: '/admin/users/password',
  failureFlash: '密码错误',
}),(req, res, next) => {
  // console.log('req.body:', user.email);
  req.checkBody('password', '旧密码不能为空').notEmpty();
  req.checkBody('confirmPassword', '新密码不能为空').notEmpty();
  var email = req.body.email;
  User.findOne({ email: email}).exec(function(err, user){
    if (err) {
        return next(err);
    }
    var password = md5(req.body.confirmPassword);
    user.password = password;

    user.save(function(err, user){
      if(err){
        req.flash('err', '密码编辑失败');
        res.render('admin/user/password');
      }else{
        req.flash('info', '密码编辑成功');
        res.render('admin/user/password'); //跳到文章列表页
      }
    });

  });
  // User.findOne({ email: email }).exec(function (err, user) {
  //     // console.log('passport.local.find:', user, err);
  //     if (err) {
  //         return next(err);
  //     }
  //
  //     var password = md5(req.body.confirmPassword);
  //     // user.update
  //     user.password = password;
  //     user.save(function(err, user){
  //       if(err){
  //         req.flash('err', '密码修改失败');
  //         res.redirect('admin/user/password');
  //       }else{
  //         req.flash('info', '密码修改成功');
  //         res.redirect('admin/user/password'); //跳到文章列表页
  //       }
  //     });
  //   });

  //console.log('user login success: ', req.body);
  // res.redirect('admin/users/password');
//  return res.jsonp(req.body);
  // res.render('admin/user/password', {

  //   pretty: true,
  // });
  // var errors = req.validationErrors();
  //   if (errors) {
  //       console.log(errors);
  //       return res.render('admin/index', req.body);
  //   }
  //   console.log('提交数据为',req.body.email);
  //   console.log('提交数据为',req.body.password);
  //   console.log('提交数据为',req.body.confirmPassword);
  //   if(user.password == req.body.password){
  //
  //   }
  //   var newpassword = req.body.confirmPassword;
  //   user.password = newpassword;
    // user.save(function(err, post){
    //   if(err){
    //     req.flash('err', '密码修改失败');
    //     res.redirect('/admin/index');
    //   }else{
    //     req.flash('info', '密码修改成功');
    //     res.redirect('/admin/index'); //跳到文章列表页
    //   }
    // });
    // User.find(function(err, users){
    //   //return res.jsonp(users);
    // });
    //
    // var user = new User({
    //   name: req.body.email.split('@').shift(),
    //   email: req.body.email,
    //   password: md5(req.body.password),
    //   created: new Date(),
    // });
    //
    // user.save(function (err, user){
    //   if(err){
    //     console.log('admin/user/register error:', err);
    //     req.flash('info', '用户注册失败');
    //     res.render('admin/user/register');
    //   }else{
    //     req.flash('info', '用户注册成功');
    //     res.redirect('/admin/users/login');
    //   }
    // });
  // res.render('admin/user/login', {
  //   pretty: true,
  // });
});


router.get('/logout', (req, res, next) => {
  //TODO
  req.logout();
  res.redirect('/');
});
