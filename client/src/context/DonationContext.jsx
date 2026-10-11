import { createContext, useContext, useState, useEffect } from 'react';
import { donationsApi, trackingApi, usersApi, listingsApi } from '../services/api';
import { DEMO_FOOD_LISTINGS } from '../data/demoData';
import { STATUS_TRANSITIONS } from '../data/trackingConstants';

const DonationContext = createContext(null);

const INITIAL_DONATIONS = [
  {
    id: 1,
    listingId: 1,
    foodName: 'Vegetable Biryani',
    description: 'Freshly prepared vegetable biryani with raita. Suitable for vegetarians.',
    quantity: 25,
    unit: 'meals',
    category: 'Main Course',
    image: '🍛',
    donorId: 1,
    donorName: 'Green Kitchen Restaurant',
    donorLocation: 'Koramangala 4th Block, Bangalore',
    donorLat: 12.9352,
    donorLng: 77.6245,
    donorPhone: '+91 98765 43210',
    pickupInstructions: 'Enter via rear kitchen door on 8th Main Road. Ask for Manager Suresh.',
    foodSafety: 'Stored at 65°C. Vegetarian. Prepared 2 hours ago.',
    ngoId: 2,
    ngoName: 'FeedIndia Foundation',
    ngoLocation: 'Indiranagar 100ft Road, Bangalore',
    ngoLat: 12.9784,
    ngoLng: 77.6408,
    ngoPhone: '+91 98765 43211',
    destinationName: 'Hope Children Shelter',
    destinationAddress: 'Domlur 2nd Stage, Bangalore',
    destinationLat: 12.9620,
    destinationLng: 77.6550,
    status: 'ON_THE_WAY',
    scheduledPickupTime: '2026-10-10T16:30:00',
    requestedAt: '2026-10-10T11:00:00',
    volunteer: {
      name: 'Ramesh Kumar',
      phone: '+91 98765 43213',
      vehicle: 'Electric Cargo Scooter (KA-01-EA-4321)',
      avatar: '🛵',
      liveSharing: true,
      currentLat: 12.9568,
      currentLng: 77.6326,
      lastUpdated: 'Just now',
    },
    history: [
      {
        id: 1,
        status: 'AVAILABLE',
        updatedByName: 'Green Kitchen Restaurant (Donor)',
        timestamp: '2026-10-10T10:30:00',
        note: 'Listed 25 vegetable biryani meals for donation.',
      },
      {
        id: 2,
        status: 'ACCEPTED',
        updatedByName: 'FeedIndia Foundation (NGO)',
        timestamp: '2026-10-10T11:15:00',
        note: 'Accepted donation for distribution at Hope Children Shelter.',
      },
      {
        id: 3,
        status: 'PICKUP_SCHEDULED',
        updatedByName: 'FeedIndia Foundation (NGO)',
        timestamp: '2026-10-10T12:00:00',
        note: 'Scheduled pickup for 4:30 PM today.',
      },
      {
        id: 4,
        status: 'ON_THE_WAY',
        updatedByName: 'Ramesh Kumar (Volunteer)',
        timestamp: '2026-10-10T16:05:00',
        note: 'Departed from Indiranagar base station. En route via 100ft Road.',
        location: { lat: 12.9568, lng: 77.6326, name: '100ft Road Signal' },
      },
    ],
  },
  {
    id: 2,
    listingId: 3,
    foodName: 'Assorted Sandwiches',
    description: 'Mix of veg and paneer sandwiches from corporate catering.',
    quantity: 50,
    unit: 'pieces',
    category: 'Snacks',
    image: '🥪',
    donorId: 5,
    donorName: 'Taj Hotel Banquets',
    donorLocation: 'MG Road, Bangalore',
    donorLat: 12.9756,
    donorLng: 77.6066,
    donorPhone: '+91 98765 55443',
    pickupInstructions: 'Report to Loading Dock B near service elevator.',
    foodSafety: 'Refrigerated at 4°C. Contains dairy.',
    ngoId: 2,
    ngoName: 'FeedIndia Foundation',
    ngoLocation: 'Indiranagar, Bangalore',
    ngoLat: 12.9784,
    ngoLng: 77.6408,
    ngoPhone: '+91 98765 43211',
    destinationName: 'St. Joseph Night Shelter',
    destinationAddress: 'Austin Town, Bangalore',
    destinationLat: 12.9620,
    destinationLng: 77.6110,
    status: 'DELIVERED',
    scheduledPickupTime: '2026-10-10T14:00:00',
    requestedAt: '2026-10-10T09:00:00',
    volunteer: {
      name: 'Priya Nair',
      phone: '+91 98765 67890',
      vehicle: 'Delivery Van (KA-03-MD-8899)',
      avatar: '🚐',
      liveSharing: false,
      currentLat: 12.9620,
      currentLng: 77.6110,
      lastUpdated: '10 mins ago',
    },
    history: [
      {
        id: 1,
        status: 'AVAILABLE',
        updatedByName: 'Taj Hotel Banquets',
        timestamp: '2026-10-10T08:30:00',
        note: 'Created 50 sandwich surplus listing.',
      },
      {
        id: 2,
        status: 'ACCEPTED',
        updatedByName: 'FeedIndia Foundation',
        timestamp: '2026-10-10T09:00:00',
        note: 'Donation accepted.',
      },
      {
        id: 3,
        status: 'PICKUP_SCHEDULED',
        updatedByName: 'FeedIndia Foundation',
        timestamp: '2026-10-10T09:30:00',
        note: 'Pickup scheduled for 2:00 PM.',
      },
      {
        id: 4,
        status: 'ON_THE_WAY',
        updatedByName: 'Priya Nair',
        timestamp: '2026-10-10T13:40:00',
        note: 'Started journey to MG Road.',
      },
      {
        id: 5,
        status: 'ARRIVED',
        updatedByName: 'Priya Nair',
        timestamp: '2026-10-10T13:58:00',
        note: 'Arrived at Taj Hotel Loading Dock B.',
      },
      {
        id: 6,
        status: 'PICKED_UP',
        updatedByName: 'Priya Nair',
        timestamp: '2026-10-10T14:15:00',
        note: 'Loaded insulated food containers.',
      },
      {
        id: 7,
        status: 'DELIVERED',
        updatedByName: 'Priya Nair',
        timestamp: '2026-10-10T15:00:00',
        note: 'Handed over 50 sandwiches to Austin Town Night Shelter team.',
      },
    ],
  },
];

const INITIAL_NOTIFICATIONS = [
  {
    id: 1,
    donationId: 1,
    title: 'NGO On The Way! 🛵',
    message: 'Ramesh Kumar from FeedIndia Foundation has started travelling to collect Vegetable Biryani.',
    timestamp: '2026-10-10T16:05:00',
    isRead: false,
    type: 'status_update',
    targetRole: 'donor',
  },
  {
    id: 2,
    donationId: 1,
    title: 'Pickup Scheduled 📅',
    message: 'FeedIndia Foundation scheduled pickup for Vegetable Biryani at 4:30 PM.',
    timestamp: '2026-10-10T12:00:00',
    isRead: true,
    type: 'status_update',
    targetRole: 'all',
  },
];

const CATEGORY_EMOJIS = {
  'Main Course': '🍛',
  'Bakery': '🍞',
  'Snacks': '🥪',
  'Starters': '🧀',
  'Fruits': '🍎',
  'Beverages': '🥤',
  'Desserts': '🍰',
};

export function DonationProvider({ children }) {
  const [listings, setListings] = useState(() => {
    try {
      const saved = localStorage.getItem('foodlink_listings');
      if (!saved || saved === 'undefined' || saved === 'null') return DEMO_FOOD_LISTINGS;
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEMO_FOOD_LISTINGS;
    } catch (e) {
      return DEMO_FOOD_LISTINGS;
    }
  });

  const [donations, setDonations] = useState(() => {
    try {
      const saved = localStorage.getItem('foodlink_donations');
      if (!saved || saved === 'undefined' || saved === 'null') return INITIAL_DONATIONS;
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_DONATIONS;
    } catch (e) {
      return INITIAL_DONATIONS;
    }
  });

  const [notifications, setNotifications] = useState(() => {
    try {
      const saved = localStorage.getItem('foodlink_notifications');
      if (!saved || saved === 'undefined' || saved === 'null') return INITIAL_NOTIFICATIONS;
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_NOTIFICATIONS;
    } catch (e) {
      return INITIAL_NOTIFICATIONS;
    }
  });

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem('foodlink_listings', JSON.stringify(listings));
  }, [listings]);

  useEffect(() => {
    localStorage.setItem('foodlink_donations', JSON.stringify(donations));
  }, [donations]);

  useEffect(() => {
    localStorage.setItem('foodlink_notifications', JSON.stringify(notifications));
  }, [notifications]);

  // Initial fetch from backend if available
  useEffect(() => {
    listingsApi
      .getAll()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setListings(data);
        }
      })
      .catch(() => {});

    donationsApi
      .getAll()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setDonations(data);
        }
      })
      .catch(() => {});

    usersApi
      .getNotifications()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setNotifications(data);
        }
      })
      .catch(() => {});
  }, []);

  // ─── Listings Actions ───────────────────────────────────────────────
  const addListing = async (formData, currentUser) => {
    const newId = Date.now();
    const emoji = CATEGORY_EMOJIS[formData.category] || '🍱';
    const newListing = {
      id: newId,
      donorId: currentUser?.id || 1,
      donorName: currentUser?.name || 'Green Kitchen Restaurant',
      foodName: formData.foodName,
      description: formData.description || '',
      quantity: Number(formData.quantity) || 1,
      unit: formData.unit || 'meals',
      category: formData.category || 'Main Course',
      pickupDeadline: formData.pickupDeadline,
      location: formData.location || currentUser?.location || 'Koramangala, Bangalore',
      lat: currentUser?.lat || 12.9352,
      lng: currentUser?.lng || 77.6245,
      status: 'available',
      foodSafety: formData.foodSafety || 'Stored safely at appropriate temperature.',
      pickupInstructions: formData.pickupInstructions || '',
      createdAt: new Date().toISOString(),
      image: emoji,
    };

    setListings((prev) => [newListing, ...prev]);

    try {
      const created = await listingsApi.create(newListing);
      if (created && created.id) {
        setListings((prev) =>
          prev.map((l) => (l.id === newId ? { ...newListing, ...created } : l))
        );
      }
    } catch (err) {
      console.warn('Backend listing create sync:', err.message);
    }

    notify(
      newId,
      'Food Listed Successfully! 🍱',
      `Your listing for ${newListing.foodName} (${newListing.quantity} ${newListing.unit}) is now visible to NGOs.`
    );

    return newListing;
  };

  const deleteListing = async (id) => {
    setListings((prev) => prev.filter((l) => l.id !== id));
    try {
      await listingsApi.delete(id);
    } catch (err) {
      console.warn('Backend listing delete sync:', err.message);
    }
  };

  // ─── Notification Actions ───────────────────────────────────────────
  const notify = (donationId, title, message, targetRole = 'all') => {
    const newNotif = {
      id: Date.now(),
      donationId,
      title,
      message,
      timestamp: new Date().toISOString(),
      isRead: false,
      type: 'status_update',
      targetRole,
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  const markNotificationAsRead = async (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    try {
      await usersApi.markRead(id);
    } catch (e) {}
  };

  const markAllNotificationsAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    try {
      await usersApi.markAllRead();
    } catch (e) {}
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  // ─── Donation Status Actions ────────────────────────────────────────
  const updateDonationStatus = async (donationId, targetStatus, note = '', user, extraData = {}) => {
    setDonations((prevDonations) =>
      prevDonations.map((d) => {
        if (d.id !== Number(donationId)) return d;

        const nowIso = new Date().toISOString();
        const updatedByName = user ? `${user.name} (${user.role.toUpperCase()})` : 'System';

        const historyEntry = {
          id: Date.now(),
          status: targetStatus,
          updatedByName,
          timestamp: nowIso,
          note: note || `Status updated to ${targetStatus.replace(/_/g, ' ')}`,
          location: extraData.location || (d.volunteer ? { lat: d.volunteer.currentLat, lng: d.volunteer.currentLng } : null),
        };

        const updated = {
          ...d,
          status: targetStatus,
          history: [historyEntry, ...(d.history || [])],
          ...(extraData.scheduledTime ? { scheduledPickupTime: extraData.scheduledTime } : {}),
          ...(targetStatus === 'CANCELLED' ? { cancelReason: note } : {}),
        };

        return updated;
      })
    );

    try {
      await donationsApi.updateStatus(donationId, {
        status: targetStatus,
        note,
        scheduledPickupTime: extraData.scheduledTime,
        cancelReason: targetStatus === 'CANCELLED' ? note : undefined,
        lat: extraData.location?.lat,
        lng: extraData.location?.lng,
        locationName: extraData.location?.name,
      });
    } catch (err) {
      console.warn('Backend donation status sync:', err.message);
    }

    const notifTitles = {
      ACCEPTED: 'Donation Accepted 🤝',
      PICKUP_SCHEDULED: 'Pickup Scheduled 📅',
      ON_THE_WAY: 'Volunteer On The Way 🛵',
      ARRIVED: 'Volunteer Arrived 📍',
      PICKED_UP: 'Food Collected 🍱',
      DELIVERED: 'Food Handed Over 🚚',
      COMPLETED: 'Donation Completed 🎉',
      CANCELLED: 'Donation Cancelled ❌',
    };

    const notifTitle = notifTitles[targetStatus] || `Status Updated: ${targetStatus}`;
    notify(donationId, notifTitle, `Donation #${donationId} status changed to ${targetStatus.replace(/_/g, ' ')}`);
  };

  const updateVolunteerLocation = (donationId, lat, lng, isLive = true) => {
    setDonations((prev) =>
      prev.map((d) => {
        if (d.id !== Number(donationId)) return d;
        return {
          ...d,
          volunteer: {
            ...(d.volunteer || { name: 'Assigned Volunteer', vehicle: 'Scooter' }),
            currentLat: lat,
            currentLng: lng,
            liveSharing: isLive,
            lastUpdated: new Date().toISOString(),
          },
        };
      })
    );
  };

  const toggleLiveLocationSharing = (donationId, isLive) => {
    setDonations((prev) =>
      prev.map((d) => {
        if (d.id !== Number(donationId)) return d;
        return {
          ...d,
          volunteer: {
            ...(d.volunteer || {}),
            liveSharing: isLive,
          },
        };
      })
    );
  };

  const createDonationFromListing = async (listing, ngoUser) => {
    const newDonation = {
      id: Date.now(),
      listingId: listing.id,
      foodName: listing.foodName,
      description: listing.description,
      quantity: listing.quantity,
      unit: listing.unit,
      category: listing.category,
      image: listing.image || '🍱',
      donorId: listing.donorId,
      donorName: listing.donorName,
      donorLocation: listing.location,
      donorLat: listing.lat || 12.9352,
      donorLng: listing.lng || 77.6245,
      donorPhone: '+91 98765 43210',
      pickupInstructions: 'Contact front desk upon arrival.',
      foodSafety: listing.foodSafety || 'Follow standard food handling procedure.',
      ngoId: ngoUser.id,
      ngoName: ngoUser.name,
      ngoLocation: ngoUser.location || 'Indiranagar, Bangalore',
      ngoLat: 12.9784,
      ngoLng: 77.6408,
      ngoPhone: ngoUser.phone || '+91 98765 43211',
      destinationName: 'Local Community Shelter',
      destinationAddress: ngoUser.location || 'Bangalore Shelter',
      destinationLat: 12.9750,
      destinationLng: 77.6420,
      status: 'ACCEPTED',
      scheduledPickupTime: null,
      requestedAt: new Date().toISOString(),
      volunteer: {
        name: 'Ramesh Kumar',
        phone: '+91 98765 43213',
        vehicle: 'Cargo Scooter',
        avatar: '🛵',
        liveSharing: false,
        currentLat: 12.9784,
        currentLng: 77.6408,
        lastUpdated: 'Just now',
      },
      history: [
        {
          id: 1,
          status: 'AVAILABLE',
          updatedByName: listing.donorName,
          timestamp: listing.createdAt || new Date().toISOString(),
          note: 'Listed surplus food for donation.',
        },
        {
          id: 2,
          status: 'ACCEPTED',
          updatedByName: ngoUser.name,
          timestamp: new Date().toISOString(),
          note: 'Claimed and accepted by NGO for distribution.',
        },
      ],
    };

    setDonations((prev) => [newDonation, ...prev]);

    // Mark the listing as claimed in the listings state
    setListings((prev) =>
      prev.map((l) => (l.id === listing.id ? { ...l, status: 'claimed' } : l))
    );

    try {
      await donationsApi.claim(listing.id, {
        destinationName: 'Local Community Shelter',
        destinationAddress: ngoUser.location,
        destinationLat: 12.9750,
        destinationLng: 77.6420,
      });
    } catch (e) {
      console.warn('Backend claim sync:', e.message);
    }

    notify(newDonation.id, 'Donation Claimed 🤝', `${ngoUser.name} accepted ${listing.foodName}.`);
    return newDonation;
  };

  return (
    <DonationContext.Provider
      value={{
        listings,
        addListing,
        deleteListing,
        donations,
        notifications,
        setNotifications,
        clearAllNotifications,
        updateDonationStatus,
        updateVolunteerLocation,
        toggleLiveLocationSharing,
        createDonationFromListing,
        markNotificationAsRead,
        markAllNotificationsAsRead,
      }}
    >
      {children}
    </DonationContext.Provider>
  );
}

export function useDonations() {
  const context = useContext(DonationContext);
  if (!context) {
    throw new Error('useDonations must be used within a DonationProvider');
  }
  return context;
}
