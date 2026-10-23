import { NextResponse } from "next/server";
import {
  getAuthenticatedSupabaseUser,
  getSupabaseForRequest,
} from "@/lib/supabaseServer";
import { toPropertyUpdate, toPublicProperty } from "@/lib/propertyData";

export const dynamic = "force-dynamic";

function withPrivateData(property, privateData) {
  if (!privateData) return { ...property, _id: property.id };
  return {
    ...property,
    ...privateData,
    _id: property.id,
    location: {
      type: "Point",
      coordinates: [privateData.longitude, privateData.latitude],
    },
  };
}

export async function GET(req, { params }) {
  try {
    const supabase = getSupabaseForRequest(req);
    const user = await getAuthenticatedSupabaseUser(req, supabase);
    const { data: property, error } = await supabase
      .from("properties")
      .select("*")
      .eq("id", params.id)
      .maybeSingle();
    if (error) throw error;
    if (!property) return NextResponse.json({ error: "Property not found." }, { status: 404 });

    if (user) {
      const { data: privateData, error: privateError } = await supabase
        .from("property_private")
        .select("*")
        .eq("propertyId", params.id)
        .maybeSingle();
      if (privateError) throw privateError;
      if (privateData?.ownerUid === user.id) {
        return NextResponse.json({ property: withPrivateData(property, privateData) });
      }
      if (privateData) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle();
        if (profile?.role === "admin") {
          return NextResponse.json({ property: withPrivateData(property, privateData) });
        }
      }
    }

    return NextResponse.json({ property: toPublicProperty(property) });
  } catch (error) {
    console.error("Error fetching Supabase property:", error);
    return NextResponse.json({ error: "Failed to load property details." }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    const supabase = getSupabaseForRequest(req);
    const user = await getAuthenticatedSupabaseUser(req, supabase);
    if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

    const { data: privateData, error: privateError } = await supabase
      .from("property_private")
      .select("*")
      .eq("propertyId", params.id)
      .eq("ownerUid", user.id)
      .maybeSingle();
    if (privateError) throw privateError;
    if (!privateData) {
      return NextResponse.json({ error: "Property not found or access denied." }, { status: 404 });
    }

    const payload = await req.json();
    const updates = toPropertyUpdate(payload);
    const propertyUpdates = { ...updates };
    delete propertyUpdates.address;
    delete propertyUpdates.pincode;
    delete propertyUpdates.latitude;
    delete propertyUpdates.longitude;
    delete propertyUpdates.tourismLicenseId;

    const { data: currentProperty, error: propertyError } = await supabase
      .from("properties")
      .select("shareExactLocation")
      .eq("id", params.id)
      .maybeSingle();
    if (propertyError) throw propertyError;
    if (!currentProperty) {
      return NextResponse.json({ error: "Property not found." }, { status: 404 });
    }

    const privateUpdates = {};
    for (const field of ["address", "pincode", "latitude", "longitude", "tourismLicenseId"]) {
      if (Object.hasOwn(updates, field)) privateUpdates[field] = updates[field];
    }
    const shareExactLocation = Object.hasOwn(updates, "shareExactLocation")
      ? updates.shareExactLocation
      : currentProperty.shareExactLocation;
    const latitude = Object.hasOwn(privateUpdates, "latitude")
      ? privateUpdates.latitude
      : privateData.latitude;
    const longitude = Object.hasOwn(privateUpdates, "longitude")
      ? privateUpdates.longitude
      : privateData.longitude;
    if (shareExactLocation && (latitude == null || longitude == null)) {
      return NextResponse.json(
        { error: "Add a property location before choosing to show its exact map pin." },
        { status: 400 }
      );
    }
    const mapLocationChanged =
      Object.hasOwn(updates, "shareExactLocation") ||
      Object.hasOwn(privateUpdates, "latitude") ||
      Object.hasOwn(privateUpdates, "longitude");
    if (mapLocationChanged) {
      propertyUpdates.shareExactLocation = shareExactLocation;
      propertyUpdates.mapLatitude = shareExactLocation ? latitude : null;
      propertyUpdates.mapLongitude = shareExactLocation ? longitude : null;
    }

    const privateListingChanged = ["address", "pincode", "latitude", "longitude"]
      .some((field) => Object.hasOwn(privateUpdates, field));
    if (privateListingChanged) {
      propertyUpdates.status = "pending_review";
    }

    let updatedProperty = null;
    if (Object.keys(propertyUpdates).length) {
      const { data, error } = await supabase
        .from("properties")
        .update(propertyUpdates)
        .eq("id", params.id)
        .select("*")
        .maybeSingle();
      if (error) throw error;
      updatedProperty = data;
    }

    let updatedPrivateData = privateData;
    if (Object.keys(privateUpdates).length) {
      const { data, error } = await supabase
        .from("property_private")
        .update(privateUpdates)
        .eq("propertyId", params.id)
        .eq("ownerUid", user.id)
        .select("*")
        .single();
      if (error) throw error;
      updatedPrivateData = data;
    }

    if (!updatedProperty) {
      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .eq("id", params.id)
        .single();
      if (error) throw error;
      updatedProperty = data;
    }
    return NextResponse.json({
      success: true,
      property: withPrivateData(updatedProperty, updatedPrivateData),
    });
  } catch (error) {
    if (
      error.message?.includes("latitude") ||
      error.message?.includes("longitude") ||
      error.message?.includes("exact map location") ||
      error.message?.includes("Tourism license ID") ||
      error.message === "Invalid listing status."
    ) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("Error updating Supabase property:", error);
    return NextResponse.json({ error: "Failed to update property." }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const supabase = getSupabaseForRequest(req);
    const user = await getAuthenticatedSupabaseUser(req, supabase);
    if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

    const { data: property, error } = await supabase
      .from("properties")
      .delete()
      .eq("id", params.id)
      .select("id")
      .maybeSingle();
    if (error) throw error;
    if (!property) return NextResponse.json({ error: "Property not found or access denied." }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting Supabase property:", error);
    return NextResponse.json({ error: "Failed to delete property." }, { status: 500 });
  }
}
