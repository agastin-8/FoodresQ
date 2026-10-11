import { BarChart3, TrendingUp, Leaf, Award, PieChart, Users, UtensilsCrossed } from 'lucide-react';
import { calculateStats, DEMO_FOOD_LISTINGS, DEMO_DONATIONS } from '../data/demoData';

export default function Stats() {
  const stats = calculateStats(DEMO_FOOD_LISTINGS, DEMO_DONATIONS);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-surface-900">Platform Analytics & Impact</h1>
        <p className="text-surface-500 mt-1">Real-time stats on surplus food redistribution and environmental impact</p>
      </div>

      {/* Summary grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-5 rounded-xl border border-surface-200 shadow-[var(--shadow-card)]">
          <p className="text-sm text-surface-500 font-medium">Total Food Redirected</p>
          <p className="text-2xl font-bold text-surface-900 mt-1">{stats.totalMealsRedirected} meals</p>
          <span className="text-xs text-primary-600 font-medium flex items-center gap-1 mt-2">
            <TrendingUp className="w-3.5 h-3.5" /> +18% this week
          </span>
        </div>
        <div className="bg-white p-5 rounded-xl border border-surface-200 shadow-[var(--shadow-card)]">
          <p className="text-sm text-surface-500 font-medium">CO₂ Emissions Prevented</p>
          <p className="text-2xl font-bold text-surface-900 mt-1">{(stats.estimatedWasteReduced * 2.5).toFixed(1)} kg</p>
          <span className="text-xs text-primary-600 font-medium flex items-center gap-1 mt-2">
            <Leaf className="w-3.5 h-3.5" /> Environmental gain
          </span>
        </div>
        <div className="bg-white p-5 rounded-xl border border-surface-200 shadow-[var(--shadow-card)]">
          <p className="text-sm text-surface-500 font-medium">Active Partners</p>
          <p className="text-2xl font-bold text-surface-900 mt-1">12 Donors / 6 NGOs</p>
          <span className="text-xs text-info-500 font-medium flex items-center gap-1 mt-2">
            <Users className="w-3.5 h-3.5" /> 100% verified
          </span>
        </div>
        <div className="bg-white p-5 rounded-xl border border-surface-200 shadow-[var(--shadow-card)]">
          <p className="text-sm text-surface-500 font-medium">Fulfillment Rate</p>
          <p className="text-2xl font-bold text-surface-900 mt-1">94.2%</p>
          <span className="text-xs text-primary-600 font-medium flex items-center gap-1 mt-2">
            <Award className="w-3.5 h-3.5" /> High success rate
          </span>
        </div>
      </div>

      {/* Category distribution */}
      <div className="bg-white rounded-xl border border-surface-200 shadow-[var(--shadow-card)] p-6 mb-8">
        <h3 className="font-semibold text-surface-900 mb-4 flex items-center gap-2">
          <PieChart className="w-5 h-5 text-primary-600" />
          Donation Categories Distribution
        </h3>
        <div className="space-y-4">
          {[
            { category: 'Main Course', count: 4, pct: '50%' },
            { category: 'Bakery', count: 2, pct: '25%' },
            { category: 'Snacks', count: 1, pct: '12.5%' },
            { category: 'Starters', count: 1, pct: '12.5%' },
          ].map((cat, i) => (
            <div key={i}>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium text-surface-700">{cat.category}</span>
                <span className="text-surface-500">{cat.count} listings ({cat.pct})</span>
              </div>
              <div className="w-full bg-surface-100 rounded-full h-2.5">
                <div
                  className="bg-primary-600 h-2.5 rounded-full"
                  style={{ width: cat.pct }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
