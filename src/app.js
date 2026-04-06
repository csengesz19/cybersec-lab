import 'dotenv/config';
import express from 'express';
import session from 'express-session';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import trainRoutesRouter from './routes/trainRoutes.js';
import bookingRouter from './routes/bookingRoutes.js';
import authRouter from './routes/authRoutes.js';
import logger from './middleware/logger.js';
import errorHandler from './middleware/errorHandler.js';

const currentFile = fileURLToPath(import.meta.url);
const currentDir = dirname(currentFile);

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(currentDir, 'views'));

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'dev-secret-change-me',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60,
    },
  }),
);

app.use((req, res, next) => {
  res.locals.currentUser = req.session?.user || null;
  res.locals.currentPath = req.originalUrl || '/';
  next();
});

app.use(logger);
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(express.static(path.join(currentDir, '..', 'public')));

app.use('/', authRouter);
app.use('/', trainRoutesRouter);
app.use('/', bookingRouter);

app.get('/health', (req, res) => {
  res.send('OK');
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`CyberSec Lab server listening on http://localhost:${PORT}`);
});
