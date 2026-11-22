import { resourceService } from '../services/resourceService.js';

export class ResourceController {
  async getAll(req, res, next) {
    try {
      const { category, minCapacity, status, equipment } = req.query;
      const filters = {};
      if (category) filters.category = category;
      if (minCapacity) filters.minCapacity = Number(minCapacity);
      if (status) filters.status = status;
      if (equipment) filters.equipment = Array.isArray(equipment) ? equipment : [equipment];

      const resources = await resourceService.getAllResources(filters);
      res.json({ success: true, count: resources.length, data: resources });
    } catch (err) {
      next(err);
    }
  }

  async getById(req, res, next) {
    try {
      const resource = await resourceService.getResourceById(req.params.id);
      res.json({ success: true, data: resource });
    } catch (err) {
      next(err);
    }
  }

  async create(req, res, next) {
    try {
      const { name, category, building, floor, roomNumber, capacity, equipment, status, operatingHours, minBookingDuration, maxBookingDuration, description, imageUrl } = req.body;
      if (!name || !category || !building || !capacity) {
        return res.status(400).json({ success: false, error: 'name, category, building, and capacity are required' });
      }

      const created = await resourceService.createResource({
        name,
        category,
        building,
        floor,
        roomNumber: roomNumber || '101',
        capacity,
        equipment,
        status,
        operatingHours,
        minBookingDuration,
        maxBookingDuration,
        description,
        imageUrl,
      });

      res.status(201).json({ success: true, data: created });
    } catch (err) {
      next(err);
    }
  }

  async update(req, res, next) {
    try {
      const updated = await resourceService.updateResource(req.params.id, req.body);
      res.json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  }

  async delete(req, res, next) {
    try {
      await resourceService.deleteResource(req.params.id);
      res.json({ success: true, message: 'Resource deleted successfully' });
    } catch (err) {
      next(err);
    }
  }

  async getAvailability(req, res, next) {
    try {
      const resourceId = req.query.resourceId || req.params.id;
      const date = req.query.date || new Date().toISOString().split('T')[0];

      if (!resourceId) {
        return res.status(400).json({ success: false, error: 'resourceId query parameter is required' });
      }

      const availability = await resourceService.getAvailability(resourceId, date);
      res.json({ success: true, data: availability });
    } catch (err) {
      next(err);
    }
  }
}

export const resourceController = new ResourceController();
