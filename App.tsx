
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
import { Loader2, Settings, Download, Trash2, Edit2, TrendingUp, Activity, X, Wallet, Eye } from 'lucide-react';

export default function App() {
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'portfolio' | 'analytics'>('portfolio');
  
  // Modal States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null); // For the detail view
  const [editingCard, setEditingCard] = useState<Card | null>(null);
  const [updatingPriceCard, setUpdatingPriceCard] = useState<Card | null>(null);
  const [analyzingCard, setAnalyzingCard] = useState<Card | null>(null);

  // Load Data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const data = await dataService.getCards();
      setCards(data);
      setLoading(false);
    };
    loadData();
  }, []);

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

    // Only calc stats for Portfolio items
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
    const saved = await dataService.saveCard(card);
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
      await dataService.deleteCard(id);
      setCards(prev => prev.filter(c => c.id !== id));
      setSelectedCard(null);
    }
  };

  const handleUpdatePrice = async (cardId: string, newPrice: number, dateStr: string) => {
    const updated = await dataService.updatePrice(cardId, newPrice, dateStr);
    if (updated) {
      setCards(prev => prev.map(c => c.id === cardId ? updated : c));
      setUpdatingPriceCard(null);
      if (selectedCard?.id === cardId) setSelectedCard(updated);
    }
  };

  // Convert Watchlist item to Asset
  const handleConvertToAsset = (card: Card) => {
    // Open form with this card data, but flip watchlist to false
    // and let user confirm purchase price
    setEditingCard({
        ...card,
        watchlist: false,
        purchaseDate: new Date().toISOString().split('T')[0],
        purchasePrice: card.currentValue // Default purchase price to current market value
    });
    setIsFormOpen(true);
  };

  // CSV Export
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

  if (loading) {
    return (
      <div className="h-screen w-screen bg-black flex flex-col items-center justify-center text-emerald-500">
        <Loader2 size={48} className="animate-spin mb-4" />
        <h1 className="text-xl font-bold text-white tracking-widest">PRISM</h1>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-slate-200 font-sans pb-20">
      
      {/* Top Bar - Minimalist */}
      <header className="fixed top-0 left-0 right-0 bg-black/80 backdrop-blur-md z-30 px-4 py-3 flex justify-between items-center border-b border-slate-900/50">
        <div className="flex items-center gap-3">
           <img src="https://i.imgur.com/Qh15d2B.jpeg" alt="Prism Logo" className="w-8 h-8 rounded-lg object-contain bg-slate-950" />
           <span className="font-bold text-lg tracking-tight text-white">Prism</span>
        </div>
        <button onClick={exportToCSV} className="p-2 text-slate-500 hover:text-white transition-colors">
          <Download size={20} />
        </button>
      </header>

      {/* Main Scrollable Area */}
      <main className="pt-16 max-w-2xl mx-auto">
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

      {/* Detail Sheet (Custom "Action Sheet" for mobile feel) */}
      {selectedCard && (
        <div className="fixed inset-0 z-50 flex items-end justify-center pointer-events-none">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto transition-opacity"
            onClick={() => setSelectedCard(null)}
          />
          
          {/* Sheet */}
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
                   <Trash2 className="text-rose-400" size={24} />
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
