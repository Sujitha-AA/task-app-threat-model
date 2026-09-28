const express = require('express');
const bcrypt = require('bcrypt');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');

const app = express();
app.use(express.json());
app.use(cookieParser());

// In-memory user database (for demonstration purposes)
const users = [];

// Rate limiter for authentication endpoints to prevent brute-force attacks
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// 1. Registration Endpoint with Input Validation & Password Hashing
app.post('/register', async (req, res) => {
  const { username, password } = req.body;

  // Server-side input validation
  if (!username || typeof username !== 'string' || username.length < 3) {
    return res.status(400).json({ error: 'Username must be at least 3 characters long.' });
  }
  if (!password || typeof password !== 'string' || password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters long.' });
  }

  // Check if user already exists
  const existingUser = users.find(u => u.username === username);
  if (existingUser) {
    return res.status(400).json({ error: 'Username is already taken.' });
  }

  try {
    // Hash password securely using bcrypt
    const hashedPassword = await bcrypt.hash(password, 12);
    users.push({ username, password: hashedPassword });
    
    res.status(201).json({ message: 'User registered successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error during registration.' });
  }
});

// 2. Login Endpoint with Rate Limiting & Generic Errors
app.post('/login', authLimiter, async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  const user = users.find(u => u.username === username);

  // Generic error message to prevent user enumeration attacks
  const genericError = 'Invalid username or password.';

  if (!user) {
    return res.status(401).json({ error: genericError });
  }

  try {
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ error: genericError });
    }

    // Set a secure, HttpOnly cookie for session management
    res.cookie('sessionUser', user.username, {
      httpOnly: true,
      secure: false, // Set to true in production with HTTPS
      sameSite: 'strict',
      maxAge: 3600000 // 1 hour session expiry
    });

    res.json({ message: 'Logged in successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error during login.' });
  }
});

// 3. Protected Dashboard Route
app.get('/dashboard', (req, res) => {
  const sessionUser = req.cookies.sessionUser;
  if (!sessionUser) {
    return res.status(401).json({ error: 'Unauthorized. Please log in.' });
  }
  res.json({ message: `Welcome to your dashboard, ${sessionUser}!` });
});

// 4. Logout Endpoint (Clears the secure cookie)
app.post('/logout', (req, res) => {
  res.clearCookie('sessionUser');
  res.json({ message: 'Logged out successfully.' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Auth service running on port ${PORT}`);
});
