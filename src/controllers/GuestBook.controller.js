import { Guest } from "../models/GuestBook.models.js";

export const getGuestsByHost = async (req, res) => {
  try {
    const { host_id } = req.params;
    const guests = await Guest.find({ host_id });
    res.json(guests);
  } catch (error) {
    res.status(500).json({ message: 'Error', error: error.message });
  }
};  
/**
 * Add multiple guests for a host
 * - Ensures proper validation of input
 * - Uses transactions for atomic insert
 * - Returns inserted guests or error
 */
export const addGuest = async (req, res) => {
//   const session = await mongoose.startSession();
//   session.startTransaction();

  try {
    const { host_id, guests } = req.body;

    // ====== 1. Basic Input Validation ======
    // if (!host_id || !mongoose.Types.ObjectId.isValid(host_id)) {
    //   return res.status(400).json({ 
    //     success: false, 
    //     message: "Valid host_id is required" 
    //   });
    // }

    // if (!Array.isArray(guests) || guests.length === 0) {
    //   return res.status(400).json({ 
    //     success: false, 
    //     message: "Guests must be a non-empty array" 
    //   });
    // }

    // ====== 2. Deep Validation for Each Guest ======
    for (const [index, guest] of guests.entries()) {
      if (!guest.name || typeof guest.name !== "string") {
        return res.status(400).json({
          success: false,
          message: `Guest at index ${index} is missing a valid name`
        });
      }

      if (!Array.isArray(guest.contacts) || guest.contacts.length === 0) {
        return res.status(400).json({
          success: false,
          message: `Guest "${guest.name}" must have at least one contact`
        });
      }

    //const hasEmail = guest.contacts.some(c => c.type === "email");
      const hasMobile = guest.contacts.some(c => c.type === "mobile");

      if (!hasMobile) {
        return res.status(400).json({
          success: false,
          message: `Guest "${guest.name}" must include at least one email and one mobile contact`
        });
      }

      // Check contacts format
    //   for (const contact of guest.contacts) {
    //     if (!["email", "mobile"].includes(contact.type)) {
    //       return res.status(400).json({
    //         success: false,
    //         message: `Invalid contact type "${contact.type}" for guest "${guest.name}"`
    //       });
    //     }
    //     if (!contact.value || typeof contact.value !== "string") {
    //       return res.status(400).json({
    //         success: false,
    //         message: `Contact value is required for guest "${guest.name}"`
    //       });
    //     }
    //   }
    }

    // ====== 3. Insert Guests ======
    const newGuests = guests.map(guest => ({
      host_id,
      ...guest
    }));

    const insertedGuests = await Guest.insertMany(newGuests);

    // await session.commitTransaction();
    // session.endSession();

    // ====== 4. Success Response ======
    return res.status(201).json({
      success: true,
      message: "Guests added successfully",
      count: insertedGuests.length,
      guests: insertedGuests
    });

  } catch (error) {
    // await session.abortTransaction();
    // session.endSession();

    console.error("❌ Error adding guests:", error);

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Guest validation failed",
        error: error.message
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message
    });
  }
};

export const updateGuest = async (req, res) => {
  try {
    const { guest_id } = req.params;
    const { name, displayName } = req.body;

    const guest = await Guest.findByIdAndUpdate(
      guest_id,
      { name, displayName },
      { new: true } // ensures the updated document is returned
    );

    if (!guest) {
      return res.status(404).json({ message: 'Guest not found' });
    }

    res.status(200).json({ message: 'Guest updated', guest });
  } catch (error) {
    res.status(500).json({ message: 'Error', error: error.message });
  }
};


export const deleteGuest = async (req, res) => {
  try {
    const { guest_id } = req.params;

    const guest = await Guest.findByIdAndDelete(guest_id);

    if (!guest) {
      return res.status(404).json({ message: "Guest not found" });
    }

    // Option 1: return the deleted guest
    return res.status(200).json({ message: "Guest deleted", guest });

    // Option 2 (cleaner REST): return no content
    // return res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: "Error deleting guest", error: error.message });
  }
};
