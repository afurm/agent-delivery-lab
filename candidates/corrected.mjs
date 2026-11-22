// Guard the transition; derive available capacity from active reservations.
export function cancel(state, reservationId) {
  const reservation = state.reservations.find(item => item.id === reservationId);
  if (!reservation || reservation.status !== 'active') return structuredClone(state);
  const next = structuredClone(state);
  next.reservations = next.reservations.map(item => item.id === reservationId
    ? { ...item, status: 'cancelled' } : item);
  const activeCount = () => next.reservations.filter(item => item.status === 'active').length;
  if (next.waitlist.length && activeCount() < next.capacity) {
    const [attendee, ...remaining] = next.waitlist;
    next.waitlist = remaining;
    next.reservations = [...next.reservations,
      { id: `promoted-${attendee}`, attendee, status: 'active' }];
    next.promotions = [...next.promotions, attendee];
  }
  next.freePlaces = next.capacity - activeCount();
  return next;
}
