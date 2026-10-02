const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../src/app');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Peak1 REST API Integration Tests', () => {
  it('GET /api/v1/health - should return status OK', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.statusCode).toEqual(200);
    expect(res.body.status).toEqual('OK');
    expect(res.body.platform).toEqual('Peak1 Event Platform');
  });

  it('GET /api/v1/events - should list published events without auth', async () => {
    const res = await request(app).get('/api/v1/events');
    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.events)).toBe(true);
  });

  it('POST /api/v1/auth/register - should reject invalid registration input', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'invalid-email',
        password: '123'
      });
    expect(res.statusCode).toEqual(400);
    expect(res.body.success).toBe(false);
    expect(res.body.errorCode).toEqual('VALIDATION_ERROR');
  });
});
