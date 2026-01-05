import React, { useMemo, useState } from 'react';
import { Card, Currency } from '../types';
import { ArrowDown, ArrowUp, TrendingUp, TrendingDown, Filter, ArrowUpDown, ChevronDown } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface TransactionLine {
  direction: 'OUT' | 'IN';
  item: string;
  bookedAs: string;
  amountFMV: number;
  costBasis?: number;
  realizedGainLoss?: number;
  cardId?: string;
}

interface Transaction {
  id: string;
  date: string;
  type: 'sale' | 'trade' | 'purchase';
  lines: TransactionLine[];
}

type SortOption = 'date-newest' | 'date-oldest' | 'amount-high' | 'amount-low' | 'pl-best' | 'pl-worst';

interface FilterState {
  type: 'all' | 'buy' | 'sell' | 'trade';
  dateMin: string;
  dateMax: string;
  search: string;
  plStatus: 'all' | 'profit' | 'loss' | 'breakeven';
}

interface TransactionsViewProps {
  cards: Card[];
  displayCurrency: Currency;
  convertPrice: (price: number, from: Currency, to: Currency) => number;
}

export const TransactionsView: React.FC<TransactionsViewProps> = ({ cards, displayCurrency, convertPrice }) => {
  const { t } = useLanguage();
  const symbol = displayCurrency === 'USD' ? '$' : '¥';

  const [sortBy, setSortBy] = useState<SortOption>('date-newest');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    type: 'all',
    dateMin: '',
    dateMax: '',
    search: '',
    plStatus: 'all',
  });

  // Generate transactions from both purchased and sold cards
  const transactions = useMemo(() => {
    const txns: Transaction[] = [];

    // 1. Add purchase transactions (IN) for all cards
    const purchasedCards = cards.filter(c => !c.watchlist).sort((a, b) => {
      const dateA = new Date(a.purchaseDate).getTime();
      const dateB = new Date(b.purchaseDate).getTime();
      return dateB - dateA; // Most recent first
    });

    purchasedCards.forEach(card => {
      const cardDesc = `${card.year} ${card.brand} ${card.series} ${card.insert} ${card.player}${card.parallel ? ` (${card.parallel})` : ''}${card.serialNumber ? ` #${card.serialNumber}` : ''}${card.graded ? ` ${card.gradeCompany} ${card.gradeValue}` : ''}`;

      // Cost basis for purchase
      const costBasis = convertPrice(card.purchasePrice, card.currency, displayCurrency);

      const lines: TransactionLine[] = [
        {
          direction: 'IN',
          item: cardDesc,
          bookedAs: card.acquisitionSource || 'Purchase',
          amountFMV: costBasis,
          cardId: card.id
        }
      ];

      txns.push({
        id: `purchase-${card.id}`,
        date: card.purchaseDate,
        type: 'purchase',
        lines
      });
    });

    // 2. Add sale/trade transactions (OUT) for sold cards
    const soldCards = cards.filter(c => c.sold).sort((a, b) => {
      const dateA = new Date(a.soldDate || '').getTime();
      const dateB = new Date(b.soldDate || '').getTime();
      return dateB - dateA; // Most recent first
    });

    console.log('[TRANSACTIONS DEBUG] Sold cards:', soldCards.map(c => ({ player: c.player, soldVia: c.soldVia })));

    soldCards.forEach(card => {
      const cardDesc = `${card.year} ${card.brand} ${card.series} ${card.insert} ${card.player}${card.parallel ? ` (${card.parallel})` : ''}${card.serialNumber ? ` #${card.serialNumber}` : ''}${card.graded ? ` ${card.gradeCompany} ${card.gradeValue}` : ''}`;

      // For cards from breaks or self-rips, use the earliest price history entry as cost basis
      const costBasis = (card.acquisitionSource === 'Break' || card.acquisitionSource === 'Self Rip (Case/Box)')
        && card.priceHistory && card.priceHistory.length > 0
        ? convertPrice(card.priceHistory[0].value, card.currency, displayCurrency)
        : convertPrice(card.purchasePrice, card.currency, displayCurrency);
      const soldPrice = convertPrice(card.soldPrice || 0, card.currency, displayCurrency);
      const realizedGL = soldPrice - costBasis;

      if (card.soldVia === 'trade') {
        // For trades, we create a transaction with OUT and IN lines
        // Note: We don't have the received cards linked yet, so we just show the sold card
        const lines: TransactionLine[] = [
          {
            direction: 'OUT',
            item: cardDesc,
            bookedAs: 'Taxable SALE',
            amountFMV: soldPrice,
            costBasis: costBasis,
            realizedGainLoss: realizedGL,
            cardId: card.id
          }
        ];

        txns.push({
          id: `trade-${card.id}`,
          date: card.soldDate || '',
          type: 'trade',
          lines
        });
      } else {
        // Regular sale
        const lines: TransactionLine[] = [
          {
            direction: 'OUT',
            item: cardDesc,
            bookedAs: 'Taxable SALE',
            amountFMV: soldPrice,
            costBasis: costBasis,
            realizedGainLoss: realizedGL,
            cardId: card.id
          }
        ];

        txns.push({
          id: `sale-${card.id}`,
          date: card.soldDate || '',
          type: 'sale',
          lines
        });
      }
    });

    // Apply filters
    let filtered = txns;

    // Filter by type
    if (filters.type !== 'all') {
      if (filters.type === 'buy') {
        filtered = filtered.filter(t => t.type === 'purchase');
      } else if (filters.type === 'sell') {
        filtered = filtered.filter(t => t.type === 'sale');
      } else if (filters.type === 'trade') {
        filtered = filtered.filter(t => t.type === 'trade');
      }
    }

    // Filter by date range
    if (filters.dateMin) {
      const minDate = new Date(filters.dateMin).getTime();
      filtered = filtered.filter(t => new Date(t.date).getTime() >= minDate);
    }
    if (filters.dateMax) {
      const maxDate = new Date(filters.dateMax).getTime();
      filtered = filtered.filter(t => new Date(t.date).getTime() <= maxDate);
    }

    // Filter by card/player search
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(t =>
        t.lines.some(line => line.item.toLowerCase().includes(searchLower))
      );
    }

    // Filter by P/L status
    if (filters.plStatus !== 'all') {
      filtered = filtered.filter(t => {
        const hasRealizedGL = t.lines.some(line => line.realizedGainLoss !== undefined);
        if (!hasRealizedGL && filters.plStatus !== 'breakeven') return false;

        return t.lines.some(line => {
          if (line.realizedGainLoss === undefined) return filters.plStatus === 'breakeven';

          if (filters.plStatus === 'profit') return line.realizedGainLoss > 0;
          if (filters.plStatus === 'loss') return line.realizedGainLoss < 0;
          if (filters.plStatus === 'breakeven') return Math.abs(line.realizedGainLoss) < 0.01;
          return true;
        });
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();

      // Get amounts (sum of all lines in transaction)
      const amountA = a.lines.reduce((sum, line) => sum + line.amountFMV, 0);
      const amountB = b.lines.reduce((sum, line) => sum + line.amountFMV, 0);

      // Get realized P/L (sum of all lines with realized G/L)
      const plA = a.lines.reduce((sum, line) => sum + (line.realizedGainLoss || 0), 0);
      const plB = b.lines.reduce((sum, line) => sum + (line.realizedGainLoss || 0), 0);

      switch (sortBy) {
        case 'date-newest':
          return dateB - dateA;
        case 'date-oldest':
          return dateA - dateB;
        case 'amount-high':
          return amountB - amountA;
        case 'amount-low':
          return amountA - amountB;
        case 'pl-best':
          return plB - plA;
        case 'pl-worst':
          return plA - plB;
        default:
          return dateB - dateA;
      }
    });

    return filtered;
  }, [cards, displayCurrency, convertPrice, filters, sortBy]);

  return (
    <div className="space-y-4 p-4 lg:p-6">
      {/* Header with Sort/Filter */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl lg:text-3xl font-bold text-white">{t('transactions.title')}</h2>
          <div className="flex items-center gap-3">
            <span className="text-xs lg:text-sm text-slate-400 font-medium">
              {transactions.length} {transactions.length === 1 ? t('transactions.transaction') : t('transactions.transactions')}
            </span>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-lg transition-colors ${showFilters ? 'bg-crypto-lime/10 text-crypto-lime' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
            >
              <Filter size={18} />
            </button>
          </div>
        </div>

        {/* Sort Dropdown */}
        <div className="flex items-center gap-2">
          <ArrowUpDown size={16} className="text-slate-400" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-crypto-lime/50 focus:border-crypto-lime outline-none"
          >
            <option value="date-newest">{t('transSort.dateNewest')}</option>
            <option value="date-oldest">{t('transSort.dateOldest')}</option>
            <option value="amount-high">{t('transSort.amountHigh')}</option>
            <option value="amount-low">{t('transSort.amountLow')}</option>
            <option value="pl-best">{t('transSort.plBest')}</option>
            <option value="pl-worst">{t('transSort.plWorst')}</option>
          </select>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="glass-card backdrop-blur-sm border border-white/10 rounded-xl p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Type Filter */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{t('transFilter.type')}</label>
                <select
                  value={filters.type}
                  onChange={(e) => setFilters({ ...filters, type: e.target.value as FilterState['type'] })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-crypto-lime/50 focus:border-crypto-lime outline-none"
                >
                  <option value="all">{t('transFilter.allTransactions')}</option>
                  <option value="buy">{t('transFilter.buyOnly')}</option>
                  <option value="sell">{t('transFilter.sellOnly')}</option>
                  <option value="trade">{t('transFilter.tradeOnly')}</option>
                </select>
              </div>

              {/* P/L Status Filter */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{t('transFilter.realizedPL')}</label>
                <select
                  value={filters.plStatus}
                  onChange={(e) => setFilters({ ...filters, plStatus: e.target.value as FilterState['plStatus'] })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-crypto-lime/50 focus:border-crypto-lime outline-none"
                >
                  <option value="all">{t('transFilter.all')}</option>
                  <option value="profit">{t('transFilter.profitOnly')}</option>
                  <option value="loss">{t('transFilter.lossOnly')}</option>
                  <option value="breakeven">{t('transFilter.breakeven')}</option>
                </select>
              </div>

              {/* Date Range */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{t('transFilter.dateRange')}</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    value={filters.dateMin}
                    onChange={(e) => setFilters({ ...filters, dateMin: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-crypto-lime/50 focus:border-crypto-lime outline-none"
                  />
                  <input
                    type="date"
                    value={filters.dateMax}
                    onChange={(e) => setFilters({ ...filters, dateMax: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-crypto-lime/50 focus:border-crypto-lime outline-none"
                  />
                </div>
              </div>

              {/* Card/Player Search */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{t('transFilter.search')}</label>
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  placeholder={t('transFilter.searchPlaceholder')}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-crypto-lime/50 focus:border-crypto-lime outline-none"
                />
              </div>
            </div>

            {/* Clear Filters Button */}
            <button
              onClick={() => setFilters({
                type: 'all',
                dateMin: '',
                dateMax: '',
                search: '',
                plStatus: 'all',
              })}
              className="w-full px-4 py-2 bg-crypto-lime/10 hover:bg-crypto-lime/20 text-crypto-lime font-medium rounded-lg text-sm transition-colors border border-crypto-lime/30"
            >
              {t('transFilter.clearFilters')}
            </button>
          </div>
        )}
      </div>

      {transactions.length === 0 ? (
        <div className="glass-card backdrop-blur-sm border border-white/10 rounded-2xl p-12 text-center">
          <p className="text-slate-500">{t('transactions.noTransactions')}</p>
          <p className="text-xs text-slate-600 mt-2">{t('transactions.sellTrade')}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {transactions.map((txn) => {
            const typeColor = txn.type === 'trade' ? 'purple' : txn.type === 'purchase' ? 'blue' : 'crypto-lime';
            const typeLabel = txn.type === 'trade' ? t('transactions.trade') : txn.type === 'purchase' ? t('transactions.buy') : t('transactions.sale');

            return (
            <div key={txn.id} className={`glass-card backdrop-blur-sm rounded-2xl overflow-hidden ${
              txn.type === 'trade' ? 'border-2 border-purple-500/30' :
              txn.type === 'purchase' ? 'border-2 border-blue-500/30' :
              'border-2 border-crypto-lime/30'
            }`}>
              {/* Transaction Header */}
              <div className={`px-4 py-3 border-b flex items-center justify-between ${
                txn.type === 'trade' ? 'bg-purple-500/10 border-purple-500/20' :
                txn.type === 'purchase' ? 'bg-blue-500/10 border-blue-500/20' :
                'bg-crypto-lime/10 border-crypto-lime/20'
              }`}>
                <div className="flex items-center gap-2 lg:gap-3">
                  <span className={`px-2 lg:px-3 py-1 rounded-lg text-xs font-bold ${
                    txn.type === 'trade' ? 'bg-purple-500/30 text-purple-300 border border-purple-400/50' :
                    txn.type === 'purchase' ? 'bg-blue-500/30 text-blue-300 border border-blue-400/50' :
                    'bg-crypto-lime/30 text-crypto-lime border border-crypto-lime/50'
                  }`}>
                    {typeLabel}
                  </span>
                  <span className="text-xs lg:text-sm text-slate-300 font-semibold">
                    {new Date(txn.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </span>
                </div>
              </div>

              {/* Transaction Lines - Desktop Table View */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-800/30">
                      <th className="text-left text-xs font-bold text-slate-400 uppercase tracking-wide px-4 py-3 w-24">{t('transactions.direction')}</th>
                      <th className="text-left text-xs font-bold text-slate-400 uppercase tracking-wide px-4 py-3">{t('transactions.item')}</th>
                      <th className="text-left text-xs font-bold text-slate-400 uppercase tracking-wide px-4 py-3 w-32">{t('transactions.bookedAs')}</th>
                      <th className="text-right text-xs font-bold text-slate-400 uppercase tracking-wide px-4 py-3 w-32">{t('transactions.amount')}</th>
                      <th className="text-right text-xs font-bold text-slate-400 uppercase tracking-wide px-4 py-3 w-32">{t('transactions.costBasis')}</th>
                      <th className="text-right text-xs font-bold text-slate-400 uppercase tracking-wide px-4 py-3 w-36">{t('transactions.realizedGL')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {txn.lines.map((line, idx) => {
                      const isProfit = (line.realizedGainLoss || 0) >= 0;
                      return (
                        <tr key={idx} className="border-b border-slate-800/20 last:border-b-0 hover:bg-white/5 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              {line.direction === 'OUT' ? (
                                <ArrowUp className="text-rose-400" size={16} />
                              ) : (
                                <ArrowDown className="text-crypto-lime" size={16} />
                              )}
                              <span className={`text-xs font-bold ${line.direction === 'OUT' ? 'text-rose-400' : 'text-crypto-lime'}`}>
                                {line.direction}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm text-white">{line.item}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs text-slate-400">{line.bookedAs}</span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="font-mono text-sm font-semibold text-white">
                              {symbol}{line.amountFMV.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            {line.costBasis !== undefined ? (
                              <span className="font-mono text-sm text-slate-400">
                                {symbol}{line.costBasis.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            ) : (
                              <span className="text-slate-600">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {line.realizedGainLoss !== undefined ? (
                              <div className="flex items-center justify-end gap-1.5">
                                {isProfit ? <TrendingUp size={14} className="text-crypto-lime" /> : <TrendingDown size={14} className="text-rose-400" />}
                                <span className={`font-mono text-sm font-bold ${isProfit ? 'text-crypto-lime' : 'text-rose-400'}`}>
                                  {isProfit ? '+' : ''}{symbol}{Math.abs(line.realizedGainLoss).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                              </div>
                            ) : (
                              <span className="text-slate-600">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Transaction Lines - Mobile Card View */}
              <div className="lg:hidden">
                {txn.lines.map((line, idx) => {
                  const isProfit = (line.realizedGainLoss || 0) >= 0;
                  return (
                    <div key={idx} className="p-4 border-b border-slate-800/20 last:border-b-0 space-y-3">
                      {/* Direction and Item */}
                      <div className="flex items-start gap-3">
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {line.direction === 'OUT' ? (
                            <ArrowUp className="text-rose-400" size={18} />
                          ) : (
                            <ArrowDown className="text-crypto-lime" size={18} />
                          )}
                          <span className={`text-xs font-bold ${line.direction === 'OUT' ? 'text-rose-400' : 'text-crypto-lime'}`}>
                            {line.direction}
                          </span>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-white font-medium leading-snug">{line.item}</p>
                          <p className="text-xs text-slate-400 mt-1">{line.bookedAs}</p>
                        </div>
                      </div>

                      {/* Financial Details */}
                      <div className="grid grid-cols-3 gap-3 pt-2 border-t border-slate-800/30">
                        <div>
                          <p className="text-[10px] text-slate-500 uppercase tracking-wide font-bold mb-1">Amount (FMV)</p>
                          <p className="font-mono text-sm font-semibold text-white">
                            {symbol}{line.amountFMV.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-500 uppercase tracking-wide font-bold mb-1">Cost Basis</p>
                          {line.costBasis !== undefined ? (
                            <p className="font-mono text-sm text-slate-400">
                              {symbol}{line.costBasis.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </p>
                          ) : (
                            <p className="text-slate-600">—</p>
                          )}
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-500 uppercase tracking-wide font-bold mb-1">Realized G/L</p>
                          {line.realizedGainLoss !== undefined ? (
                            <div className="flex items-center gap-1">
                              {isProfit ? <TrendingUp size={12} className="text-crypto-lime" /> : <TrendingDown size={12} className="text-rose-400" />}
                              <p className={`font-mono text-sm font-bold ${isProfit ? 'text-crypto-lime' : 'text-rose-400'}`}>
                                {isProfit ? '+' : ''}{symbol}{Math.abs(line.realizedGainLoss).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </p>
                            </div>
                          ) : (
                            <p className="text-slate-600">—</p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
          })}
        </div>
      )}
    </div>
  );
};
