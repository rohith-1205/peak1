/**
 * Database Migration Script for Feature 4 & Feature 3 Schema Extensions & Unique Index Cleaning
 * 
 * Supports dry-run mode by default. Run with --apply flag to execute changes:
 * node src/migrations/runner.js --apply
 */

const User = require('../models/User');
const Event = require('../models/Event');
const Registration = require('../models/Registration');

const STATUS_PRIORITY = {
  CHECKED_IN: 5,
  CONFIRMED: 4,
  PAYMENT_PENDING: 3,
  CANCELLED: 2,
  PAYMENT_FAILED: 1
};

const runMigration = async (isApply = false) => {
  console.log(`[Migration] Starting Schema Migration (${isApply ? 'MODE: APPLY CHANGES' : 'MODE: DRY-RUN ONLY (pass --apply to execute)'})...`);

  // 1. Migrate Users
  const users = await User.find({ profile: { $exists: false } });
  console.log(`[Migration] Found ${users.length} users needing profile initialization.`);
  if (isApply && users.length > 0) {
    for (const user of users) {
      user.profile = {
        dob: null,
        gender: null,
        city: '',
        state: '',
        emergencyContactName: '',
        emergencyContactPhone: '',
        bloodGroup: null,
        tShirtSize: null
      };
      await user.save();
    }
    console.log(`[Migration] Initialized ${users.length} user profiles.`);
  }

  // 2. Migrate Events (poster/banner object transformation & registrationConfig initialization)
  const events = await Event.find({});
  console.log(`[Migration] Processing ${events.length} events for image objects & registrationConfig...`);
  let eventUpdates = 0;
  for (const event of events) {
    let updated = false;

    if (event.posterUrl && (!event.poster || !event.poster.url)) {
      if (isApply) event.poster = { url: event.posterUrl };
      updated = true;
    }
    if (event.bannerUrl && (!event.banner || !event.banner.url)) {
      if (isApply) event.banner = { url: event.bannerUrl };
      updated = true;
    }

    if (!event.registrationConfig || !event.registrationConfig.requiredProfileFields) {
      const requiredFields = ['fullName', 'email', 'phone', 'emergencyContactName', 'emergencyContactPhone'];
      
      if (event.category === 'Motorsport') {
        requiredFields.push('dob', 'bloodGroup');
      } else if (event.category === 'Running' || event.category === 'Marathon') {
        requiredFields.push('bloodGroup', 'tShirtSize', 'dob');
      }

      const isMotor = event.category === 'Motorsport';
      if (isApply) {
        event.registrationConfig = {
          requiredProfileFields: requiredFields,
          raceFieldsConfig: {
            vehicleModel: isMotor ? 'REQUIRED' : 'HIDDEN',
            vehicleNumber: isMotor ? 'REQUIRED' : 'HIDDEN',
            drivingLicense: isMotor ? 'REQUIRED' : 'HIDDEN',
            teamName: 'OPTIONAL',
            categoryClass: 'OPTIONAL'
          },
          minAge: isMotor ? 18 : 0,
          customQuestions: (event.customFields || []).map((cf, idx) => ({
            fieldId: cf.fieldId || `custom_${idx}`,
            label: cf.label,
            type: cf.type || 'text',
            required: !!cf.required,
            options: cf.options || [],
            placeholder: cf.placeholder || ''
          }))
        };
      }
      updated = true;
    }

    if (updated) {
      eventUpdates++;
      if (isApply) await event.save();
    }
  }
  console.log(`[Migration] ${eventUpdates} events updated for image objects & configuration.`);

  // 3. Migrate Registrations (populate participantSnapshot)
  const registrations = await Registration.find({ participantSnapshot: { $exists: false } });
  console.log(`[Migration] Found ${registrations.length} registrations needing participantSnapshot.`);
  if (isApply && registrations.length > 0) {
    for (const reg of registrations) {
      if (reg.participantDetails) {
        reg.participantSnapshot = {
          fullName: reg.participantDetails.fullName,
          email: reg.participantDetails.email,
          phone: reg.participantDetails.phone,
          dob: reg.participantDetails.dob,
          gender: reg.participantDetails.gender,
          city: reg.participantDetails.city,
          state: reg.participantDetails.state || '',
          emergencyContactName: reg.participantDetails.emergencyContact || '',
          emergencyContactPhone: '',
          bloodGroup: reg.participantDetails.bloodGroup,
          tShirtSize: reg.participantDetails.tShirtSize,
          snapshotAt: reg.createdAt || new Date()
        };
        await reg.save();
      }
    }
  }

  // 4. Duplicate Registration Inspection & Unique Index Safeguard
  console.log('[Migration] Inspecting database for duplicate registrations per { eventId, userId }...');
  const duplicates = await Registration.aggregate([
    {
      $group: {
        _id: { eventId: '$eventId', userId: '$userId' },
        count: { $sum: 1 },
        docs: { $push: { id: '$_id', registrationId: '$registrationId', status: '$status', paymentId: '$paymentId' } }
      }
    },
    { $match: { count: { $gt: 1 } } }
  ]);

  if (duplicates.length > 0) {
    console.warn(`[Migration Warning] Found ${duplicates.length} duplicate registration groups.`);
    for (const group of duplicates) {
      const sortedDocs = [...group.docs].sort(
        (a, b) => (STATUS_PRIORITY[b.status] || 0) - (STATUS_PRIORITY[a.status] || 0)
      );

      const keeper = sortedDocs[0];
      const toRemove = sortedDocs.slice(1);

      console.log(`[Migration] Group eventId=${group._id.eventId} userId=${group._id.userId}: Keeping ${keeper.registrationId} (${keeper.status})`);

      for (const item of toRemove) {
        if (item.paymentId || item.status === 'CONFIRMED' || item.status === 'CHECKED_IN') {
          console.warn(`[Migration CAUTION] Duplicate registration ${item.registrationId} has paid status (${item.status}). Preserving record!`);
        } else {
          console.log(`[Migration] Duplicate registration ${item.registrationId} (${item.status}) marked for removal.`);
          if (isApply) {
            await Registration.findByIdAndDelete(item.id);
          }
        }
      }
    }
  } else {
    console.log('[Migration] Zero duplicate registrations found. Safe for unique index creation.');
  }

  if (isApply) {
    try {
      await Registration.collection.createIndex({ eventId: 1, userId: 1 }, { unique: true });
      console.log('[Migration] Created unique compound index on Registration { eventId: 1, userId: 1 }.');
    } catch (err) {
      console.warn('[Migration Notice] Index creation status:', err.message);
    }
  } else {
    console.log('[Migration DRY-RUN] Skipping index creation in dry-run mode. Run with --apply flag to apply index.');
  }

  console.log(`[Migration] Migration execution finished (${isApply ? 'APPLIED' : 'DRY-RUN'}).`);
};

module.exports = runMigration;
