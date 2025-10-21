// controllers/guestGroupRelationController.js
import mongoose from 'mongoose';
import GuestGroupRelation from '../models/GuestGroupRelation.models.js';
import Group from "../models/GuestGroup.models.js"
import shortid from "shortid";
import { Guest } from '../models/GuestBook.models.js';
import CustomMsgFormatModels from '../models/CustomMsgFormat.models.js';
import { invitationEmailTemplate } from '../Templates/invitationEmailTemplate.js';
import twilio from 'twilio';
import nodemailer from 'nodemailer';


export const addGuestsToGroup = async (req, res) => {
  try {
    const { guest_ids, group_id, order_id} = req.body;

    // 1) Basic validation
    if (!Array.isArray(guest_ids) || guest_ids.length === 0) {
      return res.status(400).json({ message: "guest_ids must be a non-empty array" });
    }
    if (!group_id || !order_id ) {
      return res.status(400).json({ message: "group_id, order_id and event_id are required" });
    }

    // 2) Validate only ObjectIds (guest_id & group_id)
    const invalid = [group_id, ...guest_ids].find(
      (id) => !mongoose.isValidObjectId(id)
    );
    if (invalid) {
      return res.status(400).json({ message: `Invalid ObjectId: ${invalid}` });
    }

    // order_id & event_id are STRING from Frappe → no ObjectId check needed

    // 3) Check existing relations
    const existing = await GuestGroupRelation.find({
      guest_id: { $in: guest_ids },
      group_id,
      order_id, // string compare
    })
      .select("guest_id")
      .lean();

    const existingIds = new Set(existing.map((e) => String(e.guest_id)));
    const newGuestIds = guest_ids.filter((id) => !existingIds.has(String(id)));
    
    if (newGuestIds.length === 0) {
      return res.status(200).json({
        message: "All guests already exist in this group/order combination",
        addedCount: 0,
        alreadyExistCount: existingIds.size,
      });
    }

    // 4) Create new docs
    const docs = newGuestIds.map((gid) => ({
      guest_id: new mongoose.Types.ObjectId(gid),
      group_id: new mongoose.Types.ObjectId(group_id),
      order_id, // keep as string
      uniqueCode: shortid.generate(),
      inviteStatus: {
        preInvite: {},
        invite: {},
        reminder: {},
        thankyou: {},
      },
      views: 0,
    }));

    // 5) Insert
    let inserted;
    try {
      inserted = await GuestGroupRelation.insertMany(docs, { ordered: false });
    } catch (err) {
      if (err && err.insertedDocs) {
        inserted = err.insertedDocs;
      } else if (err && err.code === 11000) {
        inserted = [];
      } else {
        console.error("insertMany error:", err);
        return res
          .status(500)
          .json({ message: "Error inserting relations", error: err.message });
      }
    }

    const addedCount = Array.isArray(inserted) ? inserted.length : 0;
    const alreadyExistCount = guest_ids.length - addedCount;

    return res.status(201).json({
      message: `${addedCount} guests added, ${alreadyExistCount} already existed`,
      addedCount,
      alreadyExistCount,
      relations: inserted,
    });
  } catch (err) {
    console.error("addGuestsToGroup (fatal) error:", err);
    return res
      .status(500)
      .json({ message: "Error adding guests to group", error: err.message });
  }
};

/**
 * Remove Guest from Group
 */
export const removeGuestFromGroup = async (req, res) => {
  try {
    const { relation_id } = req.params; 
    console.log(relation_id)

    const deleted = await GuestGroupRelation.findByIdAndDelete(relation_id);

    if (!deleted) {
      return res.status(404).json({ message: "Relation not found" });
    }

    res.json({ message: "Guest removed from group successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error removing guest", error: error.message });
  }

};

/**
 * Get all Guests in a Group with Group Settings
 */
export const getHostGroupGuests = async (req, res) => {
  try {
    const {  group_id } = req.params;

    // if (!mongoose.isValidObjectId(host_id) || !mongoose.isValidObjectId(group_id)) {
    //   return res.status(400).json({ message: "Invalid host_id or group_id" });
    // }

    // Step 1: Ensure group belongs to the host
    const group = await Group.findOne({ _id: group_id });
    if (!group) {
      return res.status(404).json({ message: "Group not found for this host" });
    }

    // Step 2: Lookup all guest relations for that group
    const result = await GuestGroupRelation.aggregate([
      { $match: { group_id: new mongoose.Types.ObjectId(group_id) } },
      {
        $lookup: {
          from: "guests",
          localField: "guest_id",
          foreignField: "_id",
          as: "guest"
        }
      },
      { $unwind: "$guest" },
      {
        $project: {
          group_id: 1,
          order_id: 1,
          guest_id: "$guest._id",
          guest_name: "$guest.name",
          guest_contact: "$guest.contact",
          uniqueUrl: 1,
          inviteStatus: 1,
          views: 1
        }
      }
    ]);

    res.json({
      message: "Guests fetched successfully",
      group: { id: group._id, name: group.name, settings: group.settings },
      guestCount: result.length,
      guests: result
    });
  } catch (error) {
    console.error("getHostGroupGuests error:", error);
    res.status(500).json({ message: "Error fetching host's group guests", error: error.message });
  }
};


// conrtroller for get addedGuest in relation"
export const invitedGuest = async (req, res) => {
  try {
    const { order_id } = req.params;
    if (!order_id) {
       return res.status(400).json({ success: false, message: "order_id is required" });
    }

    const result = await Group.aggregate([
      { $match: { order_id: order_id } }, // ✅ String compare (no ObjectId)
      {
        $lookup: {
          from: "guestgrouprelations",
          localField: "_id",
          foreignField: "group_id",
          as: "relations",
        },
      },
      { $unwind: "$relations" },
      {
        $lookup: {
          from: "guests",
          localField: "relations.guest_id",
          foreignField: "_id",
          as: "guests",
        },
      },
      { $unwind: "$guests" },
      {
        $group: {
          _id: "$_id",
          group_name: { $first: "$name" },
          settings: { $first: "$settings" },
          guests: {
            $push: {
              guest_id: "$guests._id",
              guest_name: "$guests.name",
              guest_contact: "$guests.contact",
              relation_id: "$relations._id",
            },
          },
        },
      },
    ]);

    if (!result.length) {
      return res
        .status(404)
        .json({ success: false, message: "No invited guests found for this order" });
    }

    res.json({ success: true, data: result });
  } catch (error) {
    console.error("❌ Error in invitedGuest:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching invited guests",
      error: error.message,
    });
  }
};



export const moveGuestToNewGroup = async (req, res) => {
  try {
    const { guest_id, current_group_id, new_group_id, order_id } = req.body;

    // ---------------- Validation ----------------

    if (!guest_id || !current_group_id || !new_group_id || !order_id) {
      return res.status(400).json({
        success: false,
        message: 'guest_id, current_group_id, new_group_id, and order_id are required'
      });
    }

    if (!mongoose.Types.ObjectId.isValid(guest_id)) {
      return res.status(400).json({ success: false, message: 'Invalid guest_id' });
    }
    if (!mongoose.Types.ObjectId.isValid(current_group_id)) {
      return res.status(400).json({ success: false, message: 'Invalid current_group_id' });
    }
    if (!mongoose.Types.ObjectId.isValid(new_group_id)) {
      return res.status(400).json({ success: false, message: 'Invalid new_group_id' });
    }

    // ---------------- Find Existing Relation ----------------
    const existingRelation = await GuestGroupRelation.findOne({
      guest_id: new mongoose.Types.ObjectId(guest_id),
      group_id: new mongoose.Types.ObjectId(current_group_id),
      order_id: order_id // order_id is string
    });

    if (!existingRelation) {
      return res.status(404).json({
        success: false,
        message: 'Guest not found in the current group for this order'
      });
    }

    // ---------------- Move Guest (Update group_id) ----------------
    existingRelation.group_id = new mongoose.Types.ObjectId(new_group_id);
    await existingRelation.save();

    return res.json({
      success: true,
      message: 'Guest moved to new group successfully',
      data: existingRelation
    });
  } catch (error) {
    console.error("❌ Error moving guest:", error);
    res.status(500).json({
      success: false,
      message: 'Error moving guest',
      error: error.message
    });
  }
};
// controllers/invitationController.js


const twilioClient = twilio(process.env.YOUR_TWILIO_ACCOUNT_SID, process.env.YOUR_TWILIO_AUTH_TOKEN);
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
  }
});

export const sendInvitation = async (req, res, next) => {
  try {
    console.log(req.body);
    const { guest_ids, medium, stage = 'invite' } = req.body;
    // Validate input
    if (!Array.isArray(guest_ids) || guest_ids.length === 0 ||
        !medium || !['email','sms','whatsapp'].includes(medium) ||
        !['preInvite','invite','reminder','thankyou'].includes(stage)) {
      return res.status(400).json({ success: false, message: 'Invalid input: guest_ids array, medium, or stage required' });
    }

    // Map medium and stage to numeric codes
    const mediumCode = medium === 'email' ? 1 : medium === 'sms' ? 2 : 3;
    const inviteTypeCode = stage === 'preInvite' ? 0 
                         : stage === 'invite'   ? 1 
                         : stage === 'reminder' ? 2 : 3;

    const successfulGuests = [];
    const failedGuests = [];
    const totalGuests = guest_ids.length;

    for (const guest_id of guest_ids) {
      let guestSuccess = true;
      try {
        const guest = await Guest.findById(guest_id);
        if (!guest) throw new Error('Guest not found');

        const relations = await GuestGroupRelation.find({ guest_id: new mongoose.Types.ObjectId(guest_id) });
        if (relations.length === 0) throw new Error('No invite relations found for guest');

        // Process each group/relation for this guest
        for (const relation of relations) {
          // Skip if this stage is already sent
          if (relation.inviteStatus[stage]?.status == inviteTypeCode ) {
            guestSuccess = false;
            failedGuests.push({
              guest_id,
              medium,
              stage,
              message: 'Already invited for this stage'
            });
            continue; // don’t attempt to send again
          }
          // Load custom message template if any
          const customMsg = await CustomMsgFormatModels.findOne({
            order_id: relation.order_id,
            invite_type: inviteTypeCode
          });
          let finalMessage;
          if (customMsg && customMsg.msg_text) {
            finalMessage = customMsg.msg_text;
          } else {
            // No custom message: use a meaningful fallback
            const name = guest.displayName || guest.name || 'Guest';
            // (Optionally fetch event/order name using relation.order_id if needed here)
            finalMessage = `Hello ${name}, you are invited! Please view your invitation here: ${relation.inviteUrl}`;
          }

          // Replace placeholders message (e.g. {{guest_name}}, {{guest_url}})
          finalMessage = finalMessage
            .replace(/\{\{guest_name\}\}/g, guest.displayName || guest.name || '')
            .replace(/\{\{guest_url\}\}/g, relation.inviteUrl);
          
          const guestName = guest.displayName || guest.name || 'Guest';
          const inviteLink = relation.uniqueUrl;
          
          const finalHTML = invitationEmailTemplate(guestName,finalMessage,inviteLink);
          console.log(finalHTML);

          // Find the appropriate contact (email or mobile) for this medium
          const contactType = (medium === 'email' ? 'email' : 'mobile');
          const contact = guest.contacts.find(c => c.type === contactType);
          if (!contact || !contact.value) {
            throw new Error(`No contact of type '${contactType}' found for guest`);
          }

          // Attempt to send the message via Twilio or email
          try {
            if (medium === 'sms' || medium === 'whatsapp') {
              const fromNumber = medium === 'whatsapp'
                ? `whatsapp:${process.env.NUMBER}`
                : process.env.NUMBER;
              const toNumber = medium === 'whatsapp'
                ? `whatsapp:${contact.value}`
                : contact.value;

              await twilioClient.messages.create({
                body: finalMessage,
                from: fromNumber,
                to: toNumber
              });
            } else if (medium === 'email') {
              await transporter.sendMail({
                from: 'shekharara926290@gmail.com', // use verified sender
                to: contact.value,
                subject: 'KlickInvite Invitation',
                html: finalHTML
              });
            }
          } catch (sendError) {
            // Log/send error for this relation, but continue processing other relations
            guestSuccess = false;
            failedGuests.push({
              guest_id,
              medium,
              stage,
              message: `Sending failed: ${sendError.message}`
            });
            continue; // skip updating status for this relation
          }

          // Update invite status on successful send
          relation.inviteStatus[stage].status = 1;
          relation.inviteStatus[stage].medium = mediumCode;
          relation.inviteStatus[stage].sentAt = new Date();
          await relation.save();
        }

        if (guestSuccess) {
          successfulGuests.push({ guest_id });
        }
      } catch (err) {
        // Failed to process this guest at some point
        guestSuccess = false;
        failedGuests.push({ guest_id, message: err.message });
      }

      // Note: guest is either in successfulGuests or failedGuests
    }

    // Respond with summary
    res.json({
      success: true,
      message: 'Invitations processed',
      data: {
        total: totalGuests,
        successfulCount: successfulGuests.length,
        failedCount: failedGuests.length,
        failed: failedGuests
      }
    });
  } catch (error) {
    // Unexpected error: pass to Express error handler or send generic failure
    console.error('Error in sendInvitation:', error);
    // In production, do not expose internal error details
    res.status(500).json({ success: false, message: 'Error sending invitations' });
    // Or use `next(error)` to delegate to Express error-handling middleware
  }
};



// controllers/msgFormatController.js (New API for Ready-Made Msg Formats for Invited Guests)
// controllers/msgFormatController.js (Updated API with invite_type)

export const getFinalMsgFormatsForInvitedGuests = async (req, res) => {
  try {
    const { order_id } = req.params;
    const { invite_type = 1 } = req.query; // Default to 'invite' (1), optional parameter
    console.log(order_id)
    console.log(invite_type)

    if (!order_id) {
      return res.status(400).json({ success: false, message: 'order_id is required' });
    }

    if (![0, 1, 2, 3].includes(Number(invite_type))) {
      return res.status(400).json({ success: false, message: 'Invalid invite_type. Use 0 (preinvite), 1 (invite), 2 (reminder), or 3 (thank_you_msg)' });
    }

    // Fetch all relations for the order
    const relations = await GuestGroupRelation.find({ order_id });
    console.log(relations)
    if (!relations.length) {
      return res.status(404).json({ success: false, message: 'No invited guests found for this order' });
    }

    const results = [];
    for (const relation of relations) {
      const guest = await Guest.findById(relation.guest_id)
      if (!guest) {
        results.push({ guest_id: relation.guest_id, message: 'Guest not found' });
        continue;
      }
      console.log(guest)

      const guestName = guest.displayName||guest.name || 'Guest';
      const uniqueUrl = relation.inviteUrl;
      console.log(guestName)
      console.log(uniqueUrl)

      // Fetch custom msg formats for the group and specific invite_type
      const customMsgs = await CustomMsgFormatModels.find({
        order_id,
        group_id: relation.group_id,
        invite_type: Number(invite_type)
      })

      const whatsappMsg = customMsgs.find(msg => msg.msg_medium === 3);
      const smsMsg = customMsgs.find(msg => msg.msg_medium === 2);
      const emailMsg = customMsgs.find(msg => msg.msg_medium === 1);
      let finalMessage = '';
            if (emailMsg && emailMsg.msg_text) {
              finalMessage = emailMsg.msg_text
                           .replace(/\{\{guest_name\}\}/g, guest.displayName || guest.name || '')
                           .replace(/\{\{guest_url\}\}/g, relation.uniqueUrl);
           } else {
                finalMessage = `Dear ${guestName}, you are invited! Please view your invitation here: ${relation.uniqueUrl}`;
                }
      const finalHTML = invitationEmailTemplate(guestName, finalMessage, uniqueUrl);

      const guestResult = {
        guest_id: relation.guest_id,
        guest_name: guestName,
        group_id: relation.group_id.toString(),
        unique_url: uniqueUrl,
        whatsapp: whatsappMsg ? whatsappMsg.msg_text
          .replace(/\{\{guest_name\}\}/g, guestName)
          .replace(/\{\{guest_url\}\}/g, uniqueUrl) : 'Create WhatsApp msg format first',
        sms: smsMsg ? smsMsg.msg_text
          .replace(/\{\{guest_name\}\}/g, guestName)
          .replace(/\{\{guest_url\}\}/g, uniqueUrl) : 'Create SMS msg format first',
        email: finalHTML ? finalHTML: 'Create Email msg format first',
        invite_type: Number(invite_type) // Include invite_type in response for clarity
      };

      results.push(guestResult);
    }

    res.json({ success: true, message: 'Final msg formats fetched', data: results });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching final msg formats', error: error.message });
  }
};

export const getWhatsappMsgForInvitedGuests = async (req, res) => {
  console.log( req.params)
  try {
    const { order_id } = req.params;
    if (!order_id) {
      return res.status(400).json({ success: false, message: 'order_id is required' });
    }

    // Fetch all relations for the order
    const relations = await GuestGroupRelation.find({ order_id });

    if (!relations.length) {
      return res.status(404).json({ success: false, message: 'No invited guests found for this order' });
    }

    const results = [];
    for (const relation of relations) {
      // Fetch custom msg for WhatsApp (medium = 3) for the group
      const customMsg = await CustomMsgFormatModels.findOne({ order_id, group_id: new mongoose.Types.ObjectId(relation.group_id), msg_medium: 3 });
      console.log(customMsg);
      if (customMsg) {
        const guest = await Guest.findById(relation.guest_id).select('name').lean();
        console.log(guest)
        const guestName = guest ? guest.name : 'Guest';
        console.log(guestName)
        const finalMessage = customMsg.msg_text 
           .replace(/\{\{guest_name\}\}/g, guest.displayName || guestName|| '')
            .replace(/\{\{guest_url\}\}/g, relation.inviteUrl);
        console.log(finalMessage)
        results.push({ guest_id: relation.guest_id, final_whatsapp_msg: finalMessage });
      } else {
        results.push({ guest_id: relation.guest_id, message: 'Create WhatsApp msg format first' });
      }
    }

    res.json({ success: true, message: 'WhatsApp messages fetched', data: results });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching WhatsApp messages', error: error.message });
  }
};

// controllers/invitationController.js
// export const sendInvitation = async (req, res) => {
//   try {
//     const { guest_ids, medium, stage = 'invite' } = req.body;
//     if (!guest_ids || !Array.isArray(guest_ids) || guest_ids.length === 0 || !medium || !['preInvite', 'invite', 'reminder', 'thankyou'].includes(stage)) {
//       return res.status(400).json({ success: false, message: 'Invalid input: guest_ids array, medium, or stage required' });
//     }

//     const mediumCode = medium === 'email' ? 1 : medium === 'sms' ? 2 : medium === 'whatsapp' ? 3 : 0;
//     const inviteTypeCode = stage === 'preInvite' ? 0 : stage === 'invite' ? 1 : stage === 'reminder' ? 2 : 3;

//     const successful = [];
//     const failed = [];
//     let total = guest_ids.length;

//     for (const guest_id of guest_ids) {
//       let relationSuccess = true;
//       try {
//         const guest = await Guest.findById(guest_id);
//         if (!guest) throw new Error('Guest not found');

//         const relations = await GuestGroupRelation.find({ guest_id: new mongoose.Types.ObjectId(guest_id) });
//         if (!relations.length) throw new Error('No relations found for guest');

//         for (const relation of relations) {
//           if (relation.inviteStatus[stage].status > 0) continue;

//           const customMsg = await CustomMsgFormatModels.findOne({ order_id: relation.order_id,  invite_type: inviteTypeCode });
//           let finalMessage = customMsg ? customMsg.msg_text : "You are invited. Link: [unique_base_url]";

//           finalMessage = finalMessage
//           .replace(/\{\{guest_name\}\}/g, guest.displayName || guest.name,'')
//           .replace(/\{\{guest_url\}\}/g, relation.uniqueUrl);

//             // .replace('[guest_url]', relation.uniqueUrl)
//             // .replace('[guest_name]', guest.displayName || '')
//             // Assume other placeholders like [event_name] are already in custom msg_text as per user input

//           const contact = guest.contacts.find(c => c.type === (medium === 'email' ? 'email' : 'mobile'));
//           if (!contact) throw new Error('No contact found for medium');

//           if (medium === 'sms' || medium === 'whatsapp') {
//             await twilioClient.messages.create({
//               body: finalMessage,
//               from: medium === 'whatsapp' ? `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}` : process.env.TWILIO_NUMBER,
//               to: medium === 'whatsapp' ? `whatsapp:${contact.value}` : contact.value
//             });
//           } else if (medium === 'email') {
//             await transporter.sendMail({
//               from: 'shekharara926290@gmail.com',
//               to: contact.value,
//               subject: 'KlickInvite Invitation',
//               html: finalMessage
//             });
//           }

//           relation.inviteStatus[stage].status = 1;
//           relation.inviteStatus[stage].medium = mediumCode;
//           relation.inviteStatus[stage].sentAt = new Date();
//           await relation.save();
//         }
//         successful.push({ guest_id });
//       } catch (error) {
//         relationSuccess = false;
//         failed.push({ guest_id, message: error.message });
//       }

//       if (relationSuccess) {
//         successful.push({ guest_id });
//       } else {
//         failed.push({ guest_id, message: error.message });
//       }
//     }

//     res.json({ success: true, message: 'Invitations processed', data: { total, successful: successful.length, left: failed.length, failed } });
//   } catch (error) {
//     res.status(500).json({ success: false, message: 'Error sending invitations', error: error.message });
//   }
// };




// export const sendInvitation = async (req, res) => {
//   try {
//     const { group_id, guest_ids, medium, message, stage = 'invite' } = req.body; // stage: 'preInvite', 'invite', 'reminder', 'thankyou'
//     if (!group_id || !medium || !message || !['preInvite', 'invite', 'reminder', 'thankyou'].includes(stage)) {
//       return res.status(400).json({ message: 'Invalid input: group_id, medium, message, or stage missing/invalid' });
//     }
//     console.log

//     // Fetch relations (bulk for group or specific guests)
//     const query = { group_id };
//     if (guest_ids && Array.isArray(guest_ids)) {
//       query.guest_id = { $in: guest_ids };
//     }
//     const relations = await GuestGroupRelation.find(query);
//     if (!relations.length) {
//       return res.status(404).json({ message: 'No relations found for this group or guests' });
//     }

//     const updatedRelations = [];
//     for (const relation of relations) {
//       // Edge case: Already sent (status > 0)
//       if (relation.inviteStatus[stage].status > 0) {
//         updatedRelations.push({ relation_id: relation._id, message: 'Already sent, skipping' });
//         continue;
//       }

//       // Update inviteStatus
//       relation.inviteStatus[stage] = {
//         status: 1, // sent
//         medium: medium === 'sms' ? 2 : medium === 'whatsapp' ? 3 : medium === 'email' ? 1 : 0,
//         sentAt: new Date()
//       };

//       // Send via medium
//       let sendSuccess = true;
//       try {
//         const guest = await Guest.findById(relation.guest_id);
//         console.log("realtion_Guest",guest);
//         const contact = guest.contacts.find(c => c.type === (medium === 'email' ? 'email' : 'mobile'));
//        console.log("contact_guest",contact);
//         if (!contact) {
//           sendSuccess = false;
//           relation.inviteStatus[stage].status = 0; // revert to pending
//           throw new Error('No contact found for medium');
//         }

//         // if (medium === 'sms' || medium === 'whatsapp') {
//         //   await twilioClient.messages.create({
//         //     body: `${message} ${relation.uniqueUrl}`,
//         //     from: medium === 'whatsapp' ? `whatsapp:${process.env.NUMBER}` : process.env.NUMBER,
//         //     to: medium === 'whatsapp' ? `whatsapp:${contact.value}` : `+91${contact.value}`
//         //   });
//          if (medium === 'sms') {
//           await twilioClient.messages.create({
//             body: `${message} ${relation.uniqueUrl}`,
//             from: process.env.NUMBER,
//             to: `+91${contact.value}`
//           });
//         } else if (medium === 'email') {
//           await transporter.sendMail({
//             from: 'shekharara926290@gmail.com',
//             to: contact.value,
//             subject: 'KlickInvite Invitation',
//             html: `${message} <a href="${relation.uniqueUrl}">View Invite</a>`
//           });
//         }
//       } catch (sendError) {
//         sendSuccess = false;
//         relation.inviteStatus[stage].status = 0; // revert
//         updatedRelations.push({ relation_id: relation._id, message: 'Sending failed', error: sendError.message });
//       }

//       if (sendSuccess) {
//         updatedRelations.push({ relation_id: relation._id, message: 'Sent successfully' });
//       }

//       await relation.save();
//     }

//     res.json({ message: 'Invitations sent', details: updatedRelations });
//   } catch (error) {
//     res.status(500).json({ message: 'Error sending invitations', error: error.message });
//   }
// };

// Add to invitationController.js or new file
// controllers/invitationController.js


export const openInvite = async (req, res) => {
  try {
    const { uniqueCode } = req.params;
    if (!uniqueCode) {
      return res.status(400).json({ success: false, message: 'Invalid unique URL' });
    }

    const relation = await GuestGroupRelation.findOne({ uniqueCode });
    if (!relation) {
      return res.status(404).json({ success: false, message: 'Invalid or expired invitation link' });
    }

    if (relation.views >= relation.maxViewsPerGuest) {
      return res.status(403).json({ success: false, message: 'View limit exceeded' });
    }

    // Update view count and status
    if (relation.inviteStatus.invite.status < 2) {
      relation.inviteStatus.invite.status = 2;
      relation.inviteStatus.invite.sentAt = new Date();
    }
    relation.views += 1;
    await relation.save();

    // Fetch guest details
    const guest = await Guest.findById(relation.guest_id).select('name displayName contacts');
    if (!guest) {
      return res.status(404).json({ success: false, message: 'Guest not found' });
    }

    // Fetch group details
    const group = await Group.findById(relation.group_id).select('name order_id settings events');
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    // // Fetch event details from Frappe (minimal call for open invite)
    // let events = [];
    // if (group.events && group.events.length > 0) {
    //   const eventPromises = group.events.map(eventId =>
    //     axios.get(`https://frappe.klickinvite.com/api/resource/Event/${eventId}`, {
    //       headers: { Authorization: `token ${process.env.FRAPPE_API_KEY}:${process.env.FRAPPE_API_SECRET}` }
    //     })
    //   );
    //   const eventResponses = await Promise.all(eventPromises);
    //   events = eventResponses.map(res => res.data.data).filter(event => event); // Filter out any failed fetches
    // }

    // Prepare response with all details
    const responseData = {
      success: true,
      message: 'Invitation opened',
      data: {
        uniqueUrl: relation.uniqueUrl,
        guest: {
          id: guest._id,
          name: guest.name,
          displayName: guest.displayName,
          contacts: guest.contacts
        },
        group: {
          id: group._id,
          name: group.name,
          order_id: group.order_id,
          settings: group.settings,
          events: group.events // Frappe event IDs
        },
        // eventDetails: events, // Enriched event data from Frappe (name, date, etc.)
        inviteStatus: relation.inviteStatus,
        views: relation.views,
        maxViewsPerGuest: relation.maxViewsPerGuest
      }
    };

    res.json(responseData);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error opening invitation', error: error.message });
  }
};


// controllers/guestGroupRelationController.js (Updated getAvailableGuestsByOrder)
export const getAvailableGuestsByOrder = async (req, res) => {
  try {
    const { host_id, order_id } = req.params;

    // --------------------
    // 1. Validate params
    // --------------------
    if (!host_id || !order_id) {
      return res.status(400).json({
        success: false,
        message: "host_id and order_id are required",
      });
    }

    // host_id must be string, order_id must be string (as per your schema)
    if (typeof host_id !== "string") {
      return res.status(400).json({
        success: false,
        message: "host_id must be a string",
      });
    }

    if (typeof order_id !== "string") {
      return res.status(400).json({
        success: false,
        message: "order_id must be a string",
      });
    }

    // --------------------
    // 2. Fetch host's guests
    // --------------------
    const allGuests = await Guest.find({ host_id })
      .select("name displayName contacts")
      .lean();

    if (!allGuests.length) {
      return res.status(404).json({
        success: false,
        message: "No guests found for this host",
      });
    }

    // --------------------
    // 3. Fetch all relations for the order
    // --------------------
    const orderRelations = await GuestGroupRelation.find({ order_id })
      .select("guest_id")
      .lean();

    const addedGuestIds = new Set(
      orderRelations.map((rel) => rel.guest_id.toString())
    );

    // --------------------
    // 4. Filter available guests (not in any relation for this order)
    // --------------------
    const availableGuests = allGuests.filter(
      (guest) => !addedGuestIds.has(guest._id.toString())
    );

    if (!availableGuests.length) {
      return res.status(404).json({
        success: false,
        message: "All guests are already added to relations for this order",
      });
    }

    // --------------------
    // 5. Response
    // --------------------
    return res.status(200).json({
      success: true,
      message: "Available guests fetched successfully",
      count: availableGuests.length,
      data: availableGuests,
    });
  } catch (error) {
    console.error("Error in getAvailableGuestsByOrder:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error while fetching available guests",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
// // Add to invitationController.js or new file
// export const openInvitation = async (req, res) => {
//   try {
//     const { uniqueUrl } = req.params;
//     const relation = await GuestGroupRelation.findOne({ uniqueUrl });
//     if (!relation) {
//       return res.status(404).json({ message: 'Invalid or expired URL' });
//     }

//     // Edge case: Max views exceeded
//     if (relation.views >= relation.maxViewsPerGuest) {
//       return res.status(403).json({ message: 'View limit exceeded' });
//     }

//     // Update views and status (e.g., to opened if not already)
//     if (relation.inviteStatus.invite.status < 2) {
//       relation.inviteStatus.invite.status = 2; // opened
//       relation.inviteStatus.invite.sentAt = new Date(); // update if needed
//     }
//     relation.views += 1;
//     await relation.save();

//     // Fetch related data (guest, group, order)
//     const populatedRelation = await GuestGroupRelation.findOne({ uniqueUrl })
//       .populate('guest_id', 'name contacts') // Get guest details
//       .populate('group_id', 'name settings'); // Get group with settings

//     res.json({
//       message: 'Invitation opened',
//       guest: populatedRelation.guest_id,
//       group: populatedRelation.group_id,
//       inviteStatus: populatedRelation.inviteStatus,
//       views: populatedRelation.views
//     });
//   } catch (error) {
//     res.status(500).json({ message: 'Error opening invitation', error: error.message });
//   }
// };