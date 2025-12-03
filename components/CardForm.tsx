
import React, { useState, useEffect, useRef } from 'react';
import { Card, Sport, Currency, AcquisitionSource, Offer, PricePoint } from '../types';
import { X, Upload, Image as ImageIcon, Eye, Wallet, Plus, Trash2 } from 'lucide-react';

interface CardFormProps {
  initialData?: Card | null;
  onSave: (card: Card) => void;
  onCancel: () => void;
}

export const CardForm: React.FC<CardFormProps> = ({ initialData, onSave, onCancel }) => {
  // Mode
  const [isWatchlist, setIsWatchlist] = useState(false);

  // Visual
  const [imageUrl, setImageUrl] = useState<string>('');

  // Basics
  const [player, setPlayer] = useState('');
  const [sport, setSport] = useState<Sport>(Sport.BASKETBALL);
  const [year, setYear] = useState<string>(new Date().getFullYear().toString());
  const [brand, setBrand] = useState('');
  const [series, setSeries] = useState('');
  const [cardType, setCardType] = useState('');
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
      setCardType(initialData.cardType);
      setSerialNumber(initialData.serialNumber || '');

      setGraded(initialData.graded);
      setGradeCompany(initialData.gradeCompany || 'PSA');
      setGradeValue(initialData.gradeValue || '10');
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const pPrice = parseFloat(purchasePrice) || 0;
    const cValue = currentValueUnknown ? -1 : (parseFloat(currentValue) || 0);
    const sPrice = parseFloat(soldPrice) || 0;

    // If transitioning from Watchlist to Owned, ensure we unflag watchlist
    // But if we are simply editing, we keep the state

    const newCard: Card = {
      id: initialData ? initialData.id : crypto.randomUUID(),
      watchlist: isWatchlist,
      imageUrl,
      player,
      sport,
      year: parseInt(year) || 0,
      brand,
      series,
      cardType,
      serialNumber,
      graded,
      gradeCompany: graded ? gradeCompany : undefined,
      gradeValue: graded ? gradeValue : undefined,
      certNumber: graded ? certNumber : undefined,
      currency,
      purchasePrice: pPrice,
      purchaseDate: isWatchlist ? new Date().toISOString().split('T')[0] : purchaseDate, // Default date for watchlist
      currentValue: cValue,
      acquisitionSource,
      acquisitionSourceOther: acquisitionSource === AcquisitionSource.OTHER ? acquisitionSourceOther : undefined,
      sold: isWatchlist ? false : sold, // Watchlist items can't be sold yet
      soldDate: sold ? soldDate : undefined,
      soldPrice: sold ? sPrice : undefined,
      offers,
      notes,
      priceHistory: initialData ? initialData.priceHistory : [{
        date: new Date().toISOString(),
        value: cValue
      }]
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-400">Player / Subject</label>
                      <input type="text" required value={player} onChange={(e) => setPlayer(e.target.value)} className="form-input" placeholder="e.g. LeBron James" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-400">Sport</label>
                      <select value={sport} onChange={(e) => setSport(e.target.value as Sport)} className="form-input">
                        {Object.values(Sport).map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-400">Year</label>
                      <input type="number" required value={year} onChange={(e) => setYear(e.target.value)} className="form-input" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-400">Brand</label>
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
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-400">Set</label>
                      <input type="text" value={series} onChange={(e) => setSeries(e.target.value)} className="form-input" placeholder="e.g. Flawless, Prizm, National Treasures" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-400">Insert / Parallel</label>
                      <input type="text" value={cardType} onChange={(e) => setCardType(e.target.value)} className="form-input" placeholder="e.g. Silver, Mojo, Red" />
                    </div>
                    <div className="space-y-1 col-span-2">
                      <label className="text-xs font-medium text-slate-400">Serial Number (Optional)</label>
                      <input type="text" value={serialNumber} onChange={(e) => setSerialNumber(e.target.value)} className="form-input" placeholder="e.g. 05/99" />
                    </div>
                  </div>
                </div>

                {/* Grading */}
                <div>
                  <div className="mb-4">
                    <h3 className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-4">Grading</h3>
                    <button
                      type="button"
                      onClick={() => setGraded(!graded)}
                      className={`w-full py-3 px-4 rounded-xl font-semibold text-sm transition-all border ${graded
                          ? 'bg-emerald-500 border-emerald-500 text-white'
                          : 'bg-slate-900/40 border-slate-800/50 text-slate-400 hover:border-slate-700 hover:text-slate-300'
                        }`}
                    >
                      {graded ? '✓ Graded Card' : 'Mark as Graded'}
                    </button>
                  </div>

                  {graded && (
                    <div className="space-y-4 p-4 bg-slate-900/40 rounded-xl border border-slate-800/50">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-slate-400">Company</label>
                          <select value={gradeCompany} onChange={(e) => { setGradeCompany(e.target.value); setGradeType('card-only'); }} className="form-input">
                            <option value="PSA">PSA</option>
                            <option value="BGS">BGS</option>
                            <option value="SGC">SGC</option>
                            <option value="CGC">CGC</option>
                            <option value="CSA">CSA</option>
                            <option value="TAG">TAG</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-slate-400">Grade Type</label>
                          <select value={gradeType} onChange={(e) => setGradeType(e.target.value)} className="form-input">
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
                                <div className="space-y-1">
                                  <label className="text-xs font-medium text-slate-400">Card Grade</label>
                                  <input type="text" value={gradeValue} onChange={(e) => setGradeValue(e.target.value)} className="form-input" placeholder="10" />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-xs font-medium text-slate-400">Auto Grade</label>
                                  <input type="text" value={autoGrade} onChange={(e) => setAutoGrade(e.target.value)} className="form-input" placeholder="10" />
                                </div>
                              </>
                            ) : (
                              // Card Only: Show single grade input
                              <div className="space-y-1">
                                <label className="text-xs font-medium text-slate-400">Grade</label>
                                <input type="text" value={gradeValue} onChange={(e) => setGradeValue(e.target.value)} className="form-input" placeholder="10" />
                              </div>
                            )}
                          </>
                        )}
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-slate-400">Cert #</label>
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

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-400">
                        {isWatchlist ? 'Target Buy Price' : 'Cost Basis'} ({currency})
                      </label>
                      <input type="number" step="0.01" required={!isWatchlist} value={purchasePrice} onChange={(e) => setPurchasePrice(e.target.value)} className="form-input font-mono" placeholder="0.00" />
                    </div>

                    {!isWatchlist && (
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-slate-400">Date of Purchase</label>
                        <input type="date" required value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} className="form-input" />
                      </div>
                    )}

                    {!isWatchlist && (
                      <div className="space-y-1 col-span-2">
                        <label className="text-xs font-medium text-slate-400">Acquisition Source</label>
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
                      <div className="space-y-1 col-span-2">
                        <label className="text-xs font-medium text-slate-400">Specify Other Source</label>
                        <input
                          type="text"
                          value={acquisitionSourceOther}
                          onChange={(e) => setAcquisitionSourceOther(e.target.value)}
                          className="form-input"
                          placeholder="Enter source name"
                        />
                      </div>
                    )}

                    <div className="space-y-1 col-span-2">
                      <label className="text-xs font-medium text-slate-400">Current Market Value ({currency})</label>
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
                      <p className="text-[10px] text-slate-500">
                        {isWatchlist ? 'Used to calculate distance to target.' : 'Update this later from the dashboard.'}
                      </p>
                    </div>
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
