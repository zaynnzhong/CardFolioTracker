
import React, { useState, useEffect, useMemo } from 'react';
import { Card, Stats, Currency, TradePlan, ReceivedCardInput, AcquisitionSource, Sport } from './types';
import { dataService } from './services/dataService';
import { DashboardStats } from './components/DashboardStats';
import { CardList } from './components/CardList';
import { WatchList } from './components/WatchList';
import { CardForm } from './components/CardForm';
import { PriceUpdateModal } from './components/PriceUpdateModal';
import { InsightModal } from './components/InsightModal';
import { SoldModal } from './components/SoldModal';
import { TradeModal, TradeData } from './components/TradeModal';
import { AnalyticsView } from './components/AnalyticsView';
import { TransactionsView } from './components/TransactionsView';
import { TradePlanner } from './components/TradePlanner';
import { TradePlansList } from './components/TradePlansList';
import { TradePlanDetail } from './components/TradePlanDetail';
import { TradePlanExecutionModal } from './components/TradePlanExecutionModal';
import { NeverTradeList } from './components/NeverTradeList';
import { BottomNav } from './components/BottomNav';
import { LandingPage } from './components/LandingPage';
import { Login } from './components/Login';
import { UpgradePromptModal } from './components/UpgradePromptModal';
import { GradeTag } from './components/GradeTag';
import { PWAUpdateNotification } from './components/PWAUpdateNotification';
import { PWAInstallPrompt } from './components/PWAInstallPrompt';
import { OfflineIndicator } from './components/OfflineIndicator';
import { CardStackLoader } from './components/CardStackLoader';
import { LoaderPreview } from './components/LoaderPreview';
import { ConfirmEmail } from './components/ConfirmEmail';
import { ProfileSettings } from './components/ProfileSettings';
import { CardLimitBanner } from './components/CardLimitBanner';
import { UnlockKeyModal } from './components/UnlockKeyModal';
import { AdminPanel } from './components/AdminPanel';
import { useAuth } from './contexts/AuthContext';
import { useLanguage } from './contexts/LanguageContext';
import { tierService } from './services/tierService';
import { revenueCatService } from './services/revenueCatService';
import { UserProfile } from './types';
import { Loader2, Download, Edit2, TrendingUp, Activity, X, Wallet, Eye, LogOut, User, Home, BarChart3, Plus, Settings, DollarSign, ArrowRightLeft, Receipt, Shield, Package } from 'lucide-react';

export default function App() {
  const { t } = useLanguage();
  // Check URL routing
  const urlParams = new URLSearchParams(window.location.search);
  const pathname = window.location.pathname;
  const isPreview = urlParams.get('preview') === 'loader';
  const isConfirmEmail = pathname === '/confirm-email';
  const isProfileSettings = pathname === '/profile' || pathname === '/settings';

  if (isPreview) {
    return <LoaderPreview />;
  }

  if (isConfirmEmail) {
    return <ConfirmEmail />;
  }

  const { user, loading: authLoading, signOut, getIdToken } = useAuth();

  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'portfolio' | 'analytics' | 'transactions' | 'trade-plans'>('portfolio');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [displayCurrency, setDisplayCurrency] = useState<Currency>(() => {
    // Load from localStorage, default to USD
    const saved = localStorage.getItem('displayCurrency') as Currency;
    return (saved === 'USD' || saved === 'CNY') ? saved : 'USD';
  });
  const [sidebarHovered, setSidebarHovered] = useState(false);
  const [isNarrowScreen, setIsNarrowScreen] = useState(false);

  // Listen for currency changes from ProfileSettings and sync with localStorage
  useEffect(() => {
    // Check localStorage on mount and when returning from settings
    const checkCurrency = () => {
      const saved = localStorage.getItem('displayCurrency') as Currency;
      if (saved && (saved === 'USD' || saved === 'CNY') && saved !== displayCurrency) {
        setDisplayCurrency(saved);
      }
    };

    // Check immediately
    checkCurrency();

    // Listen for custom currency change event
    const handleCurrencyChange = (event: CustomEvent<Currency>) => {
      setDisplayCurrency(event.detail);
    };
    window.addEventListener('currencyChange', handleCurrencyChange as EventListener);

    // Also check when window regains focus (user comes back from settings)
    window.addEventListener('focus', checkCurrency);

    return () => {
      window.removeEventListener('currencyChange', handleCurrencyChange as EventListener);
      window.removeEventListener('focus', checkCurrency);
    };
  }, [displayCurrency]);

  // Check screen width
  useEffect(() => {
    const checkScreenWidth = () => {
      setIsNarrowScreen(window.innerWidth < 1180);
    };

    checkScreenWidth();
    window.addEventListener('resize', checkScreenWidth);
    return () => window.removeEventListener('resize', checkScreenWidth);
  }, []);

  // Modal States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [editingCard, setEditingCard] = useState<Card | null>(null);
  const [updatingPriceCard, setUpdatingPriceCard] = useState<Card | null>(null);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [analyzingCard, setAnalyzingCard] = useState<Card | null>(null);
  const [soldModalCard, setSoldModalCard] = useState<Card | null>(null);
  const [tradeModalCard, setTradeModalCard] = useState<Card | null>(null);
  const [portfolioTab, setPortfolioTab] = useState<'holdings' | 'sold'>('holdings');

  // Tier & Limit States
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // Trade Plans States
  const [tradePlansView, setTradePlansView] = useState<'list' | 'detail' | null>(null);
  const [tradePlansTab, setTradePlansTab] = useState<'plans' | 'never-trade'>('plans');
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [showTradePlanner, setShowTradePlanner] = useState(false);
  const [showExecutionModal, setShowExecutionModal] = useState(false);
  const [executingPlan, setExecutingPlan] = useState<TradePlan | null>(null);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (showUserMenu) {
        setShowUserMenu(false);
      }
    };
    if (showUserMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showUserMenu]);

  // Load Data when user is authenticated
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const loadData = async () => {
      setLoading(true);
      const data = await dataService.getCards(getIdToken);
      setCards(data);
      setLoading(false);
    };
    loadData();
  }, [user, getIdToken]);

  // Load user profile, initialize RevenueCat, and check admin status
  useEffect(() => {
    if (!user) return;

    const loadProfile = async () => {
      try {
        // Initialize RevenueCat for native platforms
        try {
          await revenueCatService.initialize(user.uid);
          await revenueCatService.setUserAttributes({
            email: user.email || undefined,
            displayName: user.displayName || undefined
          });

          // Check if user has pro access via RevenueCat
          const hasProAccess = await revenueCatService.hasProAccess();
          if (hasProAccess) {
            console.log('[App] User has Pro access via RevenueCat');
            // User tier will be synced via webhook, but we can update immediately
          }
        } catch (error) {
          // RevenueCat initialization failed (likely web platform or no SDK)
          console.log('[App] RevenueCat not available or initialization failed');
        }

        const profile = await tierService.getUserProfile();
        setUserProfile(profile);

        // Check if user is admin
        const config = await tierService.getAdminConfig();
        setIsAdmin(config.adminEmails.includes(user.email || ''));
      } catch (error) {
        // If getAdminConfig fails, user is not admin (403 error expected)
        console.log('User is not admin');
      }
    };
    loadProfile();
  }, [user]);

  const portfolioCards = cards.filter(c => !c.watchlist);
  const watchlistCards = cards.filter(c => c.watchlist && !c.sold);

  // Currency conversion utility (1 USD = 7 CNY)
  const convertPrice = (price: number, fromCurrency: Currency, toCurrency: Currency): number => {
    if (fromCurrency === toCurrency) return price;
    if (fromCurrency === 'USD' && toCurrency === 'CNY') return price * 7;
    if (fromCurrency === 'CNY' && toCurrency === 'USD') return price / 7;
    return price;
  };

  const stats: Stats = useMemo(() => {
    const initial = { USD: 0, CNY: 0 };
    const totalInvested = { ...initial };
    const currentPortfolioValue = { ...initial };
    const unrealizedProfit = { ...initial };
    const realizedProfit = { ...initial };
    const soldTotal = { ...initial };
    const cash = { ...initial };
    const totalCostBasisOwned = { ...initial };
    const tradeCashBoots = { ...initial };
    let cardCount = 0;

    portfolioCards.forEach(card => {
      const cur = card.currency;
      const isBreakOrSelfRip = card.acquisitionSource === 'Break' || card.acquisitionSource === 'Self Rip (Case/Box)';

      // For Break/Self Rip cards, use earliest comp as basis if available
      const earliestComp = card.priceHistory && card.priceHistory.length > 0
        ? card.priceHistory[0].value
        : card.purchasePrice;
      const basis = isBreakOrSelfRip ? earliestComp : card.purchasePrice;

      if (card.sold) {
        const soldPrice = card.soldPrice || 0;
        soldTotal[cur] += soldPrice;

        // Track cash boots from trades
        if (card.tradeCashBoot) {
          tradeCashBoots[cur] += card.tradeCashBoot;
        }

        // Calculate realized P/L using appropriate basis
        const profit = soldPrice - basis;
        realizedProfit[cur] += profit;
      } else {
        cardCount++;

        // Count cost basis of all owned cards
        totalCostBasisOwned[cur] += basis;

        // Only count investment for non-break/self-rip cards
        if (!isBreakOrSelfRip) {
          totalInvested[cur] += card.purchasePrice;
        }

        // Only add to portfolio value if not unknown (-1)
        if (card.currentValue !== -1) {
          currentPortfolioValue[cur] += card.currentValue;

          // Calculate unrealized P/L using appropriate basis
          const profit = card.currentValue - basis;
          // Only count unrealized P/L for cards with known value
          unrealizedProfit[cur] += profit;
        }
      }
    });

    // Cash in the Game = (Total received from sales + cash boots from trades) - (Total cost basis of owned cards)
    cash.USD = soldTotal.USD + tradeCashBoots.USD - totalCostBasisOwned.USD;
    cash.CNY = soldTotal.CNY + tradeCashBoots.CNY - totalCostBasisOwned.CNY;

    return { totalInvested, currentPortfolioValue, unrealizedProfit, realizedProfit, soldTotal, cash, cardCount };
  }, [portfolioCards]);

  const handleSaveCard = async (card: Card) => {
    // Check if this is a new card (not editing)
    const isNewCard = !cards.find(c => c.id === card.id);

    // Check guest limit: only for new cards and anonymous users
    if (isNewCard && user?.isAnonymous) {
      const currentCardCount = cards.length;
      if (currentCardCount >= 8) {
        setShowUpgradePrompt(true);
        return; // Don't save the card
      }
    }

    const saved = await dataService.saveCard(card, getIdToken);
    setCards(prev => {
      const index = prev.findIndex(c => c.id === saved.id);
      if (index >= 0) return prev.map(c => c.id === saved.id ? saved : c);
      return [...prev, saved];
    });
    setIsFormOpen(false);
    setEditingCard(null);
    if (selectedCard?.id === card.id) setSelectedCard(saved);
  };

  const handleDeleteCard = async (id: string) => {
    if (window.confirm('Delete this item? This action cannot be undone.')) {
      await dataService.deleteCard(id, getIdToken);
      setCards(prev => prev.filter(c => c.id !== id));
      setSelectedCard(null);
    }
  };

  const handleUpdatePrice = async (cardId: string, newPrice: number, dateStr: string, platform?: string, parallel?: string, grade?: string, serialNumber?: string) => {
    console.log('[App] handleUpdatePrice called with:', { cardId, newPrice, dateStr, platform, parallel, grade, serialNumber });
    const updated = await dataService.updatePrice(cardId, newPrice, getIdToken, dateStr, platform, parallel, grade, serialNumber);
    if (updated) {
      setCards(prev => prev.map(c => c.id === cardId ? updated : c));
      setUpdatingPriceCard(null);
      if (selectedCard?.id === cardId) setSelectedCard(updated);
    }
  };

  const handleDeletePriceEntry = async (cardId: string, priceDate: string) => {
    console.log('[App] handleDeletePriceEntry called with:', { cardId, priceDate });
    const updated = await dataService.deletePriceEntry(cardId, priceDate, getIdToken);
    if (updated) {
      setCards(prev => prev.map(c => c.id === cardId ? updated : c));
      if (analyzingCard?.id === cardId) setAnalyzingCard(updated);
      if (selectedCard?.id === cardId) setSelectedCard(updated);
    }
  };

  const handleEditPriceEntry = async (cardId: string, oldDate: string, newPrice: number, newDate?: string, platform?: string, parallel?: string, grade?: string, serialNumber?: string) => {
    console.log('[App] handleEditPriceEntry called with:', { cardId, oldDate, newPrice, newDate, platform, parallel, grade, serialNumber });
    const updated = await dataService.editPriceEntry(cardId, oldDate, newPrice, getIdToken, newDate, platform, parallel, grade, serialNumber);
    if (updated) {
      setCards(prev => prev.map(c => c.id === cardId ? updated : c));
      if (analyzingCard?.id === cardId) setAnalyzingCard(updated);
      if (selectedCard?.id === cardId) setSelectedCard(updated);
    }
  };

  const handleConvertToAsset = (card: Card) => {
    setEditingCard({
      ...card,
      watchlist: false,
      purchaseDate: new Date().toISOString().split('T')[0],
      purchasePrice: card.currentValue
    });
    setIsFormOpen(true);
  };

  const handleMarkAsSold = async (cardId: string, soldPrice: number, soldDate: string, platform: string) => {
    const card = cards.find(c => c.id === cardId);
    if (!card) return;

    // Update the card with sold information
    const updatedCard: Card = {
      ...card,
      sold: true,
      soldPrice,
      soldDate,
      soldVia: 'sale'
    };

    await handleSaveCard(updatedCard);
    setSoldModalCard(null);
  };

  const handleTrade = async (tradeData: TradeData) => {
    // Mark the given card as sold with FMV as sold price
    const givenCard = cards.find(c => c.id === tradeData.cardGivenId);
    if (!givenCard) return;

    const soldCard: Card = {
      ...givenCard,
      sold: true,
      soldPrice: tradeData.cardGivenFMV,
      soldDate: tradeData.tradeDate,
      soldVia: 'trade'
    };

    console.log('[TRADE DEBUG] Saving card with soldVia:', soldCard.soldVia);
    console.log('[TRADE DEBUG] Full card object:', soldCard);
    await handleSaveCard(soldCard);

    // Create new cards for received cards using full ReceivedCardData
    for (const receivedCard of tradeData.cardsReceived) {
      const newCard: Card = {
        id: `${Date.now()}_${Math.random()}`,
        player: receivedCard.player,
        year: receivedCard.year,
        sport: receivedCard.sport,
        brand: receivedCard.brand,
        series: receivedCard.series,
        insert: receivedCard.insert,
        parallel: receivedCard.parallel || '',
        serialNumber: receivedCard.serialNumber || '',
        graded: receivedCard.graded,
        gradeCompany: receivedCard.gradeCompany,
        gradeValue: receivedCard.gradeValue,
        currency: displayCurrency,
        purchaseDate: tradeData.tradeDate,
        purchasePrice: receivedCard.fmv, // Cost basis is FMV on trade date
        currentValue: receivedCard.fmv,
        priceHistory: [{
          date: tradeData.tradeDate,
          value: receivedCard.fmv,
          platform: 'Trade'
        }],
        sold: false,
        watchlist: false
      };

      await handleSaveCard(newCard);
    }

    setTradeModalCard(null);
    setSelectedCard(null);
  };

  const exportToCSV = () => {
    const headers = ['ID', 'Type', 'Player', 'Year', 'Brand', 'Series', 'Cost/Target', 'Current Value'];
    const csvContent = [
      headers.join(','),
      ...cards.map(c => [
        c.id,
        c.watchlist ? 'Watchlist' : 'Asset',
        c.player,
        c.year,
        c.brand,
        c.series,
        c.purchasePrice,
        c.currentValue
      ].join(','))
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `prism_portfolio_${new Date().toISOString()}.csv`;
    link.click();
  };

  const handleSignOut = async () => {
    await signOut();
    setCards([]);
    setShowUserMenu(false);
  };

  const handleExecuteTradePlan = async (tradeData: {
    receivedValue: number;
    cashBoot: number;
    tradeDate: string;
    receivedCards: ReceivedCardInput[];
  }) => {
    if (!executingPlan) return;

    // Get the plan's currency (what the plan values are stored in)
    const planCurrency = executingPlan.cashCurrency || displayCurrency;

    try {
      // 1. Mark all bundled cards as sold
      for (const bundledCard of executingPlan.bundleCards) {
        const card = cards.find(c => c.id === bundledCard.cardId);
        if (card) {
          // Convert soldPrice from plan currency to card's original currency
          const soldPriceInCardCurrency = convertPrice(
            bundledCard.currentValueAtPlanTime,
            planCurrency,
            card.currency
          );

          const soldCard: Card = {
            ...card,
            sold: true,
            soldDate: tradeData.tradeDate,
            soldPrice: soldPriceInCardCurrency,
            soldVia: 'trade'
          };
          await handleSaveCard(soldCard);
        }
      }

      // 2. Create new cards for received items
      for (const receivedCard of tradeData.receivedCards) {
        const newCard: Card = {
          id: '', // Will be generated by backend
          player: receivedCard.player,
          year: receivedCard.year,
          sport: Sport.BASKETBALL, // Default sport, user can edit later
          brand: receivedCard.brand || 'Unknown',
          series: receivedCard.series || 'Unknown',
          insert: receivedCard.insert || 'Base',
          parallel: receivedCard.parallel,
          serialNumber: receivedCard.serialNumber,
          graded: receivedCard.graded,
          gradeCompany: receivedCard.gradeCompany,
          gradeValue: receivedCard.gradeValue,
          currency: receivedCard.currency,
          purchaseDate: tradeData.tradeDate,
          purchasePrice: receivedCard.currentValue, // FMV at trade time becomes cost basis
          acquisitionSource: AcquisitionSource.TRADE,
          currentValue: receivedCard.currentValue,
          priceHistory: [{
            date: tradeData.tradeDate,
            value: receivedCard.currentValue,
            platform: 'Trade'
          }],
          sold: false,
          notes: receivedCard.notes ? `Trade received: ${receivedCard.notes}` : `Received in trade from plan: ${executingPlan.planName}`
        };
        await handleSaveCard(newCard);
      }

      // 3. Mark plan as completed
      await dataService.completeTradePlan(executingPlan._id, 'trade-execution', getIdToken);

      // 4. Close modals and refresh
      setShowExecutionModal(false);
      setExecutingPlan(null);
      setTradePlansView(null);

      // Reload cards to reflect changes
      const refreshedCards = await dataService.getCards(getIdToken);
      setCards(refreshedCards);
    } catch (error) {
      console.error('Failed to execute trade plan:', error);
      throw error;
    }
  };

  const handleToggleNeverTrade = async (cardId: string, neverTrade: boolean) => {
    const card = cards.find(c => c.id === cardId);
    if (!card) return;

    const updatedCard: Card = {
      ...card,
      neverTrade
    };

    await handleSaveCard(updatedCard);
  };

  // Show loading screen while checking auth
  if (authLoading) {
    return <CardStackLoader />;
  }

  // Handle unauthenticated users - show landing page on desktop, skip on iOS
  if (!user) {
    // Check if we might be processing a redirect result
    // This prevents showing login screen prematurely while auth state is updating
    const urlParams = new URLSearchParams(window.location.search);
    const hasAuthParams = urlParams.toString().includes('state=') ||
                          urlParams.toString().includes('code=') ||
                          window.location.hash.includes('access_token');

    // If we have OAuth parameters, ALWAYS show loading while processing redirect
    // This is critical - don't check loading state, just show loader if auth params exist
    if (hasAuthParams) {
      console.log('[App] OAuth parameters detected, showing loader while processing redirect');
      return <CardStackLoader />;
    }

    // Detect iOS devices
    const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);

    // On iOS, skip landing page and go directly to login
    if (isIOS) {
      return <Login />;
    }

    // On desktop/web, show landing page or login based on route
    if (pathname === '/login') {
      return <Login onBack={() => window.history.back()} />;
    }

    // Show landing page by default
    return <LandingPage />;
  }

  // If user is authenticated and on /login, redirect to home
  if (pathname === '/login') {
    window.history.replaceState({}, '', '/');
  }

  // Handle profile settings route
  if (isProfileSettings) {
    return (
      <div className="min-h-screen bg-crypto-darker text-slate-100 p-6">
        <ProfileSettings />
      </div>
    );
  }

  // Show app loading
  if (loading) {
    return <CardStackLoader />;
  }

  return (
    <div className="min-h-screen relative bg-crypto-darker text-slate-100 font-sans overflow-hidden flex">

      {/* Sidebar Navigation - Desktop Only */}
      <aside
        className={`hidden lg:flex lg:flex-col bg-black/95 border-r border-white/10 backdrop-blur-xl fixed left-0 top-0 bottom-0 z-40 transition-all duration-300 ${
          (isNarrowScreen && !sidebarHovered) ? 'w-20' : 'w-64'
        }`}
        onMouseEnter={() => setSidebarHovered(true)}
        onMouseLeave={() => setSidebarHovered(false)}
      >
        {/* Logo */}
        <div className={`p-6 border-b border-white/10 transition-all duration-300 ${(isNarrowScreen && !sidebarHovered) ? 'px-4' : ''}`}>
          {(isNarrowScreen && !sidebarHovered) ? (
            <img src="/prism-fav.png" alt="Prism Icon" className="object-contain drop-shadow-2xl" style={{ width: '40px', height: 'auto' }} />
          ) : (
            <img src="/white-type.svg" alt="Prism Logo" className="object-contain drop-shadow-2xl" style={{ width: '140px', height: 'auto' }} />
          )}
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-4 flex flex-col">
          <div className="space-y-2">
            <button
              onClick={() => setActiveTab('portfolio')}
              className={`w-full flex items-center rounded-xl transition-all duration-300 font-semibold ${
                activeTab === 'portfolio'
                  ? 'bg-crypto-lime/20 text-crypto-lime border border-crypto-lime/30 glow-lime'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              } ${(isNarrowScreen && !sidebarHovered) ? 'justify-center p-3' : 'gap-3 px-4 py-3'}`}
            >
              <Home size={24} className="flex-shrink-0" />
              {(!isNarrowScreen || sidebarHovered) && <span className="whitespace-nowrap overflow-hidden">{t('nav.portfolio')}</span>}
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`w-full flex items-center rounded-xl transition-all duration-300 font-semibold ${
                activeTab === 'analytics'
                  ? 'bg-crypto-lime/20 text-crypto-lime border border-crypto-lime/30 glow-lime'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              } ${(isNarrowScreen && !sidebarHovered) ? 'justify-center p-3' : 'gap-3 px-4 py-3'}`}
            >
              <BarChart3 size={24} className="flex-shrink-0" />
              {(!isNarrowScreen || sidebarHovered) && <span className="whitespace-nowrap overflow-hidden">Analytics</span>}
            </button>

            <button
              onClick={() => setActiveTab('transactions')}
              className={`w-full flex items-center rounded-xl transition-all duration-300 font-semibold ${
                activeTab === 'transactions'
                  ? 'bg-crypto-lime/20 text-crypto-lime border border-crypto-lime/30 glow-lime'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              } ${(isNarrowScreen && !sidebarHovered) ? 'justify-center p-3' : 'gap-3 px-4 py-3'}`}
            >
              <Receipt size={24} className="flex-shrink-0" />
              {(!isNarrowScreen || sidebarHovered) && <span className="whitespace-nowrap overflow-hidden">{t('nav.transactions')}</span>}
            </button>

            <button
              onClick={() => setActiveTab('trade-plans')}
              className={`w-full flex items-center rounded-xl transition-all duration-300 font-semibold ${
                activeTab === 'trade-plans'
                  ? 'bg-crypto-lime/20 text-crypto-lime border border-crypto-lime/30 glow-lime'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              } ${(isNarrowScreen && !sidebarHovered) ? 'justify-center p-3' : 'gap-3 px-4 py-3'}`}
            >
              <Package size={24} className="flex-shrink-0" />
              {(!isNarrowScreen || sidebarHovered) && <span className="whitespace-nowrap overflow-hidden">{t('nav.trade')}</span>}
            </button>

            <div className="pt-4 space-y-3">
              <button
                onClick={() => { setEditingCard(null); setIsFormOpen(true); }}
                className={`w-full flex items-center justify-center rounded-xl crypto-gradient text-black font-bold transition-all duration-300 hover:scale-105 glow-lime ${
                  (isNarrowScreen && !sidebarHovered) ? 'p-3' : 'gap-3 px-4 py-3'
                }`}
              >
                <Plus size={24} className="flex-shrink-0" />
                {(!isNarrowScreen || sidebarHovered) && <span className="whitespace-nowrap overflow-hidden">Add Card</span>}
              </button>

            </div>
          </div>

          {/* Bottom Section - Export CSV and User Profile */}
          <div className="mt-auto pt-4 border-t border-white/10">
            {(!isNarrowScreen || sidebarHovered) ? (
              <div className="flex items-center gap-2 px-4 py-3">
                {/* Export CSV Button */}
                <button
                  onClick={exportToCSV}
                  className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg hover:bg-slate-800/50 transition-all text-slate-300"
                >
                  <Download size={20} className="flex-shrink-0" />
                  <span className="text-sm font-medium whitespace-nowrap overflow-hidden">Export CSV</span>
                </button>

                {/* User Profile */}
                <div className="relative flex-shrink-0">
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowUserMenu(!showUserMenu); }}
                    className="flex items-center justify-center rounded-lg hover:bg-white/5 transition-all"
                  >
                    {user.photoURL ? (
                      <img src={user.photoURL} alt={user.displayName || 'User'} className="w-10 h-10 rounded-full border-2 border-crypto-lime/50 object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-crypto-lime/20 flex items-center justify-center border-2 border-crypto-lime/50">
                        <User size={24} className="text-crypto-lime" />
                      </div>
                    )}
                  </button>

                  {/* Desktop Dropdown Menu */}
                  {showUserMenu && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="absolute bottom-full right-0 mb-2 w-48 bg-slate-900 backdrop-blur-xl border border-slate-800/50 rounded-xl shadow-2xl overflow-hidden z-[100]"
                    >
                      <div className="px-4 py-3 border-b border-slate-800/50">
                        <p className="text-white font-semibold text-sm truncate">{user.displayName || (user.isAnonymous ? 'Guest' : 'User')}</p>
                        <p className="text-slate-500 text-xs truncate">{user.email || 'Not signed in'}</p>
                        {user.isAnonymous && (
                          <div className="mt-2 px-2 py-1 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                            <p className="text-amber-400 text-xs font-semibold">Guest Mode</p>
                            <p className="text-amber-400/70 text-[10px]">{cards.length}/8 cards used</p>
                          </div>
                        )}
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); window.location.href = '/profile'; }}
                        className="w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-slate-800/50 transition-colors text-slate-300 font-medium"
                      >
                        <Settings size={20} />
                        <span>Settings</span>
                      </button>
                      {isAdmin && (
                        <button
                          onClick={(e) => { e.stopPropagation(); setShowAdminPanel(true); setShowUserMenu(false); }}
                          className="w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-slate-800/50 transition-colors text-prism font-medium"
                        >
                          <Shield size={20} />
                          <span>Admin Panel</span>
                        </button>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); handleSignOut(); }}
                        className="w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-slate-800/50 transition-colors text-rose-400 font-medium"
                      >
                        <LogOut size={20} />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 px-2 py-3">
                {/* Export CSV Icon */}
                <button
                  onClick={exportToCSV}
                  className="w-full flex items-center justify-center p-3 rounded-lg hover:bg-slate-800/50 transition-all text-slate-300"
                  title="Export CSV"
                >
                  <Download size={24} className="flex-shrink-0" />
                </button>

                {/* User Profile Icon */}
                <button
                  onClick={(e) => { e.stopPropagation(); setShowUserMenu(!showUserMenu); }}
                  className="flex items-center justify-center rounded-lg hover:bg-white/5 transition-all"
                  title={user.displayName || 'User menu'}
                >
                  {user.photoURL ? (
                    <img src={user.photoURL} alt={user.displayName || 'User'} className="w-10 h-10 rounded-full border-2 border-crypto-lime/50 object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-crypto-lime/20 flex items-center justify-center border-2 border-crypto-lime/50">
                      <User size={24} className="text-crypto-lime" />
                    </div>
                  )}
                </button>
              </div>
            )}
          </div>
        </nav>
      </aside>

      {/* Main Content Area - Full Width on Desktop */}
      <div className={`flex-1 transition-all duration-300 ${(isNarrowScreen && !sidebarHovered) ? 'lg:ml-20' : 'lg:ml-64'}`}>
        {/* Top Bar - Mobile Only */}
        <header className="lg:hidden fixed top-0 left-0 right-0 glass-card backdrop-blur-xl z-30 px-4 ios-header-safe flex justify-between items-center border-b border-white/10">
          <img src="/white-type.svg" alt="Prism Logo" className="object-contain" style={{ width: '120px', height: 'auto' }} />
          <div className="flex items-center gap-2">
            <button onClick={exportToCSV} className="p-2 text-slate-400 hover:text-white">
              <Download size={20} />
            </button>
            <div className="relative">
              <button
                onClick={(e) => { e.stopPropagation(); setShowUserMenu(!showUserMenu); }}
                className="p-1"
              >
                {user.photoURL ? (
                  <img src={user.photoURL} alt="User" className="w-8 h-8 rounded-full border-2 border-crypto-lime/50" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-crypto-lime/20 flex items-center justify-center border-2 border-crypto-lime/50">
                    <User size={16} className="text-crypto-lime" />
                  </div>
                )}
              </button>

              {/* Mobile Dropdown Menu */}
              {showUserMenu && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="absolute top-full right-0 mt-2 w-48 bg-slate-900 backdrop-blur-xl border border-slate-800/50 rounded-xl shadow-2xl overflow-hidden z-[100]"
                >
                  <div className="px-4 py-3 border-b border-slate-800/50">
                    <p className="text-white font-semibold text-sm truncate">{user.displayName || (user.isAnonymous ? 'Guest' : 'User')}</p>
                    <p className="text-slate-500 text-xs truncate">{user.email || 'Not signed in'}</p>
                    {user.isAnonymous && (
                      <div className="mt-2 px-2 py-1 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                        <p className="text-amber-400 text-xs font-semibold">Guest Mode</p>
                        <p className="text-amber-400/70 text-[10px]">{cards.length}/8 cards used</p>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); window.location.href = '/profile'; }}
                    className="w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-slate-800/50 transition-colors text-slate-300 font-medium"
                  >
                    <Settings size={18} />
                    <span>Settings</span>
                  </button>
                  {isAdmin && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setShowAdminPanel(true); setShowUserMenu(false); }}
                      className="w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-slate-800/50 transition-colors text-prism font-medium"
                    >
                      <Shield size={18} />
                      <span>Admin Panel</span>
                    </button>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); handleSignOut(); }}
                    className="w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-slate-800/50 transition-colors text-rose-400 font-medium"
                  >
                    <LogOut size={18} />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Scrollable Area - Full Width */}
        <main className="relative lg:pt-0 lg:pb-0 bg-crypto-dark" style={{
          paddingTop: 'calc(3.5rem + env(safe-area-inset-top))',
          paddingBottom: 'calc(5.5rem + env(safe-area-inset-bottom))',
          minHeight: '100vh'
        }}>
          {activeTab === 'portfolio' ? (
            <div className="p-4 lg:p-6 space-y-6">
              <DashboardStats stats={stats} displayCurrency={displayCurrency} convertPrice={convertPrice} />

              {/* Card Limit Banner */}
              <CardLimitBanner
                cardCount={portfolioCards.filter(c => !c.sold).length}
                onProfileUpdate={setUserProfile}
              />

              {/* Transactions Button - Mobile Only */}
              <button
                onClick={() => setActiveTab('transactions')}
                className="lg:hidden w-full flex items-center justify-between glass-card backdrop-blur-sm border border-white/10 rounded-2xl p-4 hover:bg-white/5 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-crypto-lime/10 rounded-lg group-hover:bg-crypto-lime/20 transition-colors">
                    <Receipt size={20} className="text-crypto-lime" />
                  </div>
                  <div className="text-left">
                    <p className="text-white font-semibold text-sm">Transaction History</p>
                    <p className="text-slate-400 text-xs">View all buys, sells & trades</p>
                  </div>
                </div>
                <ArrowRightLeft size={18} className="text-slate-500 group-hover:text-crypto-lime transition-colors" />
              </button>

              {/* Owned Assets */}
              <CardList
                cards={portfolioCards}
                onSelect={setSelectedCard}
                displayCurrency={displayCurrency}
                convertPrice={convertPrice}
                onTabChange={setPortfolioTab}
              />

              {/* Watchlist Section - Only show on Holdings tab */}
              {watchlistCards.length > 0 && portfolioTab === 'holdings' && (
                <WatchList
                  cards={watchlistCards}
                  onSelect={setSelectedCard}
                  onConvertToAsset={handleConvertToAsset}
                  onUpdatePrice={(c) => setUpdatingPriceCard(c)}
                  displayCurrency={displayCurrency}
                  convertPrice={convertPrice}
                />
              )}

              {portfolioCards.length === 0 && watchlistCards.length === 0 && (
                <div className="text-center py-20 px-6">
                  <p className="text-slate-500 mb-4">Start your journey by adding a card to your portfolio or watchlist.</p>
                </div>
              )}
            </div>
          ) : activeTab === 'analytics' ? (
            <AnalyticsView cards={cards} displayCurrency={displayCurrency} convertPrice={convertPrice} />
          ) : activeTab === 'transactions' ? (
            <div className="p-4 lg:p-6">
              <TransactionsView cards={cards} displayCurrency={displayCurrency} convertPrice={convertPrice} />
            </div>
          ) : activeTab === 'trade-plans' ? (
            <div className="p-4 lg:p-6">
              {!tradePlansView ? (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-white">Trade Plans</h2>
                    {tradePlansTab === 'plans' && (
                      <button
                        onClick={() => setShowTradePlanner(true)}
                        className="bg-gradient-to-r from-crypto-lime to-green-500 text-black font-bold py-2 px-4 rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2"
                      >
                        <Plus size={20} />
                        Create New Plan
                      </button>
                    )}
                  </div>

                  {/* Tabs */}
                  <div className="flex gap-2 mb-6 border-b border-slate-700/50">
                    <button
                      onClick={() => setTradePlansTab('plans')}
                      className={`px-4 py-2 font-medium transition-all ${
                        tradePlansTab === 'plans'
                          ? 'text-crypto-lime border-b-2 border-crypto-lime'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      My Plans
                    </button>
                    <button
                      onClick={() => setTradePlansTab('never-trade')}
                      className={`px-4 py-2 font-medium transition-all ${
                        tradePlansTab === 'never-trade'
                          ? 'text-crypto-lime border-b-2 border-crypto-lime'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Never Trade List
                    </button>
                  </div>

                  {tradePlansTab === 'plans' ? (
                    <TradePlansList
                      displayCurrency={displayCurrency}
                      convertPrice={(amount) => convertPrice(amount, 'USD', displayCurrency).toLocaleString()}
                      formatCurrency={(amount, currency) => `${currency === 'USD' ? '$' : '¥'}${amount.toLocaleString()}`}
                      getIdToken={getIdToken}
                      onViewPlan={(id) => {
                        setSelectedPlanId(id);
                        setTradePlansView('detail');
                      }}
                    />
                  ) : (
                    <NeverTradeList
                      cards={cards}
                      displayCurrency={displayCurrency}
                      convertPrice={convertPrice}
                      formatPrice={(amount, currency) => `${currency === 'USD' ? '$' : '¥'}${amount.toLocaleString()}`}
                      onToggleNeverTrade={handleToggleNeverTrade}
                    />
                  )}
                </>
              ) : tradePlansView === 'detail' && selectedPlanId ? (
                <TradePlanDetail
                  planId={selectedPlanId}
                  displayCurrency={displayCurrency}
                  convertPrice={(amount) => convertPrice(amount, 'USD', displayCurrency).toLocaleString()}
                  convertCurrency={convertPrice}
                  formatCurrency={(amount, currency) => `${currency === 'USD' ? '$' : '¥'}${amount.toLocaleString()}`}
                  allCards={cards}
                  getIdToken={getIdToken}
                  onBack={() => {
                    setTradePlansView(null);
                    setSelectedPlanId(null);
                  }}
                  onExecuteTrade={(plan) => {
                    setExecutingPlan(plan);
                    setShowExecutionModal(true);
                  }}
                />
              ) : null}
            </div>
          ) : null}
        </main>
      </div>

      {/* Detail Sheet */}
      {selectedCard && (
        <div className="fixed inset-0 z-50 flex items-end justify-center pointer-events-none">
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-md pointer-events-auto transition-opacity"
            onClick={() => setSelectedCard(null)}
          />

          <div className="bg-slate-900/95 w-full max-w-xl rounded-t-3xl border-t border-slate-800/50 p-6 pointer-events-auto transform transition-transform duration-300 ease-out max-h-[85vh] overflow-y-auto shadow-2xl">
            <div className="w-12 h-1.5 bg-slate-800 rounded-full mx-auto mb-6" />

            <div className="flex gap-6 mb-6">
              <div className="w-24 h-32 bg-slate-800 rounded-lg overflow-hidden flex-shrink-0 border border-slate-700 relative">
                {selectedCard.imageUrl && <img src={selectedCard.imageUrl} className="w-full h-full object-cover" />}
                {selectedCard.watchlist && (
                  <div className="absolute top-0 right-0 bg-indigo-600 text-white p-1 rounded-bl-lg">
                    <Eye size={12} />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-white leading-tight mb-1">
                  {selectedCard.year} {selectedCard.brand} {selectedCard.series}
                </h2>
                <p className="text-slate-400 text-sm mb-2">
                  {selectedCard.insert}
                  {selectedCard.parallel && ` • ${selectedCard.parallel}`}
                  {selectedCard.serialNumber && ` • ${selectedCard.serialNumber}`}
                </p>
                <p className="text-lg font-semibold text-white mb-2">{selectedCard.player}</p>
                {selectedCard.graded && (
                  <GradeTag card={selectedCard} />
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-slate-900/40 backdrop-blur-sm p-4 rounded-xl border border-slate-800/50">
                <span className="text-xs text-slate-500 uppercase font-semibold tracking-wide">Market Value</span>
                <div className="text-2xl font-mono font-bold text-white mt-1.5">
                  {selectedCard.currentValue === -1 ? (
                    <span className="text-amber-400">Unknown</span>
                  ) : (
                    `${displayCurrency === 'USD' ? '$' : '¥'}${convertPrice(selectedCard.currentValue, selectedCard.currency, displayCurrency).toLocaleString()}`
                  )}
                </div>
              </div>
              <div className="bg-slate-900/40 backdrop-blur-sm p-4 rounded-xl border border-slate-800/50">
                <span className="text-xs text-slate-500 uppercase font-semibold tracking-wide">
                  {selectedCard.watchlist ? 'Target' : 'Cost Basis'}
                </span>
                <div className="text-2xl font-mono font-bold text-slate-400 mt-1.5">{displayCurrency === 'USD' ? '$' : '¥'}{convertPrice(selectedCard.purchasePrice, selectedCard.currency, displayCurrency).toLocaleString()}</div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-4 gap-3">
                <button onClick={() => setUpdatingPriceCard(selectedCard)} className="flex flex-col items-center gap-1.5 p-3 bg-slate-900/40 backdrop-blur-sm rounded-xl border border-slate-800/50 hover:bg-emerald-500/10 hover:border-emerald-500/30 active:scale-95 transition-all">
                  <TrendingUp className="text-emerald-400" size={22} />
                  <span className="text-[10px] font-medium text-slate-300">Log Price</span>
                </button>

                <button onClick={() => setAnalyzingCard(selectedCard)} className="flex flex-col items-center gap-1.5 p-3 bg-slate-900/40 backdrop-blur-sm rounded-xl border border-slate-800/50 hover:bg-indigo-500/10 hover:border-indigo-500/30 active:scale-95 transition-all">
                  <Activity className="text-indigo-400" size={22} />
                  <span className="text-[10px] font-medium text-slate-300">History</span>
                </button>
                <button onClick={() => { setEditingCard(selectedCard); setIsFormOpen(true); }} className="flex flex-col items-center gap-1.5 p-3 bg-slate-900/40 backdrop-blur-sm rounded-xl border border-slate-800/50 hover:bg-slate-800 hover:border-slate-700 active:scale-95 transition-all">
                  <Edit2 className="text-blue-400" size={22} />
                  <span className="text-[10px] font-medium text-slate-300">Edit</span>
                </button>
                <button onClick={() => handleDeleteCard(selectedCard.id)} className="flex flex-col items-center gap-1.5 p-3 bg-slate-900/40 backdrop-blur-sm rounded-xl border border-slate-800/50 hover:bg-rose-500/10 hover:border-rose-500/30 active:scale-95 transition-all">
                  <X className="text-rose-400" size={22} />
                  <span className="text-[10px] font-medium text-slate-300">Delete</span>
                </button>
              </div>

              {/* Buy button for watchlist items */}
              {selectedCard.watchlist && (
                <button
                  onClick={() => handleConvertToAsset(selectedCard)}
                  className="w-full flex items-center justify-center gap-2 p-3 bg-emerald-500/10 backdrop-blur-sm rounded-xl border border-emerald-500/30 hover:bg-emerald-500/20 hover:border-emerald-500/50 active:scale-95 transition-all"
                >
                  <Wallet className="text-emerald-400" size={20} />
                  <span className="text-sm font-semibold text-emerald-300">I Bought This</span>
                </button>
              )}

              {/* Mark as Sold and Log Trade Buttons - Only show if card is not sold and not in watchlist */}
              {!selectedCard.watchlist && !selectedCard.sold && (
                <>
                  <button
                    onClick={() => setSoldModalCard(selectedCard)}
                    className="w-full flex items-center justify-center gap-2 p-3 bg-emerald-500/10 backdrop-blur-sm rounded-xl border border-emerald-500/30 hover:bg-emerald-500/20 hover:border-emerald-500/50 active:scale-95 transition-all"
                  >
                    <Wallet className="text-emerald-400" size={20} />
                    <span className="text-sm font-semibold text-emerald-300">Mark as Sold</span>
                  </button>

                  <button
                    onClick={() => setTradeModalCard(selectedCard)}
                    className="w-full flex items-center justify-center gap-2 p-3 bg-purple-500/10 backdrop-blur-sm rounded-xl border border-purple-500/30 hover:bg-purple-500/20 hover:border-purple-500/50 active:scale-95 transition-all"
                  >
                    <ArrowRightLeft className="text-purple-400" size={20} />
                    <span className="text-sm font-semibold text-purple-300">Log Trade</span>
                  </button>
                </>
              )}

              {/* Show sold status if already sold */}
              {selectedCard.sold && (
                <div className="w-full p-3 bg-emerald-500/10 backdrop-blur-sm rounded-xl border border-emerald-500/30">
                  <div className="flex items-center justify-center gap-2">
                    <Wallet className="text-emerald-400" size={18} />
                    <span className="text-sm font-semibold text-emerald-300">Sold on {selectedCard.soldDate}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-8 text-center">
              <button onClick={() => setSelectedCard(null)} className="text-slate-500 text-sm py-2">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Bottom Nav */}
      <BottomNav
        currentTab={activeTab}
        onTabChange={setActiveTab}
        onAdd={() => { setEditingCard(null); setIsFormOpen(true); }}
      />

      {/* Full Screen Modals */}
      {isFormOpen && (
        <CardForm
          initialData={editingCard}
          onSave={handleSaveCard}
          onCancel={() => setIsFormOpen(false)}
          getIdToken={getIdToken}
        />
      )}

      {updatingPriceCard && (
        <PriceUpdateModal
          card={updatingPriceCard}
          onSave={handleUpdatePrice}
          onCancel={() => setUpdatingPriceCard(null)}
          convertPrice={convertPrice}
        />
      )}

      {analyzingCard && (
        <InsightModal
          card={analyzingCard}
          allCards={cards}
          onClose={() => setAnalyzingCard(null)}
          onDeleteEntry={handleDeletePriceEntry}
          onEditEntry={handleEditPriceEntry}
        />
      )}

      {soldModalCard && (
        <SoldModal
          card={soldModalCard}
          onSave={handleMarkAsSold}
          onCancel={() => setSoldModalCard(null)}
          convertPrice={convertPrice}
        />
      )}

      {tradeModalCard && (
        <TradeModal
          card={tradeModalCard}
          allCards={cards}
          onSave={handleTrade}
          onCancel={() => setTradeModalCard(null)}
          displayCurrency={displayCurrency}
          convertPrice={convertPrice}
        />
      )}

      {showUpgradePrompt && (
        <UpgradePromptModal
          onClose={() => setShowUpgradePrompt(false)}
        />
      )}

      {/* Admin Panel */}
      {showAdminPanel && (
        <AdminPanel onClose={() => setShowAdminPanel(false)} />
      )}

      {/* Unlock Key Modal */}
      {showUnlockModal && (
        <UnlockKeyModal
          onClose={() => setShowUnlockModal(false)}
          onSuccess={setUserProfile}
        />
      )}

      {/* Trade Planner Modal */}
      {showTradePlanner && (
        <TradePlanner
          cards={cards}
          displayCurrency={displayCurrency}
          convertPrice={(amount) => convertPrice(amount, 'USD', displayCurrency).toLocaleString()}
          getIdToken={getIdToken}
          onClose={() => setShowTradePlanner(false)}
          onPlanCreated={() => {
            setShowTradePlanner(false);
            // Optionally refresh plans list if viewing trade plans
          }}
        />
      )}

      {/* Trade Plan Execution Modal */}
      {showExecutionModal && executingPlan && (
        <TradePlanExecutionModal
          plan={executingPlan}
          displayCurrency={displayCurrency}
          convertPrice={(amount) => convertPrice(amount, executingPlan.cashCurrency || displayCurrency, displayCurrency).toLocaleString()}
          onExecute={handleExecuteTradePlan}
          onCancel={() => {
            setShowExecutionModal(false);
            setExecutingPlan(null);
          }}
        />
      )}

      {/* PWA Components */}
      <PWAUpdateNotification />
      <PWAInstallPrompt />
      <OfflineIndicator />
    </div>
  );
}
