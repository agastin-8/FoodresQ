// Demo data for FoodLink AI — clearly labelled as synthetic demonstration data

export const DEMO_FOOD_LISTINGS = [
  {
    id: 1,
    donorId: 1,
    donorName: 'Green Kitchen Restaurant',
    foodName: 'Vegetable Biryani',
    description: 'Freshly prepared vegetable biryani with raita. Suitable for vegetarians.',
    quantity: 25,
    unit: 'meals',
    category: 'Main Course',
    preparationTime: '2026-10-10T10:00:00',
    pickupDeadline: '2026-10-10T16:00:00',
    location: 'Koramangala, Bangalore',
    lat: 12.9352,
    lng: 77.6245,
    status: 'available',
    foodSafety: 'Stored at proper temperature. Vegetarian. No nuts.',
    createdAt: '2026-10-10T10:30:00',
    image: '🍛',
  },
  {
    id: 2,
    donorId: 1,
    donorName: 'Green Kitchen Restaurant',
    foodName: 'Dal Tadka with Rice',
    description: 'Yellow dal with tempering served with steamed basmati rice.',
    quantity: 30,
    unit: 'meals',
    category: 'Main Course',
    preparationTime: '2026-10-10T09:30:00',
    pickupDeadline: '2026-10-10T15:30:00',
    location: 'Koramangala, Bangalore',
    lat: 12.9352,
    lng: 77.6245,
    status: 'available',
    foodSafety: 'Vegan-friendly. Gluten-free. No allergens.',
    createdAt: '2026-10-10T09:45:00',
    image: '🍲',
  },
  {
    id: 3,
    donorId: 4,
    donorName: 'Taj Hotel Banquets',
    foodName: 'Assorted Sandwiches',
    description: 'Mix of veg and paneer sandwiches from a cancelled corporate event.',
    quantity: 50,
    unit: 'pieces',
    category: 'Snacks',
    preparationTime: '2026-10-10T08:00:00',
    pickupDeadline: '2026-10-10T14:00:00',
    location: 'MG Road, Bangalore',
    lat: 12.9756,
    lng: 77.6066,
    status: 'claimed',
    foodSafety: 'Contains dairy. Some may contain gluten.',
    createdAt: '2026-10-10T08:30:00',
    image: '🥪',
  },
  {
    id: 4,
    donorId: 5,
    donorName: "Baker's Dozen",
    foodName: 'Fresh Bread Loaves',
    description: 'Day-end surplus whole wheat and multigrain bread loaves.',
    quantity: 40,
    unit: 'loaves',
    category: 'Bakery',
    preparationTime: '2026-10-10T06:00:00',
    pickupDeadline: '2026-10-10T20:00:00',
    location: 'HSR Layout, Bangalore',
    lat: 12.9116,
    lng: 77.6389,
    status: 'available',
    foodSafety: 'Contains gluten. Vegan. Nut-free.',
    createdAt: '2026-10-10T17:00:00',
    image: '🍞',
  },
  {
    id: 5,
    donorId: 6,
    donorName: 'Spice Garden Restaurant',
    foodName: 'Chicken Curry with Naan',
    description: 'Leftover chicken curry from lunch service with fresh naan bread.',
    quantity: 20,
    unit: 'meals',
    category: 'Main Course',
    preparationTime: '2026-10-10T11:00:00',
    pickupDeadline: '2026-10-10T17:00:00',
    location: 'Whitefield, Bangalore',
    lat: 12.9698,
    lng: 77.7500,
    status: 'available',
    foodSafety: 'Non-vegetarian. Contains dairy and gluten.',
    createdAt: '2026-10-10T13:00:00',
    image: '🍗',
  },
  {
    id: 6,
    donorId: 7,
    donorName: 'University Hostel Mess',
    foodName: 'Mixed Fruit Bowl',
    description: 'Surplus seasonal fruits — bananas, apples, oranges, guavas.',
    quantity: 15,
    unit: 'kg',
    category: 'Fruits',
    preparationTime: '2026-10-10T07:00:00',
    pickupDeadline: '2026-10-10T19:00:00',
    location: 'Jayanagar, Bangalore',
    lat: 12.9250,
    lng: 77.5938,
    status: 'available',
    foodSafety: 'Fresh produce. No processing. Vegan.',
    createdAt: '2026-10-10T07:30:00',
    image: '🍎',
  },
  {
    id: 7,
    donorId: 1,
    donorName: 'Green Kitchen Restaurant',
    foodName: 'Paneer Tikka',
    description: 'Grilled paneer tikka with mint chutney from evening prep.',
    quantity: 15,
    unit: 'plates',
    category: 'Starters',
    preparationTime: '2026-10-10T14:00:00',
    pickupDeadline: '2026-10-10T20:00:00',
    location: 'Koramangala, Bangalore',
    lat: 12.9352,
    lng: 77.6245,
    status: 'picked_up',
    foodSafety: 'Vegetarian. Contains dairy.',
    createdAt: '2026-10-10T14:30:00',
    image: '🧀',
  },
];

export const DEMO_NGOS = [
  {
    id: 2,
    name: 'FeedIndia Foundation',
    email: 'ngo@foodlink.demo',
    location: 'Indiranagar, Bangalore',
    lat: 12.9784,
    lng: 77.6408,
    coverageArea: '10 km',
    capacity: 100,
    currentLoad: 35,
  },
  {
    id: 8,
    name: 'Akshaya Patra',
    email: 'akshaya@foodlink.demo',
    location: 'BTM Layout, Bangalore',
    lat: 12.9166,
    lng: 77.6101,
    coverageArea: '15 km',
    capacity: 200,
    currentLoad: 80,
  },
  {
    id: 9,
    name: 'Robin Hood Army',
    email: 'robinhood@foodlink.demo',
    location: 'JP Nagar, Bangalore',
    lat: 12.9063,
    lng: 77.5857,
    coverageArea: '12 km',
    capacity: 75,
    currentLoad: 20,
  },
];

export const DEMO_DONATIONS = [
  {
    id: 1,
    listingId: 3,
    ngoId: 2,
    ngoName: 'FeedIndia Foundation',
    donorName: 'Taj Hotel Banquets',
    foodName: 'Assorted Sandwiches',
    quantity: 50,
    unit: 'pieces',
    status: 'accepted',
    requestedAt: '2026-10-10T09:00:00',
    acceptedAt: '2026-10-10T09:15:00',
    image: '🥪',
  },
  {
    id: 2,
    listingId: 7,
    ngoId: 8,
    ngoName: 'Akshaya Patra',
    donorName: 'Green Kitchen Restaurant',
    foodName: 'Paneer Tikka',
    quantity: 15,
    unit: 'plates',
    status: 'picked_up',
    requestedAt: '2026-10-10T15:00:00',
    acceptedAt: '2026-10-10T15:10:00',
    pickedUpAt: '2026-10-10T16:00:00',
    image: '🧀',
  },
  {
    id: 3,
    listingId: 1,
    ngoId: 9,
    ngoName: 'Robin Hood Army',
    donorName: 'Green Kitchen Restaurant',
    foodName: 'Vegetable Biryani',
    quantity: 25,
    unit: 'meals',
    status: 'pending',
    requestedAt: '2026-10-10T11:00:00',
    image: '🍛',
  },
];

// Smart matching: calculate distance between two lat/lng points (Haversine)
function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Smart matching engine (rule-based, transparent)
export function getSmartMatches(listings, ngos) {
  const availableListings = listings.filter((l) => l.status === 'available');
  const matches = [];

  for (const listing of availableListings) {
    for (const ngo of ngos) {
      const distance = haversineDistance(listing.lat, listing.lng, ngo.lat, ngo.lng);
      const coverageKm = parseFloat(ngo.coverageArea);
      const remainingCapacity = ngo.capacity - ngo.currentLoad;

      if (distance > coverageKm) continue;
      if (remainingCapacity <= 0) continue;

      const hoursUntilDeadline =
        (new Date(listing.pickupDeadline) - new Date()) / (1000 * 60 * 60);
      if (hoursUntilDeadline < 0) continue;

      // Score: lower distance + more capacity + urgency = better match
      const distanceScore = Math.max(0, 100 - distance * 10);
      const capacityScore = Math.min(100, (remainingCapacity / listing.quantity) * 50);
      const urgencyScore = hoursUntilDeadline < 2 ? 30 : hoursUntilDeadline < 4 ? 15 : 0;
      const score = distanceScore + capacityScore + urgencyScore;

      const reasons = [];
      if (distance < 3) reasons.push(`Very close — only ${distance.toFixed(1)} km away`);
      else reasons.push(`Within range — ${distance.toFixed(1)} km away`);
      if (remainingCapacity >= listing.quantity)
        reasons.push('Has enough capacity for full pickup');
      if (hoursUntilDeadline < 2) reasons.push('⚠️ Urgent — deadline approaching soon');
      else if (hoursUntilDeadline < 4) reasons.push('Pickup deadline within 4 hours');

      matches.push({
        listing,
        ngo,
        distance: distance.toFixed(1),
        score: Math.round(score),
        reasons,
        urgency:
          hoursUntilDeadline < 2 ? 'high' : hoursUntilDeadline < 4 ? 'medium' : 'low',
      });
    }
  }

  return matches.sort((a, b) => b.score - a.score);
}

// Suggest combined pickups from nearby donors
export function suggestCombinedPickups(listings) {
  const available = listings.filter((l) => l.status === 'available');
  const groups = [];

  const used = new Set();
  for (let i = 0; i < available.length; i++) {
    if (used.has(i)) continue;
    const group = [available[i]];
    used.add(i);

    for (let j = i + 1; j < available.length; j++) {
      if (used.has(j)) continue;
      const dist = haversineDistance(
        available[i].lat,
        available[i].lng,
        available[j].lat,
        available[j].lng
      );
      if (dist < 3) {
        group.push(available[j]);
        used.add(j);
      }
    }

    if (group.length > 1) {
      const totalMeals = group.reduce((sum, l) => sum + l.quantity, 0);
      groups.push({
        items: group,
        totalQuantity: totalMeals,
        donors: [...new Set(group.map((l) => l.donorName))],
        area: group[0].location,
        reason: `${group.length} donations within 3 km — combine for one trip (${totalMeals} total items)`,
      });
    }
  }

  return groups;
}

// Platform statistics (calculated from actual data)
export function calculateStats(listings, donations) {
  const totalListings = listings.length;
  const availableListings = listings.filter((l) => l.status === 'available').length;
  const claimedListings = listings.filter((l) => l.status === 'claimed').length;
  const completedDonations = donations.filter((d) => d.status === 'picked_up').length;
  const pendingDonations = donations.filter((d) => d.status === 'pending').length;
  const totalMealsRedirected = donations
    .filter((d) => d.status === 'picked_up')
    .reduce((sum, d) => sum + d.quantity, 0);

  // Estimate: each meal ≈ 0.4 kg food waste prevented
  const estimatedWasteReduced = (totalMealsRedirected * 0.4).toFixed(1);

  return {
    totalListings,
    availableListings,
    claimedListings,
    completedDonations,
    pendingDonations,
    totalDonations: donations.length,
    totalMealsRedirected,
    estimatedWasteReduced,
    isDemo: true, // Flag: this data is synthetic
  };
}
