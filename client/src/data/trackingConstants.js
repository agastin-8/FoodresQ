// Centralized constants and validation state machine for FoodLink AI Tracking

export const TRACKING_STAGES = [
  {
    key: 'AVAILABLE',
    label: 'Available',
    shortDesc: 'Surplus food listed by donor',
    icon: '🍽️',
    stepIndex: 0,
    color: 'emerald',
  },
  {
    key: 'ACCEPTED',
    label: 'Accepted by NGO',
    shortDesc: 'NGO assigned & claimed donation',
    icon: '🤝',
    stepIndex: 1,
    color: 'blue',
  },
  {
    key: 'PICKUP_SCHEDULED',
    label: 'Pickup Scheduled',
    shortDesc: 'Pickup time & volunteer confirmed',
    icon: '📅',
    stepIndex: 2,
    color: 'indigo',
  },
  {
    key: 'ON_THE_WAY',
    label: 'On The Way',
    shortDesc: 'Volunteer travelling to donor location',
    icon: '🛵',
    stepIndex: 3,
    color: 'amber',
  },
  {
    key: 'ARRIVED',
    label: 'Arrived at Pickup',
    shortDesc: 'Volunteer reached donor premises',
    icon: '📍',
    stepIndex: 4,
    color: 'purple',
  },
  {
    key: 'PICKED_UP',
    label: 'Food Collected',
    shortDesc: 'Food inspected and loaded for transport',
    icon: '🍱',
    stepIndex: 5,
    color: 'teal',
  },
  {
    key: 'DELIVERED',
    label: 'Food Handed Over',
    shortDesc: 'Delivered to shelter / distribution site',
    icon: '🚚',
    stepIndex: 6,
    color: 'cyan',
  },
  {
    key: 'COMPLETED',
    label: 'Workflow Completed',
    shortDesc: 'Donation confirmed complete by both parties',
    icon: '🎉',
    stepIndex: 7,
    color: 'green',
  },
  {
    key: 'CANCELLED',
    label: 'Cancelled',
    shortDesc: 'Pickup or donation cancelled',
    icon: '❌',
    stepIndex: -1,
    color: 'red',
  },
];

export const STATUS_TRANSITIONS = {
  AVAILABLE: ['ACCEPTED', 'CANCELLED'],
  ACCEPTED: ['PICKUP_SCHEDULED', 'ON_THE_WAY', 'CANCELLED'],
  PICKUP_SCHEDULED: ['ON_THE_WAY', 'CANCELLED'],
  ON_THE_WAY: ['ARRIVED', 'CANCELLED'],
  ARRIVED: ['PICKED_UP', 'CANCELLED'],
  PICKED_UP: ['DELIVERED', 'CANCELLED'],
  DELIVERED: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
};

// Role-based authorization rules for state changes
export function getPermittedNextActions(currentStatus, userRole) {
  if (currentStatus === 'COMPLETED' || currentStatus === 'CANCELLED') {
    return [];
  }

  const actions = [];

  // NGO, Volunteer & Admin actions
  if (userRole === 'ngo' || userRole === 'admin' || userRole === 'volunteer') {
    if (currentStatus === 'AVAILABLE' && userRole !== 'volunteer') {
      actions.push({ targetStatus: 'ACCEPTED', label: 'Accept Donation', icon: '🤝', variant: 'primary' });
    }
    if (currentStatus === 'ACCEPTED' && userRole !== 'volunteer') {
      actions.push({ targetStatus: 'PICKUP_SCHEDULED', label: 'Schedule Pickup Time', icon: '📅', variant: 'indigo', requiresTimeInput: true });
    }
    if (['ACCEPTED', 'PICKUP_SCHEDULED'].includes(currentStatus)) {
      actions.push({ targetStatus: 'ON_THE_WAY', label: 'Start Journey 🛵', icon: '🛵', variant: 'warning' });
    }
    if (currentStatus === 'ON_THE_WAY') {
      actions.push({ targetStatus: 'ARRIVED', label: 'Mark as Arrived 📍', icon: '📍', variant: 'purple' });
    }
    if (currentStatus === 'ARRIVED') {
      actions.push({ targetStatus: 'PICKED_UP', label: 'Confirm Food Collected 🍱', icon: '🍱', variant: 'teal' });
    }
    if (currentStatus === 'PICKED_UP') {
      actions.push({ targetStatus: 'DELIVERED', label: 'Confirm Food Handed Over 🚚', icon: '🚚', variant: 'cyan' });
    }
    if (currentStatus === 'DELIVERED') {
      actions.push({ targetStatus: 'COMPLETED', label: 'Complete Workflow 🎉', icon: '🎉', variant: 'success' });
    }
    if (userRole !== 'volunteer') {
      actions.push({ targetStatus: 'CANCELLED', label: 'Cancel Pickup', icon: '❌', variant: 'danger', requiresReason: true });
    }
  }

  // Donor Actions
  if (userRole === 'donor' || userRole === 'admin') {
    if (currentStatus === 'DELIVERED') {
      actions.push({ targetStatus: 'COMPLETED', label: 'Confirm Handover Received & Complete 🎉', icon: '🎉', variant: 'success' });
    }
    if (['AVAILABLE', 'ACCEPTED', 'PICKUP_SCHEDULED'].includes(currentStatus)) {
      actions.push({ targetStatus: 'CANCELLED', label: 'Cancel Food Listing', icon: '❌', variant: 'danger', requiresReason: true });
    }
  }

  return actions;
}
