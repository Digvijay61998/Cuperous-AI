export const getDaySubtitle = (day: number) => {
  if (day === 1) {
    return 'Since Today';
  }
  if (day === 2) {
    return 'Since Yesterday';
  }

  if (day === 7) {
    return 'Since Last Week';
  }

  if (day === 30) {
    return 'Since Last Month';
  }

  if (day === 365) {
    return 'Since Last Year';
  }

  return `Since Last ${day} days`;
};
