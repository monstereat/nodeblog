const express = require('express');
const slug = require('slug');
const pinyin = require('pinyin');
const router = express.Router();
const mongoose = require('mongoose');
var auth = require('./user');
const Post = mongoose.model('Post');
const Category = mongoose.model('Category');

module.exports = (app) => {
  app.use('/admin/categories', router);
};

router.get('/',auth.requireLogin, (req, res, next) => {
  res.render('admin/category/index', {
    pretty: true,
  });
});

router.get('/add',auth.requireLogin, (req, res, next) => {
  res.render('admin/category/add', {
    action: "/admin/categories/add",
    pretty: true,
    category: {_id: ''},
  });
});

router.post('/add',auth.requireLogin, (req, res, next) => {
  req.checkBody('name', '分类标题不能为空').notEmpty();

  //获取后端页面错误
  var errors = req.validationErrors();
  if(errors){
    //重新渲染页面
    console.log(errors);
    return res.render('admin/category/add',{
      errors: errors,
      name: req.body.name,
    });
  }

  var name = req.body.name.trim();
    var py = pinyin(name, {
      style: pinyin.STYLE_NORMAL,
      heteronym: false
    }).map(function(item){
      return item[0];
    }).join('');

    //文章保存在内存里面
    var category = new Category({
      name: name,
      slug: slug(py),
      created: new Date(),
    });

    category.save(function(err, category){
      if(err){
        req.flash('err', '分类保存失败');
        res.redirect('/admin/categories/add');
      }else{
        req.flash('info', '分类保存成功');
        res.redirect('/admin/categories'); //跳到文章列表页
      }
    });
});
router.get('/edit/:id',auth.requireLogin, getCategoryById, (req, res, next) => {
  res.render('admin/category/add',{
    action: "/admin/categories/edit/" + req.category._id,
    category: req.category,
  });

});


router.post('/edit/:id',auth.requireLogin, getCategoryById, (req, res, next) => {
  var category = req.category;
  var name = req.body.name.trim();

  var py = pinyin(name, {
    style: pinyin.STYLE_NORMAL,
    heteronym: false
  }).map(function(item){
    return item[0];
  }).join('');

  category.name = name;
  category.slug = slug(py);

  category.save(function(err, category){
    if(err){
      req.flash('err', '分类编辑失败');
      res.redirect('/admin/categories/edit/' + post._id);
    }else{
      req.flash('info', '分类编辑成功');
      res.redirect('/admin/categories'); //跳到文章列表页
    }
  });
});


router.get('/delete/:id',auth.requireLogin, getCategoryById, (req, res, next) => {
  req.category.remove(function(err,rowsRemoved){
    if(err){
      return next(err);
    }

    if(rowsRemoved){
      req.flash('success','分类删除成功');
    }else{
      req.flash('fail','分类删除失败');
    }

    res.redirect('/admin/categories');
  });
});

//代码重构   公共中间件
function getCategoryById(req, res, next){
  if(!req.params.id){
    return next(new Error('no category id provided'));
  }

  Category.findOne({_id: req.params.id})
  .exec(function(err, category){
    if(err){
      return next(err);
    }
    if(!category){
      return next(new Error('category not found: ',req.params.id));
    }

    req.category = category;
    next();
  });
}
