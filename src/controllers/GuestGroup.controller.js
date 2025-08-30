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
// export const createGroup = async (req, res) => {
//   try {
//     const { order_id, name, category, eventId } = req.body;

//     // ✅ Validation
//     if (!order_id) {
//       return res.status(400).json({ success: false, message: "orderId is required" });
//     }
//     if (!name) {
//       return res.status(400).json({ success: false, message: "Group name is required" });
//     }
//     if (!eventId) {
//       return res.status(400).json({ success: false, message: "At least one eventId is required" });
//     }
//     const schema = Joi.object({
//           name: Joi.string().trim().min(3).max(100).required().messages({
//             "string.base": "name must be String",
//             "string.empty": "name is required",
//             "string.min": "name must be at least 3 characters long",
//             "string.max": "name must not exceed 100 characters",
//           }),
//           category: Joi.string().trim().min(3).max(50).required().messages({
//             "string.base": "Category must be a string",
//             "string.empty": "Category is required",
//             "string.min": "Category must be at least 3 characters long",
//             "string.max": "Category must not exceed 50 characters",
//           })
//         });
//                                   // Validate input
//         const { error } = schema.validate({ name, category });
//         if (error) {
//           return res.status(400).json({ success: false, message: error.details[0].message });
//         }
 

//     const group = await Group.create({
//       order_id,
//       name,
//       category,
//       events: [eventId], // ✅ Always wrap in array
//     });

//     return res.status(201).json({
//       success: true,
//       message: "Group created successfully",
//       data: group,
//     });
//   } catch (error) {
//     console.error("❌ Error creating group:", error.message);
//     return res.status(500).json({
//       success: false,
//       message: "Internal Server Error",
//       error: error.message,
//     });
//   }
// };


// export const addEventToGroup = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { eventId } = req.body;

//     // ✅ Validation
//     if (!eventId) {
//       return res.status(400).json({ success: false, message: "eventId is required" });
//     }

//     const group = await Group.findByIdAndUpdate(
//       id,
//       { $push: { events: eventId } }, // ✅ push single only
//       { new: true }
//     );

//     if (!group) {
//       return res.status(404).json({ success: false, message: "Group not found" });
//     }

//     return res.status(200).json({
//       success: true,
//       message: "Event added to group successfully",
//       data: group,
//     });
//   } catch (error) {
//     console.error("❌ Error adding event:", error.message);
//     return res.status(500).json({
//       success: false,
//       message: "Internal Server Error",
//       error: error.message,
//     });
//   }
// };

// export const getGroupsByEvent = async (req, res) => {
//   try {
//     const { eventId } = req.params;

//     if (!eventId) {
//       return res.status(400).json({ success: false, message: "eventId is required" });
//     }

//     const groups = await Group.find({ events: eventId });
//     console.log(groups)
//     if (!groups || groups.length === 0) {
//   return res.status(404).json({
//     success: false,
//     message: "No groups found for this event",
//   });
// }

//     return res.status(200).json({
//       success: true,
//       message: "Groups fetched successfully",
//       data: groups,
//     });
//   } catch (error) {
//     console.error("❌ Error fetching groups:", error.message);
//     return res.status(500).json({
//       success: false,
//       message: "Internal Server Error",
//       error: error.message,
//     });
//   }
// };

// // controllers/groupController.js
// export const removeEventFromGroup = async (req, res) => {
//   try {
//     const { eventId } = req.params;

//     if (!eventId) {
//       return res.status(400).json({
//         success: false,
//         message: "eventId is required",
//       });
//     }

//     // Event ko group ke array se pull karna
//     const updatedGroup = await Group.findOneAndUpdate(
//       { events: eventId },
//       { $pull: { events: eventId } },
//       { new: true }
//     );

//     if (!updatedGroup) {
//       return res.status(404).json({
//         success: false,
//         message: "No group found containing this eventId",
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       message: "Event removed from group successfully",
//       data: updatedGroup,
//     });
//   } catch (error) {
//     console.error("❌ Error removing event from group:", error.message);
//     return res.status(500).json({
//       success: false,
//       message: "Internal Server Error",
//       error: error.message,
//     });
//   }
// };




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
// 
// ✅ Get All Groups

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
