const express = require('express');
const Transaction = require('../models/Transaction');
const Category = require('../models/Category');
const router = express.Router();

const isLoggedIn = (req,res,next) => {
    if (res.locals.loggedIn) {
      next()
    } else {
      res.redirect('/login')
    }
  }

router.get('/transactions/', isLoggedIn, async (req, res, next) => {
  try {
    const { sortBy } = req.query;
    let transactions;

    const rawTransactions = await Transaction.find({ userId: req.user._id }).populate('category');
    console.log("raw transaction fetch successfully")

    transactions = rawTransactions.sort((a, b) => {
      switch (sortBy) {
        case 'category':
          return a.category.name.localeCompare(b.category.name);
        case 'amount':
          return a.amount - b.amount;
        case 'description':
          return a.description.localeCompare(b.description);
        case 'date':
        default:
          return new Date(a.date) - new Date(b.date);
      }
    });
    const categories = await Category.find(); 
    res.render('transactions', { user: req.user, transactions, categories, sortBy });
  } catch (err) {
    next(err);
  }
});

router.get('/transactions/groupedByCategory', isLoggedIn, async (req, res, next) => {
  try {
    const transactions = await Transaction.aggregate([
      { $match: { userId: req.user._id } },
      {
        $lookup: {
          from: 'categories',
          localField: 'category',
          foreignField: '_id',
          as: 'category'
        }
      },
      { $unwind: '$category' },
      {
        $group: {
          _id: '$category.name',
          totalAmount: { $sum: '$amount' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.render('transactionsByCategory', { user: req.user, transactionsByCategory: transactions });
  } catch (err) {
    next(err);
  }
});

router.post('/transactions', isLoggedIn, async (req, res, next) => {
  try {
    const newTransactionData = {
      date: req.body.date,
      description: req.body.description,
      amount: req.body.amount,
      userId: req.user._id, 
    };    

    if (req.body['new-category']) {
      const newCategory = new Category({ name: req.body['new-category'] });
      await newCategory.save();
      newTransactionData.category = newCategory._id; 
    } else {
      throw new Error('Category can not be null!');
    }

    const newTransaction = new Transaction(newTransactionData);
    await newTransaction.save();
    res.redirect('/transactions');
  } catch (err) {
    next(err);
  }
});

router.delete('/transactions/:id', isLoggedIn, async (req, res, next) => {
  try {
    const { id } = req.params;
    await Transaction.findByIdAndDelete(id);
    console.log("Transaction deleted successfully.")
    res.redirect('/transactions'); 
  } catch (err) {
    next(err);
  }
});


router.get('/transactions/:id/edit', 
    isLoggedIn,
    async (req, res, next) => {
    try {
        const { id } = req.params;
        const transaction = await Transaction.findById(id);
        const categories = await Category.find().sort('name'); 
        res.render('edit-transaction', { transaction, id, categories }); 
    } catch (err) {
        next(err);
    }
});

router.put('/transactions/:id', isLoggedIn, async (req, res, next) => {
  try {
    const { id } = req.params;
    const transaction = await Transaction.findById(id);

    if (!transaction) {
        throw new Error('Transaction not found');
    }

    const updates = {
        date: req.body.date,
        description: req.body.description,
        amount: req.body.amount,
    };

    if (req.body['new-category']) {
        const newCategory = new Category({ name: req.body['new-category'] });
        await newCategory.save();
        updates.category = newCategory._id; 
    } else {
        updates.category = req.body.category === "" ? null : req.body.category;
    }

    await Transaction.findByIdAndUpdate(id, updates);
    res.redirect('/transactions');
  } catch (err) {
    next(err);
  }
});


module.exports = router;