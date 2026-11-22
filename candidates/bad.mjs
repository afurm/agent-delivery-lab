// Intentionally flawed: assumes every delivery is a new cancellation.
export function cancel(state, reservationId) {
  const next = structuredClone(state);
  const reservation = next.reservations.find(item => item.id === reservationId);
  if (!reservation) return next;
  reservation.status = 'cancelled';
  next.freePlaces += 1;
  if (next.waitlist.length && next.freePlaces > 0) {
    const attendee = next.waitlist.shift();
    next.reservations.push({ id: `promoted-${attendee}`, attendee, status: 'active' });
    next.promotions.push(attendee);
    next.freePlaces -= 1;
  }
  return next;
}
