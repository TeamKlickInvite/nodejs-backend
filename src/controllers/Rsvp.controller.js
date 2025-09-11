// controllers/rsvpController.js
import mongoose from 'mongoose';
import RSVP from '../models/Rsvp.models.js';

/** ---------------------------
 * Helper Functions
 * --------------------------- */
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const sendResponse = (res, statusCode, success, message, data = null, error = null) => {
  return res.status(statusCode).json({
    success,
    message,
    ...(data && { data }),
    ...(error && { error })
  });
};

/** ---------------------------
 * @desc Submit RSVP
 * @route POST /api/rsvp
 * @access Public/Guest
 * --------------------------- */
export const submitRSVP = async (req, res) => {
  try {
    const { guest_id, group_id, order_id, event_id, response, details } = req.body;

    // Required fields check
    if (!guest_id || !group_id || !order_id || !event_id || !response) {
      return sendResponse(res, 400, false, 'Missing required fields');
    }

    // ObjectId validation
    if (![guest_id, group_id].every(isValidObjectId)) {
      return sendResponse(res, 400, false, 'Invalid guest_id or group_id format');
    }

    // Order & Event come from Frappe => treat as plain string/UUID
    if (typeof order_id !== 'string' || typeof event_id !== 'string') {
      return sendResponse(res, 400, false, 'order_id and event_id must be strings');
    }

    // Response validation
    const allowedResponses = ['attending', 'not_attending', 'maybe'];
    if (!allowedResponses.includes(response)) {
      return sendResponse(res, 400, false, `Invalid response. Allowed: ${allowedResponses.join(', ')}`);
    }

    // UPSERT logic (update if exists, otherwise insert)
    const rsvp = await RSVP.findOneAndUpdate(
      { guest_id, order_id, event_id },
      {
        group_id,
        response,
        details: details || {},
        updatedAt: new Date()
      },
      { new: true, upsert: true, runValidators: true }
    );

    return sendResponse(res, 201, true, 'RSVP submitted successfully', rsvp);
  } catch (error) {
    console.error('RSVP Submit Error:', error);
    return sendResponse(res, 500, false, 'Internal server error', null, error.message);
  }
};

/** ---------------------------
 * @desc Get RSVPs by Order
 * @route GET /api/rsvp/order/:order_id
 * @access Admin/Event Owner
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * --------------------------- */
export const getRSVPsByOrder = async (req, res) => {
  try {
    const { order_id } = req.params;

    if (!order_id || typeof order_id !== 'string') {
      return sendResponse(res, 400, false, 'Invalid order_id');
    }

    const rsvps = await RSVP.find({ order_id })
      .populate('guest_id', 'name contacts')
      .lean();

    if (!rsvps.length) {
      return sendResponse(res, 404, false, 'No RSVPs found for this order');
    }

    return sendResponse(res, 200, true, 'RSVPs fetched successfully', rsvps);
  } catch (error) {
    console.error('Get RSVPs By Order Error:', error);
    return sendResponse(res, 500, false, 'Internal server error', null, error.message);
  }
};

/** ---------------------------
 * @desc Get RSVPs by Guest
 * @route GET /api/rsvp/guest/:guest_id
 * @access Public/Guest
 * --------------------------- */
export const getRSVPsByGuest = async (req, res) => {
  try {
    const { guest_id } = req.params;

    if (!isValidObjectId(guest_id)) {
      return sendResponse(res, 400, false, 'Invalid guest_id');
    }

    const rsvps = await RSVP.find({ guest_id }).lean();

    if (!rsvps.length) {
      return sendResponse(res, 404, false, 'No RSVPs found for this guest');
    }

    return sendResponse(res, 200, true, 'RSVPs fetched successfully', rsvps);
  } catch (error) {
    console.error('Get RSVPs By Guest Error:', error);
    return sendResponse(res, 500, false, 'Internal server error', null, error.message);
  }
};
