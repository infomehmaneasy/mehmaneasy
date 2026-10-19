import { NextResponse } from "next/server";
import {
  getAuthenticatedSupabaseUser,
  getSupabaseForRequest,
} from "@/lib/supabaseServer";
import { escapeLike, toPropertyUpdate, toPublicProperty } from "@/lib/propertyData";

export const dynamic = "force-dynamic";

const PROPERTY_TYPES = [
  "Hotel",
  "Resort",
  "Villa",
  "Homestay",
  "Apartment",
  "Boutique Hotel",
  "Farmhouse",
  "Holiday Home",
  "Serviced Apartment",
];

function validNumberParam(value, { integer = false, min = 0 } = {}) {
  if (value === null || value === "") return null;
  const number = Number(value);
  if (!Number.isFinite(number) || number < min || (integer && !Number.isInteger(number))) {
    return undefined;
  }
  return number;
}

export async function GET(req) {
  try {
    const url = new URL(req.url);
    const supabase = getSupabaseForRequest(req);
    const ownerUid = url.searchParams.get("ownerUid");
    let user = null;

    if (ownerUid) {
      user = await getAuthenticatedSupabaseUser(req, supabase);
      if (!user || user.id !== ownerUid) {
        return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
      }
    }

    const minPrice = validNumberParam(url.searchParams.get("minPrice"));
    const maxPrice = validNumberParam(url.searchParams.get("maxPrice"));
    const bedrooms = validNumberParam(url.searchParams.get("bedrooms"), { integer: true });
    const guests = validNumberParam(url.searchParams.get("guests"), { integer: true, min: 1 });
    const invalidNumber = [minPrice, maxPrice, bedrooms, guests].some((value) => value === undefined);
    if (invalidNumber || (minPrice !== null && maxPrice !== null && minPrice > maxPrice)) {
      return NextResponse.json({ error: "Invalid numeric search filter." }, { status: 400 });
    }

    const propertyType = url.searchParams.get("propertyType");
    if (propertyType && !PROPERTY_TYPES.includes(propertyType)) {
      return NextResponse.json({ error: "Invalid property type." }, { status: 400 });
    }
    const stayTier = url.searchParams.get("stayTier");
    if (stayTier && !["Royal", "Gold", "Easy"].includes(stayTier)) {
      return NextResponse.json({ error: "Invalid stay category." }, { status: 400 });
    }
    const amenity = url.searchParams.getAll("amenity").slice(0, 20);
    if (amenity.some((item) => !item || item.length > 60)) {
      return NextResponse.json({ error: "Invalid amenity filter." }, { status: 400 });
    }

    for (const filterName of ["petFriendly", "instantBook", "pool"]) {
      const filterValue = url.searchParams.get(filterName);
      if (filterValue !== null && !["true", "false"].includes(filterValue)) {
        return NextResponse.json({ error: `Invalid ${filterName} filter.` }, { status: 400 });
      }
    }

    const lat = validNumberParam(url.searchParams.get("lat"), { min: -90 });
    const lng = validNumberParam(url.searchParams.get("lng"), { min: -180 });
    if (lat === undefined || lng === undefined || (lat !== null && Math.abs(lat) > 90) || (lng !== null && Math.abs(lng) > 180)) {
      return NextResponse.json({ error: "Invalid location coordinates." }, { status: 400 });
    }
    if ((lat === null) !== (lng === null)) {
      return NextResponse.json({ error: "Both location coordinates are required." }, { status: 400 });
    }

    let ownerPrivateListings = null;
    let query = supabase.from("properties").select("*");
    if (ownerUid) {
      const { data: privateListings, error: privateError } = await supabase
        .from("property_private")
        .select("propertyId,ownerUid,ownerEmail,address,pincode,latitude,longitude")
        .eq("ownerUid", user.id);
      if (privateError) throw privateError;
      ownerPrivateListings = privateListings || [];
      const ids = (privateListings || []).map((listing) => listing.propertyId);
      if (ids.length === 0) return NextResponse.json({ properties: [] });
      query = query.in("id", ids);
    } else {
      query = query.eq("status", "active").eq("verificationStatus", "approved");
    }

    if (propertyType) query = query.eq("propertyType", propertyType);
    if (stayTier) query = query.eq("stayTier", stayTier);
    if (minPrice !== null) query = query.gte("price", minPrice);
    if (maxPrice !== null) query = query.lte("price", maxPrice);
    if (bedrooms !== null) query = query.gte("bedrooms", bedrooms);
    if (guests !== null) query = query.gte("capacity", guests);
    if (amenity.length) query = query.contains("amenities", amenity);
    if (url.searchParams.get("petFriendly") === "true") query = query.eq("petFriendly", true);
    if (url.searchParams.get("instantBook") === "true") query = query.eq("instantBook", true);
    if (url.searchParams.get("pool") === "true") query = query.contains("amenities", ["Swimming pool"]);

    const keyword = (url.searchParams.get("keyword") || "").trim().slice(0, 80);
    if (keyword) {
      const pattern = `%${escapeLike(keyword)}%`;
      query = query.or(`title.ilike.${pattern},city.ilike.${pattern}`);
    }

    const { data, error } = await query
      .order("isFeatured", { ascending: false })
      .order("createdAt", { ascending: false })
      .limit(100);
    if (error) throw error;

    let properties = data || [];
    if (ownerUid) {
      const privateById = new Map((ownerPrivateListings || []).map((item) => [item.propertyId, item]));
      properties = properties.map((property) => {
        const privateData = privateById.get(property.id);
        return {
          ...property,
          ...privateData,
          _id: property.id,
          location: privateData
            ? { type: "Point", coordinates: [privateData.longitude, privateData.latitude] }
            : null,
        };
      });
    } else {
      properties = properties.map(toPublicProperty);
    }

    return NextResponse.json({ properties });
  } catch (error) {
    console.error("Error fetching Supabase properties:", error);
    if (error.code === "PGRST205" || error.code === "42P01") {
      return NextResponse.json(
        {
          error:
            "The stay database is not initialized. In Supabase Dashboard → SQL Editor, run supabase/migrations/202610190001_marketplace.sql, then try again.",
          setupRequired: true,
        },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: "Failed to load properties." }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const supabase = getSupabaseForRequest(req);
    const user = await getAuthenticatedSupabaseUser(req, supabase);
    if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    if (!user.email_confirmed_at) {
      return NextResponse.json({ error: "Verify your email before listing a stay." }, { status: 403 });
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role,verified")
      .eq("id", user.id)
      .single();
    if (profileError) throw profileError;
    if (profile.role !== "host" || !profile.verified) {
      return NextResponse.json({ error: "A verified host account is required to list a stay." }, { status: 403 });
    }

    const payload = await req.json();
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
      return NextResponse.json({ error: "Invalid property submission." }, { status: 400 });
    }
    const data = toPropertyUpdate(payload);
    if (
      !data.title?.trim() ||
      !data.description?.trim() ||
      !data.price ||
      !data.city?.trim() ||
      !data.address?.trim() ||
      !data.pincode?.trim() ||
      !PROPERTY_TYPES.includes(data.propertyType) ||
      !["Royal", "Gold", "Easy"].includes(data.stayTier) ||
      !["night", "month"].includes(data.priceBasis) ||
      !Array.isArray(data.images) ||
      data.images.length < 3 ||
      data.images.length > 30 ||
      data.images.some((image) => typeof image !== "string" || image.length > 2048)
    ) {
      return NextResponse.json(
        { error: "Complete the stay details, choose a collection and price period, and add at least three valid photos." },
        { status: 400 }
      );
    }
    const price = Number(data.price);
    if (!Number.isFinite(price) || price <= 0) {
      return NextResponse.json({ error: "Price must be a positive amount." }, { status: 400 });
    }
    data.price = price;
    data.area = Number(data.area || 0);
    data.category = data.stayTier;

    const publicData = {
      ...data,
      city: data.city.trim(),
    };
    for (const field of ["status", "address", "pincode", "latitude", "longitude", "lat", "lng"]) {
      delete publicData[field];
    }
    const privateData = {
      address: data.address.trim(),
      pincode: data.pincode.trim(),
      latitude: data.latitude ?? null,
      longitude: data.longitude ?? null,
    };
    delete publicData.lat;
    delete publicData.lng;

    const { data: property, error } = await supabase.rpc("create_host_property", {
      property_data: publicData,
      private_data: privateData,
    });
    if (error) throw error;
    return NextResponse.json({ success: true, property }, { status: 201 });
  } catch (error) {
    if (
      error.message?.includes("latitude") ||
      error.message?.includes("longitude") ||
      error.message === "Invalid listing status."
    ) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("Error creating Supabase property:", error);
    return NextResponse.json({ error: "Failed to create property." }, { status: 500 });
  }
}
