const express = require('express');
const router = express.Router();
const slug = require('slug'); //生成随机数据
const pinyin = require('pinyin');
const mongoose = require('mongoose');
var auth = require('./user');
const Post = mongoose.model('Post');
const User = mongoose.model('User');
const Category = mongoose.model('Category');

module.exports = (app) => {
  app.use('/admin/posts', router);
};

router.get('/', auth.requireLogin, (req, res, next) => {  //auth.requireLogin 用于权限校验 所有后台功能都需要
  //处理 sort 逻辑
  var sortby = req.query.sortby ? req.query.sortby : 'created';
  var sortdir = req.query.sortdir ? req.query.sortdir: 'desc'; //降序排

  //可排序字段
  if(['title', 'category', 'author', 'created', 'published'].indexOf(sortby) === -1){
    sortby = 'created';
  }
  if(['desc', 'asc'].indexOf(sortdir) === -1){
    sortdir = 'desc';
  }
  console.log("post first");
  //构建排序对象传给 mongoose
  var sortObj = {};
  sortObj[sortby] = sortdir;

  //处理condition 逻辑
  var conditions = {};
  if(req.query.category){
    conditions.category = req.query.category.trim();
  }
  if(req.query.author){
    conditions.category = req.query.author.trim();
  }
  if(req.query.keyword){
    conditions.title = new RegExp(req.query.keyword.trim(), 'i');  //生成一个正则表达式   区分大小写
    conditions.content = new RegExp(req.query.keyword.trim(), 'i');
  }

  User.find({},function(err, authors){
    if (err) return next(err);
    console.log("find error", err);
    Post.find(conditions)
    .sort(sortObj)
    .populate('author')
    .populate('category')
    .exec((err, posts) => {

      if (err) return next(err);
      console.log("exce error", err);
      var pageNum = Math.abs(parseInt(req.query.page || 1, 10));
      var pageSize = 10;

      var totalCount = posts.length;
      var pageCount = Math.ceil(totalCount / pageSize);

      if(pageNum > pageCount){
        pageNum = pageCount;
      }

      res.render('admin/post/index', {
        posts: posts.slice((pageNum - 1)*pageSize, pageNum*pageSize),
        pageNum: pageNum,
        pageCount: pageCount,
        authors: authors,
        sortdir: sortdir,
        sortby: sortby,  //传字段到前端
        pretty: true,
        filter:{
          category: req.query.category || "",
          author: req.query.author || "",
          keyword: req.query.keyword || "",  //把keyword回传到前台
        }
      });

    });
  });
});

router.get('/add',auth.requireLogin, (req, res, next) => {
  res.render('admin/post/add', {
    action: "/admin/posts/add",
    pretty: true,
    post: {
      category: {_id: ''},
    },
  });
});

// 获取添加文章数据   发表文章
router.post('/add',auth.requireLogin, (req, res, next) => {

//express-validator 配置 规则     校验(进数据库之前)  后端校验
  req.checkBody('title', '文章标题不能为空').notEmpty();
  req.checkBody('category', '必须指定文章分类').notEmpty();
  req.checkBody('content', '文章内容至少写几句').notEmpty();

  // 获取后端验证错误  validator 配置
  var errors = req.validationErrors();
  if(errors){
    //重新渲染页面
    console.log(errors);
    return res.render('admin/post/add',{
      errors: errors,
      title: req.body.title,
      content: req.body.content,
    });
  }

  var title = req.body.title.trim();
  var category = req.body.category.trim();
  var content = req.body.content;

  //随机找个用户当成作者
  User.findOne({}, function(err, author){
    if(err){
      return next(err);
    }
    var py = pinyin(title, {
      style: pinyin.STYLE_NORMAL,
      heteronym: false
    }).map(function(item){
      return item[0];
    }).join('');

    //文章保存在内存里面
    var post = new Post({
      title: title,
      slug: slug(py),
      category: category,
      content: content,
      author: author,
      published: true,
      meta: {favorite: 0},
      comments: [],
      created: new Date(),
    });

    post.save(function(err, post){
      if(err){
        req.flash('err', '文章保存失败');  //用与!=message 的展示
        res.redirect('/admin/posts/add');
      }else{
        req.flash('info', '文章保存成功');
        res.redirect('/admin/posts'); //跳到文章列表页
      }
    });
  });
});

//
router.get('/edit/:id',auth.requireLogin,getPostById,(req, res, next) => {
    res.render('admin/post/add',{
        action: "/admin/posts/edit/" + req.post._id,
      post: req.post,
    });

});

//编辑提交页  post 方法
router.post('/edit/:id',auth.requireLogin, getPostById,(req, res, next) => {
    var post = req.post;
    var title = req.body.title.trim();
    var category = req.body.category.trim();
    var content = req.body.content;

    var py = pinyin(title, {
      style: pinyin.STYLE_NORMAL,
      heteronym: false
    }).map(function(item){
      return item[0];
    }).join('');

    post.title = title;
    post.category = category;
    post.content = content;
    post.slug = slug(py);

    post.save(function(err, post){
      if(err){
        req.flash('err', '文章编辑失败');
        res.redirect('/admin/posts/edit/' + post._id);
      }else{
        req.flash('info', '文章编辑成功');
        res.redirect('/admin/posts'); //跳到文章列表页
      }
    });
});

//删除功能 get 方法
router.get('/delete/:id',auth.requireLogin, (req, res, next) => {
  if(!req.params.id){
    return next(new Error('no post provided'));
  }

  Post.remove({_id: req.params.id}).exec(function(err,rowsRemoved){
    if(err){
      return next(err);
    }

    if(rowsRemoved){
      req.flash('success','文章删除成功');
    }else{
      req.flash('fail','文章删除失败');
    }

    res.redirect('/admin/posts');
  });
});

//代码重构   公共中间件
function getPostById(req, res, next){
  if(!req.params.id){
    return next(new Error('no post id provided'));
  }

  Post.findOne({_id: req.params.id})
  .populate('category')
  .populate('author')
  .exec(function(err, post){
    if(err){
      return next(err);
    }
    if(!post){
      return next(new Error('post not found: ',req.params.id));
    }

    req.post = post;
    next();
  });
}
