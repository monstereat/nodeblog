// User model

const mongoose = require('mongoose');
const Schema = mongoose.Schema;
var md5 = require('md5');
const UserSchema = new Schema({
  name: {type: String, required: true},
  email: {type: String, required: true},
  password: {type: String, required: true},
  created: {type: Date},
});



UserSchema.methods.verifyPassword = function(password){   //此方法在 passport.js 中
  var isMatch = md5(password) === this.password;  //this 代表当前用户对象查出来的   左边的为用户传进来的明文
  console.log('UserSchema.methods.verifyPassword:', password, this.password, isMatch);
  return isMatch;
}

mongoose.model('User', UserSchema);
