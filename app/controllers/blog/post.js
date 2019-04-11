const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Post = mongoose.model('Post');
const Category = mongoose.model('Category');

module.exports = (app) => {
  app.use('/posts', router);
};

router.get('/', (req, res, next) => {
  var conditions = {published: true};
  if(req.query.keyword){
    conditions.title = new RegExp(req.query.keyword.trim(), 'i');  //正则区分大小写
    conditions.content = new RegExp(req.query.keyword.trim(), 'i');
  }
  Post.find(conditions)
  .sort('-created')
  .populate('author')
  .populate('category')
  .exec((err, posts) => {
    // return res.json(posts);
    if (err) return next(err);
    var pageNum = Math.abs(parseInt(req.query.page || 1, 10));
    var pageSize = 10;

    var totalCount = posts.length;
    var pageCount = Math.ceil(totalCount / pageSize);

    if(pageNum > pageCount){
      pageNum = pageCount;
    }
    res.render('blog/index', {
      posts: posts.slice((pageNum - 1)*pageSize, pageNum*pageSize),
      pageNum: pageNum,
      pageCount: pageCount,
      pretty: true,
    });
  // Post.find({published:true})
  // .populate('author')
  // .populate('category').exec(function(err,posts){
  //   if(err) return next(err);
  //   res.render('blog/test');
  //   posts: posts,
  //   pretty: true
  // })
  // res.render('blog/test', {
  //   posts: posts.slice((pageNum - 1)*pageSize, pageNum*pageSize),
  //      pageNum: pageNum,
  //      pageCount: pageCount,
  //      pretty: true,
  // });
  });
});

router.get('/category/:name', (req, res, next) => {
  Category.findOne({name: req.params.name}).exec(function(err, category){
    if(err){
      return next(err);
    }

    Post.find({category: category, published: true})
    .sort('created')
    .populate('category')
    .populate('author')
    .exec(function (err, posts){
      if(err){
        return next(err);
      }

      res.render('blog/category', {
        posts: posts,
        category: category,
        pretty: true,
      });

    });
  });
});

router.get('/view/:id', (req, res, next) => {
  if(!req.params.id){
    return next(new Error('no post id provided'));
  }

  var conditions = {};
  try{
    conditions._id = mongoose.Types.ObjectId(req.params.id);
  }catch(err){
    conditions.slug = req.params.id;
  }
  Post.findOne(conditions)
  .populate('category')
  .populate('author')
  .exec(function(err, post){
    if(err){
      return next(err);
    }

    res.render('blog/view',{
      post: post,
    });
  });
});

//点赞功能
router.get('/favorite/:id', (req, res, next) => {
  if(!req.params.id){
    return next(new Error('no post id provided'));
  }

  var conditions = {};
  try{
    conditions._id = mongoose.Types.ObjectId(req.params.id);
  }catch(err){
    conditions.slug = req.params.id;
  }
  Post.findOne(conditions)
  .populate('category')
  .populate('author')
  .exec(function(err, post){
    if(err){
      return next(err);
    }
    post.meta.favorite = post.meta.favorite?post.meta.favorite+1 : 1;
    post.markModified('meta');
    post.save(function(err){
      res.redirect('/posts/view/' + post.slug);
      });
    });

});

//评论功能
router.post('/comment/:id', (req, res, next) => {
  if(!req.body.email){
    return next(new Error('no email provided for commenter'));
  }
  if(!req.body.content){
    return next(new Error('no content provided for commenter'));
  }

  var conditions = {};
  try{
    conditions._id = mongoose.Types.ObjectId(req.params.id);
  }catch(err){
    conditions.slug = req.params.id;
  }
  Post.findOne(conditions).exec(function(err, post){
    if(err){
      return next(err);
    }

    var comment = {
      email: req.body.email,
      content: req.body.content,
      created: new Date(),
    };

    post.comments.unshift(comment);
    post.markModified('comments');

    post.save(function(err,post){
      req.flash('info','评论添加成功')
      res.redirect('/posts/view/'+post.slug);
    });
  });
});
//登陆功能完善（文章详情页面登陆）
router.get('/view/admin/users/login', (req, res, next) => {
  res.render('admin/user/login', {
    pretty: true,
  });
});

//登陆功能完善（分类页面登陆）
router.get('/category/admin/users/login', (req, res, next) => {
  res.render('admin/user/login', {
    pretty: true,
  });
});

//注册功能完善（文章详情页面）
router.get('/view/admin/users/register', (req, res, next) => {
  res.render('admin/user/register', {
    pretty: true,
  });
});

//登陆功能完善（分类页面登陆）
router.get('/category/admin/users/register', (req, res, next) => {
  res.render('admin/user/register', {
    pretty: true,
  });
});
