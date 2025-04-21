function getSeasonalRoomPrice(basePrice, checkInDate) {
  const date = new Date(checkInDate);
  const month = date.getMonth(); // January = 0, December = 11

  // Example: High season in June–August
  if (month >= 5 && month <= 7) {
    return basePrice * 1.2; // 20% increase
  }

  // Low season in December–February
  if (month === 11 || month <= 1) {
    return basePrice * 0.85; // 15% discount
  }

  // Regular season
  return basePrice;
}

module.exports = getSeasonalRoomPrice;