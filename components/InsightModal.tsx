import React, { useState, useMemo } from 'react';
import { Card } from '../types';
import { X, Filter, Calendar } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface InsightModalProps {
  card: Card;
  onClose: () => void;
}

export const InsightModal: React.FC<InsightModalProps> = ({ card, onClose }) => {
  const [filterPlatform, setFilterPlatform] = useState<string>('');
  const [filterVariation, setFilterVariation] = useState<string>('');
  const [filterGrade, setFilterGrade] = useState<string>('');
  const [filterSerialNumber, setFilterSerialNumber] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Get unique values for filters
  const uniquePlatforms = useMemo(() => {
    const platforms = card.priceHistory
      .map(p => p.platform)
      .filter((p): p is string => !!p);
    return [...new Set(platforms)].sort();
  }, [card.priceHistory]);

  const uniqueVariations = useMemo(() => {
    const variations = card.priceHistory
      .map(p => p.variation)
      .filter((v): v is string => !!v);
    return [...new Set(variations)].sort();
  }, [card.priceHistory]);

  const uniqueGrades = useMemo(() => {
    const grades = card.priceHistory
      .map(p => p.grade)
      .filter((g): g is string => !!g);
    return [...new Set(grades)].sort();
  }, [card.priceHistory]);

  const uniqueSerialNumbers = useMemo(() => {
    const serials = card.priceHistory
      .map(p => p.serialNumber)
      .filter((s): s is string => !!s);
    return [...new Set(serials)].sort();
  }, [card.priceHistory]);

  // Filter price history
  const filteredHistory = useMemo(() => {
    let filtered = [...card.priceHistory];

    // Apply platform filter
    if (filterPlatform) {
      filtered = filtered.filter(p => p.platform === filterPlatform);
    }

    // Apply variation filter
    if (filterVariation) {
      filtered = filtered.filter(p => p.variation === filterVariation);
    }

    // Apply grade filter
    if (filterGrade) {
      filtered = filtered.filter(p => p.grade === filterGrade);
    }

    // Apply serial number filter
    if (filterSerialNumber) {
      filtered = filtered.filter(p => p.serialNumber === filterSerialNumber);
    }

    // Apply date range filter
    if (startDate) {
      filtered = filtered.filter(p => new Date(p.date) >= new Date(startDate));
    }
    if (endDate) {
      filtered = filtered.filter(p => new Date(p.date) <= new Date(endDate));
    }

    return filtered.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [card.priceHistory, filterPlatform, filterVariation, filterGrade, filterSerialNumber, startDate, endDate]);

  // Format for chart
  const chartData = filteredHistory.map(p => ({
    date: new Date(p.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: '2-digit' }),
    value: p.value,
    fullDate: new Date(p.date).toLocaleDateString(),
    platform: p.platform || 'N/A',
    variation: p.variation || 'N/A',
    grade: p.grade || 'N/A',
    serialNumber: p.serialNumber || 'N/A'
  }));

  // Calculate stats
  const stats = useMemo(() => {
    if (filteredHistory.length === 0) {
      return { min: 0, max: 0, avg: 0, latest: 0 };
    }
    const values = filteredHistory.map(p => p.value);
    return {
      min: Math.min(...values),
      max: Math.max(...values),
      avg: values.reduce((a, b) => a + b, 0) / values.length,
      latest: values[values.length - 1]
    };
  }, [filteredHistory]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="bg-slate-900/95 border border-slate-800/50 rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-slate-800/50 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-white">Price History</h2>
            <p className="text-slate-400 text-sm mt-1">{card.year} {card.brand} {card.player}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-2 hover:bg-slate-800 rounded-lg transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Filters */}
          <div className="bg-slate-900/40 backdrop-blur-sm border border-slate-800/50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-4">
              <Filter size={16} className="text-emerald-400" />
              <h3 className="text-sm font-semibold text-white uppercase tracking-wide">Filters</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5 block">
                  Platform
                </label>
                <select
                  value={filterPlatform}
                  onChange={(e) => setFilterPlatform(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                >
                  <option value="">All Platforms</option>
                  {uniquePlatforms.map(platform => (
                    <option key={platform} value={platform}>{platform}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5 block">
                  Variation
                </label>
                <select
                  value={filterVariation}
                  onChange={(e) => setFilterVariation(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                >
                  <option value="">All Variations</option>
                  {uniqueVariations.map(variation => (
                    <option key={variation} value={variation}>{variation}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5 block">
                  Grade
                </label>
                <select
                  value={filterGrade}
                  onChange={(e) => setFilterGrade(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                >
                  <option value="">All Grades</option>
                  {uniqueGrades.map(grade => (
                    <option key={grade} value={grade}>{grade}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5 block">
                  Serial #
                </label>
                <select
                  value={filterSerialNumber}
                  onChange={(e) => setFilterSerialNumber(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                >
                  <option value="">All Serials</option>
                  {uniqueSerialNumbers.map(serial => (
                    <option key={serial} value={serial}>{serial}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                  <Calendar size={12} /> Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                  <Calendar size={12} /> End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                />
              </div>
            </div>

            {(filterPlatform || filterVariation || filterGrade || filterSerialNumber || startDate || endDate) && (
              <button
                onClick={() => {
                  setFilterPlatform('');
                  setFilterVariation('');
                  setFilterGrade('');
                  setFilterSerialNumber('');
                  setStartDate('');
                  setEndDate('');
                }}
                className="mt-3 text-xs text-emerald-400 hover:text-emerald-300 font-medium"
              >
                Clear All Filters
              </button>
            )}
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-slate-900/40 backdrop-blur-sm p-4 rounded-xl border border-slate-800/50">
              <p className="text-xs text-slate-500 uppercase font-semibold tracking-wide mb-1.5">Latest</p>
              <p className="text-2xl font-mono font-bold text-white">${stats.latest.toFixed(2)}</p>
            </div>
            <div className="bg-slate-900/40 backdrop-blur-sm p-4 rounded-xl border border-slate-800/50">
              <p className="text-xs text-slate-500 uppercase font-semibold tracking-wide mb-1.5">Average</p>
              <p className="text-2xl font-mono font-bold text-emerald-400">${stats.avg.toFixed(2)}</p>
            </div>
            <div className="bg-slate-900/40 backdrop-blur-sm p-4 rounded-xl border border-slate-800/50">
              <p className="text-xs text-slate-500 uppercase font-semibold tracking-wide mb-1.5">High</p>
              <p className="text-2xl font-mono font-bold text-green-400">${stats.max.toFixed(2)}</p>
            </div>
            <div className="bg-slate-900/40 backdrop-blur-sm p-4 rounded-xl border border-slate-800/50">
              <p className="text-xs text-slate-500 uppercase font-semibold tracking-wide mb-1.5">Low</p>
              <p className="text-2xl font-mono font-bold text-rose-400">${stats.min.toFixed(2)}</p>
            </div>
          </div>

          {/* Chart */}
          {chartData.length > 0 ? (
            <div className="bg-slate-900/40 backdrop-blur-sm border border-slate-800/50 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-white uppercase tracking-wide mb-4">Price Trend</h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                    <XAxis
                      dataKey="date"
                      stroke="#94a3b8"
                      tick={{fontSize: 12}}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="#94a3b8"
                      tick={{fontSize: 12}}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `$${value}`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        borderColor: '#334155',
                        color: '#f8fafc',
                        borderRadius: '0.5rem',
                        padding: '12px'
                      }}
                      formatter={(value: number, name: string, props: any) => {
                        return [
                          <div key="tooltip" className="space-y-1">
                            <div className="font-mono font-bold text-emerald-400">${value.toFixed(2)}</div>
                            <div className="text-xs text-slate-400">{props.payload.fullDate}</div>
                            <div className="text-xs text-slate-400">Platform: {props.payload.platform}</div>
                            <div className="text-xs text-slate-400">Variation: {props.payload.variation}</div>
                            <div className="text-xs text-slate-400">Grade: {props.payload.grade}</div>
                            <div className="text-xs text-slate-400">Serial #: {props.payload.serialNumber}</div>
                          </div>
                        ];
                      }}
                      labelFormatter={() => ''}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#10b981"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorValue)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900/40 backdrop-blur-sm border border-slate-800/50 rounded-xl p-12 text-center">
              <p className="text-slate-400">No price history matches the selected filters.</p>
              <p className="text-slate-500 text-sm mt-2">Try adjusting your filter criteria.</p>
            </div>
          )}

          {/* Price History Table */}
          {filteredHistory.length > 0 && (
            <div className="bg-slate-900/40 backdrop-blur-sm border border-slate-800/50 rounded-xl overflow-hidden">
              <div className="p-4 border-b border-slate-800/50">
                <h3 className="text-sm font-semibold text-white uppercase tracking-wide">
                  All Entries ({filteredHistory.length})
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-950/50">
                    <tr>
                      <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide px-4 py-3">Date</th>
                      <th className="text-right text-xs font-semibold text-slate-400 uppercase tracking-wide px-4 py-3">Price</th>
                      <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide px-4 py-3">Platform</th>
                      <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide px-4 py-3">Variation</th>
                      <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide px-4 py-3">Grade</th>
                      <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide px-4 py-3">Serial #</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {filteredHistory.map((entry, index) => (
                      <tr key={index} className="hover:bg-slate-800/30 transition-colors">
                        <td className="px-4 py-3 text-sm text-slate-300">
                          {new Date(entry.date).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-mono font-semibold text-white">
                          ${entry.value.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-400">
                          {entry.platform || '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-400">
                          {entry.variation || '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-400">
                          {entry.grade || '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-400">
                          {entry.serialNumber || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
