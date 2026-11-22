import { describe, it, expect, beforeAll } from '@jest/globals';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { seedDatabase } from '../src/seeds/seed.js';

describe('CampusSlot REST API End-to-End Integration Tests', () => {
  let app;

  beforeAll(async () => {
    await seedDatabase();
    app = createApp();
  });

  it('GET /health - returns system health status', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('UP');
    expect(res.body.service).toBe('CampusSlot API');
  });

  it('GET /api/resources - returns list of campus facilities', async () => {
    const res = await request(app)
      .get('/api/resources')
      .set('x-user-id', 'demo-student-01')
      .set('x-user-role', 'STUDENT');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('GET /api/availability - retrieves 30-min slot calendar for a resource', async () => {
    const res = await request(app)
      .get('/api/availability?resourceId=res-lab-01&date=2026-11-25')
      .set('x-user-id', 'demo-student-01')
      .set('x-user-role', 'STUDENT');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.slots).toBeDefined();
    expect(res.body.data.slots.length).toBeGreaterThan(0);
  });

  it('POST /api/bookings - successfully creates a valid reservation', async () => {
    const res = await request(app)
      .post('/api/bookings')
      .set('x-user-id', 'demo-student-01')
      .set('x-user-role', 'STUDENT')
      .send({
        resourceId: 'res-study-02',
        date: '2026-11-25',
        startTime: '16:00',
        endTime: '17:30',
        purpose: 'Capstone Project Review',
        attendeesCount: 5,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('CONFIRMED');
    expect(res.body.data.slotKeys).toHaveLength(3); // 16:00, 16:30, 17:00
  });

  it('POST /api/allocate - successfully auto-allocates an optimal resource', async () => {
    const res = await request(app)
      .post('/api/allocate')
      .set('x-user-id', 'demo-student-01')
      .set('x-user-role', 'STUDENT')
      .send({
        category: 'STUDY_ROOM',
        capacity: 4,
        durationMinutes: 60,
        date: '2026-11-26',
        preferredTime: '10:00',
        purpose: 'Automated study allocation',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.allocated).toBe(true);
    expect(res.body.data.resource).toBeDefined();
  });

  it('GET /api/suggestions - returns intelligent alternatives when query provided', async () => {
    const res = await request(app)
      .get('/api/suggestions?resourceId=res-lab-01&date=2026-11-25&preferredTime=10:00&durationMinutes=60')
      .set('x-user-id', 'demo-student-01')
      .set('x-user-role', 'STUDENT');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('GET /api/admin/analytics - returns executive analytics for admin role', async () => {
    const res = await request(app)
      .get('/api/admin/analytics')
      .set('x-user-id', 'demo-admin-01')
      .set('x-user-role', 'ADMIN');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.totalBookings).toBeDefined();
    expect(res.body.data.peakHours).toBeDefined();
  });

  it('GET /api/admin/analytics - denies access for unauthorized student role', async () => {
    const res = await request(app)
      .get('/api/admin/analytics')
      .set('x-user-id', 'demo-student-01')
      .set('x-user-role', 'STUDENT');

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });
});
