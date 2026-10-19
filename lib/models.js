import mongoose from "mongoose";

// User Schema
const UserSchema = new mongoose.Schema(
  {
    uid: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    phone: { type: String, required: true },
    place: { type: String, required: true },
    pincode: { type: String, required: true },
    verified: { type: Boolean, default: false },
    role: { type: String, enum: ["guest", "host"], default: "guest", index: true },
  },
  { timestamps: true }
);

// Property Schema
const PropertySchema = new mongoose.Schema(
  {
    ownerUid: { type: String, required: true, index: true },
    ownerEmail: { type: String, required: true, index: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: {
      type: String,
      required: true,
      enum: [
        "Residential",
        "Commercial",
        "Land",
        "Rental",
        "Royal",
        "Gold",
        "Easy",
      ],
    },
    propertyType: {
      type: String,
      enum: [
        "Hotel",
        "Resort",
        "Villa",
        "Homestay",
        "Apartment",
        "Boutique Hotel",
        "Farmhouse",
        "Holiday Home",
        "Serviced Apartment",
      ],
      default: "Apartment",
      index: true,
    },
    stayTier: {
      type: String,
      enum: ["Royal", "Gold", "Easy"],
      default: null,
      index: true,
    },
    price: { type: Number, required: true },
    priceBasis: {
      type: String,
      enum: ["night", "month", "listing"],
      default: "month",
    },
    area: { type: Number, required: true },
    bedrooms: { type: Number, default: 0 },
    bathrooms: { type: Number, default: 0 },
    capacity: { type: Number, min: 1, default: 2 },
    amenities: { type: [String], default: [] },
    petFriendly: { type: Boolean, default: false },
    instantBook: { type: Boolean, default: false },
    rating: { type: Number, min: 0, max: 5, default: null },
    reviewsCount: { type: Number, min: 0, default: 0 },
    cleaningFee: { type: Number, min: 0, default: 0 },
    images: { type: [String], default: [] },
    address: { type: String, required: true },
    city: { type: String, required: true, index: true },
    pincode: { type: String, required: true, index: true },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number], // [lng, lat]
        required: true,
      },
    },
    status: {
      type: String,
      required: true,
      enum: ["active", "sold", "inactive", "pending_review", "rejected"],
      default: "pending_review",
    },
    verificationStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },
    verificationNotes: { type: String, default: "" },
    reviewedAt: { type: Date, default: null },
    reviewedBy: { type: String, default: "" },
    isFeatured: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

// Geospatial index for nearby queries: [lng, lat] format
PropertySchema.index({ location: "2dsphere" });

// Enquiry Schema
const EnquirySchema = new mongoose.Schema(
  {
    propertyId: { type: String, required: true, index: true },
    sellerEmail: { type: String, required: true, index: true },
    buyerName: { type: String, required: true },
    buyerEmail: { type: String, required: true },
    buyerPhone: { type: String, required: true },
    message: { type: String },
    propertyLink: { type: String },
    propertyTitle: { type: String },
    recipientEmail: { type: String, index: true },
    status: { type: String, enum: ["new", "reviewed"], default: "new", index: true },
  },
  { timestamps: true }
);

// OTP Schema
const OtpSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, index: true },
  codeHash: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  attempts: { type: Number, default: 0 },
  requestedAt: { type: Date, default: Date.now },
  requestWindowStart: { type: Date, default: Date.now },
  requestCount: { type: Number, default: 1 },
});

// Helper function to get model without recompiling
export const User = mongoose.models.User || mongoose.model("User", UserSchema);
export const Property = mongoose.models.Property || mongoose.model("Property", PropertySchema);
export const Enquiry = mongoose.models.Enquiry || mongoose.model("Enquiry", EnquirySchema);
export const Otp = mongoose.models.Otp || mongoose.model("Otp", OtpSchema);
