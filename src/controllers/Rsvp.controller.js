import GuestGroupRelation from "../models/GuestGroupRelation.models.js"
import {Guest} from "../models/GuestBook.models.js"
import Group from "../models/GuestGroup.models.js"
import Rsvp from "../models/Rsvp.models.js"

export const submitRsvp = async (req, res) => {
  try {
    const { uniqueCode } = req.params;
    const {
      rsvp_status = "pending",
      comments = "",
      attending_events = [],
      numberOfGuests = 1,
      customAnswers = {},
    } = req.body;

    // 1️⃣ Validate invitation link
    const relation = await GuestGroupRelation.findOne({ uniqueCode });
    if (!relation)
      return res.status(404).json({
        success: false,
        message: "Invalid invitation link",
      });

    // 2️⃣ Validate RSVP status
    const validStatus = ["yes", "no", "maybe", "pending"];
    if (!validStatus.includes(rsvp_status))
      return res.status(400).json({
        success: false,
        message: "Invalid rsvp_status value",
      });

    // 3️⃣ Fetch guest & group info (in parallel)
    const [guest, group] = await Promise.all([
      Guest.findById(relation.guest_id).select("name displayName"),
      Group.findById(relation.group_id).select("name order_id events"),
    ]);

    // 4️⃣ Create or update RSVP
    let rsvp = await Rsvp.findOne({ relation_id: relation._id });

    if (rsvp) {
      // update
      Object.assign(rsvp, {
        rsvp_status,
        comments,
        numberOfGuests,
        attending_events,
        customAnswers,
        responded_at: new Date(),
      });
    } else {
      // create
      rsvp = new Rsvp({
        relation_id: relation._id,
        rsvp_status,
        comments,
        attending_events,
        numberOfGuests,
        customAnswers,
        responded_at: new Date(),
      });
    }

    await rsvp.save();

    // 5️⃣ Update invite status
    await GuestGroupRelation.updateOne(
      { _id: relation._id },
      { $set: { "inviteStatus.invite.status": 3 } } // 3 = responded
    );

    // 6️⃣ Respond with success JSON
    return res.status(200).json({
      success: true,
      message: "RSVP recorded successfully",
      data: {
        rsvp_id: rsvp._id,
        guest: {
          id: guest?._id,
          name: guest?.displayName || guest?.name,
        },
        group: {
          id: group?._id,
          name: group?.name,
          order_id: group?.order_id,
        },
        rsvp: {
          status: rsvp.rsvp_status,
          comments: rsvp.comments,
          attending_events: rsvp.attending_events,
          numberOfGuests: rsvp.numberOfGuests,
          responded_at: rsvp.responded_at,
          customAnswers: rsvp.customAnswers
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
    const { uniqueCode } = req.params;

    // 1️⃣ Validate relation
    const relation = await GuestGroupRelation.findOne({ uniqueCode });
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
