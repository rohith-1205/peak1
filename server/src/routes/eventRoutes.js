const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const { authenticateUser, requireAdmin, optionalAuth } = require('../middleware/auth');
const { validate, createEventSchema } = require('../validators');

router.get('/', optionalAuth, eventController.getEvents);
router.get('/meta/categories', eventController.getEventCategories);
router.get('/id/:id', authenticateUser, requireAdmin, eventController.getEventById);
router.get('/:slug', eventController.getEventBySlug);
router.get('/:slug/leaderboard', eventController.getLeaderboard);

router.post('/', authenticateUser, requireAdmin, validate(createEventSchema), eventController.createEvent);
router.put('/:id', authenticateUser, requireAdmin, eventController.updateEvent);
router.patch('/:id/status', authenticateUser, requireAdmin, eventController.updateStatus);
router.delete('/:id', authenticateUser, requireAdmin, eventController.deleteEvent);

module.exports = router;
