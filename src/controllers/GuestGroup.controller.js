import Group from "../models/GuestGroup.models.js"
import Joi from "joi"


export const getGroupsByOrder = async (req, res) => {
  try {
    const { order_id } = req.params;
    const groups = await Group.find({ order_id });
    res.json(groups);
  } catch (error) {
    res.status(500).json({ message: 'Error', error: error.message });
  }
};

// ✅ Create Group
export const createGroup = async (req, res) => {
  try {
    const { order_id, name, category } = req.body;
    const schema = Joi.object({
          name: Joi.string().trim().min(3).max(100).required().messages({
            "string.base": "Tittle must be String",
            "string.empty": "Title is required",
            "string.min": "Title must be at least 3 characters long",
            "string.max": "Title must not exceed 100 characters",
          }),
          category: Joi.string().trim().min(3).max(50).required().messages({
            "string.base": "Category must be a string",
            "string.empty": "Category is required",
            "string.min": "Category must be at least 3 characters long",
            "string.max": "Category must not exceed 50 characters",
          })
        });
                                  // Validate input
        const { error } = schema.validate({ name, category });
        if (error) {
          return res.status(400).json({ success: false, message: error.details[0].message });
        }
 

    const newGroup = new Group({ order_id, name, category });
    await newGroup.save();

    res.status(201).json({
      success: true,
      message: "Group created successfully",
      group: newGroup
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error creating group",
      error: error.message
    });
  }
};

// ✅ Get All Groups
export const getGroups = async (req, res) => {
  try {
    const groups = await Group.find().populate("order_id", "orderNumber status"); // populate order if needed

    res.json({
      success: true,
      count: groups.length,
      groups
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching groups",
      error: error.message
    });
  }
};

// ✅ Get Single Group by ID
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

// ✅ Update Group
export const updateGroup = async (req, res) => {
  try {
    const updatedGroup = await Group.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedGroup) {
      return res.status(404).json({
        success: false,
        message: "Group not found"
      });
    }

    res.json({
      success: true,
      message: "Group updated successfully",
      group: updatedGroup
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating group",
      error: error.message
    });
  }
};

// ✅ Delete Group
export const deleteGroup = async (req, res) => {
  try {
    const deletedGroup = await Group.findByIdAndDelete(req.params.id);

    if (!deletedGroup) {
      return res.status(404).json({
        success: false,
        message: "Group not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Group deleted successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting group",
      error: error.message
    });
  }
};
