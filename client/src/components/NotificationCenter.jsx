import { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Bell,
  CheckCheck,
  ExternalLink,
  Clock,
  Maximize2,
  Minimize2,
  X,
  Trash2,
  Search,
  Radio,
} from 'lucide-react';
import { useDonations } from '../context/DonationContext';
import { useNavigate } from 'react-router-dom';

export default function NotificationCenter() {
  const { notifications, markNotificationAsRead, markAllNotificationsAsRead, clearAllNotifications } = useDonations();
  const [isOpen, setIsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(true); // Default to full-screen convenient view
  const [activeFilter, setActiveFilter] = useState('all'); // 'all', 'unread', 'tracking'
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleNotificationClick = (notif) => {
    markNotificationAsRead(notif.id);
    setIsOpen(false);
    if (notif.donationId) {
      navigate(`/track/${notif.donationId}`);
    }
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to clear all notifications?')) {
      if (clearAllNotifications) {
        clearAllNotifications();
      }
    }
  };

  // Filtered notifications
  const filteredNotifications = notifications.filter((n) => {
    const matchesFilter =
      activeFilter === 'all'
        ? true
        : activeFilter === 'unread'
        ? !n.isRead
        : activeFilter === 'tracking'
        ? n.type === 'status_update' || n.title?.toLowerCase().includes('way') || n.title?.toLowerCase().includes('track') || n.title?.toLowerCase().includes('arrived')
        : true;

    const matchesSearch =
      searchQuery.trim() === '' ||
      n.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.message?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const modalContent = isOpen ? (
    <div className="fixed inset-0 z-[99999] bg-surface-900/60 backdrop-blur-sm flex items-center justify-center p-0 sm:p-4 md:p-6 transition-all animate-in fade-in duration-200">
      <div
        className={`bg-white shadow-2xl flex flex-col overflow-hidden transition-all duration-300 ${
          isFullscreen
            ? 'w-full h-full sm:rounded-2xl max-w-5xl max-h-[92vh] border border-surface-200'
            : 'w-full max-w-lg rounded-2xl max-h-[85vh] border border-surface-200'
        }`}
      >
        {/* Header */}
        <div className="p-4 sm:p-6 bg-gradient-to-r from-surface-900 via-surface-800 to-surface-900 text-white flex flex-wrap items-center justify-between gap-4 border-b border-surface-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-500/20 border border-primary-400/30 flex items-center justify-center text-primary-400">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">Notification Center</h2>
                {unreadCount > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full bg-rose-500 text-white text-xs font-bold shadow-xs">
                    {unreadCount} New
                  </span>
                )}
              </div>
              <p className="text-xs text-surface-300 mt-0.5">
                Real-time updates, pickup progress alerts, and food rescue milestones
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllNotificationsAsRead}
                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold text-white flex items-center gap-1.5 transition cursor-pointer border border-white/10"
              >
                <CheckCheck className="w-3.5 h-3.5 text-primary-400" />
                <span>Mark all as read</span>
              </button>
            )}

            {notifications.length > 0 && (
              <button
                onClick={handleClearAll}
                className="p-2 rounded-lg bg-white/10 hover:bg-rose-500/20 text-surface-300 hover:text-rose-300 transition cursor-pointer border border-white/10"
                title="Clear All Notifications"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="hidden sm:flex p-2 rounded-lg bg-white/10 hover:bg-white/20 text-surface-300 hover:text-white transition cursor-pointer border border-white/10"
              title={isFullscreen ? 'Compact View' : 'Full Screen View'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            <button
              onClick={() => setIsOpen(false)}
              className="p-2 rounded-lg bg-white/10 hover:bg-rose-600 text-surface-300 hover:text-white transition cursor-pointer border border-white/10"
              title="Close Notifications"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="px-4 py-3 sm:px-6 bg-surface-50 border-b border-surface-200 flex flex-wrap items-center justify-between gap-3">
          {/* Filter Pills */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeFilter === 'all'
                  ? 'bg-primary-600 text-white shadow-xs'
                  : 'bg-white text-surface-600 hover:bg-surface-100 border border-surface-200'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setActiveFilter('unread')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeFilter === 'unread'
                  ? 'bg-primary-600 text-white shadow-xs'
                  : 'bg-white text-surface-600 hover:bg-surface-100 border border-surface-200'
              }`}
            >
              Unread ({unreadCount})
            </button>
            <button
              onClick={() => setActiveFilter('tracking')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1 ${
                activeFilter === 'tracking'
                  ? 'bg-primary-600 text-white shadow-xs'
                  : 'bg-white text-surface-600 hover:bg-surface-100 border border-surface-200'
              }`}
            >
              <Radio className="w-3 h-3 text-emerald-500" />
              <span>Status & Milestones</span>
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative flex-1 sm:flex-initial sm:w-64">
            <Search className="w-3.5 h-3.5 text-surface-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search notifications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg text-xs bg-white border border-surface-300 focus:outline-hidden focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>

        {/* Notification List Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 divide-y divide-surface-100">
          {filteredNotifications.length === 0 ? (
            <div className="py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-surface-100 text-surface-400 mx-auto flex items-center justify-center text-2xl mb-4">
                🎉
              </div>
              <h3 className="text-base font-bold text-surface-800">You're all caught up!</h3>
              <p className="text-xs text-surface-500 mt-1 max-w-sm mx-auto">
                {searchQuery
                  ? 'No notifications match your current search query.'
                  : 'New updates about your listings, pickups, and volunteer delivery routes will appear here.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredNotifications.map((notif) => {
                const isTracking =
                  notif.type === 'status_update' ||
                  notif.title?.toLowerCase().includes('way') ||
                  notif.title?.toLowerCase().includes('arrived') ||
                  notif.title?.toLowerCase().includes('food');

                return (
                  <div
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className={`group p-4 sm:p-5 rounded-xl border transition-all cursor-pointer flex flex-col sm:flex-row items-start justify-between gap-4 ${
                      !notif.isRead
                        ? 'bg-primary-50/40 border-primary-200 hover:border-primary-400 hover:shadow-md'
                        : 'bg-white border-surface-200 hover:bg-surface-50 hover:border-surface-300 hover:shadow-xs'
                    }`}
                  >
                    <div className="flex items-start gap-3.5 flex-1 min-w-0">
                      {/* Status Icon */}
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 shadow-xs ${
                          isTracking
                            ? 'bg-emerald-100 text-emerald-700 ring-2 ring-emerald-200'
                            : 'bg-primary-100 text-primary-700'
                        }`}
                      >
                        {notif.title?.includes('🛵')
                          ? '🛵'
                          : notif.title?.includes('📍')
                          ? '📍'
                          : notif.title?.includes('🍱')
                          ? '🍱'
                          : notif.title?.includes('🎉')
                          ? '🎉'
                          : '🔔'}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="text-sm font-bold text-surface-900 group-hover:text-primary-700 transition-colors">
                            {notif.title}
                          </h4>
                          {!notif.isRead && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary-600 text-white">
                              NEW
                            </span>
                          )}
                          {notif.donationId && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-surface-100 text-surface-600 border border-surface-200">
                              #FL-{notif.donationId.toString().padStart(6, '0')}
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-surface-600 mt-1.5 leading-relaxed font-normal">
                          {notif.message}
                        </p>

                        <div className="flex items-center gap-4 mt-3 text-[11px] text-surface-400">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-surface-400" />
                            {new Date(notif.timestamp || Date.now()).toLocaleString('en-IN', {
                              hour: '2-digit',
                              minute: '2-digit',
                              day: 'numeric',
                              month: 'short',
                            })}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right CTA Button */}
                    {notif.donationId && (
                      <div className="self-end sm:self-center shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleNotificationClick(notif);
                          }}
                          className="px-3.5 py-1.5 rounded-lg bg-white border border-surface-300 hover:border-primary-500 hover:bg-primary-50 text-xs font-semibold text-surface-700 hover:text-primary-700 transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
                        >
                          <span>View Live GPS Track</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-surface-50 border-t border-surface-200 flex flex-wrap items-center justify-between text-xs text-surface-500 gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            <span>FoodLink Live Notification Stream</span>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="px-4 py-1.5 bg-surface-200 hover:bg-surface-300 text-surface-800 rounded-lg font-semibold transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      {/* Bell Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="relative p-2 rounded-xl text-surface-600 hover:text-surface-900 hover:bg-surface-100 transition-colors cursor-pointer group"
        title="Open Full Screen Notifications"
      >
        <Bell className="w-5 h-5 text-surface-700 group-hover:text-primary-600 transition-colors" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-4 h-4 px-1 rounded-full bg-rose-500 text-white text-[10px] font-extrabold flex items-center justify-center animate-pulse shadow-xs ring-2 ring-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Render Modal via React Portal directly into body */}
      {typeof document !== 'undefined' && modalContent ? createPortal(modalContent, document.body) : null}
    </>
  );
}
