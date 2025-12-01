import React, { useState, useEffect, useMemo } from 'react';
import { Card, Stats } from './types';
import { DashboardStats } from './components/DashboardStats';
import { CardTable } from './components/CardTable';
import { CardForm } from './components/CardForm';
import { PriceUpdateModal } from './components/PriceUpdateModal';
import { InsightModal } from './components/InsightModal';
import { Plus, Wallet, FileSpreadsheet } from 'lucide-react';

const STORAGE_KEY = 'cardfolio_data_v2'; // Changed version to separate from old data structure

export default function App() {
  const [cards, setCards] = useState<Card[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<Card | null>(null);
  const [updatingPriceCard, setUpdatingPriceCard] = useState<Card | null>(null);
  const [analyzingCard, setAnalyzingCard] = useState<Card | null>(null);

  // Load from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setCards(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse saved data", e);
      }
    }
  }, []);

  // Save to local storage whenever cards change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
  }, [cards]);

  const stats: Stats = useMemo(() => {
    const initial = { USD: 0, CNY: 0 };
    
    // Initialize accumulators
    const totalInvested = { ...initial };
    const currentPortfolioValue = { ...initial };
    const unrealizedProfit = { ...initial };
    const realizedProfit = { ...initial };
    const soldTotal = { ...initial };

    let cardCount = 0;

    cards.forEach(card => {
      const cur = card.currency;
      
      if (card.sold) {
        // Sold items contribute to Realized Profit
        const soldPrice = card.soldPrice || 0;
        const profit = soldPrice - card.purchasePrice;
        
        soldTotal[cur] += soldPrice;
        realizedProfit[cur] += profit;
      } else {
        // Held items contribute to Portfolio Value and Unrealized Profit
        cardCount++;
        totalInvested[cur] += card.purchasePrice;
        currentPortfolioValue[cur] += card.currentValue;
        unrealizedProfit[cur] += (card.currentValue - card.purchasePrice);
      }
    });

    return {
      totalInvested,
      currentPortfolioValue,
      unrealizedProfit,
      realizedProfit,
      soldTotal,
      cardCount
    };
  }, [cards]);

  const handleSaveCard = (card: Card) => {
    if (editingCard) {
      setCards(cards.map(c => c.id === card.id ? card : c));
    } else {
      setCards([...cards, card]);
    }
    setIsFormOpen(false);
    setEditingCard(null);
  };

  const handleDeleteCard = (id: string) => {
    if (window.confirm('Are you sure you want to delete this card?')) {
      setCards(cards.filter(c => c.id !== id));
    }
  };

  const handleUpdatePrice = (cardId: string, newPrice: number) => {
    setCards(cards.map(c => {
      if (c.id === cardId) {
        const history = [...c.priceHistory];
        // If the last entry was today, update it, otherwise push new
        const today = new Date().toISOString().split('T')[0];
        const lastDate = history.length > 0 ? history[history.length - 1].date.split('T')[0] : '';
        
        if (lastDate === today) {
           history[history.length - 1].value = newPrice;
        } else {
           history.push({ date: new Date().toISOString(), value: newPrice });
        }

        return {
          ...c,
          currentValue: newPrice,
          priceHistory: history
        };
      }
      return c;
    }));
    setUpdatingPriceCard(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-emerald-500/30">
      
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-30 shadow-md backdrop-blur-md bg-opacity-80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-600 p-2 rounded-lg text-white shadow-lg shadow-emerald-900/50">
              <FileSpreadsheet size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight leading-none">CardFolio</h1>
              <p className="text-xs text-slate-500 font-mono">Collection Tracker</p>
            </div>
          </div>
          <button 
            onClick={() => { setEditingCard(null); setIsFormOpen(true); }}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg font-medium transition-all shadow-lg shadow-emerald-900/20 active:scale-95 hover:shadow-emerald-500/20"
          >
            <Plus size={20} />
            <span className="hidden sm:inline">Add Card</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        <DashboardStats stats={stats} />

        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Wallet className="text-indigo-400" size={24} />
              My Collection
            </h2>
          </div>
          
          <CardTable 
            cards={cards}
            onUpdatePrice={(card) => setUpdatingPriceCard(card)}
            onEdit={(card) => { setEditingCard(card); setIsFormOpen(true); }}
            onDelete={handleDeleteCard}
            onAnalyze={(card) => setAnalyzingCard(card)}
          />
        </div>
      </main>

      {/* Modals */}
      {isFormOpen && (
        <CardForm 
          initialData={editingCard}
          onSave={handleSaveCard}
          onCancel={() => { setIsFormOpen(false); setEditingCard(null); }}
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