
import React, { useState, useEffect, useRef } from 'react';
import { Card, Sport, Currency, AcquisitionSource, Offer, PricePoint } from '../types';
import { X, Upload, Image as ImageIcon, Eye, Wallet, Plus, Trash2 } from 'lucide-react';

interface CardFormProps {
  initialData?: Card | null;
  onSave: (card: Card) => void;
  onCancel: () => void;
}

interface CardVariant {
  id: string;
  graded: boolean;
  gradeCompany: string;
  gradeValue: string;
  certNumber: string;
  quantity: number;
  purchasePrice: string; // Individual purchase price for this variant
  currentValue: string; // Individual current value for this variant
}

export const CardForm: React.FC<CardFormProps> = ({ initialData, onSave, onCancel }) => {
  // Mode
  const [isWatchlist, setIsWatchlist] = useState(false);
  const [isBulkMode, setIsBulkMode] = useState(false);

  // Visual
  const [imageUrl, setImageUrl] = useState<string>('');

  // Bulk entry variants
  const [variants, setVariants] = useState<CardVariant[]>([
    { id: crypto.randomUUID(), graded: false, gradeCompany: 'PSA', gradeValue: '10', certNumber: '', quantity: 1, purchasePrice: '', currentValue: '' }
  ]);

  // Basics
  const [player, setPlayer] = useState('');
  const [sport, setSport] = useState<Sport>(Sport.BASKETBALL);
  const [year, setYear] = useState<string>(new Date().getFullYear().toString());
  const [brand, setBrand] = useState('');
  const [series, setSeries] = useState('');
  const [insert, setInsert] = useState('');
  const [parallel, setParallel] = useState('');
  const [serialNumber, setSerialNumber] = useState('');

  // Grading
  const [graded, setGraded] = useState(false);
  const [gradeCompany, setGradeCompany] = useState('PSA');
  const [gradeType, setGradeType] = useState('card-only');
  const [gradeValue, setGradeValue] = useState('10');
  const [autoGrade, setAutoGrade] = useState('10');
  const [certNumber, setCertNumber] = useState('');

  // Economics
  const [currency, setCurrency] = useState<Currency>('USD');
  const [purchasePrice, setPurchasePrice] = useState<string>(''); // Used as Cost OR Target Price
  const [purchaseDate, setPurchaseDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [currentValue, setCurrentValue] = useState<string>('');
  const [currentValueUnknown, setCurrentValueUnknown] = useState(false);
  const [acquisitionSource, setAcquisitionSource] = useState<AcquisitionSource>(AcquisitionSource.EBAY);
  const [acquisitionSourceOther, setAcquisitionSourceOther] = useState<string>('');
  const [offers, setOffers] = useState<Offer[]>([]);

  // Sales
  const [sold, setSold] = useState(false);
  const [soldPrice, setSoldPrice] = useState<string>('');
  const [soldDate, setSoldDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const [notes, setNotes] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialData) {
      setIsWatchlist(!!initialData.watchlist);
      setImageUrl(initialData.imageUrl || '');
      setPlayer(initialData.player);
      setSport(initialData.sport);
      setYear(initialData.year.toString());
      setBrand(initialData.brand);
      setSeries(initialData.series);
      setInsert(initialData.insert);
      setParallel(initialData.parallel || '');
      setSerialNumber(initialData.serialNumber || '');

      setGraded(initialData.graded);
      setGradeCompany(initialData.gradeCompany || 'PSA');
      setGradeValue(initialData.gradeValue || '10');
      setAutoGrade(initialData.autoGrade || '10');

      // Detect grade type based on autoGrade presence
      let detectedGradeType = 'card-only';
      if (initialData.autoGrade) {
        detectedGradeType = 'card-auto';
      } else if (initialData.graded && initialData.priceHistory && initialData.priceHistory.length > 0) {
        // Check the most recent price history grade to detect authentic/dna-auth
        const lastGrade = initialData.priceHistory[initialData.priceHistory.length - 1].grade;
        if (lastGrade) {
          if (lastGrade.includes('DNA Auth')) {
            detectedGradeType = 'dna-auth';
          } else if (lastGrade.includes('Authentic')) {
            detectedGradeType = 'authentic';
          }
        }
      }

      console.log('[CardForm] Init Debug:', {
        hasAutoGrade: !!initialData.autoGrade,
        autoGrade: initialData.autoGrade,
        lastPriceGrade: initialData.priceHistory?.[initialData.priceHistory.length - 1]?.grade,
        settingGradeType: detectedGradeType
      });
      setGradeType(detectedGradeType);
      setCertNumber(initialData.certNumber || '');

      setCurrency(initialData.currency);
      setPurchasePrice(initialData.purchasePrice.toString());
      setPurchaseDate(initialData.purchaseDate);

      // Handle unknown/unsure current value (-1)
      if (initialData.currentValue === -1) {
        setCurrentValueUnknown(true);
        setCurrentValue('0');
      } else {
        setCurrentValueUnknown(false);
        setCurrentValue(initialData.currentValue.toString());
      }

      setAcquisitionSource(initialData.acquisitionSource || AcquisitionSource.EBAY);
      setAcquisitionSourceOther(initialData.acquisitionSourceOther || '');
      setOffers(initialData.offers || []);

      setSold(initialData.sold);
      setSoldPrice(initialData.soldPrice ? initialData.soldPrice.toString() : '');
      setSoldDate(initialData.soldDate || new Date().toISOString().split('T')[0]);

      setNotes(initialData.notes || '');
    }
  }, [initialData]);

  const addVariant = () => {
    setVariants([...variants, {
      id: crypto.randomUUID(),
      graded: false,
      gradeCompany: 'PSA',
      gradeValue: '10',
      certNumber: '',
      quantity: 1,
      purchasePrice: '',
      currentValue: ''
    }]);
  };

  const removeVariant = (id: string) => {
    if (variants.length > 1) {
      setVariants(variants.filter(v => v.id !== id));
    }
  };

  const updateVariant = (id: string, field: keyof CardVariant, value: string | number) => {
    setVariants(variants.map(v => v.id === id ? { ...v, [field]: value } : v));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          // Resize image to max 400px width/height to save storage
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const maxSize = 400;

          if (width > height) {
            if (width > maxSize) {
              height *= maxSize / width;
              width = maxSize;
            }
          } else {
            if (height > maxSize) {
              width *= maxSize / height;
              height = maxSize;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
          setImageUrl(dataUrl);
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const pPrice = parseFloat(purchasePrice) || 0;
    const cValue = currentValueUnknown ? -1 : (parseFloat(currentValue) || 0);
    const sPrice = parseFloat(soldPrice) || 0;

    // If in bulk mode and not editing, create multiple cards
    if (isBulkMode && !initialData) {
      // Generate a unique bulk group ID for this batch
      const bulkGroupId = crypto.randomUUID();

      // Create a card for each variant with quantity
      for (const variant of variants) {
        const variantPurchasePrice = parseFloat(variant.purchasePrice) || 0;
        const variantCurrentValue = parseFloat(variant.currentValue) || 0;

        for (let i = 0; i < variant.quantity; i++) {
          // Build price history: Start with purchase price, then add current value if different
          const priceHistory: PricePoint[] = [];

          // Format grade for price history - bulk mode only supports simple grading
          const gradeForHistory = variant.graded
            ? `${variant.gradeCompany} ${variant.gradeValue}`
            : 'Raw';

          // Always log the purchase price first (cost basis) with metadata
          priceHistory.push({
            date: purchaseDate,
            value: variantPurchasePrice,
            parallel: parallel || undefined,
            grade: gradeForHistory,
            serialNumber: serialNumber || undefined
          });

          // If current value is different and not -1 (unknown), add it as well
          if (variantCurrentValue !== -1 && variantCurrentValue !== variantPurchasePrice) {
            priceHistory.push({
              date: new Date().toISOString(),
              value: variantCurrentValue,
              parallel: parallel || undefined,
              grade: gradeForHistory,
              serialNumber: serialNumber || undefined
            });
          }

          const newCard: Card = {
            id: crypto.randomUUID(),
            watchlist: isWatchlist,
            imageUrl,
            player,
            sport,
            year: parseInt(year) || 0,
            brand,
            series,
            insert,
            parallel: parallel || undefined,
            serialNumber,
            graded: variant.graded,
            gradeCompany: variant.graded ? variant.gradeCompany : undefined,
            gradeValue: variant.graded ? variant.gradeValue : undefined,
            certNumber: variant.graded ? (variant.certNumber || undefined) : undefined,
            currency,
            purchasePrice: variantPurchasePrice,
            purchaseDate: isWatchlist ? new Date().toISOString().split('T')[0] : purchaseDate,
            currentValue: variantCurrentValue,
            acquisitionSource,
            acquisitionSourceOther: acquisitionSource === AcquisitionSource.OTHER ? acquisitionSourceOther : undefined,
            sold: isWatchlist ? false : sold,
            soldDate: sold ? soldDate : undefined,
            soldPrice: sold ? sPrice : undefined,
            offers: [],
            notes,
            bulkGroupId, // Link all cards in this bulk entry
            priceHistory
          };

          onSave(newCard);
          // Small delay to avoid overwhelming the backend
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      onCancel(); // Close form after all cards are saved
      return;
    }

    // Regular single card save

    // Build price history for new cards
    let priceHistory: PricePoint[];
    if (initialData) {
      // Editing existing card: keep existing price history
      priceHistory = initialData.priceHistory;
    } else {
      // Creating new card: Start with purchase price, then add current value if different
      priceHistory = [];

      // Format grade for price history with detailed grading info
      let gradeForHistory = 'Raw';
      if (graded) {
        if (gradeType === 'authentic' || gradeType === 'dna-auth') {
          // Authentic or DNA Auth - no numerical grade
          gradeForHistory = gradeType === 'dna-auth' ? `${gradeCompany} DNA Auth` : `${gradeCompany} Authentic`;
        } else if (gradeType === 'card-auto') {
          // Card + Auto grading (e.g., "PSA 10/10", "BGS 9.5/10")
          gradeForHistory = `${gradeCompany} ${gradeValue}/${autoGrade}`;
        } else {
          // Card only (e.g., "PSA 10", "BGS 9.5")
          gradeForHistory = `${gradeCompany} ${gradeValue}`;
        }
      }

      // Always log the purchase price first (cost basis) with metadata
      priceHistory.push({
        date: isWatchlist ? new Date().toISOString().split('T')[0] : purchaseDate,
        value: pPrice,
        parallel: parallel || undefined,
        grade: gradeForHistory,
        serialNumber: serialNumber || undefined
      });

      // If current value is different and not -1 (unknown), add it as well
      if (cValue !== -1 && cValue !== pPrice) {
        priceHistory.push({
          date: new Date().toISOString(),
          value: cValue,
          parallel: parallel || undefined,
          grade: gradeForHistory,
          serialNumber: serialNumber || undefined
        });
      }
    }

    const finalGradeValue = graded && gradeType !== 'authentic' && gradeType !== 'dna-auth' ? gradeValue : undefined;
    const finalAutoGrade = graded && gradeType === 'card-auto' ? autoGrade : undefined;

    console.log('[CardForm] Save Debug:', {
      graded,
      gradeType,
      gradeCompany,
      gradeValue,
      autoGrade,
      finalGradeValue,
      finalAutoGrade,
      willExcludeGradeValue: gradeType === 'authentic' || gradeType === 'dna-auth'
    });

    const newCard: Card = {
      id: initialData ? initialData.id : crypto.randomUUID(),
      watchlist: isWatchlist,
      imageUrl,
      player,
      sport,
      year: parseInt(year) || 0,
      brand,
      series,
      insert,
      parallel: parallel || undefined,
      serialNumber,
      graded,
      gradeCompany: graded ? gradeCompany : undefined,
      gradeValue: finalGradeValue,
      autoGrade: finalAutoGrade,
      certNumber: graded ? certNumber : undefined,
      currency,
      purchasePrice: pPrice,
      purchaseDate: isWatchlist ? new Date().toISOString().split('T')[0] : purchaseDate,
      currentValue: cValue,
      acquisitionSource,
      acquisitionSourceOther: acquisitionSource === AcquisitionSource.OTHER ? acquisitionSourceOther : undefined,
      sold: isWatchlist ? false : sold,
      soldDate: sold ? soldDate : undefined,
      soldPrice: sold ? sPrice : undefined,
      offers,
      notes,
      priceHistory
    };

    onSave(newCard);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="bg-slate-900/95 border border-slate-800/50 rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[95vh]">
        <div className="p-6 border-b border-slate-800/50 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white">{initialData ? 'Edit Card' : 'Add Card'}</h2>
          <button onClick={onCancel} className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-slate-800 rounded-lg">
            <X size={24} />
          </button>
        </div>

        <div className="overflow-y-auto p-6 flex-1">
          <form id="cardForm" onSubmit={handleSubmit} className="space-y-6">

            {/* Status Toggle */}
            <div className="bg-slate-950/50 p-1 rounded-xl inline-flex border border-slate-800/50 w-full md:w-auto">
              <button
                type="button"
                onClick={() => setIsWatchlist(false)}
                className={`flex-1 md:flex-none px-6 py-3 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all ${!isWatchlist ? 'bg-emerald-500 text-white' : 'text-slate-400 hover:text-slate-200'}`}
              >
                <Wallet size={18} /> Portfolio
              </button>
              <button
                type="button"
                onClick={() => setIsWatchlist(true)}
                className={`flex-1 md:flex-none px-6 py-3 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all ${isWatchlist ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:text-slate-200'}`}
              >
                <Eye size={18} /> Watchlist
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* Image Section - Left Column */}
              <div className="md:col-span-4 space-y-4">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={`aspect-[3/4] bg-slate-950 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-slate-900 transition-all overflow-hidden relative group ${isWatchlist ? 'border-indigo-500/30 hover:border-indigo-500' : 'border-slate-700 hover:border-emerald-500'}`}
                >
                  {imageUrl ? (
                    <>
                      <img src={imageUrl} alt="Card Preview" className="w-full h-full object-contain" />
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-white font-medium flex items-center gap-2"><Upload size={16} /> Change Photo</span>
                      </div>
                    </>
                  ) : (
                    <div className="text-slate-500 text-center p-4">
                      <ImageIcon size={48} className="mx-auto mb-2 opacity-50" />
                      <span className="text-sm font-medium">Upload Front Image</span>
                      <p className="text-xs text-slate-600 mt-1">Click to browse</p>
                    </div>
                  )}
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageUpload}
                  />
                </div>
              </div>

              {/* Data Section - Right Column */}
              <div className="md:col-span-8 space-y-6">

                {/* Basic Info */}
                <div>
                  <h3 className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-4">Card Details</h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-slate-400 block">Player / Subject</label>
                      <input type="text" required value={player} onChange={(e) => setPlayer(e.target.value)} className="form-input" placeholder="e.g. Michael Jordan" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-slate-400 block">Sport</label>
                      <select value={sport} onChange={(e) => setSport(e.target.value as Sport)} className="form-input">
                        {Object.values(Sport).map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-slate-400 block">Year</label>
                        <input type="number" required value={year} onChange={(e) => setYear(e.target.value)} className="form-input" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-slate-400 block">Brand</label>
                        <select required value={brand} onChange={(e) => setBrand(e.target.value)} className="form-input">
                          <option value="">Select Brand</option>
                          <option value="Panini">Panini</option>
                          <option value="Topps">Topps</option>
                          <option value="Leaf">Leaf</option>
                          <option value="Upper Deck">Upper Deck</option>
                          <option value="Bowman">Bowman</option>
                          <option value="Donruss">Donruss</option>
                          <option value="Select">Select</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-slate-400 block">Set</label>
                      <input type="text" value={series} onChange={(e) => setSeries(e.target.value)} className="form-input" placeholder="e.g. Flawless, Prizm, National Treasures" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-slate-400 block">Insert</label>
                        <input type="text" required value={insert} onChange={(e) => setInsert(e.target.value)} className="form-input" placeholder="e.g. RPA, Base, Auto" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-slate-400 block">Parallel (Optional)</label>
                        <input type="text" value={parallel} onChange={(e) => setParallel(e.target.value)} className="form-input" placeholder="e.g. Silver, Purple Ice" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-slate-400 block">Serial Number (Optional)</label>
                      <input type="text" value={serialNumber} onChange={(e) => setSerialNumber(e.target.value)} className="form-input" placeholder="e.g. 05/99" />
                    </div>
                  </div>
                </div>

                {/* Bulk Mode Toggle - Only show for new cards, not editing */}
                {!initialData && !isWatchlist && (
                  <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isBulkMode}
                        onChange={(e) => setIsBulkMode(e.target.checked)}
                        className="rounded border-slate-700 bg-slate-800 text-blue-500 focus:ring-blue-500 w-5 h-5"
                      />
                      <div>
                        <span className="text-sm font-semibold text-blue-300">Bulk Entry Mode</span>
                        <p className="text-xs text-blue-400/60 mt-0.5">Add multiple copies (graded or raw) in one go</p>
                      </div>
                    </label>
                  </div>
                )}

                {/* Grading */}
                <div>
                  <div className="mb-4">
                    <h3 className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-4">Grading</h3>

                    {!isBulkMode && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-300">Mark as Graded</span>
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
                    )}
                  </div>

                  {/* Bulk Mode Variants */}
                  {isBulkMode && (
                    <div className="space-y-4 p-4 bg-slate-900/40 rounded-xl border border-slate-800/50">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-semibold text-white">Grade Variants</h4>
                        <button
                          type="button"
                          onClick={addVariant}
                          className="flex items-center gap-1 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
                        >
                          <Plus size={14} /> Add Variant
                        </button>
                      </div>

                      <div className="space-y-3">
                        {variants.map((variant, index) => (
                          <div key={variant.id} className="bg-slate-950/50 p-3 rounded-lg border border-slate-800/50">
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-xs font-semibold text-slate-400">Variant {index + 1}</span>
                              {variants.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeVariant(variant.id)}
                                  className="text-rose-400 hover:text-rose-300 transition-colors"
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </div>

                            {/* Graded Toggle */}
                            <div className="mb-3">
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={variant.graded}
                                  onChange={(e) => updateVariant(variant.id, 'graded', e.target.checked)}
                                  className="rounded border-slate-700 bg-slate-800 text-emerald-500 focus:ring-emerald-500"
                                />
                                <span className="text-xs font-medium text-slate-300">Graded Card</span>
                              </label>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              {variant.graded && (
                                <>
                                  <div className="space-y-2">
                                    <label className="text-xs font-medium text-slate-400 block">Company</label>
                                    <select
                                      value={variant.gradeCompany}
                                      onChange={(e) => updateVariant(variant.id, 'gradeCompany', e.target.value)}
                                      className="form-input text-sm"
                                    >
                                      <option value="PSA">PSA</option>
                                      <option value="BGS">BGS</option>
                                      <option value="SGC">SGC</option>
                                      <option value="CGC">CGC</option>
                                      <option value="CSA">CSA</option>
                                      <option value="TAG">TAG</option>
                                    </select>
                                  </div>
                                  <div className="space-y-2">
                                    <label className="text-xs font-medium text-slate-400 block">Grade</label>
                                    <input
                                      type="text"
                                      value={variant.gradeValue}
                                      onChange={(e) => updateVariant(variant.id, 'gradeValue', e.target.value)}
                                      className="form-input text-sm"
                                      placeholder="10"
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <label className="text-xs font-medium text-slate-400 block">Cert # (Optional)</label>
                                    <input
                                      type="text"
                                      value={variant.certNumber}
                                      onChange={(e) => updateVariant(variant.id, 'certNumber', e.target.value)}
                                      className="form-input text-sm"
                                      placeholder="Optional"
                                    />
                                  </div>
                                </>
                              )}
                              <div className="space-y-2">
                                <label className="text-xs font-medium text-slate-400 block">Quantity</label>
                                <input
                                  type="number"
                                  min="1"
                                  value={variant.quantity}
                                  onChange={(e) => updateVariant(variant.id, 'quantity', parseInt(e.target.value) || 1)}
                                  className="form-input text-sm"
                                />
                              </div>
                            </div>

                            {/* Price Inputs for each variant */}
                            <div className="mt-3 pt-3 border-t border-slate-800/50">
                              <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                  <label className="text-xs font-medium text-slate-400 block">Purchase Price (each) ({currency})</label>
                                  <input
                                    type="number"
                                    step="0.01"
                                    value={variant.purchasePrice}
                                    onChange={(e) => updateVariant(variant.id, 'purchasePrice', e.target.value)}
                                    className="form-input text-sm font-mono"
                                    placeholder="0.00"
                                    required
                                  />
                                  {variant.quantity > 1 && variant.purchasePrice && (
                                    <p className="text-[10px] text-emerald-400 font-semibold">
                                      Total: {currency === 'USD' ? '$' : '¥'}{(parseFloat(variant.purchasePrice) * variant.quantity).toFixed(2)}
                                    </p>
                                  )}
                                </div>
                                <div className="space-y-2">
                                  <label className="text-xs font-medium text-slate-400 block">Current Value (each) ({currency})</label>
                                  <input
                                    type="number"
                                    step="0.01"
                                    value={variant.currentValue}
                                    onChange={(e) => updateVariant(variant.id, 'currentValue', e.target.value)}
                                    className="form-input text-sm font-mono"
                                    placeholder="0.00"
                                    required
                                  />
                                  {variant.quantity > 1 && variant.currentValue && (
                                    <p className="text-[10px] text-blue-400 font-semibold">
                                      Total: {currency === 'USD' ? '$' : '¥'}{(parseFloat(variant.currentValue) * variant.quantity).toFixed(2)}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                        <div className="space-y-1">
                          <p className="text-xs text-blue-300 font-semibold">
                            Total cards to create: {variants.reduce((sum, v) => sum + v.quantity, 0)}
                          </p>
                          <div className="text-[10px] text-blue-400/70 space-y-0.5">
                            {variants.map((v, i) => {
                              const totalCost = (parseFloat(v.purchasePrice) || 0) * v.quantity;
                              const totalValue = (parseFloat(v.currentValue) || 0) * v.quantity;
                              return (
                                <div key={v.id}>
                                  • {v.quantity}x {v.graded ? `${v.gradeCompany} ${v.gradeValue}` : 'Raw'}
                                  {v.purchasePrice && ` - Cost: ${currency === 'USD' ? '$' : '¥'}${totalCost.toFixed(2)}`}
                                  {v.currentValue && ` - Value: ${currency === 'USD' ? '$' : '¥'}${totalValue.toFixed(2)}`}
                                </div>
                              );
                            })}
                          </div>
                          {variants.some(v => v.purchasePrice) && (
                            <div className="mt-2 pt-2 border-t border-blue-500/20">
                              <p className="text-xs text-blue-200 font-bold">
                                Total Investment: {currency === 'USD' ? '$' : '¥'}
                                {variants.reduce((sum, v) => sum + ((parseFloat(v.purchasePrice) || 0) * v.quantity), 0).toFixed(2)}
                              </p>
                              {variants.some(v => v.currentValue) && (
                                <p className="text-xs text-blue-200 font-bold">
                                  Total Value: {currency === 'USD' ? '$' : '¥'}
                                  {variants.reduce((sum, v) => sum + ((parseFloat(v.currentValue) || 0) * v.quantity), 0).toFixed(2)}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {graded && !isBulkMode && (
                    <div className="space-y-4 p-4 bg-slate-900/40 rounded-xl border border-slate-800/50">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-xs font-medium text-slate-400 block">Company</label>
                          <select value={gradeCompany} onChange={(e) => {
                            setGradeCompany(e.target.value);
                            // Only reset gradeType if switching from PSA to non-PSA and currently on dna-auth
                            if (e.target.value !== 'PSA' && gradeType === 'dna-auth') {
                              setGradeType('card-only');
                            }
                          }} className="form-input">
                            <option value="PSA">PSA</option>
                            <option value="BGS">BGS</option>
                            <option value="SGC">SGC</option>
                            <option value="CGC">CGC</option>
                            <option value="CSA">CSA</option>
                            <option value="TAG">TAG</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-medium text-slate-400 block">Grade Type</label>
                          <select value={gradeType} onChange={(e) => {
                            console.log('[CardForm] Grade Type Changed:', e.target.value);
                            setGradeType(e.target.value);
                            // Clear autoGrade when switching to a type that doesn't use it
                            if (e.target.value !== 'card-auto') {
                              setAutoGrade('10');
                            }
                          }} className="form-input">
                            {gradeCompany === 'PSA' && (
                              <>
                                <option value="card-auto">Graded (card + auto)</option>
                                <option value="card-only">Graded (card only)</option>
                                <option value="authentic">Authentic (no numerical grade)</option>
                                <option value="dna-auth">DNA Auth only (sticker)</option>
                              </>
                            )}
                            {(gradeCompany === 'BGS' || gradeCompany === 'SGC' || gradeCompany === 'CGC' || gradeCompany === 'CSA' || gradeCompany === 'TAG') && (
                              <>
                                <option value="card-auto">Graded (card + auto)</option>
                                <option value="card-only">Graded (card only)</option>
                                <option value="authentic">Authentic</option>
                              </>
                            )}
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        {/* Show grade inputs only if NOT authentic/dna-auth */}
                        {gradeType !== 'authentic' && gradeType !== 'dna-auth' && (
                          <>
                            {gradeType === 'card-auto' ? (
                              // Card + Auto: Show two separate inputs
                              <>
                                <div className="space-y-2">
                                  <label className="text-xs font-medium text-slate-400 block">Card Grade</label>
                                  <input type="text" value={gradeValue} onChange={(e) => setGradeValue(e.target.value)} className="form-input" placeholder="10" />
                                </div>
                                <div className="space-y-2">
                                  <label className="text-xs font-medium text-slate-400 block">Auto Grade</label>
                                  <input type="text" value={autoGrade} onChange={(e) => setAutoGrade(e.target.value)} className="form-input" placeholder="10" />
                                </div>
                              </>
                            ) : (
                              // Card Only: Show single grade input
                              <div className="space-y-2">
                                <label className="text-xs font-medium text-slate-400 block">Grade</label>
                                <input type="text" value={gradeValue} onChange={(e) => setGradeValue(e.target.value)} className="form-input" placeholder="10" />
                              </div>
                            )}
                          </>
                        )}
                        <div className="space-y-2">
                          <label className="text-xs font-medium text-slate-400 block">Cert #</label>
                          <input type="text" value={certNumber} onChange={(e) => setCertNumber(e.target.value)} className="form-input" placeholder="Optional" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Economics */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xs uppercase tracking-wider text-slate-500 font-semibold">
                      {isWatchlist ? 'Pricing' : 'Value & Economics'}
                    </h3>
                    <div className="flex items-center bg-slate-900/40 rounded-lg p-1 border border-slate-800/50">
                      <button
                        type="button"
                        onClick={() => setCurrency('USD')}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${currency === 'USD' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}
                      >USD</button>
                      <button
                        type="button"
                        onClick={() => setCurrency('CNY')}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${currency === 'CNY' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}
                      >CNY</button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {/* In bulk mode, show read-only totals instead of input fields */}
                    {isBulkMode ? (
                      <>
                        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                          <label className="text-xs font-medium text-emerald-400 block mb-2">
                            Total Cost Basis ({currency})
                          </label>
                          <p className="text-lg font-bold text-emerald-300 font-mono">
                            {currency === 'USD' ? '$' : '¥'}
                            {variants.reduce((sum, v) => sum + ((parseFloat(v.purchasePrice) || 0) * v.quantity), 0).toFixed(2)}
                          </p>
                          <p className="text-[10px] text-emerald-400/60 mt-1">
                            Calculated from variant prices
                          </p>
                        </div>

                        <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                          <label className="text-xs font-medium text-blue-400 block mb-2">
                            Total Current Value ({currency})
                          </label>
                          <p className="text-lg font-bold text-blue-300 font-mono">
                            {currency === 'USD' ? '$' : '¥'}
                            {variants.reduce((sum, v) => sum + ((parseFloat(v.currentValue) || 0) * v.quantity), 0).toFixed(2)}
                          </p>
                          <p className="text-[10px] text-blue-400/60 mt-1">
                            Calculated from variant values
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="space-y-2">
                          <label className="text-xs font-medium text-slate-400 block">
                            {isWatchlist ? 'Target Buy Price' : 'Cost Basis'} ({currency})
                          </label>
                          <input type="number" step="0.01" required={!isWatchlist} value={purchasePrice} onChange={(e) => setPurchasePrice(e.target.value)} className="form-input font-mono" placeholder="0.00" />
                        </div>

                        <div className="space-y-2">
                          <label className="text-xs font-medium text-slate-400 block">Current Market Value ({currency})</label>
                          <div className="flex items-center gap-3">
                            <input
                              type="number"
                              step="0.01"
                              required={!currentValueUnknown}
                              value={currentValue}
                              onChange={(e) => setCurrentValue(e.target.value)}
                              className="form-input font-mono bg-slate-800 flex-1"
                              disabled={currentValueUnknown}
                            />
                            <label className="flex items-center gap-2 cursor-pointer whitespace-nowrap">
                              <input
                                type="checkbox"
                                checked={currentValueUnknown}
                                onChange={(e) => setCurrentValueUnknown(e.target.checked)}
                                className="rounded border-slate-700 bg-slate-800 text-amber-500 focus:ring-amber-500"
                              />
                              <span className="text-xs text-slate-400">Unknown</span>
                            </label>
                          </div>
                          <p className="text-[10px] text-slate-500 mt-1">
                            {isWatchlist ? 'Used to calculate distance to target.' : 'Update this later from the dashboard.'}
                          </p>
                        </div>
                      </>
                    )}

                    {!isWatchlist && (
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-slate-400 block">Date of Purchase</label>
                        <input type="date" required value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} className="form-input" />
                      </div>
                    )}

                    {!isWatchlist && (
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-slate-400 block">Acquisition Source</label>
                        <select
                          value={acquisitionSource}
                          onChange={(e) => setAcquisitionSource(e.target.value as AcquisitionSource)}
                          className="form-input"
                        >
                          {Object.values(AcquisitionSource).map(source => (
                            <option key={source} value={source}>{source}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {!isWatchlist && acquisitionSource === AcquisitionSource.OTHER && (
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-slate-400 block">Specify Other Source</label>
                        <input
                          type="text"
                          value={acquisitionSourceOther}
                          onChange={(e) => setAcquisitionSourceOther(e.target.value)}
                          className="form-input"
                          placeholder="Enter source name"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Offers Section - Hide if Watchlist or Sold */}
                {!isWatchlist && !sold && (
                  <div className="bg-slate-900/40 border border-slate-800/50 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Pending Offers</span>
                      <button
                        type="button"
                        onClick={() => {
                          const newOffer: Offer = {
                            id: crypto.randomUUID(),
                            offerPrice: 0,
                            platform: '',
                            senderName: '',
                            date: new Date().toISOString().split('T')[0],
                            notes: ''
                          };
                          setOffers([...offers, newOffer]);
                        }}
                        className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300"
                      >
                        <Plus size={14} />
                        Add Offer
                      </button>
                    </div>

                    {offers.length > 0 ? (
                      <div className="space-y-3">
                        {offers.map((offer, index) => (
                          <div key={offer.id} className="bg-slate-950/50 p-3 rounded-xl border border-slate-800/50">
                            <div className="grid grid-cols-2 gap-2 mb-2">
                              <div className="space-y-1">
                                <label className="text-[10px] text-slate-400">Offer Amount ({currency})</label>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={offer.offerPrice}
                                  onChange={(e) => {
                                    const updated = [...offers];
                                    updated[index].offerPrice = parseFloat(e.target.value) || 0;
                                    setOffers(updated);
                                  }}
                                  className="form-input text-sm font-mono"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] text-slate-400">Date</label>
                                <input
                                  type="date"
                                  value={offer.date}
                                  onChange={(e) => {
                                    const updated = [...offers];
                                    updated[index].date = e.target.value;
                                    setOffers(updated);
                                  }}
                                  className="form-input text-sm"
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div className="space-y-1">
                                <label className="text-[10px] text-slate-400">Platform</label>
                                <input
                                  type="text"
                                  value={offer.platform}
                                  onChange={(e) => {
                                    const updated = [...offers];
                                    updated[index].platform = e.target.value;
                                    setOffers(updated);
                                  }}
                                  className="form-input text-sm"
                                  placeholder="eBay, Wecard, etc."
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] text-slate-400">Sender Name</label>
                                <input
                                  type="text"
                                  value={offer.senderName}
                                  onChange={(e) => {
                                    const updated = [...offers];
                                    updated[index].senderName = e.target.value;
                                    setOffers(updated);
                                  }}
                                  className="form-input text-sm"
                                />
                              </div>
                            </div>
                            <div className="flex justify-end mt-2">
                              <button
                                type="button"
                                onClick={() => setOffers(offers.filter((_, i) => i !== index))}
                                className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1"
                              >
                                <Trash2 size={12} />
                                Remove
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 text-center py-2">No pending offers</p>
                    )}
                  </div>
                )}

                {/* Sales Toggle - Hide if Watchlist */}
                {!isWatchlist && (
                  <div className="bg-slate-900/40 border border-slate-800/50 rounded-xl p-4">
                    <label className="flex items-center gap-2 cursor-pointer mb-4">
                      <input type="checkbox" checked={sold} onChange={(e) => setSold(e.target.checked)} className="rounded border-slate-700 bg-slate-800 text-emerald-500 focus:ring-emerald-500" />
                      <span className="font-semibold text-white">Mark as Sold</span>
                    </label>

                    {sold && (
                      <div className="grid grid-cols-2 gap-4 animate-fadeIn">
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-emerald-400">Sold Price ({currency})</label>
                          <input type="number" step="0.01" required={sold} value={soldPrice} onChange={(e) => setSoldPrice(e.target.value)} className="form-input font-mono border-emerald-500/30 focus:border-emerald-500" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-emerald-400">Date Sold</label>
                          <input type="date" required={sold} value={soldDate} onChange={(e) => setSoldDate(e.target.value)} className="form-input border-emerald-500/30 focus:border-emerald-500" />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-400">Notes</label>
                  <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="form-input resize-none" placeholder="Condition notes, purchase source, etc." />
                </div>

              </div>
            </div>
          </form>
        </div>

        <div className="p-6 border-t border-slate-800/50 flex justify-end gap-3">
          <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
          <button type="submit" form="cardForm" className={`btn-primary ${isWatchlist ? '!bg-indigo-500 hover:!bg-indigo-400' : ''}`}>
            {initialData ? 'Save' : isWatchlist ? 'Add to Watchlist' : 'Add to Portfolio'}
          </button>
        </div>
      </div>

      <style>{`
        .form-input {
          width: 100%;
          background-color: #0f172a;
          border: 1px solid rgba(51, 65, 85, 0.5);
          border-radius: 0.75rem;
          padding: 0.625rem 0.875rem;
          color: white;
          outline: none;
          transition: all 0.2s;
          font-size: 0.9375rem;
        }
        .form-input:focus {
          border-color: ${isWatchlist ? '#6366f1' : '#10b981'};
          background-color: #1e293b;
        }
        .btn-primary {
          padding: 0.625rem 2rem;
          background-color: #10b981;
          color: white;
          border-radius: 0.75rem;
          font-weight: 600;
          transition: background-color 0.2s;
          font-size: 0.9375rem;
        }
        .btn-primary:hover {
          background-color: #059669;
        }
        .btn-secondary {
          padding: 0.625rem 1.5rem;
          color: #cbd5e1;
          border-radius: 0.75rem;
          font-weight: 600;
          transition: all 0.2s;
          font-size: 0.9375rem;
        }
        .btn-secondary:hover {
          color: white;
          background-color: #334155;
        }
      `}</style>
    </div>
  );
};
