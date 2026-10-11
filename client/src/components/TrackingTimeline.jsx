import { TRACKING_STAGES } from '../data/trackingConstants';
import { CheckCircle2, Clock, AlertCircle } from 'lucide-react';

export default function TrackingTimeline({ currentStatus, history = [] }) {
  if (currentStatus === 'CANCELLED') {
    const cancelHistory = history.find((h) => h.status === 'CANCELLED');
    return (
      <div className="bg-danger-50 border border-danger-200 rounded-xl p-5">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-6 h-6 text-danger-600 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-bold text-danger-900 text-base">Donation Pickup Cancelled</h4>
            <p className="text-sm text-danger-700 mt-1">
              {cancelHistory?.note || 'This donation or pickup request was cancelled.'}
            </p>
            {cancelHistory?.timestamp && (
              <p className="text-xs text-danger-500 mt-2">
                Cancelled on: {new Date(cancelHistory.timestamp).toLocaleString('en-IN')}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Determine current active stage index
  const activeStage = TRACKING_STAGES.find((s) => s.key === currentStatus) || TRACKING_STAGES[0];
  const activeIndex = activeStage.stepIndex;

  return (
    <div className="bg-white rounded-xl border border-surface-200 shadow-[var(--shadow-card)] p-6">
      <h3 className="font-semibold text-surface-900 text-base mb-6 flex items-center justify-between">
        <span>📍 Pickup Progress Timeline</span>
        <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-primary-50 text-primary-700 border border-primary-200">
          Stage {activeIndex + 1} of 8: {activeStage.label}
        </span>
      </h3>

      {/* Desktop Horizontal Timeline */}
      <div className="hidden lg:block relative mb-8">
        <div className="absolute top-5 left-8 right-8 h-1 bg-surface-200 -z-0">
          <div
            className="h-full bg-primary-600 transition-all duration-500"
            style={{ width: `${(activeIndex / 7) * 100}%` }}
          />
        </div>

        <div className="grid grid-cols-8 relative z-10 text-center">
          {TRACKING_STAGES.filter((s) => s.key !== 'CANCELLED').map((stage) => {
            const isPassed = stage.stepIndex < activeIndex;
            const isCurrent = stage.stepIndex === activeIndex;
            const historyEntry = history.find((h) => h.status === stage.key);

            return (
              <div key={stage.key} className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                    isPassed
                      ? 'bg-primary-600 text-white shadow-md'
                      : isCurrent
                      ? 'bg-primary-600 text-white ring-4 ring-primary-100 shadow-lg scale-110'
                      : 'bg-white border-2 border-surface-300 text-surface-400'
                  }`}
                >
                  {isPassed ? <CheckCircle2 className="w-5 h-5" /> : stage.icon}
                </div>
                <p
                  className={`text-xs font-semibold mt-3 ${
                    isCurrent
                      ? 'text-primary-700 font-bold'
                      : isPassed
                      ? 'text-surface-800'
                      : 'text-surface-400'
                  }`}
                >
                  {stage.label}
                </p>
                {historyEntry && (
                  <p className="text-[10px] text-surface-400 mt-1">
                    {new Date(historyEntry.timestamp).toLocaleTimeString('en-IN', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile / Compact Vertical Timeline */}
      <div className="space-y-6 lg:hidden">
        {TRACKING_STAGES.filter((s) => s.key !== 'CANCELLED').map((stage, idx) => {
          const isPassed = stage.stepIndex < activeIndex;
          const isCurrent = stage.stepIndex === activeIndex;
          const historyEntry = history.find((h) => h.status === stage.key);

          return (
            <div key={stage.key} className="flex items-start gap-4 relative">
              {idx < 7 && (
                <div
                  className={`absolute left-4 top-9 w-0.5 h-full ${
                    isPassed ? 'bg-primary-600' : 'bg-surface-200'
                  }`}
                />
              )}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 z-10 ${
                  isPassed
                    ? 'bg-primary-600 text-white'
                    : isCurrent
                    ? 'bg-primary-600 text-white ring-4 ring-primary-100'
                    : 'bg-white border-2 border-surface-300 text-surface-400'
                }`}
              >
                {isPassed ? <CheckCircle2 className="w-4 h-4" /> : stage.icon}
              </div>
              <div className="flex-1 min-w-0 pt-0.5">
                <div className="flex items-center justify-between">
                  <p className={`text-sm font-semibold ${isCurrent ? 'text-primary-700 font-bold' : isPassed ? 'text-surface-900' : 'text-surface-400'}`}>
                    {stage.label}
                  </p>
                  {historyEntry && (
                    <span className="text-xs text-surface-400">
                      {new Date(historyEntry.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>
                <p className="text-xs text-surface-500 mt-0.5">{stage.shortDesc}</p>
                {historyEntry?.note && (
                  <p className="text-xs bg-surface-50 p-2 rounded border border-surface-100 mt-1 text-surface-600 italic">
                    "{historyEntry.note}"
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
