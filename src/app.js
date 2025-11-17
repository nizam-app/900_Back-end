// src/app.js
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { errorHandler } from './middleware/errorHandler.js';

import authRoutes from './routes/auth.routes.js';
import srRoutes from './routes/sr.routes.js';
import woRoutes from './routes/wo.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import commissionRoutes from './routes/commission.routes.js';

const app = express();

app.use(cors());
app.use(helmet());
app.use(morgan('dev'));

// JSON (for normal APIs)
app.use(express.json());
// URL-encoded (optional, for form posts without files)
app.use(express.urlencoded({ extended: true }));

// ROUTES
app.use('/api/auth', authRoutes);
app.use('/api/sr', srRoutes);
app.use('/api/wos', woRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/commissions', commissionRoutes);

app.get('/', (req, res) => {
  res.json({ status: 'FSM backend running' });
});

app.use(errorHandler);

export default app;
