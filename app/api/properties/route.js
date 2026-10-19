import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { Property, User } from "@/lib/models";
import { adminAuth } from "@/lib/firebaseAdmin";
import { escapeRegex, toPublicProperty, toPropertyUpdate } from "@/lib/propertyData";

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

export async function GET(req) {
  try {
    const url = new URL(req.url);
    const ownerUid = url.searchParams.get("ownerUid") || "";
    let user = null;
    if (ownerUid) {
      user = await getUserFromRequest(req);
      if (!user || user.uid !== ownerUid) {
        return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
      }
    }
    await dbConnect();

    const query = {};

    if (ownerUid) {
      query.ownerUid = ownerUid;
    } else {
      query.status = "active";
      query.verificationStatus = "approved";
    }

    const keyword = (url.searchParams.get("keyword") || "").trim().slice(0, 80);
    const propertyType = url.searchParams.get("propertyType") || "";
    const stayTier = url.searchParams.get("stayTier") || "";
    const minPrice = url.searchParams.get("minPrice");
    const maxPrice = url.searchParams.get("maxPrice");
    const bedrooms = url.searchParams.get("bedrooms");
    const guests = url.searchParams.get("guests");
    const amenity = url.searchParams.getAll("amenity").slice(0, 20);

    if (propertyType) {
      if (
        ![
          "Hotel",
          "Resort",
          "Villa",
          "Homestay",
          "Apartment",
          "Boutique Hotel",
          "Farmhouse",
          "Holiday Home",
          "Serviced Apartment",
        ].includes(propertyType)
      ) {
        return NextResponse.json({ error: "Invalid property type." }, { status: 400 });
      }
      query.propertyType = propertyType;
    }

    if (stayTier) {
      if (!["Royal", "Gold", "Easy"].includes(stayTier)) {
        return NextResponse.json({ error: "Invalid stay category." }, { status: 400 });
      }
      query.stayTier = stayTier;
    }

    const priceRange = {};
    if (minPrice !== null && minPrice !== "") {
      const amount = Number(minPrice);
      if (!Number.isFinite(amount) || amount < 0) {
        return NextResponse.json({ error: "Invalid minimum price." }, { status: 400 });
      }
      priceRange.$gte = amount;
    }
    if (maxPrice !== null && maxPrice !== "") {
      const amount = Number(maxPrice);
      if (!Number.isFinite(amount) || amount < 0) {
        return NextResponse.json({ error: "Invalid maximum price." }, { status: 400 });
      }
      priceRange.$lte = amount;
    }
    if (Object.keys(priceRange).length) {
      query.price = priceRange;
    }

    if (bedrooms !== null && bedrooms !== "") {
      const count = Number(bedrooms);
      if (!Number.isInteger(count) || count < 0) {
        return NextResponse.json({ error: "Invalid bedroom count." }, { status: 400 });
      }
      query.bedrooms = { $gte: count };
    }
    if (guests !== null && guests !== "") {
      const count = Number(guests);
      if (!Number.isInteger(count) || count < 1) {
        return NextResponse.json({ error: "Invalid guest count." }, { status: 400 });
      }
      query.capacity = { $gte: count };
    }
    if (amenity.length) {
      const safeAmenities = amenity.filter((value) => value.length <= 60);
      if (safeAmenities.length !== amenity.length) {
        return NextResponse.json({ error: "Invalid amenity filter." }, { status: 400 });
      }
      query.amenities = { $all: safeAmenities };
    }

    for (const filterName of ["petFriendly", "instantBook", "pool"]) {
      const filterValue = url.searchParams.get(filterName);
      if (filterValue !== null && !["true", "false"].includes(filterValue)) {
        return NextResponse.json({ error: `Invalid ${filterName} filter.` }, { status: 400 });
      }
    }
    if (url.searchParams.get("petFriendly") === "true") {
      query.petFriendly = true;
    }
    if (url.searchParams.get("instantBook") === "true") {
      query.instantBook = true;
    }

    if (url.searchParams.get("pool") === "true") {
      query.$and = [...(query.$and || []), { amenities: /pool/i }];
    }

    if (keyword) {
      const matcher = new RegExp(escapeRegex(keyword), "i");
      query.$or = [{ title: matcher }, { city: matcher }];
    }

    const latParam = url.searchParams.get("lat");
    const lngParam = url.searchParams.get("lng");
    if (latParam !== null || lngParam !== null) {
      const lat = Number(latParam);
      const lng = Number(lngParam);
      if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
        return NextResponse.json({ error: "Invalid location coordinates." }, { status: 400 });
      }
      if (!ownerUid) {
        query.location = {
          $near: {
            $geometry: { type: "Point", coordinates: [lng, lat] },
            $maxDistance: 100000,
          },
        };
      }
    }

    const propertiesList = await Property.find(query)
      .sort({ isFeatured: -1, createdAt: -1 })
      .limit(100)
      .lean();

    return NextResponse.json({
      properties: ownerUid ? propertiesList : propertiesList.map(toPublicProperty),
    });
  } catch (error) {
    console.error("Error fetching properties:", error);
    return NextResponse.json({ error: error.message || "Failed to load properties." }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
    await dbConnect();
    const host = await User.findOne({ uid: user.uid, verified: true, role: "host" }).select("_id");
    if (!host) {
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
      !data.propertyType ||
      !["Royal", "Gold", "Easy"].includes(data.stayTier) ||
      !["night", "month"].includes(data.priceBasis) ||
      !Array.isArray(data.images) ||
      data.images.length < 3 ||
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
    data.category = ["Royal", "Gold", "Easy"].includes(data.stayTier)
      ? data.stayTier
      : "Rental";

    const newProperty = await Property.create({
      ...data,
      ownerUid: user.uid,
      ownerEmail: user.email,
      status: "pending_review",
      verificationStatus: "pending",
      location: data.location || { type: "Point", coordinates: [0, 0] },
    });

    return NextResponse.json({ success: true, property: newProperty }, { status: 201 });
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
    console.error("Error creating property:", error);
    return NextResponse.json({ error: error.message || "Failed to create property." }, { status: 500 });
  }
}
