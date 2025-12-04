import React, { useMemo } from 'react';
import { Card, Currency } from '../types';
import { ArrowDown, ArrowUp, TrendingUp, TrendingDown } from 'lucide-react';

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
  type: 'sale' | 'trade';
  lines: TransactionLine[];
}

interface TransactionsViewProps {
  cards: Card[];
  displayCurrency: Currency;
  convertPrice: (price: number, from: Currency, to: Currency) => number;
}

export const TransactionsView: React.FC<TransactionsViewProps> = ({ cards, displayCurrency, convertPrice }) => {
  const symbol = displayCurrency === 'USD' ? '$' : '¥';

  // Generate transactions from sold cards
  const transactions = useMemo(() => {
    const txns: Transaction[] = [];

    // Group sold cards by date and type to create transactions
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

    return txns;
  }, [cards, displayCurrency, convertPrice]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Transactions</h2>
        <div className="text-sm text-slate-400">
          {transactions.length} {transactions.length === 1 ? 'transaction' : 'transactions'}
        </div>
      </div>

      {transactions.length === 0 ? (
        <div className="bg-slate-900/40 backdrop-blur-sm border border-slate-800/50 rounded-xl p-12 text-center">
          <p className="text-slate-500">No transactions yet</p>
          <p className="text-xs text-slate-600 mt-2">Sell or trade cards to see transactions here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {transactions.map((txn) => (
            <div key={txn.id} className={`bg-slate-900/40 backdrop-blur-sm rounded-xl overflow-hidden ${txn.type === 'trade' ? 'border-2 border-purple-500/30' : 'border-2 border-emerald-500/30'}`}>
              {/* Transaction Header */}
              <div className={`px-4 py-3 border-b flex items-center justify-between ${txn.type === 'trade' ? 'bg-purple-500/10 border-purple-500/20' : 'bg-emerald-500/10 border-emerald-500/20'}`}>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-md text-xs font-bold ${txn.type === 'trade' ? 'bg-purple-500/30 text-purple-300 border border-purple-400/50' : 'bg-emerald-500/30 text-emerald-300 border border-emerald-400/50'}`}>
                    {txn.type === 'trade' ? 'TRADE' : 'SALE'}
                  </span>
                  <span className="text-sm text-slate-300 font-medium">
                    {new Date(txn.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </span>
                </div>
              </div>

              {/* Transaction Lines */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-800/30">
                      <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide px-4 py-3 w-20">Direction</th>
                      <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide px-4 py-3">Item</th>
                      <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide px-4 py-3 w-32">Booked as</th>
                      <th className="text-right text-xs font-semibold text-slate-400 uppercase tracking-wide px-4 py-3 w-28">Amount (FMV)</th>
                      <th className="text-right text-xs font-semibold text-slate-400 uppercase tracking-wide px-4 py-3 w-28">Cost Basis</th>
                      <th className="text-right text-xs font-semibold text-slate-400 uppercase tracking-wide px-4 py-3 w-32">Realized G/L</th>
                    </tr>
                  </thead>
                  <tbody>
                    {txn.lines.map((line, idx) => {
                      const isProfit = (line.realizedGainLoss || 0) >= 0;
                      return (
                        <tr key={idx} className="border-b border-slate-800/20 last:border-b-0 hover:bg-slate-800/20 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              {line.direction === 'OUT' ? (
                                <ArrowUp className="text-rose-400" size={16} />
                              ) : (
                                <ArrowDown className="text-emerald-400" size={16} />
                              )}
                              <span className={`text-xs font-semibold ${line.direction === 'OUT' ? 'text-rose-400' : 'text-emerald-400'}`}>
                                {line.direction}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm text-slate-300">{line.item}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs text-slate-400">{line.bookedAs}</span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="font-mono text-sm text-white">
                              {symbol}{line.amountFMV.toLocaleString()}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            {line.costBasis !== undefined ? (
                              <span className="font-mono text-sm text-slate-400">
                                {symbol}{line.costBasis.toLocaleString()}
                              </span>
                            ) : (
                              <span className="text-slate-600">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {line.realizedGainLoss !== undefined ? (
                              <div className="flex items-center justify-end gap-1.5">
                                {isProfit ? <TrendingUp size={14} className="text-emerald-400" /> : <TrendingDown size={14} className="text-rose-400" />}
                                <span className={`font-mono text-sm font-semibold ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                                  {isProfit ? '+' : ''}{symbol}{Math.abs(line.realizedGainLoss).toLocaleString()}
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
