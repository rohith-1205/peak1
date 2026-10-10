const Event = require('../models/Event');
const Registration = require('../models/Registration');
const AuditLog = require('../models/AuditLog');
const { EVENT_STATUS } = require('../constants');
const storageProvider = require('./storage/storageProvider');

const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
};

const getEvents = async (query = {}, isAdmin = false) => {
  const {
    search,
    category,
    city,
    isPaid,
    status,
    upcoming,
    page = 1,
    limit = 10,
    sort = 'eventDate'
  } = query;

  const filter = {};

  if (!isAdmin) {
    filter.status = { $in: [EVENT_STATUS.PUBLISHED, EVENT_STATUS.REGISTRATION_CLOSED, EVENT_STATUS.COMPLETED] };
  } else if (status) {
    filter.status = status;
  }

  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { shortDescription: { $regex: search, $options: 'i' } },
      { city: { $regex: search, $options: 'i' } },
      { venue: { $regex: search, $options: 'i' } }
    ];
  }

  if (category) filter.category = category;
  if (city) filter.city = { $regex: city, $options: 'i' };
  if (isPaid !== undefined) filter.isPaid = isPaid === 'true';

  if (upcoming === 'true') {
    filter.eventDate = { $gte: new Date() };
  }

  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 10;
  const skip = (pageNum - 1) * limitNum;

  const sortOption = sort === '-eventDate' ? { eventDate: -1 } : { eventDate: 1 };

  const [events, total] = await Promise.all([
    Event.find(filter).sort(sortOption).skip(skip).limit(limitNum),
    Event.countDocuments(filter)
  ]);

  return {
    events,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      pages: Math.ceil(total / limitNum)
    }
  };
};

const getEventBySlug = async (slug, incrementView = true) => {
  const event = await Event.findOne({ slug });
  if (!event) {
    const error = new Error('Event not found');
    error.statusCode = 404;
    error.errorCode = 'EVENT_NOT_FOUND';
    throw error;
  }

  if (incrementView) {
    event.viewCount += 1;
    await event.save();
  }

  return event;
};

const getEventById = async (id) => {
  const event = await Event.findById(id);
  if (!event) {
    const error = new Error('Event not found');
    error.statusCode = 404;
    error.errorCode = 'EVENT_NOT_FOUND';
    throw error;
  }
  return event;
};

const createEvent = async (eventData, actorId) => {
  const title = eventData.title || 'Untitled Event';
  let baseSlug = slugify(title);
  let slug = baseSlug;
  let counter = 1;

  while (await Event.findOne({ slug })) {
    slug = `${baseSlug}-${counter}`;
    counter += 1;
  }

  const capacity = eventData.capacity || 0;
  const availableSlots = eventData.isUnlimitedCapacity ? 999999 : capacity;

  const payload = {
    ...eventData,
    title,
    category: eventData.category || 'General',
    shortDescription: eventData.shortDescription || title,
    fullDescription: eventData.fullDescription || eventData.shortDescription || title,
    venue: eventData.venue || 'Main Venue',
    address: eventData.address || eventData.venue || 'Venue Address',
    city: eventData.city || 'Coimbatore',
    state: eventData.state || 'Tamil Nadu',
    eventDate: eventData.eventDate || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    startTime: eventData.startTime || '08:00',
    endTime: eventData.endTime || '17:00',
    organizer: {
      name: eventData.organizer?.name || 'Peak1 Event Operations',
      email: eventData.organizer?.email || 'events@peak1.app',
      phone: eventData.organizer?.phone || '+91 98765 43210',
      logoUrl: eventData.organizer?.logoUrl || ''
    },
    slug,
    capacity,
    availableSlots,
    hasLeaderboard: eventData.hasLeaderboard || false,
    leaderboardTitle: eventData.leaderboardTitle || 'Leaderboard'
  };

  const event = await Event.create(payload);

  if (actorId) {
    await AuditLog.create({
      actorId,
      action: 'EVENT_CREATE',
      resource: 'EVENT',
      resourceId: event._id.toString(),
      metadata: { title: event.title }
    });
  }

  return event;
};

const updateEvent = async (id, updateData, actorId) => {
  const event = await Event.findById(id);
  if (!event) {
    const error = new Error('Event not found');
    error.statusCode = 404;
    error.errorCode = 'EVENT_NOT_FOUND';
    throw error;
  }

  // Check if poster asset is being replaced
  if (updateData.poster && updateData.poster.publicId && event.poster?.publicId && updateData.poster.publicId !== event.poster.publicId) {
    try {
      await storageProvider.remove(event.poster.publicId);
    } catch (err) {
      console.warn('Warning removing old poster asset:', err.message);
    }
  }

  // Check if banner asset is being replaced
  if (updateData.banner && updateData.banner.publicId && event.banner?.publicId && updateData.banner.publicId !== event.banner.publicId) {
    try {
      await storageProvider.remove(event.banner.publicId);
    } catch (err) {
      console.warn('Warning removing old banner asset:', err.message);
    }
  }

  if (updateData.title && updateData.title !== event.title) {
    let baseSlug = slugify(updateData.title);
    let slug = baseSlug;
    let counter = 1;
    while (await Event.findOne({ slug, _id: { $ne: id } })) {
      slug = `${baseSlug}-${counter}`;
      counter += 1;
    }
    updateData.slug = slug;
  }

  // Handle Capacity Changes to maintain correct availableSlots
  if (updateData.isUnlimitedCapacity !== undefined) {
    if (updateData.isUnlimitedCapacity && !event.isUnlimitedCapacity) {
      // Switched to unlimited
      event.availableSlots = 999999;
    } else if (!updateData.isUnlimitedCapacity && event.isUnlimitedCapacity) {
      // Switched from unlimited to limited
      const existingCount = await Registration.countDocuments({
        eventId: id,
        status: { $in: ['CONFIRMED', 'CHECKED_IN', 'PAYMENT_PENDING'] }
      });
      const newCapacity = updateData.capacity !== undefined ? updateData.capacity : event.capacity;
      event.availableSlots = Math.max(0, newCapacity - existingCount);
    } else if (!updateData.isUnlimitedCapacity && !event.isUnlimitedCapacity) {
      // Both limited, capacity changed
      if (updateData.capacity !== undefined && updateData.capacity !== event.capacity) {
        const capacityDiff = updateData.capacity - event.capacity;
        event.availableSlots = Math.max(0, event.availableSlots + capacityDiff);
      }
    }
  } else if (!event.isUnlimitedCapacity && updateData.capacity !== undefined && updateData.capacity !== event.capacity) {
    // Capacity changed, isUnlimitedCapacity wasn't explicitly passed
    const capacityDiff = updateData.capacity - event.capacity;
    event.availableSlots = Math.max(0, event.availableSlots + capacityDiff);
  }

  Object.assign(event, updateData);
  await event.save();

  if (actorId) {
    await AuditLog.create({
      actorId,
      action: 'EVENT_UPDATE',
      resource: 'EVENT',
      resourceId: event._id.toString(),
      metadata: { title: event.title }
    });
  }

  return event;
};

const deleteEvent = async (id, actorId) => {
  const event = await Event.findById(id);
  if (!event) {
    const error = new Error('Event not found');
    error.statusCode = 404;
    error.errorCode = 'EVENT_NOT_FOUND';
    throw error;
  }

  // Remove associated poster and banner images
  if (event.poster?.publicId) {
    try {
      await storageProvider.remove(event.poster.publicId);
    } catch (err) {
      console.warn('Warning removing poster during event delete:', err.message);
    }
  }
  if (event.banner?.publicId) {
    try {
      await storageProvider.remove(event.banner.publicId);
    } catch (err) {
      console.warn('Warning removing banner during event delete:', err.message);
    }
  }

  await Event.findByIdAndDelete(id);

  if (actorId) {
    await AuditLog.create({
      actorId,
      action: 'EVENT_DELETE',
      resource: 'EVENT',
      resourceId: id,
      metadata: { title: event.title }
    });
  }

  return { message: 'Event deleted successfully' };
};

const updateEventStatus = async (id, status, actorId) => {
  const event = await Event.findById(id);
  if (!event) {
    const error = new Error('Event not found');
    error.statusCode = 404;
    error.errorCode = 'EVENT_NOT_FOUND';
    throw error;
  }

  event.status = status;
  await event.save();

  if (actorId) {
    await AuditLog.create({
      actorId,
      action: 'EVENT_STATUS_CHANGE',
      resource: 'EVENT',
      resourceId: event._id.toString(),
      metadata: { status }
    });
  }

  return event;
};

const archiveEvent = async (id, actorId) => {
  return await updateEventStatus(id, EVENT_STATUS.ARCHIVED, actorId);
};

const getEventCategories = async () => {
  const categories = await Event.distinct('category', { 
    status: { $in: [EVENT_STATUS.PUBLISHED, EVENT_STATUS.REGISTRATION_CLOSED, EVENT_STATUS.COMPLETED] } 
  });
  return categories;
};

const getEventLeaderboard = async (slugOrId) => {
  const isObjectId = typeof slugOrId === 'string' && slugOrId.match(/^[0-9a-fA-F]{24}$/);
  const event = await Event.findOne({
    $or: [
      { slug: slugOrId },
      ...(isObjectId ? [{ _id: slugOrId }] : [])
    ]
  });

  if (!event) {
    const error = new Error('Event not found');
    error.statusCode = 404;
    error.errorCode = 'EVENT_NOT_FOUND';
    throw error;
  }

  // Retrieve confirmed or checked-in registrations
  const registrations = await Registration.find({
    eventId: event._id,
    status: { $in: ['CONFIRMED', 'CHECKED_IN'] }
  })
    .select('registrationId participantDetails raceDetails leaderboardScore leaderboardRank checkInDetails createdAt')
    .sort({ leaderboardRank: 1, leaderboardScore: -1, createdAt: 1 });

  const leaderboard = registrations.map((reg, index) => ({
    registrationId: reg.registrationId,
    participantName: reg.participantDetails?.fullName || 'Anonymous Participant',
    mobileNumber: reg.participantDetails?.phone || '',
    city: reg.participantDetails?.city || '',
    vehicleModel: reg.raceDetails?.vehicleModel || '',
    vehicleNumber: reg.raceDetails?.vehicleNumber || '',
    teamName: reg.raceDetails?.teamName || '',
    categoryClass: reg.raceDetails?.categoryClass || '',
    leaderboardScore: reg.leaderboardScore || 0,
    leaderboardRank: reg.leaderboardRank || (index + 1),
    isCheckedIn: !!reg.checkInDetails?.isCheckedIn,
    checkInTime: reg.checkInDetails?.checkInTime || null
  }));

  return {
    event: {
      _id: event._id,
      title: event.title,
      slug: event.slug,
      category: event.category,
      eventDate: event.eventDate,
      hasLeaderboard: event.hasLeaderboard,
      leaderboardTitle: event.leaderboardTitle || 'Official Standings'
    },
    leaderboard
  };
};

module.exports = {
  getEvents,
  getEventBySlug,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  updateEventStatus,
  archiveEvent,
  getEventCategories,
  getEventLeaderboard
};

