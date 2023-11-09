require('dotenv').config();
const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const { createClient } = require('redis');

const redisClient = createClient({
  url: 'redis://localhost:6379'
});

// Redis client'ını bağla
redisClient.connect().catch(console.error);

// token rate limiter
const tokenLimiter = rateLimit({
  store: new RedisStore({
    sendCommand: (...args) => redisClient.sendCommand(args)
  }),
  windowMs: 60 * 60 * 1000, // 1 hour
  max: process.env.TOKEN_LIMITER, // 200 req/hour for every token
  handler: function (req, res) {
    res.status(429).json({
      message: 'Too many requests have been made for this token. Please try again later.'
    });
  }
});


// IP rate limiter
const ipLimiter = rateLimit({
  store: new RedisStore({
    sendCommand: (...args) => redisClient.sendCommand(args)
  }),
  windowMs: 60 * 60 * 1000, // 1 hour
  max: process.env.IP_LIMITER, // 100 req/hour for every ip
  handler: function (req, res) {
    res.status(429).json({
      message: 'Too many requests have been made for this token. Please try again later.'
    });
  }
});


module.exports = {
  tokenLimiter,
  ipLimiter
};