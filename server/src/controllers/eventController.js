const eventService = require('../services/eventService');
const ApiResponse = require('../utils/apiResponse');

const getEvents = async (req, res, next) => {
  try {
    const isAdmin = req.user && (req.user.role === 'ADMIN' || req.user.role === 'SUPER_ADMIN');
    const result = await eventService.getEvents(req.query, isAdmin);
    return ApiResponse.success(res, result, 'Events retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const getEventBySlug = async (req, res, next) => {
  try {
    const event = await eventService.getEventBySlug(req.params.slug);
    return ApiResponse.success(res, { event }, 'Event details retrieved');
  } catch (error) {
    next(error);
  }
};

const createEvent = async (req, res, next) => {
  try {
    const event = await eventService.createEvent(req.body, req.user._id);
    return ApiResponse.success(res, { event }, 'Event created successfully', 201);
  } catch (error) {
    next(error);
  }
};

const updateEvent = async (req, res, next) => {
  try {
    const event = await eventService.updateEvent(req.params.id, req.body, req.user._id);
    return ApiResponse.success(res, { event }, 'Event updated successfully');
  } catch (error) {
    next(error);
  }
};

const updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const event = await eventService.updateEventStatus(req.params.id, status, req.user._id);
    return ApiResponse.success(res, { event }, `Event status updated to ${status}`);
  } catch (error) {
    next(error);
  }
};

const deleteEvent = async (req, res, next) => {
  try {
    const event = await eventService.archiveEvent(req.params.id, req.user._id);
    return ApiResponse.success(res, { event }, 'Event archived successfully');
  } catch (error) {
    next(error);
  }
};

const getEventById = async (req, res, next) => {
  try {
    const event = await eventService.getEventById(req.params.id);
    return ApiResponse.success(res, { event }, 'Event details retrieved');
  } catch (error) {
    next(error);
  }
};

const getEventCategories = async (req, res, next) => {
  try {
    const categories = await eventService.getEventCategories();
    return ApiResponse.success(res, { categories }, 'Event categories retrieved');
  } catch (error) {
    next(error);
  }
};

const getLeaderboard = async (req, res, next) => {
  try {
    const result = await eventService.getEventLeaderboard(req.params.slug);
    return ApiResponse.success(res, result, 'Event leaderboard retrieved successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getEvents,
  getEventBySlug,
  getEventById,
  createEvent,
  updateEvent,
  updateStatus,
  deleteEvent,
  getEventCategories,
  getLeaderboard
};
