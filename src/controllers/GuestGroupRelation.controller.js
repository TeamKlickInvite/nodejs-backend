// controllers/guestGroupRelationController.js
import mongoose from 'mongoose';
import GuestGroupRelation from '../models/GuestGroupRelation.models.js';
import Group from "../models/GuestGroup.models.js"
import shortid from "shortid";
import { Guest } from '../models/GuestBook.models.js';


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
      uniqueUrl: `https://klickinvite.com/invite/${shortid.generate()}`,
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

export const moveMultipleGuests = async (req, res) => {
 
  try {
    const { relation_id, relation_ids, to_group_id } = req.body;
    console.log(relation_id)
    console.log(relation_ids)
    console.log(to_group_id)

    // === Validation ===
    const incoming = Array.isArray(relation_ids) && relation_ids.length ? relation_ids
                    : (relation_id ? [relation_id] : []);
    if (!incoming.length) {
      return res.status(400).json({ success: false, message: 'relation_id or relation_ids is required' });
    }
    if (!to_group_id || !mongoose.Types.ObjectId.isValid(to_group_id)) {
      return res.status(400).json({ success: false, message: 'Valid to_group_id is required' });
    }

    // Validate each relation id
    for (const rid of incoming) {
      if (!mongoose.Types.ObjectId.isValid(rid)) {
        return res.status(400).json({ success: false, message: `Invalid relation_id: ${rid}` });
      }
    }

    const relationObjectIds = incoming.map(id => new mongoose.Types.ObjectId(id));
const toGroupObjectId = new mongoose.Types.ObjectId(to_group_id);

    // Fetch all relations
    const relations = await GuestGroupRelation.find({ _id: { $in: relationObjectIds } }).lean();
    if (!relations.length) {
      return res.status(404).json({ success: false, message: 'No relations found for provided relation_id(s)' });
    }

    // Ensure all relations belong to the same order
    const firstOrder = String(relations[0].order_id ?? relations[0].orderId ?? relations[0].order); // tolerant
    if (!relations.every(r => String(r.order_id ?? r.orderId ?? r.order) === firstOrder)) {
      return res.status(400).json({ success: false, message: 'All relations must belong to the same order' });
    }

    // Validate target group exists and belongs to same order
    const targetGroup = await Group.findById(toGroupObjectId).lean();
    if (!targetGroup) {
      return res.status(404).json({ success: false, message: 'Target group not found' });
    }
    const targetOrder = String(targetGroup.order_id ?? targetGroup.orderId ?? targetGroup.order);
    if (targetOrder !== firstOrder) {
      return res.status(400).json({ success: false, message: 'Target group does not belong to the same order as relations' });
    }

    // Prepare results
    const moved = [];
    const skipped = [];

    // Use transaction for safety (if the Mongo deployment supports it)
      // Process serially to keep logic simple and clear (could be parallelized carefully)
      for (const rel of relations) {
        // Look for duplicate in target: same guest + same order + same event (if event_id exists)
        const dupQuery = {
          guest_id: rel.guest_id,
          group_id: toGroupObjectId,
          order_id: rel.order_id ?? rel.orderId ?? rel.order
        };
        if (rel.event_id) dupQuery.event_id = rel.event_id;
        const updated = await GuestGroupRelation.findByIdAndUpdate(
          rel._id,
          { $set: { group_id: toGroupObjectId } },
        );

        // If update somehow fails due to uniqueness race, handle in catch below
        moved.push(updated);
      }


    return res.status(200).json({
      success: true,
      message: 'Move operation completed',
      counts: { moved: moved.length, skipped: skipped.length, requested: incoming.length },
      moved,
      skipped
    });

  } catch (err) {
    // Ensure session cleanup
    try { await session.abortTransaction(); } catch (e) { /* ignore */ }

    // Handle duplicate write error gracefully
    if (err && err.code === 11000) {
      return res.status(409).json({ success: false, message: 'Duplicate detected during move (race condition)', error: err.message });
    }

    console.error('moveRelationsByRelationIds error:', err);
    return res.status(500).json({ success: false, message: 'Internal Server Error', error: err.message });
  }
};






// controllers/invitationController.js
import twilio from 'twilio';
import nodemailer from 'nodemailer';

const twilioClient = twilio(process.env.YOUR_TWILIO_ACCOUNT_SID, process.env.YOUR_TWILIO_AUTH_TOKEN);
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
  }
});

export const sendInvitation = async (req, res) => {
  try {
    const { group_id, guest_ids, medium, message, stage = 'invite' } = req.body; // stage: 'preInvite', 'invite', 'reminder', 'thankyou'
    if (!group_id || !medium || !message || !['preInvite', 'invite', 'reminder', 'thankyou'].includes(stage)) {
      return res.status(400).json({ message: 'Invalid input: group_id, medium, message, or stage missing/invalid' });
    }
    console.log

    // Fetch relations (bulk for group or specific guests)
    const query = { group_id };
    if (guest_ids && Array.isArray(guest_ids)) {
      query.guest_id = { $in: guest_ids };
    }
    const relations = await GuestGroupRelation.find(query);
    if (!relations.length) {
      return res.status(404).json({ message: 'No relations found for this group or guests' });
    }

    const updatedRelations = [];
    for (const relation of relations) {
      // Edge case: Already sent (status > 0)
      if (relation.inviteStatus[stage].status > 0) {
        updatedRelations.push({ relation_id: relation._id, message: 'Already sent, skipping' });
        continue;
      }

      // Update inviteStatus
      relation.inviteStatus[stage] = {
        status: 1, // sent
        medium: medium === 'sms' ? 2 : medium === 'whatsapp' ? 3 : medium === 'email' ? 1 : 0,
        sentAt: new Date()
      };

      // Send via medium
      let sendSuccess = true;
      try {
        const guest = await Guest.findById(relation.guest_id);
        console.log("realtion_Guest",guest);
        const contact = guest.contacts.find(c => c.type === (medium === 'email' ? 'email' : 'mobile'));
       console.log("contact_guest",contact);
        if (!contact) {
          sendSuccess = false;
          relation.inviteStatus[stage].status = 0; // revert to pending
          throw new Error('No contact found for medium');
        }

        // if (medium === 'sms' || medium === 'whatsapp') {
        //   await twilioClient.messages.create({
        //     body: `${message} ${relation.uniqueUrl}`,
        //     from: medium === 'whatsapp' ? `whatsapp:${process.env.NUMBER}` : process.env.NUMBER,
        //     to: medium === 'whatsapp' ? `whatsapp:${contact.value}` : `+91${contact.value}`
        //   });
         if (medium === 'sms') {
          await twilioClient.messages.create({
            body: `${message} ${relation.uniqueUrl}`,
            from: process.env.NUMBER,
            to: `+91${contact.value}`
          });
        } else if (medium === 'email') {
          await transporter.sendMail({
            from: 'shekharara926290@gmail.com.com',
            to: contact.value,
            subject: 'KlickInvite Invitation',
            html: `${message} <a href="${relation.uniqueUrl}">View Invite</a>`
          });
        }
      } catch (sendError) {
        sendSuccess = false;
        relation.inviteStatus[stage].status = 0; // revert
        updatedRelations.push({ relation_id: relation._id, message: 'Sending failed', error: sendError.message });
      }

      if (sendSuccess) {
        updatedRelations.push({ relation_id: relation._id, message: 'Sent successfully' });
      }

      await relation.save();
    }

    res.json({ message: 'Invitations sent', details: updatedRelations });
  } catch (error) {
    res.status(500).json({ message: 'Error sending invitations', error: error.message });
  }
};

// Add to invitationController.js or new file
export const openInvitation = async (req, res) => {
  try {
    const { uniqueUrl } = req.params;
    const relation = await GuestGroupRelation.findOne({ uniqueUrl });
    if (!relation) {
      return res.status(404).json({ message: 'Invalid or expired URL' });
    }

    // Edge case: Max views exceeded
    if (relation.views >= relation.maxViewsPerGuest) {
                                                                                                                                                                                                                                                       
      return res.status(403).json({ message: 'View limit exceeded' });
    }

    // Update views and status (e.g., to opened if not already)
    if (relation.inviteStatus.invite.status < 2) {
      relation.inviteStatus.invite.status = 2; // opened
      relation.inviteStatus.invite.sentAt = new Date(); // update if needed
    }
    relation.views += 1;
    await relation.save();

    // Fetch related data (guest, group, order)
    const populatedRelation = await GuestGroupRelation.findOne({ uniqueUrl })
      .populate('guest_id', 'name contacts') // Get guest details
      .populate('group_id', 'name settings'); // Get group with settings

    res.json({
      message: 'Invitation opened',
      guest: populatedRelation.guest_id,
      group: populatedRelation.group_id,
      inviteStatus: populatedRelation.inviteStatus,
      views: populatedRelation.views
    });
  } catch (error) {
    res.status(500).json({ message: 'Error opening invitation', error: error.message });
  }
};



export const getAvailableGuestsByGroup = async (req, res) => {
  try {
    const { host_id, group_id } = req.params;

    // --------------------
    // 1. Validate params
    // --------------------
    if (!host_id || !group_id) {
      return res.status(400).json({
        success: false,
        message: "host_id and group_id are required",
      });
    }

    // host_id must be string, group_id must be ObjectId
    if (typeof host_id !== "string") {
      return res.status(400).json({
        success: false,
        message: "host_id must be a string",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(group_id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid group_id format",
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
    // 3. Fetch group relations
    // --------------------
    const groupRelations = await GuestGroupRelation.find({
      group_id: new mongoose.Types.ObjectId(group_id),
    })
      .select("guest_id")
      .lean();
   

    const addedGuestIds = new Set(
      groupRelations.map((rel) => rel.guest_id.toString())
    );

    // --------------------
    // 4. Filter available guests
    // --------------------
    const availableGuests = allGuests.filter(
      (guest) => !addedGuestIds.has(guest._id.toString())
    );

    if (!availableGuests.length) {
      return res.status(404).json({
        success: false,
        message: "all guests are already added ",
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
    console.error("Error in getAvailableGuestsByGroup:", error);

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