import { isSupabaseConfigured, supabase } from "../lib/supabase";

export const SLOT_CAPACITY = 20;

const requireSupabase = () => {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error(
      "Online reservations are not available right now. Please try again later.",
    );
  }
};

const normalizeRpcRow = (data) => {
  if (Array.isArray(data)) return data[0] ?? null;
  return data ?? null;
};

export async function getSlotAvailability({ date, time }) {
  if (!date || !time) {
    return { capacity: SLOT_CAPACITY, booked: 0, remaining: SLOT_CAPACITY };
  }

  requireSupabase();
  const { data, error } = await supabase.rpc("get_slot_availability", {
    p_date: date,
    p_time: time,
  });
  if (error) throw error;
  const row = normalizeRpcRow(data);
  return {
    capacity: Number(row?.capacity ?? SLOT_CAPACITY),
    booked: Number(row?.booked ?? 0),
    remaining: Number(row?.remaining ?? SLOT_CAPACITY),
  };
}

export async function createReservation({ user, values }) {
  if (!user) throw new Error("Please sign in before reserving a table.");
  requireSupabase();

  const { data, error } = await supabase.rpc("create_restaurant_reservation", {
    p_guest_name: values.name,
    p_phone: values.phone || null,
    p_date: values.date,
    p_time: values.time,
    p_guests: Number(values.guests),
    p_occasion: values.occasion,
    p_preferred_dish: values.preferredDish || null,
    p_seating_preference: values.seatingPreference,
    p_special_requests: values.specialRequests || null,
  });

  if (error) throw error;
  return normalizeRpcRow(data);
}

export async function listMyReservations(user) {
  if (!user) return [];
  requireSupabase();

  const { data, error } = await supabase
    .from("reservations")
    .select("*")
    .order("date", { ascending: true })
    .order("time", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function cancelReservation({ user, reservationId }) {
  if (!user) throw new Error("Please sign in first.");
  requireSupabase();

  const { data, error } = await supabase.rpc("cancel_my_reservation", {
    p_reservation_id: reservationId,
  });
  if (error) throw error;
  return normalizeRpcRow(data);
}
