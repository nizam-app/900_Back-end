// COMPLETE: src/controllers/sr.controller.js
import * as srService from '../services/sr.service.js';

export const createSR = async (req, res, next) => {
  try {
    const { phone, address, categoryId, subserviceId, paymentType } = req.body;

    if (!phone || !address || !categoryId || !subserviceId || !paymentType) {
      return res.status(400).json({
        message: 'phone, address, categoryId, subserviceId, paymentType are required',
      });
    }

    const sr = await srService.createServiceRequest(req.body);
    return res.status(201).json(sr);
  } catch (err) {
    next(err);
  }
};

export const listSR = async (req, res, next) => {
  try {
    const srs = await srService.findServiceRequests(req.query);
    return res.json(srs);
  } catch (err) {
    next(err);
  }
};
