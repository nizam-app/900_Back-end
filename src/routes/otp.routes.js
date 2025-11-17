// src/routes/otp.routes.js
import express from 'express';
import { sendOTP, verifyOTP } from '../services/otp.service.js';

const router = express.Router();

router.post('/send', sendOTP);
router.post('/verify', verifyOTP);

export default router;
