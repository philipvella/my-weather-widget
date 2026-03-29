if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config({ path: '.env.local' });
  require('dotenv').config();
}

const express = require('express');
const path = require('path');
const rateLimit = require('express-rate-limit');
const weatherRouter = require('../src/routes/weather');

const app = express();

// ── View engine ────────────────────────────────────────────────────────────────
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

// ── Static files ───────────────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, '../public')));

// ── Rate limiting ──────────────────────────────────────────────────────────────
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// ── Notion / iframe embedding headers ─────────────────────────────────────────
app.use((req, res, next) => {
  res.removeHeader('X-Frame-Options');
  res.setHeader('Content-Security-Policy', 'frame-ancestors *');
  next();
});

// ── Routes ─────────────────────────────────────────────────────────────────────
app.get('/', (req, res) => res.redirect('/city/london'));
app.get('/demo', (req, res) => res.render('demo'));
app.use('/', weatherRouter);

// ── 404 ────────────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).render('error', { message: 'Page not found', location: null });
});

// ── Error handler ──────────────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res) => {
  console.error(err);
  res.status(500).render('error', { message: 'An unexpected error occurred', location: null });
});

// ── Local dev server ───────────────────────────────────────────────────────────
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`Weather widget running at http://localhost:${PORT}`));
}

module.exports = app;
