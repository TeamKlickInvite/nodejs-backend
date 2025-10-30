import GuestGroupRelation from "../models/GuestGroupRelation.models.js"
import {Guest} from "../models/GuestBook.models.js"
import Group from "../models/GuestGroup.models.js"
import Rsvp from "../models/Rsvp.models.js"

/* ------------------------------------------------------------------
   POST /rsvp/:
uniqueCode
   Body:
   {
     "rsvp_status": "yes",          // yes | no | maybe
     "plus_one": true,
     "plus_one_name": "Jane Doe",
     "comments": "Looking forward!",
     "attending_events": ["event1", "event2"]
   }
   ------------------------------------------------------------------ */
export const submitRsvp = async (req, res) => {
  try {
    const { uniqueCode } = req.params;
    const {
      rsvp_status = "pending",
      // plus_one = false,
      plus_one_name = "",
      comments = "",
      attending_events = [],
    } = req.body;

    // 1️⃣ Validate invite link
    const relation = await GuestGroupRelation.findOne({ uniqueCode });
    if (!relation) {
      return res
        .status(404)
        .json({ success: false, message: "Invalid invitation link" });
    }

    // 2️⃣ Validate RSVP status
    const validStatus = ["yes", "no", "maybe", "pending"];
    if (!validStatus.includes(rsvp_status)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid rsvp_status value" });
    }

    // 3️⃣ Fetch guest & group info
    const [guest, group] = await Promise.all([
      Guest.findById(relation.guest_id).select("name displayName"),
      Group.findById(relation.group_id).select("name order_id events"),
    ]);

    // 4️⃣ Create or update RSVP
    let rsvp = await Rsvp.findOne({ relation_id: relation._id });

    if (rsvp) {
      // Update existing RSVP
      rsvp.rsvp_status = rsvp_status;
      // rsvp.plus_one = plus_one;
      rsvp.plus_one_name = plus_one_name;
      rsvp.comments = comments;
      rsvp.attending_events = attending_events;
      rsvp.responded_at = new Date();
    } else {
      // Create new RSVP entry
      rsvp = new Rsvp({
        relation_id: relation._id,
        rsvp_status,
        // plus_one,
        plus_one_name,
        comments,
        attending_events,
        responded_at: new Date(),
      });
    }

    await rsvp.save();

    // 5️⃣ Update invite status in relation
    await GuestGroupRelation.updateOne(
      { _id: relation._id },
      { $set: { "inviteStatus.invite.status": 3 } } // 3 = responded
    );

    // 6️⃣ Send response
    return res.status(200).json({
      success: true,
      message: "RSVP recorded successfully",
      data: {
        rsvp_id: rsvp._id,
        guest: {
          id: guest?._id,
          name: guest?.name,
          displayName: guest?.displayName || guest?.name,
        },
        group: {
          id: group?._id,
          name: group?.name,
          order_id: group?.order_id,
        },
        rsvp: {
          status: rsvp.rsvp_status,
          // plus_one: rsvp.plus_one,
          plus_one_name: rsvp.plus_one_name,
          comments: rsvp.comments,
          attending_events: rsvp.attending_events,
          responded_at: rsvp.responded_at,
        },
      },
    });
  } catch (err) {
    console.error("RSVP Submit Error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error while saving RSVP",
      error: err.message,
    });
  }
};

/* ------------------------------------------------------------------
   GET /rsvp/:
uniqueCode
   Guest can view their current RSVP status
   ------------------------------------------------------------------ */
export const getRsvp = async (req, res) => {
  try {
    const { 
uniqueCode } = req.params;

    // 1️⃣ Validate relation
    const relation = await GuestGroupRelation.findOne({ 
uniqueCode });
    if (!relation) {
      return res
        .status(404)
        .json({ success: false, message: "Invalid invitation link" });
    }

    // 2️⃣ Fetch RSVP + related info
    const [rsvp, guest, group] = await Promise.all([
      Rsvp.findOne({ relation_id: relation._id }).populate(
        "attending_events",
        "event_name"
      ),
      Guest.findById(relation.guest_id).select("name displayName"),
      Group.findById(relation.group_id).select("name order_id"),
    ]);

    // 3️⃣ Prepare response
    return res.status(200).json({
      success: true,
      message: "RSVP details fetched successfully",
      data: {
        guest: {
          id: guest?._id,
          name: guest?.name,
          displayName: guest?.displayName || guest?.name,
        },
        group: {
          id: group?._id,
          name: group?.name,
          order_id: group?.order_id,
        },
        rsvp: rsvp || {
          status: "pending",
          plus_one: false,
          comments: "",
          attending_events: [],
        },
      },
    });
  } catch (err) {
    console.error("RSVP Fetch Error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching RSVP",
      error: err.message,
    });
  }
};
