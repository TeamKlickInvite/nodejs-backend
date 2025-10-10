import Group from "../models/GuestGroup.models.js"
import Joi from "joi"
import mongoose from "mongoose";
import GuestGroupRelationModels from "../models/GuestGroupRelation.models.js";


export const getGroupsByOrder = async (req, res) => {
  try {
    const { order_id } = req.params;
    const groups = await Group.find({ order_id });
    res.json(groups);
  } catch (error) {
    res.status(500).json({ message: 'Error', error: error.message });
  }
};

export const createGroup = async (req, res) => {
  try {
    const { order_id, name, category, events } = req.body;

    // Joi validation
    const schema = Joi.object({
      order_id: Joi.string().trim().required().messages({
        "string.base": "order_id must be a string",
        "any.required": "order_id is required",
      }),
      name: Joi.string().trim().min(3).max(100).required(),
      category: Joi.string().trim().min(3).max(50).required(),
      events: Joi.array().items(Joi.string().trim().required()).min(1).required()
        .messages({
          "array.base": "events must be an array of strings",
          "array.min": "At least one event is required",
        }),
    });

    const { error } = schema.validate({ order_id, name, category, events });
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }

    // ✅ Remove duplicates in events array
    const uniqueEvents = [...new Set(events)];

    // ✅ Check if group with same name + order already exists
    const existingGroup = await Group.findOne({ order_id, name: { $regex: `^${name}$`, $options: "i" } });
    if (existingGroup) {
      return res.status(400).json({
        success: false,
        message: "Group with this name already exists under the same order",
      });
    }

    const group = await Group.create({
      order_id,
      name,
      category,
      events: uniqueEvents,
    });

    return res.status(201).json({
      success: true,
      message: "Group created successfully",
      data: group,
    });
  } catch (error) {
    console.error("❌ Error creating group:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

export const addEventToGroup = async (req, res) => {
  try {
    const { group_id } = req.params;
    const { eventIds } = req.body; // ✅ Array of eventIds
    if (!Array.isArray(eventIds) || eventIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "eventIds must be a non-empty array"
      });
    }
    

    const group = await Group.findById(group_id);
    if (!group) {
      return res.status(404).json({ success: false, message: "Group not found" });
    }

    // ✅ Check existing vs new
    const alreadyExist = [];
    const newEvents = [];

    eventIds.forEach(eventId => {
      if (group.events.includes(eventId)) {
        alreadyExist.push(eventId);
      } else {
        newEvents.push(eventId);
      }
    });

    // ✅ Add only new unique events
    if (newEvents.length > 0) {
      group.events.push(...newEvents);
      await group.save();
    }

    return res.status(200).json({
      success: true,
      message: "Event(s) processed successfully",
      data: {
        added: newEvents,
        alreadyExist
      },
      group
    });
  } catch (error) {
    console.error("❌ Error adding events to group:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message
    });
  }
};


export const getGroupsByEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    if (!eventId) {
      return res.status(400).json({ success: false, message: "eventId is required" });
    }

    const groups = await Group.find({ events: eventId });
    console.log(groups)
    if (!groups || groups.length === 0) {
  return res.status(404).json({
    success: false,
    message: "No groups found for this event",
  });
}

    return res.status(200).json({
      success: true,
      message: "Groups fetched successfully",
      data: groups,
    });
  } catch (error) {
    console.error("❌ Error fetching groups:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};
export const removeEventFromGroup = async (req, res) => {
  try {
    const { group_id, eventId } = req.params;

    // ✅ Validation
    if (!group_id || !eventId) {
      return res.status(400).json({
        success: false,
        message: "group_id and eventId are required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(group_id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid group_id format",
      });
    }

    // ✅ Group me se sirf specific event ko pull karo
    const updatedGroup = await Group.findOneAndUpdate(
      { _id: group_id, events: eventId }, // ensure group match kare aur event exist kare
      { $pull: { events: eventId } },
      { new: true }
    );

    if (!updatedGroup) {
      return res.status(404).json({
        success: false,
        message: "Group not found or event not present in this group",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Event removed from group successfully",
      data: updatedGroup,
    });
  } catch (error) {
    console.error("❌ Error removing event from group:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};




export const getGroupById = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id).populate("order_id");

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found"
      });
    }

    res.json({
      success: true,
      group
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching group",
      error: error.message
    });
  }
};

export const updateGroup = async (req, res) => {
  try {
    const { group_id } = req.params;
    const { name, category, eventIds } = req.body;

    if (!mongoose.Types.ObjectId.isValid(group_id)) {
      return res.status(400).json({ success: false, message: "Invalid group_id format" });
    }

    const group = await Group.findById(group_id);
    if (!group) {
      return res.status(404).json({ success: false, message: "Group not found" });
    }

    // ✅ Update name & category (if provided)
    if (name) group.name = name.trim();
    if (category) group.category = category.trim();

    let addedEvents = [];
    let alreadyExists = [];

    if (Array.isArray(eventIds) && eventIds.length > 0) {
      eventIds.forEach(eventId => {
        if (!group.events.includes(eventId)) {
          group.events.push(eventId);
          addedEvents.push(eventId);
        } else {
          alreadyExists.push(eventId);
        }
      });
    }

    group.updatedAt = new Date();
    await group.save();

    return res.status(200).json({
      success: true,
      message: "Group updated successfully",
      data: group,
      addedEvents,
      alreadyExists
    });

  } catch (error) {
    console.error("❌ Error updating group:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message
    }); 
  }
};
export const getGroupEvents = async (req, res) => {
  try {
    const { group_id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(group_id)) {
      return res.status(400).json({ success: false, message: "Invalid group_id format" });
    }

    const group = await Group.findById(group_id).select("name category events");
    if (!group) {
      return res.status(404).json({ success: false, message: "Group not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Events fetched successfully",
      group_id: group._id,
      group_name: group.name,
      category: group.category,
      totalEvents: group.events.length,
      events: group.events
    });
  } catch (error) {
    console.error("❌ Error fetching group events:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message
    });
  }
};

// ✅ Delete Group
export const deleteGroup = async (req, res) => {
  
  try {
    console.log(req.params)
    const { group_id } = req.params;
    console.log(group_id);

    // --------------------
    // 1. Validate params
    // --------------------
    if (!group_id) {
      return res.status(400).json({
        success: false,
        message: "group_id is required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(group_id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid group_id format",
      });
    }

    // --------------------
    // 2. Check for existing relations
    // --------------------
    const relations = await GuestGroupRelationModels.find({ group_id: new mongoose.Types.ObjectId(group_id) });
    if (relations.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Guests exist, cannot delete the group",
      });
    }

    // --------------------
    // 3. Delete the group
    // --------------------
    const deletedGroup = await Group.findByIdAndDelete(group_id);
    if (!deletedGroup) {
      return res.status(404).json({
        success: false,
        message: "Group not found",
      });
    }

    // --------------------
    // 4. Response
    // --------------------
    return res.status(200).json({
      success: true,
      message: "Group deleted successfully",
      data: { group_id: deletedGroup._id },
    });
  } catch (error) {
    console.error("Error in deleteGroup:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error while deleting group",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};