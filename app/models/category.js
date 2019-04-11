// Category model

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CategorySchema = new Schema({
  name: {type: String, required: true},
  slug: {type: String, required: true},
  created: {type: Date},
});



mongoose.model('Category', CategorySchema);
