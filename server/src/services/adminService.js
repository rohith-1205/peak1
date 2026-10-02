const Event = require('../models/Event');
const Registration = require('../models/Registration');
const Payment = require('../models/Payment');
const AuditLog = require('../models/AuditLog');
const { REGISTRATION_STATUS, PAYMENT_STATUS, EVENT_STATUS } = require('../constants');

const getDashboardStats = async () => {
  const [
    totalEvents,
    publishedEvents,
    draftEvents,
    totalRegistrations,
    confirmedRegistrations,
    checkedInRegistrations,
    revenueResult,
    recentRegistrations
  ] = await Promise.all([
    Event.countDocuments({ status: { $ne: EVENT_STATUS.ARCHIVED } }),
    Event.countDocuments({ status: EVENT_STATUS.PUBLISHED }),
    Event.countDocuments({ status: EVENT_STATUS.DRAFT }),
    Registration.countDocuments(),
    Registration.countDocuments({ status: REGISTRATION_STATUS.CONFIRMED }),
    Registration.countDocuments({ status: REGISTRATION_STATUS.CHECKED_IN }),
    Payment.aggregate([
      { $match: { status: PAYMENT_STATUS.SUCCESS } },
      { $group: { _id: null, totalRevenue: { $sum: '$amount' } } }
    ]),
    Registration.find()
      .populate('eventId', 'title category')
      .sort({ createdAt: -1 })
      .limit(10)
  ]);

  const totalRevenue = revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;

  // Aggregate Category Breakdown
  const categoryBreakdown = await Event.aggregate([
    { $match: { status: EVENT_STATUS.PUBLISHED } },
    { $group: { _id: '$category', count: { $sum: 1 } } }
  ]);

  // Event-wise Analytics
  const eventAnalytics = await Registration.aggregate([
    {
      $group: {
        _id: '$eventId',
        totalRegistrations: { $sum: 1 },
        confirmedRegistrations: {
          $sum: { $cond: [{ $eq: ['$status', REGISTRATION_STATUS.CONFIRMED] }, 1, 0] }
        },
        checkedInRegistrations: {
          $sum: { $cond: [{ $eq: ['$status', REGISTRATION_STATUS.CHECKED_IN] }, 1, 0] }
        }
      }
    },
    {
      $lookup: {
        from: 'events',
        localField: '_id',
        foreignField: '_id',
        as: 'event'
      }
    },
    { $unwind: { path: '$event', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        eventId: '$_id',
        eventTitle: { $ifNull: ['$event.title', 'Unknown Event'] },
        eventDate: '$event.eventDate',
        totalRegistrations: 1,
        confirmedRegistrations: 1,
        checkedInRegistrations: 1
      }
    },
    { $sort: { eventDate: -1, totalRegistrations: -1 } }
  ]);

  return {
    overview: {
      totalEvents,
      publishedEvents,
      draftEvents,
      totalRegistrations,
      confirmedRegistrations,
      checkedInRegistrations,
      totalRevenue
    },
    categoryBreakdown,
    recentRegistrations,
    eventAnalytics
  };
};

const getAuditLogs = async (query = {}) => {
  const { page = 1, limit = 20 } = query;
  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 20;
  const skip = (pageNum - 1) * limitNum;

  const [logs, total] = await Promise.all([
    AuditLog.find()
      .populate('actorId', 'name email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
    AuditLog.countDocuments()
  ]);

  return {
    logs,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      pages: Math.ceil(total / limitNum)
    }
  };
};

module.exports = {
  getDashboardStats,
  getAuditLogs
};
