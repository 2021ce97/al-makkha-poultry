import React, { useState } from 'react';
import { useDatabase } from '../context/DatabaseContext';
import { 
  Plus, 
  Search, 
  Wheat, 
  Trash2, 
  AlertTriangle, 
  Tag, 
  DollarSign, 
  Scale, 
  Truck, 
  Sparkles,
  Info,
  X,
  SlidersHorizontal,
  CheckCircle2
} from 'lucide-react';

export const InventoryView: React.FC = () => {
  const { 
    db, 
    t, 
    lang, 
    addRawMaterial, 
    deleteRawMaterial, 
    lowStockThreshold,
    getLocalizedName,
    getLocalizedCat
  } = useDatabase();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [itemName, setItemName] = useState('');
  const [category, setCategory] = useState('Grains');
  const [stockKg, setStockKg] = useState<number | ''>('');
  const [unitPrice, setUnitPrice] = useState<number | ''>('');
  const [supplierName, setSupplierName] = useState('');
  const [supplierPhone, setSupplierPhone] = useState('');
  const [paidAmount, setPaidAmount] = useState<number | ''>('');
  const [notes, setNotes] = useState('');
  const [threshold, setThreshold] = useState<number | ''>('');
  const [errorMsg, setErrorMsg] = useState('');

  // Localized presets for quick-fill
  const quickPresets = [
    { 
      name: lang === 'fa' ? 'جواری دانه زرد' : lang === 'ps' ? 'ژېړ جوار' : 'Yellow Corn (Maize)', 
      cat: 'Grains', 
      price: 24 
    },
    { 
      name: lang === 'fa' ? 'کنجاره سویا (پروتین ۴۶٪)' : lang === 'ps' ? 'د سویا کنجاړه (۴۶٪)' : 'Soybean Meal (46%)', 
      cat: 'Protein', 
      price: 48 
    },
    { 
      name: lang === 'fa' ? 'کنجاره پنبه دانه' : lang === 'ps' ? 'د پنبې دانې کنجاړه' : 'Cottonseed Oil Cake', 
      cat: 'Protein', 
      price: 32 
    },
    { 
      name: lang === 'fa' ? 'تیل دیزل جنراتور و موتر' : lang === 'ps' ? 'ډیزل تېل او روغنیات' : 'Diesel Fuel & Oil', 
      cat: 'Fuel', 
      price: 65 
    },
    { 
      name: lang === 'fa' ? 'سبوس گندم' : lang === 'ps' ? 'د غنمو بوش (سبوس)' : 'Wheat Bran', 
      cat: 'Fiber', 
      price: 18 
    },
    { 
      name: lang === 'fa' ? 'پری‌میکس و ویتامین مرغداری' : lang === 'ps' ? 'ویټامینونه او پری‌میکس' : 'Poultry Premix & Vitamins', 
      cat: 'Supplements', 
      price: 120 
    },
  ];

  const handleQuickFill = (preset: typeof quickPresets[0]) => {
    setItemName(preset.name);
    setCategory(preset.cat);
    setUnitPrice(preset.price);
  };

  const handleSelectExistingSupplier = (supName: string) => {
    setSupplierName(supName);
    const existing = db.suppliers.find(s => s.name === supName);
    if (existing && existing.phone) {
      setSupplierPhone(existing.phone);
    }
  };

  const totalBillCalculated = (Number(stockKg) || 0) * (Number(unitPrice) || 0);
  const remainingCalculated = Math.max(0, totalBillCalculated - (Number(paidAmount) || 0));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName.trim()) {
      setErrorMsg(t.materialName);
      return;
    }
    if (!stockKg || Number(stockKg) <= 0) {
      setErrorMsg(t.stockInKilo);
      return;
    }
    if (!unitPrice || Number(unitPrice) < 0) {
      setErrorMsg(t.unitPriceKilo);
      return;
    }

    addRawMaterial(
      {
        name: itemName.trim(),
        category,
        stockKg: Number(stockKg),
        unitPrice: Number(unitPrice),
        supplierName: supplierName.trim() || undefined,
        notes: notes.trim() || undefined,
        lowStockThreshold: threshold !== '' ? Number(threshold) : undefined,
      },
      Number(paidAmount) || 0,
      supplierPhone.trim() || undefined
    );

    // Reset and close
    setItemName('');
    setStockKg('');
    setUnitPrice('');
    setThreshold('');
    setSupplierName('');
    setSupplierPhone('');
    setPaidAmount('');
    setNotes('');
    setErrorMsg('');
    setIsModalOpen(false);
  };

  // Filtered raw materials with search and category filter
  const filteredItems = db.rawMaterials.filter(item => {
    const localizedName = getLocalizedName(item.name).toLowerCase();
    const rawName = item.name.toLowerCase();
    const search = searchTerm.toLowerCase();
    const matchesSearch = 
      localizedName.includes(search) ||
      rawName.includes(search) ||
      (item.supplierName && item.supplierName.toLowerCase().includes(search)) ||
      (item.category && getLocalizedCat(item.category).toLowerCase().includes(search));
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const totalWarehouseKg = db.rawMaterials.reduce((acc, i) => acc + i.stockKg, 0);
  const totalWarehouseValue = db.rawMaterials.reduce((acc, i) => acc + (i.stockKg * i.unitPrice), 0);
  const lowStockCount = db.rawMaterials.filter(i => i.stockKg <= (i.lowStockThreshold ?? lowStockThreshold)).length;

  const categories = ['all', 'Grains', 'Protein', 'Fuel', 'Fiber', 'Supplements'];

  return (
    <div className="space-y-6">
      {/* Header with Title and Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
              <Wheat className="w-5 h-5" />
            </div>
            <span>{t.inventoryTitle}</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            {t.inventoryDesc}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-amber-500/20 transition-all cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>{t.addRawMaterial}</span>
          </button>
        </div>
      </div>

      {/* Overview Stat Banners (Dark Theme) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400">{t.rawStockCard}</span>
            <div className="text-xl font-bold font-mono text-white mt-1">
              {totalWarehouseKg.toLocaleString()} {t.kilo}
            </div>
            <span className="text-xs text-amber-400 font-mono">
              {(totalWarehouseKg / 1000).toFixed(1)} {t.ton}
            </span>
          </div>
          <div className="p-3 bg-amber-500/15 text-amber-400 rounded-xl border border-amber-500/20">
            <Scale className="w-6 h-6" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400">{t.totalValue}</span>
            <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
              {totalWarehouseValue.toLocaleString()} {t.currency}
            </div>
            <span className="text-xs text-slate-400">{t.activeFactory}</span>
          </div>
          <div className="p-3 bg-emerald-500/15 text-emerald-400 rounded-xl border border-emerald-500/20">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400">{t.lowStockNotificationTitle}</span>
            <div className="text-xl font-bold font-mono text-rose-400 mt-1">
              {lowStockCount} {t.itemsCount}
            </div>
            <span className="text-xs text-slate-400">
              {t.thresholdLimitLabel}: {lowStockThreshold.toLocaleString()} {t.kilo}
            </span>
          </div>
          <div className={`p-3 rounded-xl border ${lowStockCount > 0 ? 'bg-rose-500/15 text-rose-400 border-rose-500/30' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* SEARCH BAR & CATEGORY FILTER */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search input */}
        <div className="relative w-full md:w-96">
          <div className="absolute inset-y-0 start-0 flex items-center ps-3.5 pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder={t.searchPlaceholderInventory}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full ps-10 pe-4 py-2.5 text-xs sm:text-sm bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute inset-y-0 end-0 pe-3 flex items-center text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Category Pills Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
          <span className="text-xs font-semibold text-slate-400 me-1 shrink-0 hidden sm:inline">
            {t.categoryFilter}
          </span>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all whitespace-nowrap shrink-0 ${
                selectedCategory === cat
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/15'
                  : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white hover:bg-slate-800'
              }`}
            >
              {cat === 'all' ? t.allCategories : getLocalizedCat(cat)}
            </button>
          ))}
        </div>
      </div>

      {/* Rectangular Table Cards for each Raw Material */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.map((item) => {
          const itemThreshold = item.lowStockThreshold ?? lowStockThreshold;
          const isLowStock = item.stockKg <= itemThreshold;
          const totalVal = item.stockKg * item.unitPrice;
          return (
            <div
              key={item.id}
              className={`p-5 rounded-2xl border transition-all duration-200 flex flex-col justify-between relative shadow-lg ${
                isLowStock 
                  ? 'bg-gradient-to-b from-rose-950/30 to-slate-900 border-rose-500/40 hover:border-rose-500' 
                  : 'bg-slate-900 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h3 className="text-base font-bold text-white leading-tight">
                      {getLocalizedName(item.name)}
                    </h3>
                    <span className="inline-block mt-1 text-[11px] px-2.5 py-0.5 rounded-lg bg-slate-800 border border-slate-700 text-amber-400 font-medium">
                      {getLocalizedCat(item.category)}
                    </span>
                  </div>
                  {isLowStock ? (
                    <span className="flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse shrink-0">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>{t.statusLow}</span>
                    </span>
                  ) : (
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-800 text-slate-400">
                      {t.statusNormal}
                    </span>
                  )}
                </div>

                {/* Stock Details */}
                <div className="mt-4 grid grid-cols-2 gap-3 py-3 border-y border-slate-800 bg-slate-950/60 rounded-xl px-3.5">
                  <div>
                    <span className="text-[11px] text-slate-400 block">{t.stockInKilo}</span>
                    <span className={`text-base font-bold font-mono ${isLowStock ? 'text-rose-400' : 'text-white'}`}>
                      {item.stockKg.toLocaleString()} {t.kilo}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block">{t.unitPriceKilo}</span>
                    <span className="text-base font-bold text-amber-400 font-mono">
                      {item.unitPrice.toLocaleString()} {t.currency}
                    </span>
                  </div>
                  <div className="col-span-2 pt-2 border-t border-slate-800/80 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">{t.totalValue}:</span>
                    <span className="text-sm font-bold text-emerald-400 font-mono">
                      {totalVal.toLocaleString()} {t.currency}
                    </span>
                  </div>
                  {item.lowStockThreshold !== undefined && (
                    <div className="col-span-2 mt-1 flex items-center justify-between text-[10px]">
                      <span className="text-slate-500">حد هشدار سفارشی:</span>
                      <span className="text-rose-400 font-mono">{item.lowStockThreshold.toLocaleString()} {t.kilo}</span>
                    </div>
                  )}
                </div>

                {/* Supplier Info */}
                {item.supplierName && (
                  <div className="mt-3 flex items-center gap-2 text-xs text-slate-300">
                    <Truck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="text-slate-400">{t.supplier}:</span>
                    <span className="font-semibold text-slate-200 truncate">{item.supplierName}</span>
                  </div>
                )}

                {item.notes && (
                  <p className="text-[11px] text-slate-400 mt-2 bg-slate-950/50 p-2 rounded-lg border border-slate-800/60">
                    {item.notes}
                  </p>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
                <span>{item.dateAdded}</span>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(t.confirmDelete)) {
                      deleteRawMaterial(item.id);
                    }
                  }}
                  className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                  title={t.delete}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}

        {filteredItems.length === 0 && (
          <div className="col-span-full p-12 text-center bg-slate-900 rounded-2xl border border-slate-800">
            <Wheat className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-slate-400">
              {t.showingResults} 0 {t.records}
            </p>
            {(searchTerm || selectedCategory !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('all');
                }}
                className="mt-3 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-semibold"
              >
                {t.clearFilters}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Add Raw Material Modal (Dark Theme) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 relative max-h-[92vh] overflow-y-auto text-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400">
                  <Wheat className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-white">{t.addRawMaterial}</h3>
                  <p className="text-xs text-slate-400">{t.inventoryDesc}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Fill presets */}
            <div className="mt-4 p-3 bg-slate-950/70 rounded-xl border border-slate-800">
              <span className="text-xs font-semibold text-slate-400 flex items-center gap-1 mb-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>اقلام پرمصرف کارخانه (انتخاب سریع):</span>
              </span>
              <div className="flex flex-wrap gap-1.5">
                {quickPresets.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleQuickFill(preset)}
                    className="text-xs px-2.5 py-1 bg-slate-900 hover:bg-amber-500 hover:text-slate-950 text-slate-300 rounded-lg border border-slate-800 transition-colors"
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>

            {errorMsg && (
              <div className="mt-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {t.materialName} *
                  </label>
                  <input
                    type="text"
                    required
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                    placeholder="مثال: جواری دانه زرد"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {t.category}
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="Grains">{getLocalizedCat('Grains')}</option>
                    <option value="Protein">{getLocalizedCat('Protein')}</option>
                    <option value="Fuel">{getLocalizedCat('Fuel')}</option>
                    <option value="Fiber">{getLocalizedCat('Fiber')}</option>
                    <option value="Supplements">{getLocalizedCat('Supplements')}</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {t.stockInKilo} *
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    required
                    value={stockKg}
                    onChange={(e) => setStockKg(e.target.value ? Number(e.target.value) : '')}
                    placeholder="5000"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                  {Number(stockKg) > 0 && (
                    <span className="text-[11px] text-slate-400 mt-1 block">
                      = {(Number(stockKg) / 1000).toFixed(2)} {t.ton} ({Math.round(Number(stockKg) / 50)} {t.bag})
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {t.unitPriceKilo} ({t.currency}) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    required
                    value={unitPrice}
                    onChange={(e) => setUnitPrice(e.target.value ? Number(e.target.value) : '')}
                    placeholder="25"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    حد هشدار سفارشی (کیلو) - اختیاری
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={threshold}
                    onChange={(e) => setThreshold(e.target.value ? Number(e.target.value) : '')}
                    placeholder={`پیش‌فرض: ${lowStockThreshold}`}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    موجودی کمتر از این مقدار باعث نمایش وضعیت "کمبود" می‌شود.
                  </p>
                </div>
              </div>

              {/* Total Calculation Banner */}
              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-400">{t.totalValue}:</span>
                <span className="text-base font-bold text-amber-400 font-mono">
                  {totalBillCalculated.toLocaleString()} {t.currency}
                </span>
              </div>

              {/* Supplier Details */}
              <div className="border-t border-slate-800 pt-4 space-y-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  اطلاعات عرضه کننده و پرداخت حساب
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      {t.supplier}
                    </label>
                    <input
                      type="text"
                      value={supplierName}
                      onChange={(e) => setSupplierName(e.target.value)}
                      placeholder="نام تاجر یا شرکت عرضه کننده"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                    />
                    {db.suppliers.length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        <span className="text-[10px] text-slate-500">انتخاب قبلی:</span>
                        {db.suppliers.slice(0, 3).map(s => (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => handleSelectExistingSupplier(s.name)}
                            className="text-[10px] text-amber-400 underline hover:text-amber-300"
                          >
                            {s.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      {t.phone}
                    </label>
                    <input
                      type="text"
                      value={supplierPhone}
                      onChange={(e) => setSupplierPhone(e.target.value)}
                      placeholder="07xxxxxxxx"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      {t.paidToSupplier} ({t.currency})
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={paidAmount}
                      onChange={(e) => setPaidAmount(e.target.value ? Number(e.target.value) : '')}
                      placeholder="مبلغ نقد پرداختی"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      {t.remainingSupplierBill} ({t.currency})
                    </label>
                    <div className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-sm font-bold font-mono text-rose-400">
                      {remainingCalculated.toLocaleString()} {t.currency}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    یادداشت / مشخصات کیفیت جنس
                  </label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="درجه یک، فیصدی رطوبت، پروتین..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-bold shadow-lg shadow-amber-500/20"
                >
                  {t.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
