import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './lib/env.js';
import { authRouter } from './routes/auth.routes.js';
import { listingsRouter } from './routes/listings.routes.js';
import { messagesRouter } from './routes/messages.routes.js';
import { transactionsRouter } from './routes/transactions.routes.js';
import { adviceRouter } from './routes/advice.routes.js';
import { feedbackRouter } from './routes/feedback.routes.js';
import { referenceRouter } from './routes/reference.routes.js';
import { apiRateLimiter } from './middleware/rateLimit.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

const app = express();

app.set('trust proxy', 1); // Render/Railway sit behind a reverse proxy — needed for correct req.ip in rate limiting.

// Render/Railway terminate TLS at the edge and forward plain HTTP internally,
// so this isn't redundant — it rejects any request that arrives without the
// proxy having terminated it over HTTPS, rather than assuming the platform
// enforces it.
if (env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.headers['x-forwarded-proto'] !== 'https') {
      res.redirect(301, `https://${req.headers.host}${req.originalUrl}`);
      return;
    }
    next();
  });
}

app.use(helmet());
app.use(
  cors({
    origin(origin, callback) {
      // No Origin header = same-origin or a non-browser client (curl,
      // server-to-server) — not a cross-origin browser request, allow it.
      if (!origin || env.CORS_ORIGIN.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error(`Origin ${origin} is not allowed by CORS_ORIGIN`));
    },
    credentials: true, // required so the refresh-token cookie is sent/accepted cross-origin
  }),
);
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use(apiRateLimiter);

app.get('/health', (_req, res) => res.json({ ok: true }));

app.use('/api/auth', authRouter);
app.use('/api/listings', listingsRouter);
app.use('/api/messages', messagesRouter);
app.use('/api/transactions', transactionsRouter);
app.use('/api/advice', adviceRouter);
app.use('/api/feedback', feedbackRouter);
app.use('/api', referenceRouter); // /api/regions, /api/crops

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(env.PORT, () => {
  console.log(`Batanai.zw API listening on port ${env.PORT} (${env.NODE_ENV})`);
});
