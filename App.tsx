
import React, { useState, useEffect, useMemo } from 'react';
import { Card, Stats } from './types';
import { dataService } from './services/dataService';
import { DashboardStats } from './components/DashboardStats';
import { CardList } from './components/CardList';
import { WatchList } from './components/WatchList';
import { CardForm } from './components/CardForm';
import { PriceUpdateModal } from './components/PriceUpdateModal';
import { InsightModal } from './components/InsightModal';
import { AnalyticsView } from './components/AnalyticsView';
import { BottomNav } from './components/BottomNav';
import { Login } from './components/Login';
import { useAuth } from './contexts/AuthContext';
import { Loader2, Download, Edit2, TrendingUp, Activity, X, Wallet, Eye, LogOut, User } from 'lucide-react';

export default function App() {
  const { user, loading: authLoading, signOut, getIdToken } = useAuth();
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'portfolio' | 'analytics'>('portfolio');
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Modal States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [editingCard, setEditingCard] = useState<Card | null>(null);
  const [updatingPriceCard, setUpdatingPriceCard] = useState<Card | null>(null);
  const [analyzingCard, setAnalyzingCard] = useState<Card | null>(null);

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

  const portfolioCards = cards.filter(c => !c.watchlist);
  const watchlistCards = cards.filter(c => c.watchlist);

  const stats: Stats = useMemo(() => {
    const initial = { USD: 0, CNY: 0 };
    const totalInvested = { ...initial };
    const currentPortfolioValue = { ...initial };
    const unrealizedProfit = { ...initial };
    const realizedProfit = { ...initial };
    const soldTotal = { ...initial };
    let cardCount = 0;

    portfolioCards.forEach(card => {
      const cur = card.currency;
      if (card.sold) {
        const soldPrice = card.soldPrice || 0;
        const profit = soldPrice - card.purchasePrice;
        soldTotal[cur] += soldPrice;
        realizedProfit[cur] += profit;
      } else {
        cardCount++;
        totalInvested[cur] += card.purchasePrice;
        currentPortfolioValue[cur] += card.currentValue;
        unrealizedProfit[cur] += (card.currentValue - card.purchasePrice);
      }
    });

    return { totalInvested, currentPortfolioValue, unrealizedProfit, realizedProfit, soldTotal, cardCount };
  }, [portfolioCards]);

  const handleSaveCard = async (card: Card) => {
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

  const handleUpdatePrice = async (cardId: string, newPrice: number, dateStr: string) => {
    const updated = await dataService.updatePrice(cardId, newPrice, getIdToken, dateStr);
    if (updated) {
      setCards(prev => prev.map(c => c.id === cardId ? updated : c));
      setUpdatingPriceCard(null);
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

  // Show loading screen while checking auth
  if (authLoading) {
    return (
      <div className="h-screen w-screen bg-black flex flex-col items-center justify-center">
        <img src="/logo.png" alt="Prism" className="mb-6 animate-pulse" style={{ width: '168px', height: 'auto' }} />
        <Loader2 size={32} className="animate-spin text-emerald-500" />
      </div>
    );
  }

  // Show login if not authenticated
  if (!user) {
    return <Login />;
  }

  // Show app loading
  if (loading) {
    return (
      <div className="h-screen w-screen bg-black flex flex-col items-center justify-center">
        <img src="/logo.png" alt="Prism" className="mb-6 animate-pulse" style={{ width: '168px', height: 'auto' }} />
        <Loader2 size={32} className="animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative bg-black text-slate-200 font-sans pb-20 overflow-hidden">

      {/* Unified Animated Background Gradient */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-blue-500/5 to-purple-500/5 animate-pulse" style={{ animationDuration: '8s' }} />
      </div>

      {/* Top Bar with User Profile */}
      <header className="fixed top-0 left-0 right-0 bg-black/60 backdrop-blur-xl z-30 px-4 py-4 flex justify-between items-center border-b border-emerald-500/10 shadow-lg shadow-emerald-500/5">
        <div className="flex items-center">
          <img src="/logo.png" alt="Prism Logo" className="object-contain drop-shadow-lg" style={{ width: '168px', height: 'auto' }} />
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={exportToCSV}
            className="p-2.5 text-slate-400 hover:text-emerald-400 transition-all duration-300 hover:bg-emerald-500/10 rounded-lg"
          >
            <Download size={20} />
          </button>

          {/* User Profile Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-800/50 transition-all"
            >
              {user.photoURL ? (
                <img src={user.photoURL} alt={user.displayName || 'User'} className="w-8 h-8 rounded-full border-2 border-emerald-500/30" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center border-2 border-emerald-500/30">
                  <User size={16} className="text-emerald-400" />
                </div>
              )}
            </button>

            {/* Dropdown Menu */}
            {showUserMenu && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50">
                <div className="p-4 border-b border-slate-800 bg-slate-800/50">
                  <p className="text-white font-semibold truncate">{user.displayName || 'User'}</p>
                  <p className="text-slate-400 text-xs truncate">{user.email}</p>
                </div>
                <button
                  onClick={handleSignOut}
                  className="w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-slate-800 transition-colors text-rose-400"
                >
                  <LogOut size={18} />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Scrollable Area */}
      <main className="relative pt-20 max-w-2xl mx-auto">
        {activeTab === 'portfolio' ? (
          <>
            <DashboardStats stats={stats} />

            {/* Owned Assets */}
            <CardList cards={portfolioCards} onSelect={setSelectedCard} />

            {/* Watchlist Section */}
            {watchlistCards.length > 0 && (
              <WatchList
                cards={watchlistCards}
                onSelect={setSelectedCard}
                onConvertToAsset={handleConvertToAsset}
                onUpdatePrice={(c) => setUpdatingPriceCard(c)}
              />
            )}

            {portfolioCards.length === 0 && watchlistCards.length === 0 && (
              <div className="text-center py-10 px-6">
                <p className="text-slate-500 mb-4">Start your journey by adding a card to your portfolio or watchlist.</p>
              </div>
            )}
          </>
        ) : (
          <AnalyticsView cards={cards} />
        )}
      </main>

      {/* Detail Sheet */}
      {selectedCard && (
        <div className="fixed inset-0 z-50 flex items-end justify-center pointer-events-none">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto transition-opacity"
            onClick={() => setSelectedCard(null)}
          />

          <div className="bg-slate-900 w-full max-w-xl rounded-t-3xl border-t border-slate-800 p-6 pointer-events-auto transform transition-transform duration-300 ease-out max-h-[85vh] overflow-y-auto shadow-2xl">
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
              <div>
                <h2 className="text-2xl font-bold text-white leading-tight mb-1">{selectedCard.player}</h2>
                <p className="text-slate-400">{selectedCard.year} {selectedCard.brand}</p>
                <p className="text-sm text-slate-500 mb-2">{selectedCard.series}</p>
                {selectedCard.graded && (
                  <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-xs font-bold rounded border border-emerald-500/20">
                    {selectedCard.gradeCompany} {selectedCard.gradeValue}
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <span className="text-xs text-slate-500 uppercase font-bold">Market Value</span>
                <div className="text-xl font-mono text-white mt-1">${selectedCard.currentValue}</div>
              </div>
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <span className="text-xs text-slate-500 uppercase font-bold">
                  {selectedCard.watchlist ? 'Target Price' : 'Cost Basis'}
                </span>
                <div className="text-xl font-mono text-slate-400 mt-1">${selectedCard.purchasePrice}</div>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {selectedCard.watchlist ? (
                <button onClick={() => handleConvertToAsset(selectedCard)} className="flex flex-col items-center gap-1 p-3 bg-slate-800 rounded-xl hover:bg-emerald-900/40 active:scale-95 transition-all">
                  <Wallet className="text-emerald-400" size={24} />
                  <span className="text-[10px] text-slate-300">Buy</span>
                </button>
              ) : (
                <button onClick={() => setUpdatingPriceCard(selectedCard)} className="flex flex-col items-center gap-1 p-3 bg-slate-800 rounded-xl hover:bg-slate-700 active:scale-95 transition-all">
                  <TrendingUp className="text-emerald-400" size={24} />
                  <span className="text-[10px] text-slate-300">Price</span>
                </button>
              )}

              <button onClick={() => setAnalyzingCard(selectedCard)} className="flex flex-col items-center gap-1 p-3 bg-slate-800 rounded-xl hover:bg-slate-700 active:scale-95 transition-all">
                <Activity className="text-indigo-400" size={24} />
                <span className="text-[10px] text-slate-300">Insight</span>
              </button>
              <button onClick={() => { setEditingCard(selectedCard); setIsFormOpen(true); }} className="flex flex-col items-center gap-1 p-3 bg-slate-800 rounded-xl hover:bg-slate-700 active:scale-95 transition-all">
                <Edit2 className="text-blue-400" size={24} />
                <span className="text-[10px] text-slate-300">Edit</span>
              </button>
              <button onClick={() => handleDeleteCard(selectedCard.id)} className="flex flex-col items-center gap-1 p-3 bg-slate-800 rounded-xl hover:bg-rose-900/30 active:scale-95 transition-all">
                <X className="text-rose-400" size={24} />
                <span className="text-[10px] text-slate-300">Delete</span>
              </button>
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
        />
      )}

      {updatingPriceCard && (
        <PriceUpdateModal
          card={updatingPriceCard}
          onSave={handleUpdatePrice}
          onCancel={() => setUpdatingPriceCard(null)}
        />
      )}

      {analyzingCard && (
        <InsightModal
          card={analyzingCard}
          onClose={() => setAnalyzingCard(null)}
        />
      )}
    </div>
  );
}
