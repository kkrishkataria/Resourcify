import { describe, it, expect, beforeAll } from '@jest/globals';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { seedDatabase } from '../src/seeds/seed.js';

describe('Resourcify (Thapar TIET) REST API End-to-End Integration Tests', () => {
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

  it('POST /api/auth/login - successfully authenticates registered Thapar student', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'student@thapar.edu',
        password: 'Thapar@2026',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.email).toBe('student@thapar.edu');
    expect(res.body.data.user.role).toBe('STUDENT');
  });

  it('POST /api/auth/login - successfully authenticates using student Roll Number (102203456)', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        identifier: '102203456',
        password: 'Thapar@2026',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.rollNumber).toBe('102203456');
    expect(res.body.data.user.role).toBe('STUDENT');
  });

  it('POST /api/auth/login - successfully authenticates Professor using Employee ID (TIET-FAC-1042)', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        identifier: 'TIET-FAC-1042',
        password: 'Thapar@2026',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.name).toBe('Dr. Rajesh K. Bawa');
    expect(res.body.data.user.role).toBe('FACULTY');
  });

  it('POST /api/auth/login - successfully authenticates Admin using Staff ID (TIET-EST-001)', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        identifier: 'TIET-EST-001',
        password: 'Thapar@2026',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.role).toBe('ADMIN');
  });

  it('POST /api/auth/register - successfully registers a new Thapar student', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Simran Kaur',
        email: 'simran.kaur@thapar.edu',
        password: 'Password123!',
        role: 'STUDENT',
        department: 'Computer Science & Engineering (CSED)',
        rollNumber: '102103789',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.email).toBe('simran.kaur@thapar.edu');
  });

  it('GET /api/resources - returns list of Thapar campus facilities', async () => {
    const res = await request(app)
      .get('/api/resources')
      .set('x-user-id', 'tiet-std-01')
      .set('x-user-role', 'STUDENT');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('GET /api/availability - retrieves 30-min slot calendar for a Thapar resource', async () => {
    const res = await request(app)
      .get('/api/availability?resourceId=res-tiet-lab-01&date=2026-11-25')
      .set('x-user-id', 'tiet-std-01')
      .set('x-user-role', 'STUDENT');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.slots).toBeDefined();
    expect(res.body.data.slots.length).toBeGreaterThan(0);
  });

  it('POST /api/bookings - successfully creates a valid reservation', async () => {
    const res = await request(app)
      .post('/api/bookings')
      .set('x-user-id', 'tiet-std-01')
      .set('x-user-role', 'STUDENT')
      .send({
        resourceId: 'res-tiet-study-02',
        date: '2026-11-25',
        startTime: '16:00',
        endTime: '17:30',
        purpose: 'Capstone Project Review at Central Library',
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
      .set('x-user-id', 'tiet-std-01')
      .set('x-user-role', 'STUDENT')
      .send({
        category: 'STUDY_ROOM',
        capacity: 4,
        durationMinutes: 60,
        date: '2026-11-26',
        preferredTime: '10:00',
        purpose: 'Automated study allocation in NNCL',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.allocated).toBe(true);
    expect(res.body.data.resource).toBeDefined();
  });

  it('GET /api/suggestions - returns intelligent alternatives when query provided', async () => {
    const res = await request(app)
      .get('/api/suggestions?resourceId=res-tiet-lab-01&date=2026-11-25&preferredTime=10:00&durationMinutes=60')
      .set('x-user-id', 'tiet-std-01')
      .set('x-user-role', 'STUDENT');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('GET /api/admin/analytics - returns executive analytics for admin role', async () => {
    const res = await request(app)
      .get('/api/admin/analytics')
      .set('x-user-id', 'tiet-adm-01')
      .set('x-user-role', 'ADMIN');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.totalBookings).toBeDefined();
    expect(res.body.data.peakHours).toBeDefined();
  });

  it('GET /api/admin/analytics - denies access for unauthorized student role', async () => {
    const res = await request(app)
      .get('/api/admin/analytics')
      .set('x-user-id', 'tiet-std-01')
      .set('x-user-role', 'STUDENT');

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });
});
