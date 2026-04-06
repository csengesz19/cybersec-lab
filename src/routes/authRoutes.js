import express from 'express';
import bcrypt from 'bcrypt';
import { findUserByEmail, createUser } from '../repositories/userRepository.js';

const createRouter = express.Router;
const router = createRouter();

router.get('/login', (req, res) => {
  res.render('login', {
    title: 'Login',
    errorMessage: null,
    nextUrl: req.query.next || '/',
  });
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password, nextUrl } = req.body;

    const user = await findUserByEmail(email);

    if (!user) {
      return res.render('login', {
        title: 'Login',
        errorMessage: 'Invalid email or password.',
        nextUrl,
      });
    }

    const match = await bcrypt.compare(password, user.passwordHash);

    if (!match) {
      return res.render('login', {
        title: 'Login',
        errorMessage: 'Invalid email or password.',
        nextUrl,
      });
    }

    const sessionUser = {
      id: user.userId,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
    };

    const session = req.session;
    session.user = sessionUser;

    return res.redirect(nextUrl || '/');
  } catch (err) {
    return next(err);
  }
});

router.get('/register', (req, res) => {
  res.render('register', {
    title: 'Register',
    errorMessage: null,
    nextUrl: req.query.next || '/',
    formData: { name: '', email: '' },
  });
});

router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password, passwordAgain, nextUrl } = req.body;

    if (!name || !email || !password || !passwordAgain) {
      return res.render('register', {
        title: 'Register',
        errorMessage: 'All fields are required.',
        nextUrl,
        formData: { name, email },
      });
    }

    if (password !== passwordAgain) {
      return res.render('register', {
        title: 'Register',
        errorMessage: 'Passwords do not match.',
        nextUrl,
        formData: { name, email },
      });
    }

    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return res.render('register', {
        title: 'Register',
        errorMessage: 'Email already in use.',
        nextUrl,
        formData: { name, email },
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await createUser({ name, email, passwordHash });

    const sessionUser = {
      id: user.userId,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
    };

    const session = req.session;
    session.user = sessionUser;

    return res.redirect(nextUrl || '/');
  } catch (err) {
    return next(err);
  }
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});

export default router;
