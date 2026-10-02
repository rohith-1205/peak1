const QRCode = require('qrcode');
const Event = require('../models/Event');
const Registration = require('../models/Registration');
const AuditLog = require('../models/AuditLog');
const CheckInLog = require('../models/CheckInLog');
const User = require('../models/User');
const { REGISTRATION_STATUS, EVENT_STATUS } = require('../constants');
const { generateSignedQrPayload, generateQrDataUrl, verifyQrPayload } = require('../utils/qrPayload');
const { buildRegistrationSchema } = require('../validators');

const generateRegistrationId = () => {
  const year = new Date().getFullYear();
  const randomNum = Math.floor(100000 + Math.random() * 900000);
  return `PEAK-${year}-${randomNum}`;
};

const calculateAge = (dobDate) => {
  if (!dobDate) return 0;
  const today = new Date();
  const birthDate = new Date(dobDate);
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

const initiateRegistration = async (eventId, userId, registrationData) => {
  const event = await Event.findById(eventId);
  if (!event) {
    const error = new Error('Event not found');
    error.statusCode = 404;
    error.errorCode = 'EVENT_NOT_FOUND';
    throw error;
  }

  if (event.status !== EVENT_STATUS.PUBLISHED) {
    const error = new Error('Registrations are not open for this event');
    error.statusCode = 400;
    error.errorCode = 'REGISTRATION_CLOSED';
    throw error;
  }

  // Check Registration Closing Date
  if (event.registrationCloseDate && new Date() > new Date(event.registrationCloseDate)) {
    const error = new Error('Registration period has closed for this event');
    error.statusCode = 400;
    error.errorCode = 'REGISTRATION_EXPIRED';
    throw error;
  }

  const user = await User.findById(userId);
  if (!user) {
    const error = new Error('User account not found');
    error.statusCode = 404;
    error.errorCode = 'USER_NOT_FOUND';
    throw error;
  }

  // 1. Dynamic Server-Side Zod Schema Validation
  const schema = buildRegistrationSchema(event.registrationConfig || {});
  const parseResult = schema.safeParse(registrationData);
  if (!parseResult.success) {
    const issues = parseResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
    const isMissingProfile = parseResult.error.errors.some(e => e.path.includes('participantDetails') || e.path.includes('dob'));
    const error = new Error(issues.join('; '));
    error.statusCode = 400;
    error.errorCode = isMissingProfile ? 'MISSING_PROFILE_FIELDS' : 'VALIDATION_ERROR';
    error.errors = issues;
    throw error;
  }

  // 2. Profile Field Completeness Check via User helper
  const requiredProfileFields = event.registrationConfig?.requiredProfileFields || [];
  if (requiredProfileFields.length > 0) {
    const missingFields = user.getMissingProfileFields(requiredProfileFields);
    const unprovided = missingFields.filter((field) => {
      if (field === 'fullName' && registrationData.participantDetails?.fullName) return false;
      if (field === 'email' && registrationData.participantDetails?.email) return false;
      if (field === 'phone' && registrationData.participantDetails?.phone) return false;
      if (field === 'emergencyContactName' && (registrationData.participantDetails?.emergencyContact || registrationData.participantDetails?.emergencyContactName)) return false;
      if (registrationData.participantDetails?.[field]) return false;
      return true;
    });

    if (unprovided.length > 0) {
      const error = new Error(`Missing required profile details: ${unprovided.join(', ')}`);
      error.statusCode = 400;
      error.errorCode = 'MISSING_PROFILE_FIELDS';
      error.missingFields = unprovided;
      throw error;
    }
  }

  // 3. Registration Status Check: Handle Pending Retries & Cancelled Re-registrations
  const participantEmail = (registrationData.participantDetails?.email || user.email).toLowerCase();
  const existingRegistration = await Registration.findOne({
    eventId,
    $or: [
      { userId },
      { 'participantDetails.email': participantEmail }
    ]
  });

  if (existingRegistration) {
    // If CONFIRMED or CHECKED_IN -> Return friendly "Already registered" 409 Error
    if (existingRegistration.status === REGISTRATION_STATUS.CONFIRMED || existingRegistration.status === REGISTRATION_STATUS.CHECKED_IN) {
      const error = new Error('You or this email address is already registered and confirmed for this event');
      error.statusCode = 409;
      error.errorCode = 'DUPLICATE_REGISTRATION';
      throw error;
    }

    // If PAYMENT_PENDING -> Reuse existing registration for payment retry!
    if (existingRegistration.status === REGISTRATION_STATUS.PAYMENT_PENDING) {
      // Update participant details / custom responses if provided
      if (registrationData.participantDetails) {
        existingRegistration.participantDetails = {
          ...existingRegistration.participantDetails,
          ...registrationData.participantDetails
        };
      }
      if (registrationData.customResponses) {
        existingRegistration.customResponses = registrationData.customResponses;
      }
      if (registrationData.raceDetails) {
        existingRegistration.raceDetails = registrationData.raceDetails;
      }
      await existingRegistration.save();

      return {
        registration: existingRegistration,
        event,
        requiresPayment: event.isPaid,
        isPendingRetry: true
      };
    }

    // If CANCELLED or PAYMENT_FAILED -> Delete old record so user can create fresh registration
    if (existingRegistration.status === REGISTRATION_STATUS.CANCELLED || existingRegistration.status === REGISTRATION_STATUS.PAYMENT_FAILED) {
      await Registration.findByIdAndDelete(existingRegistration._id);
    }
  }

  // 4. Capacity Check & Slot Reservation
  if (!event.isUnlimitedCapacity) {
    if (event.availableSlots <= 0) {
      const error = new Error('Event capacity is full');
      error.statusCode = 400;
      error.errorCode = 'CAPACITY_FULL';
      throw error;
    }
    event.availableSlots -= 1;
    await event.save();
  }

  const registrationId = generateRegistrationId();
  const initialStatus = event.isPaid ? REGISTRATION_STATUS.PAYMENT_PENDING : REGISTRATION_STATUS.CONFIRMED;

  // Build Signed QR Code Payload
  let qrCodeData = '';
  try {
    qrCodeData = await generateQrDataUrl(registrationId, event._id.toString());
  } catch (err) {
    console.error('QR code generation warning:', err.message);
  }

  // Merge participant snapshot from user account & profile
  const details = registrationData.participantDetails || {};
  const userProf = user.profile || {};

  const participantSnapshot = {
    fullName: details.fullName || user.name,
    email: details.email || user.email,
    phone: details.phone || user.phone || '',
    dob: details.dob || userProf.dob || null,
    gender: details.gender || userProf.gender || '',
    city: details.city || userProf.city || '',
    state: details.state || userProf.state || '',
    emergencyContactName: details.emergencyContactName || details.emergencyContact || userProf.emergencyContactName || '',
    emergencyContactPhone: details.emergencyContactPhone || userProf.emergencyContactPhone || '',
    bloodGroup: details.bloodGroup || userProf.bloodGroup || '',
    tShirtSize: details.tShirtSize || userProf.tShirtSize || '',
    snapshotAt: new Date()
  };

  const registration = await Registration.create({
    registrationId,
    eventId: event._id,
    userId,
    participantDetails: {
      fullName: participantSnapshot.fullName,
      email: participantSnapshot.email,
      phone: participantSnapshot.phone,
      dob: participantSnapshot.dob,
      gender: participantSnapshot.gender,
      city: participantSnapshot.city,
      emergencyContact: participantSnapshot.emergencyContactName,
      bloodGroup: participantSnapshot.bloodGroup,
      tShirtSize: participantSnapshot.tShirtSize
    },
    participantSnapshot,
    customResponses: registrationData.customResponses || {},
    raceDetails: registrationData.raceDetails || {},
    status: initialStatus,
    qrCodeData
  });

  // Automatically update user profile if requested
  if (registrationData.saveToProfile) {
    const newProfile = { ...user.profile, profileCompletedAt: new Date() };

    if (participantSnapshot.dob) newProfile.dob = participantSnapshot.dob;
    if (participantSnapshot.gender) newProfile.gender = participantSnapshot.gender;
    if (participantSnapshot.city) newProfile.city = participantSnapshot.city;
    if (participantSnapshot.state) newProfile.state = participantSnapshot.state;
    if (participantSnapshot.emergencyContactName) newProfile.emergencyContactName = participantSnapshot.emergencyContactName;
    if (participantSnapshot.emergencyContactPhone) newProfile.emergencyContactPhone = participantSnapshot.emergencyContactPhone;
    if (participantSnapshot.bloodGroup) newProfile.bloodGroup = participantSnapshot.bloodGroup;
    if (participantSnapshot.tShirtSize) newProfile.tShirtSize = participantSnapshot.tShirtSize;

    user.profile = newProfile;
    if (participantSnapshot.phone) user.phone = participantSnapshot.phone;
    await user.save();
  }

  if (initialStatus === REGISTRATION_STATUS.CONFIRMED) {
    try {
      const { sendRegistrationEmail } = require('./emailService');
      await sendRegistrationEmail(registration, event);
    } catch (err) {
      console.error('Failed to send free registration email:', err);
    }
  }

  return {
    registration,
    event,
    requiresPayment: event.isPaid
  };
};

const getUserRegistrations = async (userId) => {
  const registrations = await Registration.find({ userId })
    .populate('eventId')
    .populate('paymentId')
    .sort({ createdAt: -1 });

  // Attach signed QR payload dynamically for ticket pass display
  return Promise.all(
    registrations.map(async (reg) => {
      const regObj = reg.toObject();
      if (reg.eventId && reg.registrationId) {
        regObj.signedQrPayload = generateSignedQrPayload(reg.registrationId, reg.eventId._id.toString());
        if (!regObj.qrCodeData) {
          try {
            regObj.qrCodeData = await generateQrDataUrl(reg.registrationId, reg.eventId._id.toString());
          } catch (e) {}
        }
      }
      return regObj;
    })
  );
};

const getRegistrationById = async (id) => {
  const reg = await Registration.findById(id).populate('eventId').populate('paymentId');
  if (!reg) {
    const error = new Error('Registration record not found');
    error.statusCode = 404;
    error.errorCode = 'REGISTRATION_NOT_FOUND';
    throw error;
  }
  const regObj = reg.toObject();
  if (reg.eventId && reg.registrationId) {
    regObj.signedQrPayload = generateSignedQrPayload(reg.registrationId, reg.eventId._id.toString());
  }
  return regObj;
};

const getAllRegistrations = async (query = {}) => {
  const { eventId, search, status, page = 1, limit = 20 } = query;
  const filter = {};

  if (eventId) filter.eventId = eventId;
  if (status) filter.status = status;
  if (search) {
    filter.$or = [
      { registrationId: { $regex: search, $options: 'i' } },
      { 'participantDetails.fullName': { $regex: search, $options: 'i' } },
      { 'participantDetails.email': { $regex: search, $options: 'i' } },
      { 'participantDetails.phone': { $regex: search, $options: 'i' } }
    ];
  }

  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 20;
  const skip = (pageNum - 1) * limitNum;

  const [registrations, total] = await Promise.all([
    Registration.find(filter)
      .populate('eventId', 'title slug eventDate category venue city hasLeaderboard leaderboardTitle')
      .populate('paymentId')
      .populate('checkInDetails.checkedInBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
    Registration.countDocuments(filter)
  ]);

  return {
    registrations,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      pages: Math.ceil(total / limitNum)
    }
  };
};

const maskCode = (code) => {
  if (!code) return '';
  return code.length > 25 ? code.slice(0, 20) + '...' : code;
};

/**
 * Gate Check-In Engine with signature verification, event matching & atomic locking.
 */
const gateCheckInParticipant = async ({ scannedCode, targetEventId, staffId, method = 'QR', ipAddress = '', userAgent = '' }) => {
  const parsed = verifyQrPayload(scannedCode);

  if (!parsed.valid) {
    await CheckInLog.create({
      registrationId: null,
      eventId: targetEventId || null,
      scannedCode: maskCode(scannedCode),
      result: parsed.code || 'INVALID_QR',
      reason: parsed.reason,
      method,
      staffId,
      ipAddress,
      userAgent
    });

    return {
      success: false,
      result: parsed.code || 'INVALID_QR',
      message: parsed.reason,
      registration: null
    };
  }

  // Find registration by registrationId or Mongo ObjectId
  const isObjectId = parsed.registrationId.match(/^[0-9a-fA-F]{24}$/);
  const reg = await Registration.findOne({
    $or: [
      { registrationId: parsed.registrationId },
      ...(isObjectId ? [{ _id: parsed.registrationId }] : [])
    ]
  }).populate('eventId');

  if (!reg) {
    await CheckInLog.create({
      registrationId: parsed.registrationId,
      eventId: targetEventId || null,
      scannedCode: maskCode(scannedCode),
      result: 'PASS_NOT_FOUND',
      reason: `Pass ID "${parsed.registrationId}" not found in system`,
      method,
      staffId,
      ipAddress,
      userAgent
    });

    return {
      success: false,
      result: 'PASS_NOT_FOUND',
      message: `Pass ID "${parsed.registrationId}" not found in system`,
      registration: null
    };
  }

  // Event ID validation if targetEventId specified or payload specifies eventId
  const effectiveTargetEvent = targetEventId || (parsed.eventId ? parsed.eventId : null);
  if (effectiveTargetEvent && reg.eventId._id.toString() !== effectiveTargetEvent.toString()) {
    await CheckInLog.create({
      registrationId: reg.registrationId,
      registration: reg._id,
      eventId: targetEventId || reg.eventId._id,
      scannedCode: maskCode(scannedCode),
      result: 'WRONG_EVENT',
      reason: `Pass belongs to "${reg.eventId.title}", not current gate event`,
      method,
      staffId,
      ipAddress,
      userAgent
    });

    return {
      success: false,
      result: 'WRONG_EVENT',
      message: `Pass is registered for "${reg.eventId.title}", not this event!`,
      registration: reg
    };
  }

  // Status Check: Payment Pending
  if (reg.status === REGISTRATION_STATUS.PAYMENT_PENDING) {
    await CheckInLog.create({
      registrationId: reg.registrationId,
      registration: reg._id,
      eventId: reg.eventId._id,
      scannedCode: maskCode(scannedCode),
      result: 'PAYMENT_PENDING',
      reason: 'Payment is pending for this pass',
      method,
      staffId,
      ipAddress,
      userAgent
    });

    return {
      success: false,
      result: 'PAYMENT_PENDING',
      message: 'Payment for this registration is still pending!',
      registration: reg
    };
  }

  // Status Check: Cancelled or Failed
  if (reg.status === REGISTRATION_STATUS.CANCELLED || reg.status === REGISTRATION_STATUS.PAYMENT_FAILED) {
    await CheckInLog.create({
      registrationId: reg.registrationId,
      registration: reg._id,
      eventId: reg.eventId._id,
      scannedCode: maskCode(scannedCode),
      result: 'REGISTRATION_CANCELLED',
      reason: `Registration status is ${reg.status}`,
      method,
      staffId,
      ipAddress,
      userAgent
    });

    return {
      success: false,
      result: 'REGISTRATION_CANCELLED',
      message: `Registration has been ${reg.status.toLowerCase()}`,
      registration: reg
    };
  }

  // Atomic Update to prevent double check-in concurrency
  const updatedReg = await Registration.findOneAndUpdate(
    {
      _id: reg._id,
      status: REGISTRATION_STATUS.CONFIRMED,
      'checkInDetails.isCheckedIn': false
    },
    {
      $set: {
        status: REGISTRATION_STATUS.CHECKED_IN,
        checkInDetails: {
          isCheckedIn: true,
          checkInTime: new Date(),
          checkedInBy: staffId
        }
      }
    },
    { new: true }
  ).populate('eventId').populate('checkInDetails.checkedInBy', 'name email');

  if (updatedReg) {
    // Granted!
    await CheckInLog.create({
      registrationId: updatedReg.registrationId,
      registration: updatedReg._id,
      eventId: updatedReg.eventId._id,
      scannedCode: maskCode(scannedCode),
      result: 'GRANTED',
      reason: 'Check-in granted successfully',
      method,
      staffId,
      ipAddress,
      userAgent
    });

    await AuditLog.create({
      actorId: staffId,
      action: 'PARTICIPANT_CHECKIN',
      resource: 'REGISTRATION',
      resourceId: updatedReg.registrationId,
      metadata: { participant: updatedReg.participantDetails?.fullName, event: updatedReg.eventId?.title, method }
    });

    // Emit Socket Event for real-time updates
    try {
      const { getIO } = require('../socket');
      getIO().emit('checkInUpdated', {
        eventId: updatedReg.eventId._id,
        registrationId: updatedReg.registrationId,
        action: 'CHECK_IN'
      });
    } catch (err) {
      console.warn('Socket emit failed:', err.message);
    }

    return {
      success: true,
      result: 'GRANTED',
      message: 'Check-in GRANTED! Entry allowed.',
      registration: updatedReg
    };
  }

  // If atomic update returned null, it means participant was ALREADY checked in!
  const existingReg = await Registration.findById(reg._id)
    .populate('eventId')
    .populate('checkInDetails.checkedInBy', 'name email');

  await CheckInLog.create({
    registrationId: existingReg.registrationId,
    registration: existingReg._id,
    eventId: existingReg.eventId._id,
    scannedCode: maskCode(scannedCode),
    result: 'ALREADY_CHECKED_IN',
    reason: `Pass already checked in at ${existingReg.checkInDetails?.checkInTime}`,
    method,
    staffId,
    ipAddress,
    userAgent
  });

  const formattedTime = existingReg.checkInDetails?.checkInTime
    ? new Date(existingReg.checkInDetails.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : 'earlier';

  return {
    success: false,
    result: 'ALREADY_CHECKED_IN',
    message: `PASS ALREADY USED! Checked in at ${formattedTime}`,
    registration: existingReg
  };
};

const checkInParticipant = async (registrationId, staffUserId) => {
  const result = await gateCheckInParticipant({
    scannedCode: registrationId,
    staffId: staffUserId,
    method: 'MANUAL'
  });

  if (!result.success && result.result !== 'ALREADY_CHECKED_IN') {
    const error = new Error(result.message);
    error.statusCode = 400;
    error.errorCode = result.result;
    throw error;
  }

  if (result.result === 'ALREADY_CHECKED_IN') {
    const error = new Error(result.message);
    error.statusCode = 409;
    error.errorCode = 'ALREADY_CHECKED_IN';
    throw error;
  }

  return result.registration;
};

const undoGateCheckIn = async (registrationId, reason, staffId) => {
  const reg = await Registration.findOne({
    $or: [{ registrationId }, { _id: registrationId }]
  }).populate('eventId');

  if (!reg) {
    const error = new Error('Registration not found');
    error.statusCode = 404;
    error.errorCode = 'REGISTRATION_NOT_FOUND';
    throw error;
  }

  if (!reg.checkInDetails?.isCheckedIn) {
    const error = new Error('Participant is not currently checked in');
    error.statusCode = 400;
    error.errorCode = 'NOT_CHECKED_IN';
    throw error;
  }

  reg.status = REGISTRATION_STATUS.CONFIRMED;
  reg.checkInDetails = {
    isCheckedIn: false,
    checkInTime: null,
    checkedInBy: null
  };
  await reg.save();

  await CheckInLog.create({
    registrationId: reg.registrationId,
    registration: reg._id,
    eventId: reg.eventId._id,
    scannedCode: reg.registrationId,
    result: 'UNDO',
    reason: reason || 'Check-in reverted by organizer',
    method: 'MANUAL',
    staffId
  });

  await AuditLog.create({
    actorId: staffId,
    action: 'PARTICIPANT_CHECKIN_UNDO',
    resource: 'REGISTRATION',
    resourceId: reg.registrationId,
    metadata: { participant: reg.participantDetails?.fullName, event: reg.eventId?.title, reason }
  });

  try {
    const { getIO } = require('../socket');
    getIO().emit('checkInUpdated', {
      eventId: reg.eventId._id,
      registrationId: reg.registrationId,
      action: 'UNDO_CHECK_IN'
    });
  } catch (err) {
    console.warn('Socket emit failed:', err.message);
  }

  return reg;
};

const getCheckInStats = async (eventId) => {
  const filter = eventId ? { eventId } : {};

  const [totalConfirmed, totalCheckedIn, recentLogs] = await Promise.all([
    Registration.countDocuments({
      ...filter,
      status: { $in: [REGISTRATION_STATUS.CONFIRMED, REGISTRATION_STATUS.CHECKED_IN] }
    }),
    Registration.countDocuments({
      ...filter,
      'checkInDetails.isCheckedIn': true
    }),
    CheckInLog.aggregate([
      { $match: filter },
      { $group: { _id: '$result', count: { $sum: 1 } } }
    ])
  ]);

  const statsByResult = recentLogs.reduce((acc, curr) => {
    acc[curr._id] = curr.count;
    return acc;
  }, {});

  return {
    totalConfirmed,
    totalCheckedIn,
    remaining: Math.max(0, totalConfirmed - totalCheckedIn),
    percentage: totalConfirmed > 0 ? Math.round((totalCheckedIn / totalConfirmed) * 100) : 0,
    breakdown: statsByResult
  };
};

const getCheckInLogs = async (eventId, limit = 50) => {
  const filter = eventId ? { eventId } : {};
  const limitNum = parseInt(limit, 10) || 50;

  return await CheckInLog.find(filter)
    .populate('staffId', 'name email')
    .populate('registration', 'participantDetails raceDetails')
    .sort({ createdAt: -1 })
    .limit(limitNum);
};

const deleteRegistration = async (id, actorId) => {
  const reg = await Registration.findById(id);
  if (!reg) {
    const error = new Error('Registration not found');
    error.statusCode = 404;
    error.errorCode = 'REGISTRATION_NOT_FOUND';
    throw error;
  }

  const event = await Event.findById(reg.eventId);
  if (event && !event.isUnlimitedCapacity && reg.status !== REGISTRATION_STATUS.CANCELLED) {
    event.availableSlots = Math.min(event.capacity, event.availableSlots + 1);
    await event.save();
  }

  await Registration.findByIdAndDelete(id);

  if (actorId) {
    await AuditLog.create({
      actorId,
      action: 'REGISTRATION_DELETE',
      resource: 'REGISTRATION',
      resourceId: reg.registrationId,
      metadata: { participant: reg.participantDetails?.fullName }
    });
  }

  return { message: 'Registration deleted successfully' };
};

const updateLeaderboardDetails = async (id, data, actorId) => {
  const reg = await Registration.findById(id);
  if (!reg) {
    const error = new Error('Registration not found');
    error.statusCode = 404;
    error.errorCode = 'REGISTRATION_NOT_FOUND';
    throw error;
  }

  if (data.leaderboardScore !== undefined) {
    reg.leaderboardScore = data.leaderboardScore;
  }
  if (data.leaderboardRank !== undefined) {
    reg.leaderboardRank = data.leaderboardRank;
  }

  await reg.save();

  if (actorId) {
    await AuditLog.create({
      actorId,
      action: 'LEADERBOARD_UPDATE',
      resource: 'REGISTRATION',
      resourceId: reg.registrationId,
      metadata: { participant: reg.participantDetails?.fullName, score: reg.leaderboardScore, rank: reg.leaderboardRank }
    });
  }

  return reg;
};

module.exports = {
  initiateRegistration,
  getUserRegistrations,
  getRegistrationById,
  getAllRegistrations,
  checkInParticipant,
  gateCheckInParticipant,
  undoGateCheckIn,
  getCheckInStats,
  getCheckInLogs,
  deleteRegistration,
  updateLeaderboardDetails
};

