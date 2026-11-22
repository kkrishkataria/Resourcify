export function formatCategory(category) {
  const map = {
    COMPUTER_LAB: 'Computer Lab',
    SEMINAR_ROOM: 'Seminar Room',
    STUDY_ROOM: 'Study Room',
    SPORTS_COURT: 'Sports Court',
    CONFERENCE_HALL: 'Conference Hall',
  };
  return map[category] || category?.replace(/_/g, ' ') || 'Resource';
}

export function formatStatus(status) {
  const map = {
    CONFIRMED: 'Confirmed',
    CHECKED_IN: 'Checked In',
    CANCELLED: 'Cancelled',
    NO_SHOW: 'No-Show',
    COMPLETED: 'Completed',
    ACTIVE: 'Active',
    MAINTENANCE: 'Maintenance',
    DISABLED: 'Disabled',
  };
  return map[status] || status;
}

export function formatDate(dateString) {
  if (!dateString) return '';
  const [year, month, day] = dateString.split('-');
  if (!year || !month || !day) return dateString;
  const d = new Date(Number(year), Number(month) - 1, Number(day));
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
