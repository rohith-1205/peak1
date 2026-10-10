const registrationService = require('../services/registrationService');
const ApiResponse = require('../utils/apiResponse');
const PDFDocument = require('pdfkit');

const registerForEvent = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const result = await registrationService.initiateRegistration(eventId, req.user._id, req.body);
    return ApiResponse.success(res, result, 'Registration initiated successfully', 201);
  } catch (error) {
    next(error);
  }
};

const getMyRegistrations = async (req, res, next) => {
  try {
    const registrations = await registrationService.getUserRegistrations(req.user._id);
    return ApiResponse.success(res, { registrations }, 'User registrations retrieved');
  } catch (error) {
    next(error);
  }
};

const getRegistrationById = async (req, res, next) => {
  try {
    const registration = await registrationService.getRegistrationById(req.params.id);
    // Ensure standard user can only view their own registration
    if (req.user.role === 'USER' && registration.userId.toString() !== req.user._id.toString()) {
      return ApiResponse.error(res, 'Unauthorized access to registration', 403, 'FORBIDDEN');
    }
    return ApiResponse.success(res, { registration }, 'Registration details retrieved');
  } catch (error) {
    next(error);
  }
};

const getAllRegistrations = async (query, res, next) => {
  try {
    const result = await registrationService.getAllRegistrations(query);
    return ApiResponse.success(res, result, 'Registrations list retrieved');
  } catch (error) {
    next(error);
  }
};

const listRegistrations = async (req, res, next) => {
  return getAllRegistrations(req.query, res, next);
};

const checkIn = async (req, res, next) => {
  try {
    const { scannedCode, registrationId, targetEventId, eventId, method } = req.body;
    const codeToVerify = scannedCode || registrationId;

    const result = await registrationService.gateCheckInParticipant({
      scannedCode: codeToVerify,
      targetEventId: targetEventId || eventId,
      staffId: req.user._id,
      method: method || 'QR',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    const statusCode = result.success ? 200 : (result.result === 'ALREADY_CHECKED_IN' ? 409 : 400);

    return res.status(statusCode).json({
      success: result.success,
      message: result.message,
      data: {
        result: result.result,
        registration: result.registration
      }
    });
  } catch (error) {
    next(error);
  }
};

const undoCheckIn = async (req, res, next) => {
  try {
    const { registrationId, reason } = req.body;
    const registration = await registrationService.undoGateCheckIn(registrationId, reason, req.user._id);
    return ApiResponse.success(res, { registration }, 'Check-in reverted successfully');
  } catch (error) {
    next(error);
  }
};

const getCheckInStats = async (req, res, next) => {
  try {
    const { eventId } = req.query;
    const stats = await registrationService.getCheckInStats(eventId);
    return ApiResponse.success(res, { stats }, 'Check-in statistics retrieved');
  } catch (error) {
    next(error);
  }
};

const getCheckInLogs = async (req, res, next) => {
  try {
    const { eventId, limit } = req.query;
    const logs = await registrationService.getCheckInLogs(eventId, limit);
    return ApiResponse.success(res, { logs }, 'Check-in logs retrieved');
  } catch (error) {
    next(error);
  }
};

const exportRegistrationsPDF = async (req, res, next) => {
  try {
    const { registrations } = await registrationService.getAllRegistrations({ ...req.query, limit: 10000 });

    const doc = new PDFDocument({ margin: 30, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="participants_roster_${Date.now()}.pdf"`);

    doc.pipe(res);

    doc.fontSize(20).text('Registered Members Roster', { align: 'center' });
    doc.moveDown(2);

    registrations.forEach((r, index) => {
      const eventTitle = r.eventId?.title || 'N/A';
      const name = r.participantSnapshot?.fullName || r.participantDetails?.fullName || 'N/A';
      const email = r.participantSnapshot?.email || r.participantDetails?.email || 'N/A';
      const phone = r.participantSnapshot?.phone || r.participantDetails?.phone || 'N/A';
      const city = r.participantSnapshot?.city || r.participantDetails?.city || 'N/A';
      
      doc.fontSize(14).text(`${index + 1}. ${name}`);
      doc.fontSize(10).text(`Event: ${eventTitle}`);
      doc.text(`Registration ID: ${r.registrationId}`);
      doc.text(`Email: ${email} | Phone: ${phone} | City: ${city}`);
      doc.text(`Status: ${r.status}`);
      doc.text(`Gate Entry: ${r.checkInDetails?.isCheckedIn ? 'Checked In' : 'Pending'}`);
      doc.moveDown(1);
    });

    doc.end();
  } catch (error) {
    next(error);
  }
};

const exportRegistrationsCSV = async (req, res, next) => {
  try {
    const { registrations } = await registrationService.getAllRegistrations({ ...req.query, limit: 10000 });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=registrations-${Date.now()}.csv`);

    let csvContent = 'Registration ID,Event Title,Participant Name,Email,Phone,DOB,Gender,City,State,Emergency Contact Name,Emergency Contact Phone,Blood Group,T-Shirt Size,Team Name,Vehicle Model,Vehicle Number,Driving License,Status,Checked In,Check-In Time,Checked In By,Custom Answers,Created At\n';

    registrations.forEach(r => {
      const event = r.eventId || {};
      const details = r.participantDetails || {};
      const snapshot = r.participantSnapshot || {};
      const race = r.raceDetails || {};
      const customMap = r.customResponses || new Map();

      const eventTitle = event.title ? `"${event.title.replace(/"/g, '""')}"` : 'N/A';
      const name = `"${(snapshot.fullName || details.fullName || '').replace(/"/g, '""')}"`;
      const email = `"${snapshot.email || details.email || ''}"`;
      const phone = `"${snapshot.phone || details.phone || ''}"`;
      const dob = snapshot.dob ? new Date(snapshot.dob).toISOString().split('T')[0] : (details.dob ? new Date(details.dob).toISOString().split('T')[0] : '');
      const gender = `"${snapshot.gender || details.gender || ''}"`;
      const city = `"${snapshot.city || details.city || ''}"`;
      const state = `"${snapshot.state || ''}"`;
      const emName = `"${(snapshot.emergencyContactName || details.emergencyContact || '').replace(/"/g, '""')}"`;
      const emPhone = `"${snapshot.emergencyContactPhone || ''}"`;
      const blood = `"${snapshot.bloodGroup || details.bloodGroup || ''}"`;
      const tShirt = `"${snapshot.tShirtSize || details.tShirtSize || ''}"`;

      const team = `"${(race.teamName || '').replace(/"/g, '""')}"`;
      const vModel = `"${(race.vehicleModel || '').replace(/"/g, '""')}"`;
      const vNum = `"${(race.vehicleNumber || '').replace(/"/g, '""')}"`;
      const license = `"${(race.drivingLicense || '').replace(/"/g, '""')}"`;

      const isCheckedIn = r.checkInDetails?.isCheckedIn ? 'YES' : 'NO';
      const checkInTime = r.checkInDetails?.checkInTime ? new Date(r.checkInDetails.checkInTime).toISOString() : '';
      const checkedInBy = r.checkInDetails?.checkedInBy?.name ? `"${r.checkInDetails.checkedInBy.name}"` : '';

      const questionsList = event.registrationConfig?.customQuestions || event.customFields || [];
      const labelValuePairs = [];

      const rawCustomObj = customMap instanceof Map ? Object.fromEntries(customMap) : (customMap || {});
      Object.entries(rawCustomObj).forEach(([fieldId, val]) => {
        const qObj = questionsList.find(q => (q.fieldId || q.id) === fieldId);
        const label = qObj ? qObj.label : fieldId;
        labelValuePairs.push(`${label}: ${Array.isArray(val) ? val.join('; ') : val}`);
      });

      const customAnswersStr = `"${labelValuePairs.join(' | ').replace(/"/g, '""')}"`;
      const createdAt = new Date(r.createdAt).toISOString();

      csvContent += `${r.registrationId},${eventTitle},${name},${email},${phone},${dob},${gender},${city},${state},${emName},${emPhone},${blood},${tShirt},${team},${vModel},${vNum},${license},${r.status},${isCheckedIn},${checkInTime},${checkedInBy},${customAnswersStr},${createdAt}\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="participants_roster.csv"');
    return res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
};

const deleteRegistration = async (req, res, next) => {
  try {
    const result = await registrationService.deleteRegistration(req.params.id, req.user._id);
    return ApiResponse.success(res, result, 'Registration deleted successfully');
  } catch (error) {
    next(error);
  }
};

const updateLeaderboard = async (req, res, next) => {
  try {
    const result = await registrationService.updateLeaderboardDetails(req.params.id, req.body, req.user._id);
    return ApiResponse.success(res, result, 'Leaderboard details updated successfully');
  } catch (error) {
    next(error);
  }
};

const manualRegister = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const result = await registrationService.createManualRegistration(eventId, req.user._id, req.body);
    return ApiResponse.success(res, { registration: result }, 'Manual registration created successfully', 201);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerForEvent,
  getMyRegistrations,
  getRegistrationById,
  listRegistrations,
  checkIn,
  undoCheckIn,
  getCheckInStats,
  getCheckInLogs,
  exportRegistrationsPDF,
  exportRegistrationsCSV,
  deleteRegistration,
  updateLeaderboard,
  manualRegister
};

