// COMPLETE: src/controllers/wo.controller.js
import * as woService from '../services/wo.service.js';

export const createWOFromSR = async (req, res, next) => {
  try {
    const srId = Number(req.params.srId);
    const wo = await woService.createWorkOrderFromSR(srId, req.body, req.user.id);
    return res.status(201).json(wo);
  } catch (err) {
    if (err.message === 'Service Request not found') {
      return res.status(404).json({ message: err.message });
    }
    if (err.message === 'SR already converted to WO') {
      return res.status(400).json({ message: err.message });
    }
    next(err);
  }
};

export const assignWO = async (req, res, next) => {
  try {
    const woId = Number(req.params.id);
    const { technicianId } = req.body;

    if (!technicianId) {
      return res.status(400).json({ message: 'technicianId is required' });
    }

    const wo = await woService.assignWorkOrder(woId, technicianId, req.user.id);
    return res.json(wo);
  } catch (err) {
    if (err.message === 'Technician not found') {
      return res.status(404).json({ message: err.message });
    }
    if (err.message === 'Technician is blocked') {
      return res.status(400).json({ message: err.message });
    }
    next(err);
  }
};

export const respondWO = async (req, res, next) => {
  try {
    const woId = Number(req.params.id);
    const { action } = req.body;

    if (!action) {
      return res.status(400).json({ message: 'action is required (ACCEPT or DECLINE)' });
    }

    const wo = await woService.respondToWorkOrder(woId, req.user.id, action);
    return res.json(wo);
  } catch (err) {
    if (err.message === 'Work Order not found') {
      return res.status(404).json({ message: err.message });
    }
    if (err.message.includes('does not belong')) {
      return res.status(403).json({ message: err.message });
    }
    if (err.message.includes('status') || err.message.includes('action')) {
      return res.status(400).json({ message: err.message });
    }
    next(err);
  }
};

export const startWO = async (req, res, next) => {
  try {
    const woId = Number(req.params.id);
    const { lat, lng } = req.body;

    if (!lat || !lng) {
      return res.status(400).json({ message: 'lat and lng are required' });
    }

    const result = await woService.startWorkOrder(woId, req.user.id, { lat, lng });
    return res.json(result);
  } catch (err) {
    if (err.message === 'Work Order not found') {
      return res.status(404).json({ message: err.message });
    }
    if (err.message.includes('does not belong')) {
      return res.status(403).json({ message: err.message });
    }
    if (err.message.includes('status')) {
      return res.status(400).json({ message: err.message });
    }
    next(err);
  }
};

export const completeWO = async (req, res, next) => {
  try {
    const woId = Number(req.params.id);
    const wo = await woService.completeWorkOrder(woId, req.user.id, req.body, req.files);
    return res.json(wo);
  } catch (err) {
    if (err.message === 'Work Order not found') {
      return res.status(404).json({ message: err.message });
    }
    if (err.message.includes('does not belong')) {
      return res.status(403).json({ message: err.message });
    }
    if (err.message.includes('status') || err.message.includes('format')) {
      return res.status(400).json({ message: err.message });
    }
    next(err);
  }
};
