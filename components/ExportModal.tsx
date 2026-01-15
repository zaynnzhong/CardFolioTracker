import React, { useState } from 'react';
import { X, Download, FileSpreadsheet } from 'lucide-react';
import { Card, Currency } from '../types';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  cards: Card[];
  displayCurrency: Currency;
  formatCurrency: (amount: number, currency: Currency) => string;
}

type ExportType = 'holdings' | 'purchases' | 'sales' | 'trades';

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  cards,
  displayCurrency,
  formatCurrency
}) => {
  const [selectedTypes, setSelectedTypes] = useState<ExportType[]>(['holdings']);

  if (!isOpen) return null;

  const toggleType = (type: ExportType) => {
    setSelectedTypes(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const getGradeString = (card: Card): string => {
    if (!card.graded) return 'Raw';
    let grade = card.gradeCompany || '';
    if (card.gradeValue) grade += ` ${card.gradeValue}`;
    if (card.autoGrade) grade += `/${card.autoGrade}`;
    return grade.trim() || 'Graded';
  };

  const escapeCSV = (value: any): string => {
    if (value === null || value === undefined) return '';
    const str = String(value);
    // Escape quotes and wrap in quotes if contains comma, quote, or newline
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const generateCSV = (type: ExportType): string => {
    let filteredCards: Card[] = [];
    let headers: string[] = [];
    let rows: string[][] = [];

    const baseCardHeaders = [
      'Player', 'Year', 'Sport', 'Brand', 'Set', 'Insert', 'Parallel',
      'Serial Number', 'Grade', 'Cert Number', 'Currency'
    ];

    const getBaseCardRow = (card: Card): string[] => [
      card.player,
      String(card.year),
      card.sport,
      card.brand,
      card.series,
      card.insert,
      card.parallel || '',
      card.serialNumber || '',
      getGradeString(card),
      card.certNumber || '',
      card.currency
    ];

    switch (type) {
      case 'holdings':
        filteredCards = cards.filter(c => !c.sold && !c.watchlist);
        headers = [...baseCardHeaders, 'Purchase Date', 'Cost Basis', 'Current Value', 'Profit/Loss', 'Source', 'Notes'];
        rows = filteredCards.map(card => [
          ...getBaseCardRow(card),
          card.purchaseDate || '',
          String(card.purchasePrice),
          String(card.currentValue),
          String(card.currentValue - card.purchasePrice),
          card.acquisitionSource || '',
          card.notes || ''
        ]);
        break;

      case 'purchases':
        filteredCards = cards.filter(c => !c.watchlist);
        headers = [...baseCardHeaders, 'Purchase Date', 'Purchase Price', 'Source', 'Status', 'Notes'];
        rows = filteredCards.map(card => [
          ...getBaseCardRow(card),
          card.purchaseDate || '',
          String(card.purchasePrice),
          card.acquisitionSource || '',
          card.sold ? (card.soldVia === 'trade' ? 'Traded' : 'Sold') : 'Holding',
          card.notes || ''
        ]);
        break;

      case 'sales':
        filteredCards = cards.filter(c => c.sold && c.soldVia === 'sale');
        headers = [...baseCardHeaders, 'Purchase Date', 'Cost Basis', 'Sold Date', 'Sale Price', 'Profit/Loss', 'Notes'];
        rows = filteredCards.map(card => [
          ...getBaseCardRow(card),
          card.purchaseDate || '',
          String(card.purchasePrice),
          card.soldDate || '',
          String(card.soldPrice || 0),
          String((card.soldPrice || 0) - card.purchasePrice),
          card.notes || ''
        ]);
        break;

      case 'trades':
        filteredCards = cards.filter(c => c.sold && c.soldVia === 'trade');
        headers = [...baseCardHeaders, 'Purchase Date', 'Cost Basis', 'Trade Date', 'Trade Value', 'Profit/Loss', 'Notes'];
        rows = filteredCards.map(card => [
          ...getBaseCardRow(card),
          card.purchaseDate || '',
          String(card.purchasePrice),
          card.soldDate || '',
          String(card.soldPrice || 0),
          String((card.soldPrice || 0) - card.purchasePrice),
          card.notes || ''
        ]);
        break;
    }

    const csvContent = [
      headers.map(escapeCSV).join(','),
      ...rows.map(row => row.map(escapeCSV).join(','))
    ].join('\n');

    return csvContent;
  };

  const handleExport = () => {
    if (selectedTypes.length === 0) return;

    selectedTypes.forEach(type => {
      const csv = generateCSV(type);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `prism_${type}_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    });

    onClose();
  };

  const getCounts = () => ({
    holdings: cards.filter(c => !c.sold && !c.watchlist).length,
    purchases: cards.filter(c => !c.watchlist).length,
    sales: cards.filter(c => c.sold && c.soldVia === 'sale').length,
    trades: cards.filter(c => c.sold && c.soldVia === 'trade').length
  });

  const counts = getCounts();

  const exportOptions: { type: ExportType; label: string; description: string }[] = [
    { type: 'holdings', label: 'Current Holdings', description: `${counts.holdings} cards currently in portfolio` },
    { type: 'purchases', label: 'All Purchases', description: `${counts.purchases} total cards purchased` },
    { type: 'sales', label: 'Sales', description: `${counts.sales} cards sold` },
    { type: 'trades', label: 'Trades', description: `${counts.trades} cards traded` }
  ];

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <FileSpreadsheet className="w-6 h-6 text-crypto-lime" />
            <h2 className="text-xl font-bold text-white">Export Data</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          <p className="text-sm text-slate-400 mb-4">
            Select what you want to export. Each selection will download as a separate CSV file.
          </p>

          {exportOptions.map(option => (
            <button
              key={option.type}
              onClick={() => toggleType(option.type)}
              className={`w-full p-4 rounded-xl border transition-all text-left ${
                selectedTypes.includes(option.type)
                  ? 'bg-crypto-lime/10 border-crypto-lime'
                  : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className={`font-semibold ${selectedTypes.includes(option.type) ? 'text-crypto-lime' : 'text-white'}`}>
                    {option.label}
                  </div>
                  <div className="text-sm text-slate-400 mt-1">{option.description}</div>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  selectedTypes.includes(option.type)
                    ? 'border-crypto-lime bg-crypto-lime'
                    : 'border-slate-600'
                }`}>
                  {selectedTypes.includes(option.type) && (
                    <div className="w-2 h-2 rounded-full bg-slate-900" />
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-700">
          <button
            onClick={handleExport}
            disabled={selectedTypes.length === 0}
            className="w-full py-3 bg-crypto-lime text-slate-900 font-bold rounded-xl hover:bg-crypto-lime/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Download size={20} />
            Export {selectedTypes.length > 0 ? `(${selectedTypes.length} file${selectedTypes.length > 1 ? 's' : ''})` : ''}
          </button>
        </div>
      </div>
    </div>
  );
};
