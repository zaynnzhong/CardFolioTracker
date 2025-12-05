import React, { useState } from 'react';
import { Card, Platform, Currency } from '../types';
import { X, TrendingUp, Calendar, Info } from 'lucide-react';

interface PriceUpdateModalProps {
  card: Card;
  onSave: (cardId: string, newPrice: number, date: string, platform?: string, parallel?: string, grade?: string, serialNumber?: string) => void;
  onCancel: () => void;
  convertPrice: (price: number, from: Currency, to: Currency) => number;
}

export const PriceUpdateModal: React.FC<PriceUpdateModalProps> = ({ card, onSave, onCancel, convertPrice }) => {
  const [newPrice, setNewPrice] = useState<string>(card.currentValue.toString());
  const [priceDate, setPriceDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [platform, setPlatform] = useState<Platform>(Platform.EBAY);
  const [parallel, setParallel] = useState<string>(card.parallel || '');
  const [serialNumber, setSerialNumber] = useState<string>('');
  const [currency, setCurrency] = useState<Currency>(card.currency);

  // Structured grading inputs (matching CardForm)
  const [graded, setGraded] = useState(false);
  const [gradeCompany, setGradeCompany] = useState('PSA');
  const [gradeType, setGradeType] = useState('card-only');
  const [gradeValue, setGradeValue] = useState('10');
  const [autoGrade, setAutoGrade] = useState('10');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const price = parseFloat(newPrice);
    if (!isNaN(price)) {
      // Format grade string based on grading inputs
      let gradeForHistory = 'Raw';
      if (graded) {
        if (gradeType === 'authentic' || gradeType === 'dna-auth') {
          gradeForHistory = gradeType === 'dna-auth' ? `${gradeCompany} DNA Auth` : `${gradeCompany} Authentic`;
        } else if (gradeType === 'card-auto') {
          gradeForHistory = `${gradeCompany} ${gradeValue}/${autoGrade}`;
        } else {
          gradeForHistory = `${gradeCompany} ${gradeValue}`;
        }
      }

      // Convert price to card's currency before saving
      const priceInCardCurrency = convertPrice(price, currency, card.currency);
      console.log('[PriceUpdateModal] Submitting:', {
        cardId: card.id,
        price,
        currency,
        priceInCardCurrency,
        cardCurrency: card.currency,
        priceDate,
        platform,
        parallel,
        grade: gradeForHistory,
        serialNumber
      });
      onSave(card.id, priceInCardCurrency, priceDate, platform, parallel, gradeForHistory, serialNumber || undefined);
    }
  };

  const isWatchlist = card.watchlist;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="bg-slate-900/95 border border-slate-800/50 rounded-2xl shadow-2xl w-full max-w-sm md:max-w-lg">
        <div className="p-6 border-b border-slate-800/50 flex justify-between items-center">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <TrendingUp size={20} className="text-crypto-lime" />
            {isWatchlist ? 'Log Market Sale' : 'Update Value'}
          </h3>
          <button onClick={onCancel} className="text-slate-400 hover:text-white p-2 hover:bg-slate-800 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="glass-card backdrop-blur-sm border border-white/10 p-4 rounded-xl">
            <p className="text-slate-500 text-xs uppercase font-bold mb-1.5 tracking-wide">Card</p>
            <p className="text-white font-semibold text-sm">{card.year} {card.brand} {card.player}</p>
            {card.series && <p className="text-slate-400 text-xs mt-0.5">{card.series}</p>}
            {card.parallel && <p className="text-crypto-lime text-xs mt-0.5 font-semibold">My Parallel: {card.parallel}</p>}
          </div>

          <div className="flex items-start gap-2 bg-blue-500/10 p-3 rounded-xl text-blue-300 text-xs border border-blue-500/20">
             <Info size={14} className="flex-shrink-0 mt-0.5" />
             <p>
               {isWatchlist
                 ? "Log a recent sale to track market trends."
                 : "Update your asset's value based on a recent comparable."}
             </p>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
                  Platform
                </label>
                <select
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value as Platform)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:ring-2 focus:ring-crypto-lime focus:border-crypto-lime outline-none"
                >
                  {Object.values(Platform).map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2 flex items-center gap-1">
                  <Calendar size={12} /> Date
                </label>
                <input
                  type="date"
                  value={priceDate}
                  onChange={(e) => setPriceDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:ring-2 focus:ring-crypto-lime focus:border-crypto-lime outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
                Parallel
              </label>
              <input
                type="text"
                value={parallel}
                onChange={(e) => setParallel(e.target.value)}
                placeholder="e.g., Silver, Purple Ice"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:ring-2 focus:ring-crypto-lime focus:border-crypto-lime outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
                Serial Number (Optional)
              </label>
              <input
                type="text"
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                placeholder="e.g., 15/99, 1/1"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:ring-2 focus:ring-crypto-lime focus:border-crypto-lime outline-none"
              />
            </div>

            {/* Grading Section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide">
                  Grading
                </label>
                <button
                  type="button"
                  onClick={() => setGraded(!graded)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-crypto-lime focus:ring-offset-2 focus:ring-offset-slate-900 ${
                    graded ? 'bg-emerald-500' : 'bg-slate-700'
                  }`}
                  role="switch"
                  aria-checked={graded}
                  aria-label="Toggle graded card"
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      graded ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {graded && (
                <div className="mt-3 space-y-3 p-3 bg-slate-950 rounded-xl border border-slate-700">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1.5">Company</label>
                      <select
                        value={gradeCompany}
                        onChange={(e) => {
                          setGradeCompany(e.target.value);
                          setGradeType('card-only');
                        }}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-2 text-sm text-white focus:ring-2 focus:ring-crypto-lime focus:border-crypto-lime outline-none"
                      >
                        <option value="PSA">PSA</option>
                        <option value="BGS">BGS</option>
                        <option value="SGC">SGC</option>
                        <option value="CGC">CGC</option>
                        <option value="CSA">CSA</option>
                        <option value="TAG">TAG</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1.5">Grade Type</label>
                      <select
                        value={gradeType}
                        onChange={(e) => setGradeType(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-2 text-sm text-white focus:ring-2 focus:ring-crypto-lime focus:border-crypto-lime outline-none"
                      >
                        {gradeCompany === 'PSA' && (
                          <>
                            <option value="card-auto">Graded (card + auto)</option>
                            <option value="card-only">Graded (card only)</option>
                            <option value="authentic">Authentic</option>
                            <option value="dna-auth">DNA Auth</option>
                          </>
                        )}
                        {gradeCompany !== 'PSA' && (
                          <>
                            <option value="card-auto">Graded (card + auto)</option>
                            <option value="card-only">Graded (card only)</option>
                            <option value="authentic">Authentic</option>
                          </>
                        )}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {gradeType !== 'authentic' && gradeType !== 'dna-auth' && (
                      <>
                        {gradeType === 'card-auto' ? (
                          <>
                            <div>
                              <label className="block text-xs font-medium text-slate-400 mb-1.5">Card Grade</label>
                              <input
                                type="text"
                                value={gradeValue}
                                onChange={(e) => setGradeValue(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-2 text-sm text-white focus:ring-2 focus:ring-crypto-lime focus:border-crypto-lime outline-none"
                                placeholder="10"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-slate-400 mb-1.5">Auto Grade</label>
                              <input
                                type="text"
                                value={autoGrade}
                                onChange={(e) => setAutoGrade(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-2 text-sm text-white focus:ring-2 focus:ring-crypto-lime focus:border-crypto-lime outline-none"
                                placeholder="10"
                              />
                            </div>
                          </>
                        ) : (
                          <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1.5">Grade</label>
                            <input
                              type="text"
                              value={gradeValue}
                              onChange={(e) => setGradeValue(e.target.value)}
                              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-2 text-sm text-white focus:ring-2 focus:ring-crypto-lime focus:border-crypto-lime outline-none"
                              placeholder="10"
                            />
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-1">
                <label className="block text-xs font-semibold text-crypto-lime uppercase tracking-wide mb-2">
                  Currency
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as Currency)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-3 text-sm text-white focus:ring-2 focus:ring-crypto-lime focus:border-crypto-lime outline-none h-[58px]"
                >
                  <option value="USD">USD ($)</option>
                  <option value="CNY">CNY (¥)</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-crypto-lime uppercase tracking-wide mb-2">
                  Price ({currency === 'USD' ? '$' : '¥'})
                </label>
                <input
                  type="number"
                  step="0.01"
                  autoFocus
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-2xl font-mono text-white focus:ring-2 focus:ring-crypto-lime focus:border-crypto-lime outline-none"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
             <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-3 rounded-xl text-slate-300 hover:bg-slate-800 font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-3 rounded-xl crypto-gradient text-black font-semibold transition-all hover:scale-105 shadow-lg glow-lime"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};