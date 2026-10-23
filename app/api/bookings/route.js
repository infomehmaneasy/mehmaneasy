import { NextResponse } from "next/server";
import {
  getAuthenticatedSupabaseUser,
  getSupabaseForRequest,
} from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

function isMissingBookingsTable(error) {
  return error?.code === "42P01" || error?.code === "PGRST205";
}

function isCalendarDate(value) {
  return typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    Number.isFinite(Date.parse(`${value}T00:00:00Z`)) &&
    new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value;
}

export async function GET(req) {
  try {
    const supabase = getSupabaseForRequest(req);
    const user = await getAuthenticatedSupabaseUser(req, supabase);
    if (!user) return NextResponse.json({ error: "Sign in to view bookings." }, { status: 401 });

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    if (profileError) throw profileError;
    if (!profile) return NextResponse.json({ error: "Your account profile is not available." }, { status: 403 });

    let query = supabase.from("bookings").select("*").order("created_at", { ascending: false }).limit(100);
    if (profile.role !== "admin") {
      query = query.or(`guest_id.eq.${user.id},host_id.eq.${user.id}`);
    }
    const { data: bookings, error } = await query;
    if (error) {
      if (isMissingBookingsTable(error)) {
        return NextResponse.json(
          { error: "Booking requests are not configured yet. Apply the Supabase booking migration." },
          { status: 503 }
        );
      }
      throw error;
    }

    const rows = bookings || [];
    const propertyIds = [...new Set(rows.map((booking) => booking.property_id))];
    const visibleParticipantRows = rows.filter((booking) =>
      profile.role === "admin" || ["confirmed", "completed"].includes(booking.status)
    );
    const participantIds = [...new Set(
      visibleParticipantRows.flatMap((booking) => [booking.host_id, booking.guest_id])
    )];
    const bookingIds = rows.map((booking) => booking.id);
    const [propertyResult, privateResult, contactsResult, profilesResult] = await Promise.all([
      propertyIds.length
        ? supabase
            .from("properties")
            .select(profile.role === "admin" ? "*" : "id,title,city,images")
            .in("id", propertyIds)
        : Promise.resolve({ data: [], error: null }),
      propertyIds.length
        ? supabase
            .from("property_private")
            .select(profile.role === "admin"
              ? '"propertyId",address,pincode,"tourismLicenseId"'
              : '"propertyId",address,pincode')
            .in("propertyId", propertyIds)
        : Promise.resolve({ data: [], error: null }),
      bookingIds.length
        ? supabase.from("booking_private").select("*").in("booking_id", bookingIds)
        : Promise.resolve({ data: [], error: null }),
      participantIds.length
        ? supabase.from("profiles").select("id,name,email,phone").in("id", participantIds)
        : Promise.resolve({ data: [], error: null }),
    ]);
    if (propertyResult.error) throw propertyResult.error;
    if (privateResult.error) throw privateResult.error;
    if (contactsResult.error) throw contactsResult.error;
    if (profilesResult.error) throw profilesResult.error;

    const properties = new Map((propertyResult.data || []).map((property) => [property.id, property]));
    const privateData = new Map((privateResult.data || []).map((data) => [data.propertyId, data]));
    const bookingContacts = new Map((contactsResult.data || []).map((data) => [data.booking_id, data]));
    const profiles = new Map((profilesResult.data || []).map((item) => [item.id, item]));
    return NextResponse.json({
      bookings: rows.map((booking) => {
        const confirmed = ["confirmed", "completed"].includes(booking.status);
        const property = properties.get(booking.property_id) || null;
        const privateStay = profile.role === "admin" || confirmed
          ? privateData.get(booking.property_id)
          : null;
        const guestContact = bookingContacts.get(booking.id);
        const host = profiles.get(booking.host_id) || null;
        return {
          ...booking,
          direction: booking.guest_id === user.id ? "guest" : booking.host_id === user.id ? "host" : "admin",
          property: property && {
            ...property,
            ...(privateStay ? {
              address: privateStay.address,
              pincode: privateStay.pincode,
              ...(profile.role === "admin" && privateStay.tourismLicenseId
                ? { tourismLicenseId: privateStay.tourismLicenseId }
                : {}),
            } : {}),
          },
          ...(host ? { host } : {}),
          ...(guestContact ? {
            guest: {
              name: guestContact.guest_name,
              email: guestContact.guest_email,
              phone: guestContact.guest_phone,
            },
          } : {}),
        };
      }),
    });
  } catch (error) {
    console.error("Error loading booking requests:", error);
    return NextResponse.json({ error: "Unable to load booking requests." }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const supabase = getSupabaseForRequest(req);
    const user = await getAuthenticatedSupabaseUser(req, supabase);
    if (!user) return NextResponse.json({ error: "Sign in to request a booking." }, { status: 401 });

    const payload = await req.json();
    const propertyId = typeof payload.propertyId === "string" ? payload.propertyId : "";
    const phone = typeof payload.phone === "string" ? payload.phone.trim() : "";
    const guests = Number(payload.guests);
    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(propertyId) ||
      !isCalendarDate(payload.checkIn) ||
      !isCalendarDate(payload.checkOut) ||
      !Number.isInteger(guests) ||
      guests < 1 ||
      !/^[+0-9() .-]{7,25}$/.test(phone)
    ) {
      return NextResponse.json({ error: "Provide valid dates, guest count, and phone." }, { status: 400 });
    }

    const { data: booking, error } = await supabase.rpc("create_booking_request", {
      p_property_id: propertyId,
      p_check_in: payload.checkIn,
      p_check_out: payload.checkOut,
      p_guests: guests,
      p_guest_phone: phone,
    });
    if (error) {
      const knownErrors = [
        "Sign in",
        "Verify your email",
        "Choose valid",
        "up to 90 nights",
        "at least one guest",
        "valid contact",
        "1000 characters",
        "no longer available",
        "nightly rate",
        "guest count exceeds",
        "cannot request your own",
        "no longer active",
      ];
      if (knownErrors.some((message) => error.message.includes(message))) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      if (isMissingBookingsTable(error)) {
        return NextResponse.json(
          { error: "Booking requests are not configured yet. Apply the Supabase booking migration." },
          { status: 503 }
        );
      }
      throw error;
    }
    return NextResponse.json({ booking }, { status: 201 });
  } catch (error) {
    console.error("Error creating booking request:", error);
    return NextResponse.json({ error: "Unable to submit this booking request." }, { status: 500 });
  }
}

export async function PATCH(req) {
  try {
    const supabase = getSupabaseForRequest(req);
    const user = await getAuthenticatedSupabaseUser(req, supabase);
    if (!user) return NextResponse.json({ error: "Sign in to update a booking." }, { status: 401 });
    const payload = await req.json();
    const bookingId = typeof payload.bookingId === "string" ? payload.bookingId : "";
    const action = typeof payload.action === "string" ? payload.action : "";
    const note = typeof payload.note === "string" ? payload.note.trim() : "";
    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(bookingId) ||
      !["confirm", "decline", "cancel", "complete"].includes(action) ||
      note.length > 1000
    ) {
      return NextResponse.json({ error: "Provide a valid booking and action." }, { status: 400 });
    }
    const { data: booking, error } = await supabase.rpc("transition_booking", {
      p_booking_id: bookingId,
      p_action: action,
      p_host_note: note,
    });
    if (error) {
      const knownErrors = [
        "Sign in",
        "Choose a valid",
        "Booking not found",
        "Only the host",
        "Only a booking participant",
        "already been handled",
        "no longer be cancelled",
        "before the check-in",
        "overlap another confirmed",
        "completed after its check-out",
        "1000 characters",
      ];
      if (knownErrors.some((message) => error.message.includes(message))) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      throw error;
    }
    return NextResponse.json({ booking });
  } catch (error) {
    console.error("Error updating booking request:", error);
    return NextResponse.json({ error: "Unable to update this booking request." }, { status: 500 });
  }
}
