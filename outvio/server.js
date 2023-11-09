require('dotenv').config();

const express = require('express');
const jwt = require('jsonwebtoken');
const app = express();
const port = 3000;

// Import custom rate limit middleware
const { tokenLimiter, ipLimiter, protectedLimiter, privateLimiter } = require('./src/redis');

app.use(express.json());

// Middleware to authenticate JWT tokens
const authenticateToken = (req, res, next) => {
  // Token is taken from the header
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) return res.sendStatus(401); // if token doesn't exist, permission is denied

  jwt.verify(token, process.env.SECRET_KEY, (err, user) => {
    if (err) return res.sendStatus(403); // if token is invalid, permission is denied
    req.user = user;
    next(); // if token is valid, it passes to the next middleware
  });
};

app.post('/token', (req, res) => {
  const { id, username } = req.body;
  
  const user = {
    id: id || '123', // Default to '123' if id is not provided
    username: username || 'exampleUser' // Default to 'exampleUser' if username is not provided
  };
  
  const token = jwt.sign(user, process.env.SECRET_KEY, { expiresIn: '1h' }); 
  res.json({ token });
});

// token limitation for protected routes
app.use('/protected', tokenLimiter);
app.use('/public', ipLimiter);

// protected routes
app.get('/protected', authenticateToken, (req, res) => {
  res.send(`Welcome! Your user ID is: ${req.user.id}`);
});

// ip limitation for public routes

// public route
app.get('/public', (req, res) => {
  res.send('This is a public route and accessible by everyone.');
});

// private route
app.get('/private', authenticateToken, tokenLimiter, (req, res) => {
  res.send(`This is a private route. Your user ID is: ${req.user.id}`);
});


app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
