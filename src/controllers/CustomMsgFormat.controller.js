// controllers/msgFormatController.js
import mongoose from 'mongoose';
import CustomMsgFormat from '../models/CustomMsgFormat.models.js';

/** ---------------------------
 * Helpers
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
 * @desc Create a new custom message format
 * @route POST /api/msg-format
 * @access Private/Admin
 * --------------------------- */
export const createMsgFormat = async (req, res) => {
  try {
    
    const { order_id,  msg_medium, invite_type, msg_text } = req.body;

    // Required field check
    if (!order_id || !msg_medium === undefined || invite_type === undefined || !msg_text) {
      return sendResponse(res, 400, false, 'All fields are required');
    }

    // order_id & event_id (Frappe IDs) => must be string
    if (typeof order_id !== 'string') {
      return sendResponse(res, 400, false, 'order_id and event_id must be strings');
    }

    // Validate msg_medium
    const validMediums = [1,2,3]; // 1=SMS, 2=Email
    if (!validMediums.includes(Number(msg_medium))) {
      return sendResponse(res, 400, false, `Invalid msg_medium. Allowed: ${validMediums.join(', ')}`);
    }

     
    // Validate invite_type
    const validTypes = [0, 1, 2, 3]; // 0=preinvite, 1=invite, 2=reminder, 3=thank_you
    if (!validTypes.includes(Number(invite_type))) {
      return sendResponse(res, 400, false, `Invalid invite_type. Allowed: ${validTypes.join(', ')}`);
    }

    // Create new record
    const newMsgFormat = new CustomMsgFormat({
      order_id,
      msg_medium,
      invite_type,
      msg_text
    });

    await newMsgFormat.save();
    return sendResponse(res, 201, true, 'Custom message created successfully', newMsgFormat);
  } catch (error) {
    console.error('Create MsgFormat Error:', error);
    return sendResponse(res, 500, false, 'Internal server error', null, error.message);
  }
};

/** ---------------------------
 * @desc Get all message formats by Order
 * @route GET /api/msg-format/order/:order_id
 * @access Private/Admin
 * --------------------------- */
export const getMsgFormatsByOrder = async (req, res) => {
  try {
    const { order_id } = req.params;

    if (!order_id || typeof order_id !== 'string') {
      return sendResponse(res, 400, false, 'Invalid order_id');
    }

    const msgFormats = await CustomMsgFormat.find({ order_id }).lean();

    if (!msgFormats.length) {
      return sendResponse(res, 404, false, 'No custom messages found for this order');
    }

    return sendResponse(res, 200, true, 'Custom messages fetched successfully', msgFormats);
  } catch (error) {
    console.error('Get MsgFormats Error:', error);
    return sendResponse(res, 500, false, 'Internal server error', null, error.message);
  }
};

/** ---------------------------
 * @desc Update a message format
 * @route PUT /api/msg-format/:msg_id
 * @access Private/Admin
 * --------------------------- */
export const updateMsgFormat = async (req, res) => {
  try {
    const { msg_id } = req.params;
    const { msg_text } = req.body;

    if (!isValidObjectId(msg_id)) {
      return sendResponse(res, 400, false, 'Invalid msg_id format');
    }

    if (!msg_text || typeof msg_text !== 'string') {
      return sendResponse(res, 400, false, 'msg_text is required and must be a string');
    }

    const msgFormat = await CustomMsgFormat.findByIdAndUpdate(
      msg_id,
      { msg_text, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
    
    if (!msgFormat) {
      return sendResponse(res, 404, false, 'Custom message not found');
    }

    return sendResponse(res, 200, true, 'Custom message updated successfully', msgFormat);
  } catch (error) {
    console.error('Update MsgFormat Error:', error);
    return sendResponse(res, 500, false, 'Internal server error', null, error.message);
  }
};

/** ---------------------------
 * @desc Delete a message format
 * @route DELETE /api/msg-format/:msg_id
 * @access Private/Admin
 * --------------------------- */
export const deleteMsgFormat = async (req, res) => {
  try {
    const { msg_id } = req.params;

    if (!isValidObjectId(msg_id)) {
      return sendResponse(res, 400, false, 'Invalid msg_id format');
    }

    const deleted = await CustomMsgFormat.findByIdAndDelete(msg_id);

    if (!deleted) {
      return sendResponse(res, 404, false, 'Custom message not found');
    }

    return sendResponse(res, 200, true, 'Custom message deleted successfully');
  } catch (error) {
    console.error('Delete MsgFormat Error:', error);
    return sendResponse(res, 500, false, 'Internal server error', null, error.message);
  }
};
