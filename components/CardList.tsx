import React, { useState, useMemo } from 'react';
import { Card, Sport, Currency } from '../types';
import { TrendingUp, TrendingDown, Image as ImageIcon, ChevronRight, CheckCircle2, Sparkles, Filter, ArrowUpDown, ChevronDown, ChevronUp, LayoutGrid, List } from 'lucide-react';
import { PillTabs } from './PillTabs';
import { FocusCards } from './FocusCards';
import { GradeTag } from './GradeTag';
import { useLanguage } from '../contexts/LanguageContext';

interface CardListProps {
  cards: Card[];
  onSelect: (card: Card) => void;
  displayCurrency: Currency;
  convertPrice: (price: number, from: Currency, to: Currency) => number;
  onTabChange?: (tab: 'holdings' | 'sold') => void;
}

type SortOption =
  | 'date-newest' | 'date-oldest'
  | 'price-high' | 'price-low'
  | 'trend-up' | 'trend-down'
  | 'basis-high' | 'basis-low'
  | 'player-az' | 'player-za'
  | 'year-newest' | 'year-oldest'
  | 'count-high' | 'count-low';

interface FilterState {
  players: string[];
  yearMin: number | null;
  yearMax: number | null;
  sets: string[];
  parallels: string[];
  grades: string[];
  valueMin: number | null;
  valueMax: number | null;
  profitStatus: 'all' | 'positive' | 'negative' | 'breakeven';
  tradeStatus: 'all' | 'available' | 'never-trade';
  hasImage: 'all' | 'yes' | 'no';
}

interface CardGroup {
  id: string; // bulkGroupId or individual card id
  cards: Card[];
  isBulkGroup: boolean;
}

export const CardList: React.FC<CardListProps> = ({ cards, onSelect, displayCurrency, convertPrice, onTabChange }) => {
  const { t } = useLanguage();
  const [sortBy, setSortBy] = useState<SortOption>('price-high');
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState<'holdings' | 'sold'>('holdings');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'list' | 'gallery'>('list');

  const [filters, setFilters] = useState<FilterState>({
    players: [],
    yearMin: null,
    yearMax: null,
    sets: [],
    parallels: [],
    grades: [],
    valueMin: null,
    valueMax: null,
    profitStatus: 'all',
    tradeStatus: 'all',
    hasImage: 'all',
  });

  const [expandedFilters, setExpandedFilters] = useState<{[key: string]: boolean}>({
    players: false,
    sets: false,
    parallels: false,
    grades: false,
  });

  const [playerSearch, setPlayerSearch] = useState('');

  // Notify parent when tab changes
  const handleTabChange = (tab: 'holdings' | 'sold') => {
    setActiveTab(tab);
    onTabChange?.(tab);
  };

  // Get unique values for filter dropdowns
  const uniqueValues = useMemo(() => {
    const players = [...new Set(cards.map(c => c.player))].sort();
    const sets = [...new Set(cards.map(c => `${c.brand} ${c.series}`))].sort();
    const parallels = [...new Set(cards.map(c => c.parallel).filter(Boolean))].sort() as string[];
    const gradeSet = new Set(cards.map(c => c.graded ? `${c.gradeCompany} ${c.gradeValue}` : 'Raw'));
    const grades = [...gradeSet].sort();
    const years = [...new Set(cards.map(c => c.year))].sort((a: number, b: number) => b - a);

    return { players, sets, parallels, grades, years };
  }, [cards]);

  // Filter and sort cards
  const filteredAndSortedCards = useMemo(() => {
    let filtered = [...cards];

    // Exclude watchlist items from both tabs
    filtered = filtered.filter(c => !c.watchlist);

    // Filter by tab (holdings or sold)
    filtered = filtered.filter(c => activeTab === 'holdings' ? !c.sold : c.sold);

    // Apply player filter
    if (filters.players.length > 0) {
      filtered = filtered.filter(c => filters.players.includes(c.player));
    }

    // Apply year range filter
    if (filters.yearMin !== null) {
      filtered = filtered.filter(c => c.year >= filters.yearMin!);
    }
    if (filters.yearMax !== null) {
      filtered = filtered.filter(c => c.year <= filters.yearMax!);
    }

    // Apply set filter
    if (filters.sets.length > 0) {
      filtered = filtered.filter(c => filters.sets.includes(`${c.brand} ${c.series}`));
    }

    // Apply parallel filter
    if (filters.parallels.length > 0) {
      filtered = filtered.filter(c => c.parallel && filters.parallels.includes(c.parallel));
    }

    // Apply grade filter
    if (filters.grades.length > 0) {
      filtered = filtered.filter(c => {
        const cardGrade = c.graded ? `${c.gradeCompany} ${c.gradeValue}` : 'Raw';
        return filters.grades.includes(cardGrade);
      });
    }

    // Apply value range filter
    if (filters.valueMin !== null || filters.valueMax !== null) {
      filtered = filtered.filter(c => {
        const value = convertPrice(c.sold ? (c.soldPrice || 0) : c.currentValue, c.currency, displayCurrency);
        if (filters.valueMin !== null && value < filters.valueMin) return false;
        if (filters.valueMax !== null && value > filters.valueMax) return false;
        return true;
      });
    }

    // Apply P/L filter
    if (filters.profitStatus !== 'all') {
      filtered = filtered.filter(c => {
        const value = convertPrice(c.sold ? (c.soldPrice || 0) : c.currentValue, c.currency, displayCurrency);
        const isBreakOrSelfRip = c.acquisitionSource === 'Break' || c.acquisitionSource === 'Self Rip (Case/Box)';
        const purchasePrice = convertPrice(c.purchasePrice, c.currency, displayCurrency);
        const earliestComp = c.priceHistory && c.priceHistory.length > 0
          ? convertPrice(c.priceHistory[0].value, c.currency, displayCurrency)
          : purchasePrice;
        const basis = isBreakOrSelfRip ? earliestComp : purchasePrice;
        const profit = value - basis;

        if (filters.profitStatus === 'positive') return profit > 0;
        if (filters.profitStatus === 'negative') return profit < 0;
        if (filters.profitStatus === 'breakeven') return Math.abs(profit) < 0.01;
        return true;
      });
    }

    // Apply trade status filter
    if (filters.tradeStatus === 'available') {
      filtered = filtered.filter(c => !c.neverTrade);
    } else if (filters.tradeStatus === 'never-trade') {
      filtered = filtered.filter(c => c.neverTrade === true);
    }

    // Apply image filter
    if (filters.hasImage === 'yes') {
      filtered = filtered.filter(c => c.imageUrl);
    } else if (filters.hasImage === 'no') {
      filtered = filtered.filter(c => !c.imageUrl);
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

      // Get purchase dates for sorting
      const aDate = a.purchaseDate ? new Date(a.purchaseDate).getTime() : 0;
      const bDate = b.purchaseDate ? new Date(b.purchaseDate).getTime() : 0;

      switch (sortBy) {
        case 'date-newest':
          return bDate - aDate; // Newest first
        case 'date-oldest':
          return aDate - bDate; // Oldest first
        case 'price-high':
          return bValue - aValue; // High to low
        case 'price-low':
          return aValue - bValue; // Low to high
        case 'trend-up':
          return bProfitPercent - aProfitPercent; // Best trending first
        case 'trend-down':
          return aProfitPercent - bProfitPercent; // Worst trending first
        case 'basis-high':
          return bBasis - aBasis; // High to low
        case 'basis-low':
          return aBasis - bBasis; // Low to high
        case 'player-az':
          return a.player.localeCompare(b.player); // A-Z
        case 'player-za':
          return b.player.localeCompare(a.player); // Z-A
        case 'year-newest':
          return b.year - a.year; // Newest year first
        case 'year-oldest':
          return a.year - b.year; // Oldest year first
        default:
          return 0;
      }
    });

    return filtered;
  }, [cards, activeTab, filters, sortBy, displayCurrency, convertPrice]);

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
        <h3 className="text-white font-bold text-xl">{t('portfolio.noCards')}</h3>
        <p className="text-slate-400 mt-2 max-w-xs">{t('portfolio.getStarted')}</p>
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
            {activeTab === 'holdings' ? t('portfolio.holdings') : t('portfolio.sold')}
          </h3>
          <div className="flex items-center gap-3">
            <span className="text-slate-400 text-sm font-medium">{filteredAndSortedCards.length} {t('portfolio.cards')} {cardGroups.filter(g => g.isBulkGroup).length > 0 && `(${cardGroups.length} entries)`}</span>

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

        {/* Slide-in Filter Panel */}
        {showFilters && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity"
              onClick={() => setShowFilters(false)}
            />

            {/* Filter Panel */}
            <div className="fixed inset-y-0 right-0 w-full sm:w-96 bg-slate-900/95 backdrop-blur-xl border-l border-white/10 z-50 overflow-y-auto shadow-2xl animate-slideInRight">
              <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b border-white/10">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Filter size={20} className="text-crypto-lime" />
                    {t('filter.title')}
                  </h2>
                  <button
                    onClick={() => setShowFilters(false)}
                    className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Sort Options */}
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3 flex items-center gap-1.5 block">
                    <ArrowUpDown size={12} /> {t('filter.sortBy')}
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:ring-2 focus:ring-crypto-lime/50 focus:border-crypto-lime outline-none transition-all"
                  >
                    <optgroup label={t('sort.groupDate')}>
                      <option value="date-newest">{t('sort.dateNewest')}</option>
                      <option value="date-oldest">{t('sort.dateOldest')}</option>
                    </optgroup>
                    <optgroup label={t('sort.groupValue')}>
                      <option value="price-high">{t('sort.priceHigh')}</option>
                      <option value="price-low">{t('sort.priceLow')}</option>
                    </optgroup>
                    <optgroup label={t('sort.groupPerformance')}>
                      <option value="trend-up">{t('sort.profitHigh')}</option>
                      <option value="trend-down">{t('sort.profitLow')}</option>
                    </optgroup>
                    <optgroup label={t('sort.groupCost')}>
                      <option value="basis-high">{t('sort.costHigh')}</option>
                      <option value="basis-low">{t('sort.costLow')}</option>
                    </optgroup>
                    <optgroup label={t('sort.groupPlayer')}>
                      <option value="player-az">{t('sort.playerAZ')}</option>
                      <option value="player-za">{t('sort.playerZA')}</option>
                    </optgroup>
                    <optgroup label={t('sort.groupYear')}>
                      <option value="year-newest">{t('sort.yearNewest')}</option>
                      <option value="year-oldest">{t('sort.yearOldest')}</option>
                    </optgroup>
                  </select>
                </div>

                <div className="border-t border-white/10 pt-6 space-y-3">
                  {/* Player Multi-select Dropdown */}
                  <div className="space-y-2">
                    <button
                      onClick={() => setExpandedFilters({ ...expandedFilters, players: !expandedFilters.players })}
                      className="w-full flex items-center justify-between p-3 bg-slate-950 hover:bg-slate-900 border border-slate-700 rounded-lg transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white">{t('filter.player')}</span>
                        {filters.players.length > 0 && (
                          <span className="text-xs px-2 py-0.5 bg-crypto-lime/20 text-crypto-lime rounded-full font-semibold">
                            {filters.players.length}
                          </span>
                        )}
                      </div>
                      <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${expandedFilters.players ? 'rotate-180' : ''}`} />
                    </button>
                    {expandedFilters.players && (
                      <div className="bg-slate-950 border border-slate-700 rounded-lg overflow-hidden">
                        {/* Search Input */}
                        <div className="p-2 border-b border-slate-700">
                          <input
                            type="text"
                            value={playerSearch}
                            onChange={(e) => setPlayerSearch(e.target.value)}
                            placeholder={t('filter.searchPlayers')}
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-crypto-lime/50 focus:border-crypto-lime outline-none"
                          />
                        </div>
                        {/* Player List */}
                        <div className="max-h-48 overflow-y-auto p-2 space-y-1">
                          {uniqueValues.players
                            .filter(player => player.toLowerCase().includes(playerSearch.toLowerCase()))
                            .map(player => (
                              <label key={player} className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-800 rounded cursor-pointer transition-colors">
                                <input
                                  type="checkbox"
                                  checked={filters.players.includes(player)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setFilters({ ...filters, players: [...filters.players, player] });
                                    } else {
                                      setFilters({ ...filters, players: filters.players.filter(p => p !== player) });
                                    }
                                  }}
                                  className="w-4 h-4 rounded border-slate-600 text-crypto-lime focus:ring-crypto-lime/50"
                                />
                                <span className="text-sm text-slate-300">{player}</span>
                              </label>
                            ))}
                          {uniqueValues.players.filter(player => player.toLowerCase().includes(playerSearch.toLowerCase())).length === 0 && (
                            <p className="text-sm text-slate-500 text-center py-4">{t('filter.noPlayers')}</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Set/Product Line Multi-select Dropdown */}
                  <div className="space-y-2">
                    <button
                      onClick={() => setExpandedFilters({ ...expandedFilters, sets: !expandedFilters.sets })}
                      className="w-full flex items-center justify-between p-3 bg-slate-950 hover:bg-slate-900 border border-slate-700 rounded-lg transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white">{t('filter.set')}</span>
                        {filters.sets.length > 0 && (
                          <span className="text-xs px-2 py-0.5 bg-crypto-lime/20 text-crypto-lime rounded-full font-semibold">
                            {filters.sets.length}
                          </span>
                        )}
                      </div>
                      <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${expandedFilters.sets ? 'rotate-180' : ''}`} />
                    </button>
                    {expandedFilters.sets && (
                      <div className="max-h-48 overflow-y-auto bg-slate-950 border border-slate-700 rounded-lg p-2 space-y-1">
                        {uniqueValues.sets.map(set => (
                          <label key={set} className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-800 rounded cursor-pointer transition-colors">
                            <input
                              type="checkbox"
                              checked={filters.sets.includes(set)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setFilters({ ...filters, sets: [...filters.sets, set] });
                                } else {
                                  setFilters({ ...filters, sets: filters.sets.filter(s => s !== set) });
                                }
                              }}
                              className="w-4 h-4 rounded border-slate-600 text-crypto-lime focus:ring-crypto-lime/50"
                            />
                            <span className="text-sm text-slate-300">{set}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Parallel Multi-select Dropdown */}
                  <div className="space-y-2">
                    <button
                      onClick={() => setExpandedFilters({ ...expandedFilters, parallels: !expandedFilters.parallels })}
                      className="w-full flex items-center justify-between p-3 bg-slate-950 hover:bg-slate-900 border border-slate-700 rounded-lg transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white">{t('filter.parallel')}</span>
                        {filters.parallels.length > 0 && (
                          <span className="text-xs px-2 py-0.5 bg-crypto-lime/20 text-crypto-lime rounded-full font-semibold">
                            {filters.parallels.length}
                          </span>
                        )}
                      </div>
                      <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${expandedFilters.parallels ? 'rotate-180' : ''}`} />
                    </button>
                    {expandedFilters.parallels && (
                      <div className="max-h-48 overflow-y-auto bg-slate-950 border border-slate-700 rounded-lg p-2 space-y-1">
                        {uniqueValues.parallels.map(parallel => (
                          <label key={parallel} className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-800 rounded cursor-pointer transition-colors">
                            <input
                              type="checkbox"
                              checked={filters.parallels.includes(parallel)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setFilters({ ...filters, parallels: [...filters.parallels, parallel] });
                                } else {
                                  setFilters({ ...filters, parallels: filters.parallels.filter(p => p !== parallel) });
                                }
                              }}
                              className="w-4 h-4 rounded border-slate-600 text-crypto-lime focus:ring-crypto-lime/50"
                            />
                            <span className="text-sm text-slate-300">{parallel}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Grade Multi-select Dropdown */}
                  <div className="space-y-2">
                    <button
                      onClick={() => setExpandedFilters({ ...expandedFilters, grades: !expandedFilters.grades })}
                      className="w-full flex items-center justify-between p-3 bg-slate-950 hover:bg-slate-900 border border-slate-700 rounded-lg transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white">{t('filter.grade')}</span>
                        {filters.grades.length > 0 && (
                          <span className="text-xs px-2 py-0.5 bg-crypto-lime/20 text-crypto-lime rounded-full font-semibold">
                            {filters.grades.length}
                          </span>
                        )}
                      </div>
                      <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${expandedFilters.grades ? 'rotate-180' : ''}`} />
                    </button>
                    {expandedFilters.grades && (
                      <div className="max-h-48 overflow-y-auto bg-slate-950 border border-slate-700 rounded-lg p-2 space-y-1">
                        {uniqueValues.grades.map(grade => (
                          <label key={grade} className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-800 rounded cursor-pointer transition-colors">
                            <input
                              type="checkbox"
                              checked={filters.grades.includes(grade)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setFilters({ ...filters, grades: [...filters.grades, grade] });
                                } else {
                                  setFilters({ ...filters, grades: filters.grades.filter(g => g !== grade) });
                                }
                              }}
                              className="w-4 h-4 rounded border-slate-600 text-crypto-lime focus:ring-crypto-lime/50"
                            />
                            <span className="text-sm text-slate-300">{grade}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Year Range */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white">{t('filter.yearRange')}</label>
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="number"
                        value={filters.yearMin ?? ''}
                        onChange={(e) => setFilters({ ...filters, yearMin: e.target.value ? parseInt(e.target.value) : null })}
                        placeholder={t('filter.from')}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-crypto-lime/50 focus:border-crypto-lime outline-none"
                      />
                      <input
                        type="number"
                        value={filters.yearMax ?? ''}
                        onChange={(e) => setFilters({ ...filters, yearMax: e.target.value ? parseInt(e.target.value) : null })}
                        placeholder={t('filter.to')}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-crypto-lime/50 focus:border-crypto-lime outline-none"
                      />
                    </div>
                  </div>

                  {/* Value Range */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white">{t('filter.valueRange')} ({displayCurrency})</label>
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="number"
                        value={filters.valueMin ?? ''}
                        onChange={(e) => setFilters({ ...filters, valueMin: e.target.value ? parseFloat(e.target.value) : null })}
                        placeholder={t('filter.min')}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-crypto-lime/50 focus:border-crypto-lime outline-none"
                      />
                      <input
                        type="number"
                        value={filters.valueMax ?? ''}
                        onChange={(e) => setFilters({ ...filters, valueMax: e.target.value ? parseFloat(e.target.value) : null })}
                        placeholder={t('filter.max')}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-crypto-lime/50 focus:border-crypto-lime outline-none"
                      />
                    </div>
                  </div>

                  {/* P/L Status */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white">{t('cardList.unrealizedPL')}</label>
                    <select
                      value={filters.profitStatus}
                      onChange={(e) => setFilters({ ...filters, profitStatus: e.target.value as FilterState['profitStatus'] })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-crypto-lime/50 focus:border-crypto-lime outline-none"
                    >
                      <option value="all">{t('cardList.allCards')}</option>
                      <option value="positive">{t('cardList.winnersOnly')}</option>
                      <option value="negative">{t('cardList.losersOnly')}</option>
                      <option value="breakeven">{t('cardList.breakeven')}</option>
                    </select>
                  </div>

                  {/* Trade Status */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white">{t('cardList.tradeStatus')}</label>
                    <select
                      value={filters.tradeStatus}
                      onChange={(e) => setFilters({ ...filters, tradeStatus: e.target.value as FilterState['tradeStatus'] })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-crypto-lime/50 focus:border-crypto-lime outline-none"
                    >
                      <option value="all">{t('cardList.allCards')}</option>
                      <option value="available">{t('cardList.availableForTrade')}</option>
                      <option value="never-trade">{t('cardList.neverTrade')}</option>
                    </select>
                  </div>

                  {/* Has Image */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white">{t('cardList.hasImage')}</label>
                    <select
                      value={filters.hasImage}
                      onChange={(e) => setFilters({ ...filters, hasImage: e.target.value as FilterState['hasImage'] })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-crypto-lime/50 focus:border-crypto-lime outline-none"
                    >
                      <option value="all">{t('cardList.allCards')}</option>
                      <option value="yes">{t('cardList.withImage')}</option>
                      <option value="no">{t('cardList.withoutImage')}</option>
                    </select>
                  </div>

                  {/* Clear Filters Button */}
                  <button
                    onClick={() => setFilters({
                      players: [],
                      yearMin: null,
                      yearMax: null,
                      sets: [],
                      parallels: [],
                      grades: [],
                      valueMin: null,
                      valueMax: null,
                      profitStatus: 'all',
                      tradeStatus: 'all',
                      hasImage: 'all',
                    })}
                    className="w-full px-4 py-3 bg-crypto-lime/10 hover:bg-crypto-lime/20 text-crypto-lime font-medium rounded-lg text-sm transition-colors border border-crypto-lime/30"
                  >
                    {t('filter.clearAll')}
                  </button>
                </div>
              </div>
            </div>
          </>
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
        <div className="lg:hidden flex flex-col gap-3">
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
                        <GradeTag card={card} />
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
                      <span className="font-mono font-bold text-lg text-amber-400">{t('cardList.unknown')}</span>
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
                <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide px-6 py-4">{t('cardList.card')}</th>
                <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide px-4 py-4">{t('cardList.details')}</th>
                {activeTab === 'sold' ? (
                  <>
                    <th className="text-right text-xs font-semibold text-slate-400 uppercase tracking-wide px-4 py-4">{t('cardList.purchase')}</th>
                    <th className="text-right text-xs font-semibold text-slate-400 uppercase tracking-wide px-4 py-4">{t('cardList.sold')}</th>
                    <th className="text-right text-xs font-semibold text-slate-400 uppercase tracking-wide px-4 py-4">{t('cardList.pl')}</th>
                    <th className="text-right text-xs font-semibold text-slate-400 uppercase tracking-wide px-6 py-4">{t('cardList.return')}</th>
                  </>
                ) : (
                  <>
                    <th className="text-right text-xs font-semibold text-slate-400 uppercase tracking-wide px-4 py-4">{t('cardList.costBasis')}</th>
                    <th className="text-right text-xs font-semibold text-slate-400 uppercase tracking-wide px-4 py-4">{t('cardList.currentValue')}</th>
                    <th className="text-right text-xs font-semibold text-slate-400 uppercase tracking-wide px-4 py-4">{t('cardList.pl')}</th>
                    <th className="text-right text-xs font-semibold text-slate-400 uppercase tracking-wide px-6 py-4">{t('cardList.change')}</th>
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
                                {card.soldVia === 'trade' ? t('cardList.traded') : t('cardList.soldLabel')}
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