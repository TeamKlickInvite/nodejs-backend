// controllers/guestGroupRelationController.js
import mongoose from 'mongoose';
import GuestGroupRelation from '../models/GuestGroupRelation.models.js';
import Group from "../models/GuestGroup.models.js"
import shortid from "shortid";


/**
 * Add multiple guests to a group for an order.
 * Uses insertMany on Mongoose documents so schema defaults (uniqueUrl, inviteStatus) apply.
 */
export const addGuestsToGroup = async (req, res) => {
  try {
    const { guest_ids, group_id, order_id } = req.body;

    if (!Array.isArray(guest_ids) || guest_ids.length === 0) {
      return res.status(400).json({ message: "guest_ids must be a non-empty array" });
    }
    if (!group_id || !order_id) {
      return res.status(400).json({ message: "group_id and order_id are required" });
    }

    // Validate IDs quickly
    const invalid = [group_id, order_id, ...guest_ids].find(id => !mongoose.isValidObjectId(id));
    if (invalid) {
      return res.status(400).json({ message: `Invalid ObjectId: ${invalid}` });
    }

    // 1) find existing relations (so we do not try to insert duplicates)
    const existing = await GuestGroupRelation.find({
      guest_id: { $in: guest_ids },
      group_id,
      order_id
    }).select("guest_id").lean();

    const existingIds = new Set(existing.map(e => String(e.guest_id)));
    const newGuestIds = guest_ids.filter(id => !existingIds.has(String(id)));

    // If nothing new, return clear response
    if (newGuestIds.length === 0) {
      return res.status(200).json({
        message: "All guests already exist in this group/order combination",
        addedCount: 0,
        alreadyExistCount: existingIds.size
      });
    }

    // 2) create docs with fields (explicitly include defaults you want applied)
    // We include uniqueUrl here so insertMany doesn't rely on schema default behavior in case driver bypasses it.
    const docs = newGuestIds.map(gid => ({
      guest_id: new mongoose.Types.ObjectId(gid),
      group_id:  new mongoose.Types.ObjectId(group_id),
      order_id: new mongoose.Types.ObjectId(order_id),
      // uniqueUrl: `https://klickinvite.com/invite/${shortid.generate()}`,
      // inviteStatus: {
      //   preInvite: {},
      //   invite: {},
      //   reminder: {},
      //   thankyou: {}
      // },
      // views: 0
    }));

    // 3) Insert with insertMany so Mongoose applies validation and returns documents
    // ordered:false allows partial success (skip duplicates if any race)
    let inserted;
    try {
      inserted = await GuestGroupRelation.insertMany(docs, { ordered: false });
    } catch (err) {
      // insertMany can throw BulkWriteError for duplicates; but inserted docs (if any) will be in err result.
      // We'll still try to salvage inserted docs if available.
      if (err && err.insertedDocs) {
        inserted = err.insertedDocs;
      } else if (err && err.code === 11000) {
        // duplicate key — none inserted, but previously existing
        inserted = [];
      } else {
        // validation or other error — bubble up
        console.error("insertMany error:", err);
        return res.status(500).json({ message: "Error inserting relations", error: err.message });
      }
    }

    const addedCount = Array.isArray(inserted) ? inserted.length : 0;
    const alreadyExistCount = guest_ids.length - addedCount;

    // Optionally return inserted docs
    return res.status(201).json({
      message: `${addedCount} guests added, ${alreadyExistCount} already existed`,
      addedCount,
      alreadyExistCount,
      relations: inserted
    });
  } catch (err) {
    console.error("addGuestsToGroup (fatal) error:", err);
    return res.status(500).json({ message: "Error adding guests to group", error: err.message });
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
export const getGroupGuestsWithSettings = async (req, res) => {
  try {
    const { group_id } = req.params;

    const result = await Group.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(group_id) } },
      {
        $lookup: {
          from: "guestgrouprelations",
          localField: "_id",
          foreignField: "group_id",
          as: "relations"
        }
      },
      { $unwind: "$relations" },
      {
        $lookup: {
          from: "guests",
          localField: "relations.guest_id",
          foreignField: "_id",
          as: "guest"
        }
      },
      { $unwind: "$guest" },
      {
        $project: {
          group_name: "$name",
          settings: 1,
          guest_id: "$guest._id",
          guest_name: "$guest.name",
          guest_contact: "$guest.contact",
          invite_status: "$relations.inviteStatus",
          uniqueUrl: "$relations.uniqueUrl"
        }
      }
    ]);

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: "Error fetching group guests", error: error.message });
  }
};
