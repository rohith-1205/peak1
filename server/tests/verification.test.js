const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../src/app');
const User = require('../src/models/User');
const Event = require('../src/models/Event');
const Registration = require('../src/models/Registration');
const CheckInLog = require('../src/models/CheckInLog');
const { generateSignedQrPayload } = require('../src/utils/qrPayload');
const sharp = require('sharp');

jest.setTimeout(300000);

let mongoServer;
let adminToken;
let userToken;
let adminUser;
let standardUser;
let testEvent;
let testEvent2;
let validRegistration;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);

  // Seed Admin User
  adminUser = await User.create({
    name: 'Test Admin',
    email: 'admin@test.com',
    password: 'AdminPassword123!',
    role: 'ADMIN'
  });

  // Seed Standard User
  standardUser = await User.create({
    name: 'Test Participant',
    email: 'user@test.com',
    password: 'UserPassword123!',
    role: 'USER',
    phone: '+91 98765 43210',
    profile: {
      dob: new Date('1995-05-15'),
      gender: 'Male',
      city: 'Coimbatore',
      emergencyContactName: 'Jane Doe',
      emergencyContactPhone: '+91 98765 43211'
    }
  });

  // Log in Admin to get Admin Token (scope: admin)
  const adminLoginRes = await request(app)
    .post('/api/v1/auth/admin/login')
    .send({ email: 'admin@test.com', password: 'AdminPassword123!' });

  adminToken = adminLoginRes.body.data.token;

  // Log in User to get Standard User Token (scope: user)
  const userLoginRes = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: 'user@test.com', password: 'UserPassword123!' });

  userToken = userLoginRes.body.data.token;

  // Create Test Event 1 (Motorsport with minAge=18 and custom questions)
  testEvent = await Event.create({
    title: 'Speedway Championship 2026',
    slug: 'speedway-championship-2026',
    category: 'Motorsport',
    shortDescription: 'Championship Drag Race',
    fullDescription: 'Full Championship Description',
    venue: 'Kari Motor Speedway',
    address: '123 Speedway',
    city: 'Coimbatore',
    state: 'Tamil Nadu',
    organizer: { name: 'Kari', email: 'kari@example.com' },
    eventDate: new Date('2026-10-15'),
    startTime: '09:00',
    endTime: '18:00',
    isPaid: true,
    price: 1500,
    capacity: 100,
    availableSlots: 100,
    status: 'PUBLISHED',
    registrationConfig: {
      requiredProfileFields: ['fullName', 'email', 'phone', 'dob', 'emergencyContactName'],
      raceFieldsConfig: {
        vehicleModel: 'REQUIRED',
        vehicleNumber: 'REQUIRED',
        drivingLicense: 'OPTIONAL'
      },
      minAge: 18,
      customQuestions: [
        {
          fieldId: 'transponder_id',
          label: 'Timing Transponder ID',
          type: 'text',
          required: true
        }
      ]
    }
  });

  // Create Test Event 2
  testEvent2 = await Event.create({
    title: 'City Marathon 2026',
    slug: 'city-marathon-2026',
    category: 'Running',
    shortDescription: '10K City Run',
    fullDescription: 'City Run Description',
    venue: 'Nehru Stadium',
    address: '456 Stadium',
    city: 'Coimbatore',
    state: 'Tamil Nadu',
    organizer: { name: 'City', email: 'city@example.com' },
    eventDate: new Date('2026-11-01'),
    isPaid: false,
    capacity: 500,
    availableSlots: 500,
    status: 'PUBLISHED'
  });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('1. ADMIN AUTHENTICATION & SECURITY GUARDS', () => {
  it('1.1 Admin Login Success with scope:admin', async () => {
    const res = await request(app)
      .post('/api/v1/auth/admin/login')
      .send({ email: 'admin@test.com', password: 'AdminPassword123!' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.role).toBe('ADMIN');
  });

  it('1.2 Admin Login with Wrong Password fails', async () => {
    const res = await request(app)
      .post('/api/v1/auth/admin/login')
      .send({ email: 'admin@test.com', password: 'WrongPassword!' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('1.3 Standard USER Account trying Admin Login endpoint fails', async () => {
    const res = await request(app)
      .post('/api/v1/auth/admin/login')
      .send({ email: 'user@test.com', password: 'UserPassword123!' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('1.4 Standard USER Token calling Admin API returns 403 Forbidden', async () => {
    const res = await request(app)
      .get('/api/v1/admin/stats')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(403);
    expect(res.body.errorCode).toBe('INVALID_ADMIN_SCOPE');
  });
});

describe('2. REGISTRATION ENGINE & DYNAMIC VALIDATION', () => {
  it('2.1 Rejects registration missing required custom question', async () => {
    const res = await request(app)
      .post(`/api/v1/registrations/event/${testEvent._id}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        participantDetails: {
          fullName: 'Test Participant',
          email: 'user@test.com',
          phone: '+91 98765 43210',
          dob: '1995-05-15',
          emergencyContactName: 'Jane Doe'
        },
        raceDetails: {
          vehicleModel: 'Yamaha R3',
          vehicleNumber: 'TN 37 AB 1234'
        },
        customResponses: {} // missing transponder_id
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('2.2 Rejects registration under minimum age restriction', async () => {
    // Create an underage user
    const underageUser = await User.create({
      name: 'Junior Racer',
      email: 'junior@test.com',
      password: 'Password123!',
      role: 'USER',
      phone: '+91 98765 00000',
      profile: { dob: new Date('2015-01-01') } // 11 years old
    });

    const juniorTokenRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'junior@test.com', password: 'Password123!' });

    const res = await request(app)
      .post(`/api/v1/registrations/event/${testEvent._id}`)
      .set('Authorization', `Bearer ${juniorTokenRes.body.data.token}`)
      .send({
        participantDetails: {
          fullName: 'Junior Racer',
          email: 'junior@test.com',
          phone: '+91 98765 00000',
          dob: '2015-01-01',
          emergencyContactName: 'Parent'
        },
        raceDetails: {
          vehicleModel: 'Yamaha R3',
          vehicleNumber: 'TN 37 AB 9999'
        },
        customResponses: { transponder_id: 'TR-101' }
      });

    expect(res.status).toBe(400);
    expect(res.body.errorCode).toBe('VALIDATION_ERROR');
  });

  it('2.3 Valid Registration Creation & Payment Pending Retry', async () => {
    // Create valid registration
    const res = await request(app)
      .post(`/api/v1/registrations/event/${testEvent._id}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        participantDetails: {
          fullName: 'Test Participant',
          email: 'user@test.com',
          phone: '+91 98765 43210',
          dob: '1995-05-15',
          emergencyContactName: 'Jane Doe'
        },
        raceDetails: {
          vehicleModel: 'Yamaha R3',
          vehicleNumber: 'TN 37 AB 1234'
        },
        customResponses: { transponder_id: 'TR-999' }
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    validRegistration = res.body.data.registration;
    expect(validRegistration.status).toBe('PAYMENT_PENDING');

    // Attempting registration again while PAYMENT_PENDING should REUSE existing registration
    const retryRes = await request(app)
      .post(`/api/v1/registrations/event/${testEvent._id}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        participantDetails: {
          fullName: 'Test Participant Updated',
          email: 'user@test.com',
          phone: '+91 98765 43210',
          dob: '1995-05-15',
          emergencyContactName: 'Jane Doe'
        }
      });

    expect(retryRes.status).toBe(201);
    expect(retryRes.body.data.isPendingRetry).toBe(true);
    expect(retryRes.body.data.registration._id).toBe(validRegistration._id);
  });
});

describe('3. GATE QR CHECK-IN & CONCURRENCY ENGINE', () => {
  beforeEach(async () => {
    // Confirm registration for gate check-in test
    await Registration.findByIdAndUpdate(validRegistration._id, { status: 'CONFIRMED' });
  });

  it('3.1 Successful Check-in returns GRANTED', async () => {
    const signedPayload = generateSignedQrPayload(validRegistration.registrationId, testEvent._id.toString());

    const res = await request(app)
      .post('/api/v1/registrations/admin/check-in')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        scannedCode: signedPayload,
        targetEventId: testEvent._id.toString(),
        method: 'QR'
      });

    expect(res.status).toBe(200);
    expect(res.body.data.result).toBe('GRANTED');
  });

  it('3.2 Subsequent check-in returns ALREADY_CHECKED_IN (409)', async () => {
    const signedPayload = generateSignedQrPayload(validRegistration.registrationId, testEvent._id.toString());

    const res = await request(app)
      .post('/api/v1/registrations/admin/check-in')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        scannedCode: signedPayload,
        targetEventId: testEvent._id.toString(),
        method: 'QR'
      });

    expect(res.status).toBe(409);
    expect(res.body.data.result).toBe('ALREADY_CHECKED_IN');
  });

  it('3.3 Wrong Event Pass returns WRONG_EVENT', async () => {
    const signedPayload = generateSignedQrPayload(validRegistration.registrationId, testEvent._id.toString());

    const res = await request(app)
      .post('/api/v1/registrations/admin/check-in')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        scannedCode: signedPayload,
        targetEventId: testEvent2._id.toString(), // wrong event gate
        method: 'QR'
      });

    expect(res.status).toBe(400);
    expect(res.body.data.result).toBe('WRONG_EVENT');
  });

  it('3.4 Tampered QR Signature returns INVALID_SIGNATURE', async () => {
    const signedPayload = generateSignedQrPayload(validRegistration.registrationId, testEvent._id.toString());
    const tampered = signedPayload.slice(0, -4) + 'ffff';

    const res = await request(app)
      .post('/api/v1/registrations/admin/check-in')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        scannedCode: tampered,
        targetEventId: testEvent._id.toString(),
        method: 'QR'
      });

    expect(res.status).toBe(400);
    expect(res.body.data.result).toBe('INVALID_SIGNATURE');
  });

  it('3.5 Non-existent Pass returns PASS_NOT_FOUND', async () => {
    const res = await request(app)
      .post('/api/v1/registrations/admin/check-in')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        scannedCode: 'PEAK-2026-000000',
        targetEventId: testEvent._id.toString(),
        method: 'MANUAL'
      });

    expect(res.status).toBe(400);
    expect(res.body.data.result).toBe('PASS_NOT_FOUND');
  });

  it('3.6 Concurrent Check-ins: Exactly 1 GRANTED and 1 ALREADY_CHECKED_IN', async () => {
    // Reset registration to CONFIRMED
    await Registration.findByIdAndUpdate(validRegistration._id, {
      status: 'CONFIRMED',
      'checkInDetails.isCheckedIn': false
    });

    const signedPayload = generateSignedQrPayload(validRegistration.registrationId, testEvent._id.toString());

    const [res1, res2] = await Promise.all([
      request(app)
        .post('/api/v1/registrations/admin/check-in')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ scannedCode: signedPayload, targetEventId: testEvent._id.toString() }),
      request(app)
        .post('/api/v1/registrations/admin/check-in')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ scannedCode: signedPayload, targetEventId: testEvent._id.toString() })
    ]);

    const results = [res1.body.data.result, res2.body.data.result];
    expect(results).toContain('GRANTED');
    expect(results).toContain('ALREADY_CHECKED_IN');
  });

  it('3.7 Undo Check-in reverts status to CONFIRMED', async () => {
    const res = await request(app)
      .post('/api/v1/registrations/admin/check-in/undo')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        registrationId: validRegistration.registrationId,
        reason: 'Testing undo API'
      });

    expect(res.status).toBe(200);
    expect(res.body.data.registration.status).toBe('CONFIRMED');
    expect(res.body.data.registration.checkInDetails.isCheckedIn).toBe(false);
  });
});

describe('4. IMAGE UPLOAD VALIDATION & OPTIMIZATION', () => {
  it('4.1 Rejects renamed non-image text file disguised as PNG', async () => {
    const textBuffer = Buffer.from('Hello world this is not a PNG image', 'utf8');

    const res = await request(app)
      .post('/api/v1/uploads/event-image')
      .set('Authorization', `Bearer ${adminToken}`)
      .attach('image', textBuffer, 'fake.png');

    expect(res.status).toBe(400);
    expect(res.body.errorCode).toBe('INVALID_IMAGE_FORMAT');
  });

  it('4.2 Rejects poster image with dimensions smaller than 800x1000px', async () => {
    // Generate a tiny 100x100 PNG using Sharp
    const tinyPngBuffer = await sharp({
      create: {
        width: 100,
        height: 100,
        channels: 4,
        background: { r: 255, g: 0, b: 0, alpha: 1 }
      }
    })
      .png()
      .toBuffer();

    const res = await request(app)
      .post('/api/v1/uploads/event-image')
      .set('Authorization', `Bearer ${adminToken}`)
      .field('kind', 'poster')
      .attach('image', tinyPngBuffer, 'tiny.png');

    expect(res.status).toBe(400);
    expect(res.body.errorCode).toBe('DIMENSIONS_TOO_SMALL');
  });
});
