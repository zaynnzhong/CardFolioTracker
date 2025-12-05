import React, { useState, useMemo } from 'react';
import { Card, Sport, Currency } from '../types';
import { TrendingUp, TrendingDown, Image as ImageIcon, ChevronRight, CheckCircle2, Sparkles, Filter, ArrowUpDown, ChevronDown, ChevronUp, LayoutGrid, List } from 'lucide-react';
import { PillTabs } from './PillTabs';
import { FocusCards } from './FocusCards';
import { GradeTag } from './GradeTag';

interface CardListProps {
  cards: Card[];
  onSelect: (card: Card) => void;
  displayCurrency: Currency;
  convertPrice: (price: number, from: Currency, to: Currency) => number;
  onTabChange?: (tab: 'holdings' | 'sold') => void;
}

type SortOption = 'price-high' | 'price-low' | 'trend-up' | 'trend-down';

interface CardGroup {
  id: string; // bulkGroupId or individual card id
  cards: Card[];
  isBulkGroup: boolean;
}

export const CardList: React.FC<CardListProps> = ({ cards, onSelect, displayCurrency, convertPrice, onTabChange }) => {
  const [filterPlayer, setFilterPlayer] = useState<string>('');
  const [sortBy, setSortBy] = useState<SortOption>('price-high');
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState<'holdings' | 'sold'>('holdings');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'list' | 'gallery'>('list');

  // Notify parent when tab changes
  const handleTabChange = (tab: 'holdings' | 'sold') => {
    setActiveTab(tab);
    onTabChange?.(tab);
  };

  // Get unique players for filter dropdown
  const uniquePlayers = useMemo(() => {
    const players = [...new Set(cards.map(c => c.player))].sort();
    return players;
  }, [cards]);

  // Filter and sort cards
  const filteredAndSortedCards = useMemo(() => {
    let filtered = [...cards];

    // Exclude watchlist items from both tabs
    filtered = filtered.filter(c => !c.watchlist);

    // Filter by tab (holdings or sold)
    filtered = filtered.filter(c => activeTab === 'holdings' ? !c.sold : c.sold);

    // Apply player filter
    if (filterPlayer) {
      filtered = filtered.filter(c => c.player === filterPlayer);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      // Convert values to display currency for fair comparison
      const aValue = convertPrice(a.sold ? (a.soldPrice || 0) : (a.currentValue === -1 ? 0 : a.currentValue), a.currency, displayCurrency);
      const bValue = convertPrice(b.sold ? (b.soldPrice || 0) : (b.currentValue === -1 ? 0 : b.currentValue), b.currency, displayCurrency);

      // Calculate basis (considering Break/Self Rip cards)
      const aIsBreakOrSelfRip = a.acquisitionSource === 'Break' || a.acquisitionSource === 'Self Rip (Case/Box)';
      const bIsBreakOrSelfRip = b.acquisitionSource === 'Break' || b.acquisitionSource === 'Self Rip (Case/Box)';

      const aEarliestComp = a.priceHistory && a.priceHistory.length > 0
        ? convertPrice(a.priceHistory[0].value, a.currency, displayCurrency)
        : convertPrice(a.purchasePrice, a.currency, displayCurrency);
      const bEarliestComp = b.priceHistory && b.priceHistory.length > 0
        ? convertPrice(b.priceHistory[0].value, b.currency, displayCurrency)
        : convertPrice(b.purchasePrice, b.currency, displayCurrency);

      const aBasis = aIsBreakOrSelfRip ? aEarliestComp : convertPrice(a.purchasePrice, a.currency, displayCurrency);
      const bBasis = bIsBreakOrSelfRip ? bEarliestComp : convertPrice(b.purchasePrice, b.currency, displayCurrency);

      const aProfit = aValue - aBasis;
      const bProfit = bValue - bBasis;
      const aProfitPercent = aBasis > 0 ? (aProfit / aBasis) * 100 : 0;
      const bProfitPercent = bBasis > 0 ? (bProfit / bBasis) * 100 : 0;

      switch (sortBy) {
        case 'price-high':
          return bValue - aValue; // High to low
        case 'price-low':
          return aValue - bValue; // Low to high
        case 'trend-up':
          return bProfitPercent - aProfitPercent; // Best trending first
        case 'trend-down':
          return aProfitPercent - bProfitPercent; // Worst trending first
        default:
          return 0;
      }
    });

    return filtered;
  }, [cards, activeTab, filterPlayer, sortBy, displayCurrency, convertPrice]);

  // Group cards by matching properties (player, year, brand, series, insert)
  const cardGroups = useMemo(() => {
    const groups: CardGroup[] = [];
    const groupMap = new Map<string, Card[]>();

    filteredAndSortedCards.forEach(card => {
      // Create a unique key based on player, year, brand, series, and insert
      const groupKey = `${card.player}-${card.year}-${card.brand}-${card.series}-${card.insert}`;

      if (!groupMap.has(groupKey)) {
        groupMap.set(groupKey, []);
      }
      groupMap.get(groupKey)!.push(card);
    });

    // Convert map to groups array
    groupMap.forEach((groupCards, groupKey) => {
      if (groupCards.length > 1) {
        // Multiple cards with same base properties - create a bulk group
        groups.push({
          id: groupKey,
          cards: groupCards,
          isBulkGroup: true
        });
      } else {
        // Single card - add as individual
        groups.push({
          id: groupCards[0].id,
          cards: groupCards,
          isBulkGroup: false
        });
      }
    });

    return groups;
  }, [filteredAndSortedCards]);

  const toggleGroupExpanded = (groupId: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupId)) {
        newSet.delete(groupId);
      } else {
        newSet.add(groupId);
      }
      return newSet;
    });
  };

  const getSportColor = (sport: Sport) => {
    switch (sport) {
      case Sport.BASKETBALL: return 'text-orange-400 bg-orange-500/10';
      case Sport.BASEBALL: return 'text-blue-400 bg-blue-500/10';
      case Sport.FOOTBALL: return 'text-amber-400 bg-amber-500/10';
      case Sport.SOCCER: return 'text-green-400 bg-green-500/10';
      case Sport.POKEMON: return 'text-yellow-400 bg-yellow-500/10';
      default: return 'text-slate-400 bg-slate-500/10';
    }
  };

  if (cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
        <div className="w-20 h-20 bg-gradient-to-br from-emerald-500/20 to-blue-500/20 rounded-2xl flex items-center justify-center mb-4 backdrop-blur-sm border border-emerald-500/20">
          <Sparkles className="text-emerald-400" size={32} />
        </div>
        <h3 className="text-white font-bold text-xl">No assets yet</h3>
        <p className="text-slate-400 mt-2 max-w-xs">Add your first card to start building your portfolio.</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="space-y-6">
        {/* Header with Tab Navigation */}
        <div className="flex items-center justify-between">
          <PillTabs
            activeTab={activeTab}
            onChange={handleTabChange}
          />
        </div>

        <div className="flex justify-between items-center mt-6">
          <h3 className="text-white text-xl lg:text-2xl font-bold">
            {activeTab === 'holdings' ? 'Holdings' : 'Sold Cards'}
          </h3>
          <div className="flex items-center gap-3">
            <span className="text-slate-400 text-sm font-medium">{filteredAndSortedCards.length} cards {cardGroups.filter(g => g.isBulkGroup).length > 0 && `(${cardGroups.length} entries)`}</span>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 bg-slate-900/50 rounded-lg p-1">
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-crypto-lime/20 text-crypto-lime' : 'text-slate-400 hover:text-white'}`}
                title="List view"
              >
                <List size={18} />
              </button>
              <button
                onClick={() => setViewMode('gallery')}
                className={`p-2 rounded-lg transition-colors ${viewMode === 'gallery' ? 'bg-crypto-lime/20 text-crypto-lime' : 'text-slate-400 hover:text-white'}`}
                title="Gallery view"
              >
                <LayoutGrid size={18} />
              </button>
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-lg transition-colors ${showFilters ? 'bg-crypto-lime/10 text-crypto-lime' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
            >
              <Filter size={18} />
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="glass-card backdrop-blur-sm border border-white/10 rounded-xl p-4 lg:flex lg:gap-4 space-y-3 lg:space-y-0">
            <div className="flex-1">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2 block">
                Filter by Player
              </label>
              <select
                value={filterPlayer}
                onChange={(e) => setFilterPlayer(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:ring-2 focus:ring-crypto-lime focus:border-crypto-lime outline-none"
              >
                <option value="">All Players</option>
                {uniquePlayers.map(player => (
                  <option key={player} value={player}>{player}</option>
                ))}
              </select>
            </div>

            <div className="flex-1">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2 flex items-center gap-1.5 block">
                <ArrowUpDown size={12} /> Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:ring-2 focus:ring-crypto-lime focus:border-crypto-lime outline-none"
              >
                <option value="price-high">Price: High to Low</option>
                <option value="price-low">Price: Low to High</option>
                <option value="trend-up">Trending: Best First</option>
                <option value="trend-down">Trending: Worst First</option>
              </select>
            </div>
          </div>
        )}

      {/* Gallery View */}
      {viewMode === 'gallery' && (
        <div className="px-4">
          <FocusCards
            cards={filteredAndSortedCards.map(card => ({
              title: `${card.year} ${card.brand} ${card.player}${card.parallel ? ` - ${card.parallel}` : ''}`,
              src: card.imageUrl || 'https://images.unsplash.com/photo-1611143669185-af224c5e3252?w=800&auto=format&fit=crop',
            }))}
          />
        </div>
      )}

      {/* Mobile Card View */}
      {viewMode === 'list' && (
        <div className="lg:hidden flex flex-col gap-3 px-4">
        {cardGroups.map((group) => {
          // Use the first card as representative for the group
          const card = group.cards[0];
          const isBreakOrSelfRip = card.acquisitionSource === 'Break' || card.acquisitionSource === 'Self Rip (Case/Box)';

          // Calculate group totals
          const groupBasis = group.cards.reduce((sum, c) => {
            const purchasePrice = convertPrice(c.purchasePrice, c.currency, displayCurrency);
            const isBreak = c.acquisitionSource === 'Break' || c.acquisitionSource === 'Self Rip (Case/Box)';
            const earliestComp = c.priceHistory && c.priceHistory.length > 0
              ? convertPrice(c.priceHistory[0].value, c.currency, displayCurrency)
              : purchasePrice;
            return sum + (isBreak ? earliestComp : purchasePrice);
          }, 0);

          const groupCurrentValue = group.cards.reduce((sum, c) => {
            return sum + convertPrice(c.sold ? (c.soldPrice || 0) : c.currentValue, c.currency, displayCurrency);
          }, 0);

          const groupProfit = groupCurrentValue - groupBasis;
          const groupProfitPercent = groupBasis > 0 ? (groupProfit / groupBasis) * 100 : 0;
          const isProfit = groupProfit >= 0;
          const symbol = displayCurrency === 'USD' ? '$' : '¥';
          const isExpanded = expandedGroups.has(group.id);

          return (
            <React.Fragment key={group.id}>
              <div
                onClick={() => group.isBulkGroup ? toggleGroupExpanded(group.id) : onSelect(card)}
                className="group relative flex items-start justify-between p-4 bg-slate-900/40 backdrop-blur-sm border border-slate-800/50 rounded-xl hover:bg-slate-900/60 hover:border-slate-700 transition-all duration-200 cursor-pointer active:scale-[0.99]"
              >
                <div className="relative flex items-start gap-3 flex-1 min-w-0">
                  {/* Image / Icon */}
                  <div className="relative w-16 h-20 bg-slate-800/50 rounded-lg overflow-hidden border border-slate-700/50 flex-shrink-0 shadow-md">
                    {card.imageUrl ? (
                      <img src={card.imageUrl} alt={card.player} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-600">
                        <ImageIcon size={20} />
                      </div>
                    )}
                    {card.sold && (
                      <div className="absolute top-1 right-1">
                        <span className={`text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-lg ${card.soldVia === 'trade' ? 'bg-purple-500' : 'bg-emerald-500'}`}>
                          {card.soldVia === 'trade' ? 'TRADED' : 'SOLD'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex flex-col flex-1 min-w-0 gap-1">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-semibold text-sm leading-tight line-clamp-2">
                        {card.year} {card.brand} {card.series} {card.insert} {card.player} {card.parallel ? `(${card.parallel})` : ''} {card.serialNumber || ''}
                      </span>
                      {group.isBulkGroup && (
                        <>
                          <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 text-[10px] font-bold border border-blue-500/30 flex-shrink-0">
                            {group.cards.length}x
                          </span>
                          {isExpanded ? (
                            <ChevronUp size={16} className="text-blue-400 flex-shrink-0" />
                          ) : (
                            <ChevronDown size={16} className="text-blue-400 flex-shrink-0" />
                          )}
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md ${getSportColor(card.sport)}`}>
                        {card.player}
                      </span>
                      {!group.isBulkGroup && card.graded && (
                        <span className="text-[10px] bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                          <GradeTag card={card} />
                        </span>
                      )}
                      {isBreakOrSelfRip && (
                        <span className="text-[10px] text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-md font-semibold">
                          {card.acquisitionSource === 'Break' ? 'BREAK' : 'SELF RIP'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Price / Change */}
                <div className="flex flex-col items-end gap-1 flex-shrink-0 ml-3">
                  {card.currentValue === -1 && !card.sold ? (
                    <>
                      <span className="font-mono font-bold text-lg text-amber-400">Unknown</span>
                      <span className="text-xs font-medium text-amber-400/60">?</span>
                    </>
                  ) : (
                    <>
                      <span className={`font-mono font-bold text-lg ${card.sold ? 'text-slate-400' : 'text-white'}`}>
                        {symbol}{groupCurrentValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>

                      <div className={`flex items-center gap-1 ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isProfit ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                        <span className="text-sm font-semibold">
                          {isProfit ? '+' : ''}{Math.abs(groupProfitPercent).toFixed(1)}%
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Expanded group cards */}
              {group.isBulkGroup && isExpanded && group.cards.map((groupCard) => {
                const cardIsBreak = groupCard.acquisitionSource === 'Break' || groupCard.acquisitionSource === 'Self Rip (Case/Box)';
                const cardCurrentValue = convertPrice(groupCard.sold ? (groupCard.soldPrice || 0) : groupCard.currentValue, groupCard.currency, displayCurrency);
                const cardPurchasePrice = convertPrice(groupCard.purchasePrice, groupCard.currency, displayCurrency);
                const cardEarliestComp = groupCard.priceHistory && groupCard.priceHistory.length > 0
                  ? convertPrice(groupCard.priceHistory[0].value, groupCard.currency, displayCurrency)
                  : cardPurchasePrice;
                const cardBasis = cardIsBreak ? cardEarliestComp : cardPurchasePrice;
                const cardProfit = cardCurrentValue - cardBasis;
                const cardProfitPercent = cardBasis > 0 ? (cardProfit / cardBasis) * 100 : 0;
                const cardIsProfit = cardProfit >= 0;

                return (
                  <div
                    key={groupCard.id}
                    onClick={() => onSelect(groupCard)}
                    className="group relative flex items-start justify-between p-4 pl-8 bg-slate-950/50 backdrop-blur-sm border border-slate-800/50 rounded-xl hover:bg-slate-900/60 hover:border-slate-700 transition-all duration-200 cursor-pointer active:scale-[0.99]"
                  >
                    <div className="flex flex-col flex-1 min-w-0 gap-1">
                      <span className="text-slate-300 text-xs">
                        {groupCard.parallel && <span className="text-slate-400">{groupCard.parallel}</span>}
                        {groupCard.serialNumber && <span className="ml-2 text-slate-500">#{groupCard.serialNumber}</span>}
                        {groupCard.graded && <span className="ml-2"><GradeTag card={groupCard} /></span>}
                      </span>
                    </div>

                    <div className="flex flex-col items-end gap-1 flex-shrink-0 ml-3">
                      <span className="font-mono font-bold text-sm text-white">
                        {symbol}{cardCurrentValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                      <div className={`flex items-center gap-1 ${cardIsProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                        <span className="text-xs font-semibold">
                          {cardIsProfit ? '+' : ''}{Math.abs(cardProfitPercent).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </React.Fragment>
          );
        })}
      </div>
      )}

      {/* Desktop Table View */}
      {viewMode === 'list' && (
        <div className="hidden lg:block bg-slate-900/40 backdrop-blur-sm border border-slate-800/50 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-900/60 border-b border-slate-800/50">
                <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide px-6 py-4">Card</th>
                <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide px-4 py-4">Details</th>
                {activeTab === 'sold' ? (
                  <>
                    <th className="text-right text-xs font-semibold text-slate-400 uppercase tracking-wide px-4 py-4">Purchase</th>
                    <th className="text-right text-xs font-semibold text-slate-400 uppercase tracking-wide px-4 py-4">Sold</th>
                    <th className="text-right text-xs font-semibold text-slate-400 uppercase tracking-wide px-4 py-4">P/L</th>
                    <th className="text-right text-xs font-semibold text-slate-400 uppercase tracking-wide px-6 py-4">Return</th>
                  </>
                ) : (
                  <>
                    <th className="text-right text-xs font-semibold text-slate-400 uppercase tracking-wide px-4 py-4">Cost Basis</th>
                    <th className="text-right text-xs font-semibold text-slate-400 uppercase tracking-wide px-4 py-4">Current Value</th>
                    <th className="text-right text-xs font-semibold text-slate-400 uppercase tracking-wide px-4 py-4">P/L</th>
                    <th className="text-right text-xs font-semibold text-slate-400 uppercase tracking-wide px-6 py-4">Change</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/30">
              {cardGroups.map((group) => {
                // Use the first card as representative for the group
                const card = group.cards[0];
                const isBreakOrSelfRip = card.acquisitionSource === 'Break' || card.acquisitionSource === 'Self Rip (Case/Box)';

                // Calculate group totals
                const groupBasis = group.cards.reduce((sum, c) => {
                  const purchasePrice = convertPrice(c.purchasePrice, c.currency, displayCurrency);
                  const isBreak = c.acquisitionSource === 'Break' || c.acquisitionSource === 'Self Rip (Case/Box)';
                  const earliestComp = c.priceHistory && c.priceHistory.length > 0
                    ? convertPrice(c.priceHistory[0].value, c.currency, displayCurrency)
                    : purchasePrice;
                  return sum + (isBreak ? earliestComp : purchasePrice);
                }, 0);

                const groupCurrentValue = group.cards.reduce((sum, c) => {
                  return sum + convertPrice(c.sold ? (c.soldPrice || 0) : c.currentValue, c.currency, displayCurrency);
                }, 0);

                const groupProfit = groupCurrentValue - groupBasis;
                const groupProfitPercent = groupBasis > 0 ? (groupProfit / groupBasis) * 100 : 0;
                const isProfit = groupProfit >= 0;
                const symbol = displayCurrency === 'USD' ? '$' : '¥';
                const isExpanded = expandedGroups.has(group.id);

                return (
                  <React.Fragment key={group.id}>
                  <tr
                    onClick={() => group.isBulkGroup ? toggleGroupExpanded(group.id) : onSelect(card)}
                    className="hover:bg-slate-800/30 cursor-pointer transition-colors group"
                  >
                    {/* Card Image + Player */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        {group.isBulkGroup && (
                          <button onClick={(e) => { e.stopPropagation(); toggleGroupExpanded(group.id); }}>
                            {isExpanded ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
                          </button>
                        )}
                        <div className="relative w-16 h-20 bg-slate-800/50 rounded-lg overflow-hidden border border-slate-700/50 flex-shrink-0">
                          {card.imageUrl ? (
                            <img src={card.imageUrl} alt={card.player} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-600">
                              <ImageIcon size={20} />
                            </div>
                          )}
                          {card.sold && (
                            <div className="absolute top-1 right-1">
                              <span className={`text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-lg ${card.soldVia === 'trade' ? 'bg-purple-500' : 'bg-emerald-500'}`}>
                                {card.soldVia === 'trade' ? 'TRADED' : 'SOLD'}
                              </span>
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <div className="font-semibold text-white text-sm">{card.player}</div>
                            {group.isBulkGroup && (
                              <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 text-[10px] font-bold border border-blue-500/30">
                                {group.cards.length}x
                              </span>
                            )}
                          </div>
                          <div className={`text-xs font-semibold uppercase px-2 py-0.5 rounded-md inline-block ${getSportColor(card.sport)}`}>
                            {card.sport}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Details */}
                    <td className="px-4 py-4">
                      <div className="text-sm text-slate-300">
                        <div className="font-medium">{card.year} {card.brand} {card.series}</div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          {card.insert}
                          {card.parallel && ` (${card.parallel})`}
                          {card.serialNumber && ` • #${card.serialNumber}`}
                        </div>
                        {card.graded && (
                          <div className="text-xs mt-1">
                            <GradeTag card={card} className="font-semibold" />
                          </div>
                        )}
                        {isBreakOrSelfRip && (
                          <div className="text-[10px] text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-md font-semibold inline-block mt-1">
                            {card.acquisitionSource === 'Break' ? 'BREAK' : 'SELF RIP'}
                          </div>
                        )}
                      </div>
                    </td>

                    {activeTab === 'sold' ? (
                      <>
                        {/* Purchase Price & Date */}
                        <td className="px-4 py-4">
                          <div className="text-right">
                            <div className="font-mono text-sm text-slate-400">
                              {symbol}{groupBasis.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                            <div className="text-[10px] text-slate-600 mt-0.5">
                              {new Date(card.purchaseDate).toLocaleDateString()}
                            </div>
                          </div>
                        </td>

                        {/* Sold Price & Date */}
                        <td className="px-4 py-4">
                          <div className="text-right">
                            <div className="font-mono text-sm font-semibold text-white">
                              {symbol}{groupCurrentValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                            <div className="text-[10px] text-slate-600 mt-0.5">
                              {card.soldDate ? new Date(card.soldDate).toLocaleDateString() : '—'}
                            </div>
                          </div>
                        </td>

                        {/* P/L Amount */}
                        <td className="px-4 py-4">
                          <div className="text-right">
                            <div className={`font-mono text-sm font-semibold ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {isProfit ? '+' : ''}{symbol}{Math.abs(groupProfit).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                          </div>
                        </td>

                        {/* Return % */}
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            {isProfit ? <TrendingUp size={16} className="text-emerald-400" /> : <TrendingDown size={16} className="text-rose-400" />}
                            <span className={`font-semibold text-sm ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {isProfit ? '+' : ''}{Math.abs(groupProfitPercent).toFixed(1)}%
                            </span>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        {/* Cost Basis / Earliest Comp */}
                        <td className="px-4 py-4">
                          <div className="text-right">
                            <div className="font-mono text-sm text-slate-400">
                              {symbol}{groupBasis.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                          </div>
                        </td>

                        {/* Current Value */}
                        <td className="px-4 py-4">
                          <div className="text-right">
                            <div className={`font-mono text-sm font-semibold ${card.sold ? 'text-slate-400' : 'text-white'}`}>
                              {symbol}{groupCurrentValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                          </div>
                        </td>

                        {/* P/L Amount */}
                        <td className="px-4 py-4">
                          <div className="text-right">
                            <div className={`font-mono text-sm font-semibold ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {isProfit ? '+' : ''}{symbol}{Math.abs(groupProfit).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                          </div>
                        </td>

                        {/* % Change */}
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            {isProfit ? <TrendingUp size={16} className="text-emerald-400" /> : <TrendingDown size={16} className="text-rose-400" />}
                            <span className={`font-semibold text-sm ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {isProfit ? '+' : ''}{Math.abs(groupProfitPercent).toFixed(1)}%
                            </span>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>

                  {/* Expanded group rows */}
                  {group.isBulkGroup && isExpanded && group.cards.map((groupCard) => {
                    const cardIsBreak = groupCard.acquisitionSource === 'Break' || groupCard.acquisitionSource === 'Self Rip (Case/Box)';
                    const cardCurrentValue = convertPrice(groupCard.sold ? (groupCard.soldPrice || 0) : groupCard.currentValue, groupCard.currency, displayCurrency);
                    const cardPurchasePrice = convertPrice(groupCard.purchasePrice, groupCard.currency, displayCurrency);
                    const cardEarliestComp = groupCard.priceHistory && groupCard.priceHistory.length > 0
                      ? convertPrice(groupCard.priceHistory[0].value, groupCard.currency, displayCurrency)
                      : cardPurchasePrice;
                    const cardBasis = cardIsBreak ? cardEarliestComp : cardPurchasePrice;
                    const cardProfit = cardCurrentValue - cardBasis;
                    const cardProfitPercent = cardBasis > 0 ? (cardProfit / cardBasis) * 100 : 0;
                    const cardIsProfit = cardProfit >= 0;

                    return (
                      <tr
                        key={groupCard.id}
                        onClick={() => onSelect(groupCard)}
                        className="hover:bg-slate-800/30 cursor-pointer transition-colors bg-slate-950/50"
                      >
                        <td className="px-6 py-4 pl-20">
                          <div className="flex items-center gap-4">
                            <div className="text-xs text-slate-500">
                              {groupCard.parallel && <span className="text-slate-400">{groupCard.parallel}</span>}
                              {groupCard.serialNumber && <span className="ml-2 text-slate-500">#{groupCard.serialNumber}</span>}
                              {groupCard.graded && <span className="ml-2"><GradeTag card={groupCard} /></span>}
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          <div className="text-xs text-slate-500">—</div>
                        </td>

                        {activeTab === 'sold' ? (
                          <>
                            <td className="px-4 py-4">
                              <div className="text-right font-mono text-sm text-slate-400">
                                {symbol}{cardBasis.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <div className="text-right font-mono text-sm text-white">
                                {symbol}{cardCurrentValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <div className="text-right">
                                <div className={`font-mono text-sm ${cardIsProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                                  {cardIsProfit ? '+' : ''}{symbol}{Math.abs(cardProfit).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center justify-end gap-2">
                                <span className={`text-sm ${cardIsProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                                  {cardIsProfit ? '+' : ''}{Math.abs(cardProfitPercent).toFixed(1)}%
                                </span>
                              </div>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="px-4 py-4">
                              <div className="text-right font-mono text-sm text-slate-400">
                                {symbol}{cardBasis.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <div className="text-right font-mono text-sm text-white">
                                {symbol}{cardCurrentValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <div className="text-right">
                                <div className={`font-mono text-sm ${cardIsProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                                  {cardIsProfit ? '+' : ''}{symbol}{Math.abs(cardProfit).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center justify-end gap-2">
                                <span className={`text-sm ${cardIsProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                                  {cardIsProfit ? '+' : ''}{Math.abs(cardProfitPercent).toFixed(1)}%
                                </span>
                              </div>
                            </td>
                          </>
                        )}
                      </tr>
                    );
                  })}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      )}
      </div>
    </div>
  );
};