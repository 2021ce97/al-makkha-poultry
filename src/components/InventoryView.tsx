import React, { useState } from 'react';
import { useDatabase } from '../context/DatabaseContext';
import { 
  Plus, 
  Search, 
  Wheat, 
  Trash2, 
  AlertTriangle, 
  DollarSign, 
  Scale, 
  Truck, 
  Sparkles,
  X
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
    setErrorMsg('');

    if (!itemName.trim() || stockKg === '' || unitPrice === '') {
      setErrorMsg(t.invalidCredentials || 'Please fill in all required fields');
      return;
    }

    const numericStock = Number(stockKg);
    const numericPrice = Number(unitPrice);
    const numericPaid = paidAmount === '' ? numericStock * numericPrice : Number(paidAmount);
    const numericThreshold = threshold === '' ? undefined : Number(threshold);

    addRawMaterial({
      name: itemName.trim(),
      category,
      stockKg: numericStock,
      unitPrice: numericPrice,
      supplierName: supplierName.trim() || undefined,
      notes: notes.trim() || undefined,
      lowStockThreshold: numericThreshold,
    }, numericPaid, supplierPhone.trim() || undefined);

    // Reset form
    setItemName('');
    setCategory('Grains');
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-100 text-amber-700">
              <Wheat className="w-5 h-5" />
            </div>
            <span>{t.inventoryTitle}</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            {t.inventoryDesc}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-amber-600/25 transition-all cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>{t.addRawMaterial}</span>
          </button>
        </div>
      </div>

      {/* Overview Stat Banners (Light Theme) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500">{t.rawStockCard}</span>
            <div className="text-xl font-bold font-mono text-slate-900 mt-1">
              {totalWarehouseKg.toLocaleString()} {t.kilo}
            </div>
            <span className="text-xs text-amber-700 font-mono font-medium">
              {(totalWarehouseKg / 1000).toFixed(1)} {t.ton}
            </span>
          </div>
          <div className="p-3 bg-amber-100 text-amber-700 rounded-xl border border-amber-200">
            <Scale className="w-6 h-6" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500">{t.totalValue}</span>
            <div className="text-xl font-bold font-mono text-emerald-700 mt-1">
              {totalWarehouseValue.toLocaleString()} {t.currency}
            </div>
            <span className="text-xs text-slate-500">{t.activeFactory}</span>
          </div>
          <div className="p-3 bg-emerald-100 text-emerald-700 rounded-xl border border-emerald-200">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500">{t.lowStockNotificationTitle}</span>
            <div className="text-xl font-bold font-mono text-rose-700 mt-1">
              {lowStockCount} {t.itemsCount}
            </div>
            <span className="text-xs text-slate-500">
              {t.thresholdLimitLabel}: {lowStockThreshold.toLocaleString()} {t.kilo}
            </span>
          </div>
          <div className={`p-3 rounded-xl border ${lowStockCount > 0 ? 'bg-rose-100 text-rose-700 border-rose-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* SEARCH BAR & CATEGORY FILTER */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
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
            className="w-full ps-10 pe-4 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-600 transition-colors shadow-2xs"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute inset-y-0 end-0 pe-3 flex items-center text-slate-400 hover:text-slate-700"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Category Pills Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
          <span className="text-xs font-semibold text-slate-500 me-1 shrink-0 hidden sm:inline">
            {t.categoryFilter}
          </span>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all whitespace-nowrap shrink-0 ${
                selectedCategory === cat
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-slate-50 text-slate-600 border border-slate-200 hover:text-slate-900 hover:bg-slate-100'
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
              className={`p-5 rounded-2xl border transition-all duration-200 flex flex-col justify-between relative shadow-sm ${
                isLowStock 
                  ? 'bg-rose-50/50 border-rose-300 hover:border-rose-400' 
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 leading-tight">
                      {getLocalizedName(item.name)}
                    </h3>
                    <span className="inline-block mt-1 text-[11px] px-2.5 py-0.5 rounded-lg bg-slate-100 border border-slate-200 text-amber-700 font-medium">
                      {getLocalizedCat(item.category)}
                    </span>
                  </div>
                  {isLowStock ? (
                    <span className="flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-lg bg-rose-100 text-rose-700 border border-rose-200 animate-pulse shrink-0">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>{t.statusLow}</span>
                    </span>
                  ) : (
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                      {t.statusNormal}
                    </span>
                  )}
                </div>

                {/* Stock Details */}
                <div className="mt-4 grid grid-cols-2 gap-3 py-3 border-y border-slate-100 bg-slate-50/70 rounded-xl px-3.5">
                  <div>
                    <span className="text-[11px] text-slate-500 block">{t.stockInKilo}</span>
                    <span className={`text-base font-bold font-mono ${isLowStock ? 'text-rose-700' : 'text-slate-900'}`}>
                      {item.stockKg.toLocaleString()} {t.kilo}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 block">{t.unitPriceKilo}</span>
                    <span className="text-base font-bold text-amber-700 font-mono">
                      {item.unitPrice.toLocaleString()} {t.currency}
                    </span>
                  </div>
                  <div className="col-span-2 pt-2 border-t border-slate-200/60 flex items-center justify-between">
                    <span className="text-[11px] text-slate-500">{t.totalValue}:</span>
                    <span className="text-sm font-bold text-emerald-700 font-mono">
                      {totalVal.toLocaleString()} {t.currency}
                    </span>
                  </div>
                  {item.lowStockThreshold !== undefined && (
                    <div className="col-span-2 mt-1 flex items-center justify-between text-[10px]">
                      <span className="text-slate-500">حد هشدار سفارشی:</span>
                      <span className="text-rose-700 font-mono">{item.lowStockThreshold.toLocaleString()} {t.kilo}</span>
                    </div>
                  )}
                </div>

                {/* Supplier Info */}
                {item.supplierName && (
                  <div className="mt-3 flex items-center gap-2 text-xs text-slate-700">
                    <Truck className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span className="text-slate-500">{t.supplier}:</span>
                    <span className="font-semibold text-slate-900 truncate">{item.supplierName}</span>
                  </div>
                )}

                {item.notes && (
                  <p className="text-[11px] text-slate-600 mt-2 bg-slate-50 p-2 rounded-lg border border-slate-200">
                    {item.notes}
                  </p>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>{item.dateAdded}</span>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(t.confirmDelete)) {
                      deleteRawMaterial(item.id);
                    }
                  }}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  title={t.delete}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}

        {filteredItems.length === 0 && (
          <div className="col-span-full p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-sm">
            <Wheat className="w-10 h-10 text-slate-400 mx-auto mb-3" />
            <p className="text-sm text-slate-600 font-medium">
              {t.showingResults} 0 {t.records}
            </p>
            {(searchTerm || selectedCategory !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('all');
                }}
                className="mt-3 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-amber-700 text-xs font-semibold"
              >
                {t.clearFilters}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Add Raw Material Modal (Light Theme) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 relative max-h-[92vh] overflow-y-auto text-slate-900">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-100 text-amber-700">
                  <Wheat className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-900">{t.addRawMaterial}</h3>
                  <p className="text-xs text-slate-500">{t.inventoryDesc}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Fill presets */}
            <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-xs font-semibold text-slate-600 flex items-center gap-1 mb-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>اقلام پرمصرف کارخانه (انتخاب سریع):</span>
              </span>
              <div className="flex flex-wrap gap-1.5">
                {quickPresets.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleQuickFill(preset)}
                    className="text-xs px-2.5 py-1 bg-white hover:bg-amber-600 hover:text-white text-slate-700 rounded-lg border border-slate-300 transition-colors shadow-2xs"
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>

            {errorMsg && (
              <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t.materialName} *
                  </label>
                  <input
                    type="text"
                    required
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                    placeholder="مثال: جواری دانه زرد"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-amber-600 shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t.category}
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-amber-600 shadow-2xs"
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
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
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
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 font-mono focus:outline-none focus:border-amber-600 shadow-2xs"
                  />
                  {Number(stockKg) > 0 && (
                    <span className="text-[11px] text-slate-500 mt-1 block font-medium">
                      = {(Number(stockKg) / 1000).toFixed(2)} {t.ton} ({Math.round(Number(stockKg) / 50)} {t.bag})
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
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
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 font-mono focus:outline-none focus:border-amber-600 shadow-2xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    حد هشدار سفارشی (کیلو) - اختیاری
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={threshold}
                    onChange={(e) => setThreshold(e.target.value ? Number(e.target.value) : '')}
                    placeholder={`پیش‌فرض: ${lowStockThreshold}`}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 font-mono focus:outline-none focus:border-amber-600 shadow-2xs"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    موجودی کمتر از این مقدار باعث نمایش وضعیت "کمبود" می‌شود.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t.supplier} (اختیاری)
                  </label>
                  <input
                    type="text"
                    value={supplierName}
                    onChange={(e) => handleSelectExistingSupplier(e.target.value)}
                    placeholder="نام تامین‌کننده"
                    list="suppliers-list"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-amber-600 shadow-2xs"
                  />
                  <datalist id="suppliers-list">
                    {db.suppliers.map(s => (
                      <option key={s.id} value={s.name} />
                    ))}
                  </datalist>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    شماره تماس تامین‌کننده
                  </label>
                  <input
                    type="text"
                    value={supplierPhone}
                    onChange={(e) => setSupplierPhone(e.target.value)}
                    placeholder="0700xxxxxx"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 font-mono focus:outline-none focus:border-amber-600 shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    مبلغ پرداخت شده ({t.currency})
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(e.target.value ? Number(e.target.value) : '')}
                    placeholder="پیش‌فرض: پرداخت کامل"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 font-mono focus:outline-none focus:border-amber-600 shadow-2xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  توضیحات / یادداشت
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="جزئیات بار..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-amber-600 shadow-2xs"
                />
              </div>

              {/* Total Calculation Banner */}
              <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-600 block">{t.totalBill}: <strong className="font-mono text-slate-900">{totalBillCalculated.toLocaleString()} {t.currency}</strong></span>
                  <span className="text-xs text-rose-700 block mt-0.5">مانده قرض: <strong className="font-mono">{remainingCalculated.toLocaleString()} {t.currency}</strong></span>
                </div>
                <div className="text-end">
                  <span className="text-[10px] text-slate-500 block">ارزش کل انبار</span>
                  <span className="text-base font-bold text-amber-700 font-mono">
                    {totalBillCalculated.toLocaleString()} {t.currency}
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md shadow-amber-600/25"
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
