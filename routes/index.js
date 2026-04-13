const express = require('express');
const authMiddleware = require('./services/api_token_security');
const router = express.Router();
const {
  subscribe,
  confirm,
  unsubscribe,
  getSubscriptions
} = require('./controllers/subscription');

router.post('/subscribe', authMiddleware, subscribe);
router.get('/confirm/:token', confirm);
router.get('/unsubscribe/:token', unsubscribe);
router.get('/subscriptions', authMiddleware, getSubscriptions);

module.exports = router;