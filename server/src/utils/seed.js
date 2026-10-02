const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const bcrypt = require('bcryptjs');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const env = require('../config/env');
const User = require('../models/User');
const Event = require('../models/Event');
const Registration = require('../models/Registration');
const Payment = require('../models/Payment');
const { ROLES, EVENT_STATUS } = require('../constants');

const seedData = async () => {
  try {
    // Safety guard
    if (env.APP_ENV === 'production' && process.env.FORCE_SEED !== 'true') {
      console.error(`FATAL: Cannot run seed script in production unless FORCE_SEED=true is set.`);
      process.exit(1);
    }

    const mongoUri = env.MONGO_URI;
    if (!mongoUri) {
      console.error(`FATAL: MONGO_URI is required.`);
      process.exit(1);
    }
    
    console.log(`[Seed] Connecting to database: ${mongoUri}`);
    await mongoose.connect(mongoUri);

    console.log('[Seed] Clearing existing development collections...');
    await User.deleteMany({});
    await Event.deleteMany({});
    await Registration.deleteMany({});
    await Payment.deleteMany({});

    console.log('[Seed] Creating Admin & User accounts...');
    const adminEmail = env.ADMIN_EMAIL || 'admin@peak1.app';
    const adminRawPassword = process.env.SEED_ADMIN_PASSWORD;
    const userRawPassword = process.env.SEED_USER_PASSWORD;

    if (!adminRawPassword || !userRawPassword) {
      console.error(`FATAL: SEED_ADMIN_PASSWORD and SEED_USER_PASSWORD are required.`);
      process.exit(1);
    }

    const admin = await User.create({
      name: 'Peak1 Race Director',
      email: adminEmail,
      password: adminRawPassword,
      phone: '+91 98765 43210',
      role: ROLES.ADMIN
    });

    const user1 = await User.create({
      name: 'Alex Rivera',
      email: 'alex.rivera@example.com',
      password: userRawPassword,
      phone: '+91 91234 56789',
      role: ROLES.USER
    });

    const user2 = await User.create({
      name: 'Priya Sharma',
      email: 'priya.sharma@example.com',
      password: userRawPassword,
      phone: '+91 98989 89898',
      role: ROLES.USER
    });

    console.log('[Seed] Creating flagship events...');

    const events = [
      {
        title: 'Apex Night Drag Race 2026',
        slug: 'apex-night-drag-race-2026',
        category: 'Motorsport',
        shortDescription: 'High-octane quarter-mile drag racing under the stadium floodlights. Precision timing & adrenaline guaranteed.',
        fullDescription: 'Join the ultimate motorsport spectacle of the year! The Apex Night Drag Race brings together elite tuned cars and superbikes battling for top speed honors across a calibrated 400m drag strip. Sanctioned safety standards, automated tree lights, and instant digital timing.',
        organizer: {
          name: 'Apex Motorsport India',
          email: 'events@apexdrag.in',
          phone: '+91 94444 33333',
          logoUrl: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&q=80&w=200'
        },
        eventDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days later
        startTime: '18:00',
        endTime: '23:30',
        venue: 'Kari Motor Speedway',
        address: 'Chettipalayam, Coimbatore',
        city: 'Coimbatore',
        state: 'Tamil Nadu',
        country: 'India',
        mapUrl: 'https://maps.google.com',
        posterUrl: 'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&q=80&w=1200',
        bannerUrl: 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&q=80&w=1600',
        galleryUrls: [
          'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&q=80&w=800'
        ],
        isPaid: true,
        price: 2500,
        currency: 'INR',
        platformFee: 150,
        capacity: 150,
        availableSlots: 148,
        isUnlimitedCapacity: false,
        status: EVENT_STATUS.PUBLISHED,
        customFields: [
          { fieldId: 'vehicleModel', label: 'Vehicle Model & Specs', type: 'text', required: true, placeholder: 'e.g. BMW M3 G80 / Yamaha R1' },
          { fieldId: 'raceClass', label: 'Competition Class', type: 'select', required: true, options: ['Unrestricted Open', 'Stock Turbo 2.0L', 'Superbike 1000cc+'] },
          { fieldId: 'drivingLicenseNo', label: 'FMSCI / Driving License Number', type: 'text', required: true }
        ],
        raceConfig: {
          vehicleType: 'Car & Superbike',
          raceCategory: 'Quarter-Mile Drag',
          distance: '400 meters',
          trackName: 'Kari Motor Speedway Drag Strip',
          safetyRequirements: 'DOT Approved Full Face Helmet, Flame Resistant Suit, Roll Cage for cars under 10s',
          licenseRequired: true
        },
        rules: [
          'All vehicles must pass pre-race technical scrutineering at 16:00.',
          'Zero tolerance for alcohol or substance consumption.',
          'Decisions of the Race Control Marshal are final.'
        ],
        terms: [
          'Participants compete at their own risk and must sign the indemnity bond.',
          'Registration fees are non-refundable within 48 hours of race day.'
        ]
      },
      {
        title: 'Highland Midnight Ultra Marathon 2026',
        slug: 'highland-midnight-ultra-marathon-2026',
        category: 'Running',
        shortDescription: 'Conquer the misty mountain trails. 21K Half Marathon and 42K Full Ultra distance under moonlight.',
        fullDescription: 'Challenge your stamina on breathtaking elevation profiles! The Highland Midnight Ultra tests runners across scenic tea plantations and cool mountain crests. Includes hydration stations every 2.5K, timing chips, finisher medals, and hot recovery meals.',
        organizer: {
          name: 'Nilgiri Trail Runners Club',
          email: 'run@nilgiritrails.org',
          phone: '+91 97777 88888',
          logoUrl: 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?auto=format&fit=crop&q=80&w=200'
        },
        eventDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days later
        startTime: '04:30',
        endTime: '11:00',
        venue: 'Botanical Gardens Gate A',
        address: 'Ooty Hills Road',
        city: 'Ooty',
        state: 'Tamil Nadu',
        country: 'India',
        posterUrl: 'https://images.unsplash.com/photo-1452626038306-9aae5e071dd3?auto=format&fit=crop&q=80&w=1200',
        bannerUrl: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?auto=format&fit=crop&q=80&w=1600',
        isPaid: true,
        price: 1200,
        currency: 'INR',
        platformFee: 50,
        capacity: 500,
        availableSlots: 499,
        isUnlimitedCapacity: false,
        status: EVENT_STATUS.PUBLISHED,
        customFields: [
          { fieldId: 'runDistance', label: 'Choose Distance', type: 'select', required: true, options: ['21K Half Marathon', '42K Full Ultra'] },
          { fieldId: 'tShirtSize', label: 'Official Finisher Tee Size', type: 'select', required: true, options: ['S', 'M', 'L', 'XL', 'XXL'] },
          { fieldId: 'bloodGroup', label: 'Blood Group', type: 'text', required: true, placeholder: 'e.g. O+ve' }
        ],
        raceConfig: {
          vehicleType: 'Foot Race',
          raceCategory: 'Trail Ultra Marathon',
          distance: '21K / 42K',
          trackName: 'Nilgiri Hill Ridge Trail'
        },
        rules: [
          'Bib must be pinned securely to the front chest at all times.',
          'Littering on trail routes results in immediate disqualification.'
        ]
      },
      {
        title: 'Velocity City Criterium Cycling Grand Prix',
        slug: 'velocity-city-criterium-cycling-grand-prix',
        category: 'Cycling',
        shortDescription: 'Fast-paced closed-circuit road bike racing in the heart of the city.',
        fullDescription: 'Experience high-velocity cornering and tactical sprinting! 30 laps on a technical 1.5km asphalt circuit with sprint prime laps every 5th round.',
        organizer: {
          name: 'Velocity Cycling India',
          email: 'info@velocitycriterium.com',
          phone: '+91 93333 22222'
        },
        eventDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
        startTime: '06:00',
        endTime: '09:30',
        venue: 'Bandra-Kurla Complex Circuit',
        address: 'BKC Avenue',
        city: 'Mumbai',
        state: 'Maharashtra',
        country: 'India',
        posterUrl: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&q=80&w=1200',
        isPaid: false, // FREE EVENT
        price: 0,
        currency: 'INR',
        capacity: 200,
        availableSlots: 200,
        isUnlimitedCapacity: false,
        status: EVENT_STATUS.PUBLISHED,
        customFields: [
          { fieldId: 'bikeCategory', label: 'Bike Type', type: 'select', required: true, options: ['Road Bike (Drop Bars)', 'Fixed Gear / Track'] }
        ]
      }
    ];

    const createdEvents = await Event.insertMany(events);
    console.log(`[Seed] Successfully created ${createdEvents.length} events!`);

    console.log('[Seed] Creating demo registrations...');
    const reg1 = await Registration.create({
      registrationId: 'PEAK-2026-881920',
      eventId: createdEvents[0]._id,
      userId: user1._id,
      participantDetails: {
        fullName: user1.name,
        email: user1.email,
        phone: user1.phone,
        city: 'Coimbatore',
        emergencyContact: '+91 91234 99999',
        bloodGroup: 'B+ve',
        tShirtSize: 'L'
      },
      raceDetails: {
        vehicleModel: 'Porsche 911 GT3 RS',
        vehicleNumber: 'TN 38 PEAK 001',
        drivingLicense: 'DL-TN38-2022-999',
        teamName: 'Apex Racing Team'
      },
      status: 'CONFIRMED',
      qrCodeData: 'data:image/png;base64,mockqr'
    });

    console.log('[Seed] Seed script completed successfully!');
    console.log(`==================================================`);
    console.log(` Admin Email    : ${adminEmail}`);
    console.log(` User Email     : alex.rivera@example.com`);
    console.log(`==================================================`);

    await mongoose.disconnect();
  } catch (error) {
    console.error('[Seed Error]:', error);
    process.exit(1);
  }
};

seedData();
