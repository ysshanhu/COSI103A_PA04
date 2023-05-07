const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  description: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null
  },
  date: {
    type: Date,
    required: true,
  },
  userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
  }
});

module.exports = mongoose.model('Transaction', transactionSchema);