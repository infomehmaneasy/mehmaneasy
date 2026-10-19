import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { Property } from "@/lib/models";
import { adminAuth } from "@/lib/firebaseAdmin";
import { toPublicProperty, toPropertyUpdate } from "@/lib/propertyData";

async function getUserFromRequest(req) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  const token = authHeader.split("Bearer ")[1];
  try {
    return await adminAuth.verifyIdToken(token);
  } catch (e) {
    return null;
  }
}

export async function GET(req, { params }) {
  try {
    const { id } = params;
    const user = await getUserFromRequest(req);
    await dbConnect();
    const property = await Property.findOne({
      _id: id,
      $or: [
        { status: "active", verificationStatus: "approved" },
        ...(user ? [{ ownerUid: user.uid }] : []),
      ],
    });
    if (!property) {
      return NextResponse.json({ error: "Property not found." }, { status: 404 });
    }

    return NextResponse.json({
      property:
        user && property.ownerUid === user.uid
          ? property
          : toPublicProperty(property),
    });
  } catch (error) {
    console.error("Error fetching property details:", error);
    return NextResponse.json({ error: error.message || "Failed to load property details." }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    const { id } = params;
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
    await dbConnect();

    const property = await Property.findById(id);
    if (!property) {
      return NextResponse.json({ error: "Property not found." }, { status: 404 });
    }

    if (property.ownerUid !== user.uid) {
      return NextResponse.json({ error: "Forbidden: You are not the owner of this property." }, { status: 403 });
    }

    const payload = await req.json();
    const updateData = toPropertyUpdate(payload);
    const listingChanged = Object.keys(updateData).some((key) => key !== "status");
    if (listingChanged) {
      updateData.verificationStatus = "pending";
      updateData.verificationNotes = "";
      updateData.status = "pending_review";
    }

    const updatedProperty = await Property.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    return NextResponse.json({ success: true, property: updatedProperty });
  } catch (error) {
    if (
      error.message === "Invalid listing status." ||
      error.message.includes("latitude") ||
      error.message.includes("longitude") ||
      error.name === "ValidationError" ||
      error.name === "CastError"
    ) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("Error updating property:", error);
    return NextResponse.json({ error: error.message || "Failed to update property." }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const { id } = params;
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
    await dbConnect();

    const property = await Property.findById(id);
    if (!property) {
      return NextResponse.json({ error: "Property not found." }, { status: 404 });
    }

    if (property.ownerUid !== user.uid) {
      return NextResponse.json({ error: "Forbidden: You are not the owner of this property." }, { status: 403 });
    }

    await Property.findByIdAndDelete(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting property:", error);
    return NextResponse.json({ error: error.message || "Failed to delete property." }, { status: 500 });
  }
}
