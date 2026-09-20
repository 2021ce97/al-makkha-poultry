import React, { useState } from 'react';
import { useDatabase } from '../context/DatabaseContext';
import { UnitType, Sale } from '../types';
import { 
  TrendingUp, 
  Plus, 
  Search, 
  Printer, 
  Users, 
  PackageCheck, 
  DollarSign, 
  Scale, 
  AlertCircle, 
  CheckCircle2, 
  Receipt,
  FileText,
  Eye,
  EyeOff,
  X,
  SlidersHorizontal,
  Phone,
  Calendar
} from 'lucide-react';

export const SalesView: React.FC = () => {
  const { db, t, lang, recordSale, getLocalizedName } = useDatabase();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProductFilter, setSelectedProductFilter] = useState('all');
  const [selectedPaymentFilter, setSelectedPaymentFilter] = useState<'all' | 'paid' | 'unpaid'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showCostRate, setShowCostRate] = useState(true); // "small option to see the cost rate per kilo"
  const [selectedInvoice, setSelectedInvoice] = useState<Sale | null>(null);

  // Form State
  const [productId, setProductId] = useState(db.processedStock[0]?.id || '');
  const [customProductName, setCustomProductName] = useState('');
  const [isCustomProduct, setIsCustomProduct] = useState(false);

  const [customerId, setCustomerId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  const [unitType, setUnitType] = useState<UnitType>('bag');
  const [unitQuantity, setUnitQuantity] = useState<number | ''>(50);
  const [salePricePerUnit, setSalePricePerUnit] = useState<number | ''>(4500); // 4500 per bag
  const [paidAmount, setPaidAmount] = useState<number | ''>(200000);
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Selected Product details
  const selectedProduct = db.processedStock.find(p => p.id === productId);
  const costRatePerKg = selectedProduct ? selectedProduct.averageCostPerKg : 30;

  // Quantity in kg calculation
  const getKg = (unit: UnitType, qty: number): number => {
    if (unit === 'bag') return qty * 50;
    if (unit === 'ton') return qty * 1000;
    return qty;
  };

  const qtyNumber = Number(unitQuantity) || 0;
  const priceNumber = Number(salePricePerUnit) || 0;
  const paidNumber = Number(paidAmount) || 0;

  const totalQuantityKg = getKg(unitType, qtyNumber);
  const totalInvoiceAmount = qtyNumber * priceNumber;
  const remainingDebt = Math.max(0, totalInvoiceAmount - paidNumber);
  const totalCostOfGoods = costRatePerKg * totalQuantityKg;
  const estimatedProfit = totalInvoiceAmount - totalCostOfGoods;

  // Handle selecting existing customer
  const handleSelectCustomer = (selectedId: string) => {
    setCustomerId(selectedId);
    if (selectedId) {
      const existing = db.customers.find(c => c.id === selectedId);
      if (existing) {
        setCustomerName(existing.name);
        setCustomerPhone(existing.phone || '');
      }
    } else {
      setCustomerName('');
      setCustomerPhone('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const finalProductName = isCustomProduct ? customProductName.trim() : (selectedProduct?.name || '');

    if (!finalProductName) {
      setErrorMsg(t.selectProduct);
      return;
    }
    if (!customerName.trim()) {
      setErrorMsg(t.customerName);
      return;
    }
    if (qtyNumber <= 0) {
      setErrorMsg(t.quantity);
      return;
    }
    if (priceNumber <= 0) {
      setErrorMsg(t.salePrice);
      return;
    }

    const res = recordSale({
      productId: isCustomProduct ? 'custom' : (selectedProduct?.id || ''),
      productName: finalProductName,
      customerId: customerId || undefined,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      unitType,
      unitQuantity: qtyNumber,
      salePricePerUnit: priceNumber,
      paidAmount: paidNumber,
      notes: notes.trim() || undefined,
    });

    if (!res.success) {
      setErrorMsg(res.error || t.insufficientStockError);
      return;
    }

    // Reset and close
    setCustomerName('');
    setCustomerPhone('');
    setCustomerId('');
    setCustomProductName('');
    setIsCustomProduct(false);
    setUnitQuantity(50);
    setPaidAmount('');
    setNotes('');
    setIsModalOpen(false);
  };

  // Filtered sales by search, product, and payment status
  const filteredSales = db.sales.filter(s => {
    const search = searchTerm.toLowerCase();
    const matchesSearch =
      s.customerName.toLowerCase().includes(search) ||
      s.productName.toLowerCase().includes(search) ||
      (s.customerPhone && s.customerPhone.includes(search)) ||
      s.id.toLowerCase().includes(search);

    const matchesProduct =
      selectedProductFilter === 'all' || s.productName === selectedProductFilter;

    const matchesPayment =
      selectedPaymentFilter === 'all' ||
      (selectedPaymentFilter === 'paid' && s.remainingAmount <= 0) ||
      (selectedPaymentFilter === 'unpaid' && s.remainingAmount > 0);

    return matchesSearch && matchesProduct && matchesPayment;
  });

  const totalSalesRevenue = db.sales.reduce((acc, s) => acc + s.totalAmount, 0);
  const totalSalesCashCollected = db.sales.reduce((acc, s) => acc + s.paidAmount, 0);
  const totalSalesRemainingDebt = db.sales.reduce((acc, s) => acc + s.remainingAmount, 0);

  // Available unique products for filter
  const uniqueProducts = Array.from(new Set(db.sales.map(s => s.productName)));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400">
              <TrendingUp className="w-5 h-5" />
            </div>
            <span>{t.salesTitle}</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            {t.salesDesc}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-emerald-500/20 transition-all cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>{t.newSaleBtn}</span>
          </button>
        </div>
      </div>

      {/* Financial Banners (Dark Theme) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400">{t.totalSaleAmount}</span>
            <div className="text-xl font-bold font-mono text-cyan-400 mt-1">
              {totalSalesRevenue.toLocaleString()} {t.currency}
            </div>
            <span className="text-xs text-slate-400">{db.sales.length} {t.records}</span>
          </div>
          <div className="p-3 bg-cyan-500/15 text-cyan-400 rounded-xl border border-cyan-500/20">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400">{t.paidAmount}</span>
            <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
              {totalSalesCashCollected.toLocaleString()} {t.currency}
            </div>
            <span className="text-xs text-slate-400">{t.moneyInHandCard}</span>
          </div>
          <div className="p-3 bg-emerald-500/15 text-emerald-400 rounded-xl border border-emerald-500/20">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-rose-500/30 bg-rose-950/20 shadow-lg flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-rose-300">{t.remainingDebt}</span>
            <div className="text-xl font-bold font-mono text-rose-400 mt-1">
              {totalSalesRemainingDebt.toLocaleString()} {t.currency}
            </div>
            <span className="text-xs text-rose-300 font-medium">{t.receivableCustomersCard}</span>
          </div>
          <div className="p-3 bg-rose-500/15 text-rose-400 rounded-xl border border-rose-500/30">
            <AlertCircle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* SEARCH BAR & FILTERS ROW */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg flex flex-col lg:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative w-full lg:w-96">
          <div className="absolute inset-y-0 start-0 flex items-center ps-3.5 pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder={t.searchPlaceholderSales}
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

        {/* Product Filter & Payment Status Filter */}
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          {/* Product Filter Dropdown */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-400 hidden sm:inline">{t.categoryFilter}</span>
            <select
              value={selectedProductFilter}
              onChange={(e) => setSelectedProductFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
            >
              <option value="all">{t.allProducts}</option>
              {uniqueProducts.map(p => (
                <option key={p} value={p}>{getLocalizedName(p)}</option>
              ))}
            </select>
          </div>

          {/* Payment Status Buttons */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
            {(['all', 'paid', 'unpaid'] as const).map(status => (
              <button
                key={status}
                type="button"
                onClick={() => setSelectedPaymentFilter(status)}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                  selectedPaymentFilter === status
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {status === 'all' ? t.allPayments : status === 'paid' ? t.statusPaid : t.statusUnpaid}
              </button>
            ))}
          </div>

          {/* Cost Rate Toggle */}
          <button
            type="button"
            onClick={() => setShowCostRate(!showCostRate)}
            className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-medium text-slate-400 hover:text-amber-400 flex items-center gap-1.5"
            title="نمایش نرخ تمام شد و حاشیه سود"
          >
            {showCostRate ? <Eye className="w-3.5 h-3.5 text-amber-400" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{t.costRateNotice}</span>
          </button>
        </div>
      </div>

      {/* Sales Transactions Table (Dark Theme) */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white">
            {t.salesHistory} ({filteredSales.length} {t.records})
          </h3>
          {(searchTerm || selectedProductFilter !== 'all' || selectedPaymentFilter !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setSelectedProductFilter('all');
                setSelectedPaymentFilter('all');
              }}
              className="text-xs text-amber-400 hover:underline font-semibold"
            >
              {t.clearFilters}
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-slate-400 text-[11px] font-semibold uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-4 py-3 text-start">{t.date}</th>
                <th className="px-4 py-3 text-start">{t.customerName}</th>
                <th className="px-4 py-3 text-start">{t.selectProduct}</th>
                <th className="px-4 py-3 text-start">{t.quantity}</th>
                <th className="px-4 py-3 text-start">{t.totalSaleAmount}</th>
                <th className="px-4 py-3 text-start">{t.paidAmount}</th>
                <th className="px-4 py-3 text-start">{t.remainingDebt}</th>
                {showCostRate && (
                  <th className="px-4 py-3 text-start text-amber-400">{t.expectedProfitNotice}</th>
                )}
                <th className="px-4 py-3 text-end">{t.action}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredSales.map((sale) => {
                const isPaidFull = sale.remainingAmount <= 0;
                return (
                  <tr key={sale.id} className="hover:bg-slate-850/50 transition-colors">
                    <td className="px-4 py-3.5 whitespace-nowrap text-slate-400 font-mono">
                      {sale.date}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="font-bold text-white">{sale.customerName}</div>
                      {sale.customerPhone && (
                        <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          <span>{sale.customerPhone}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap font-medium text-slate-200">
                      {getLocalizedName(sale.productName)}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap font-mono">
                      <strong className="text-white">{sale.unitQuantity}</strong> {t[sale.unitType] || sale.unitType}
                      <span className="text-slate-500 block text-[10px]">
                        ({sale.quantityKg.toLocaleString()} {t.kilo})
                      </span>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap font-mono font-bold text-cyan-400">
                      {sale.totalAmount.toLocaleString()} {t.currency}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap font-mono font-semibold text-emerald-400">
                      {sale.paidAmount.toLocaleString()} {t.currency}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap font-mono">
                      {isPaidFull ? (
                        <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                          <CheckCircle2 className="w-3 h-3" />
                          {t.statusPaid}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-rose-500/15 text-rose-400 font-bold border border-rose-500/30">
                          <AlertCircle className="w-3 h-3" />
                          {sale.remainingAmount.toLocaleString()} {t.currency}
                        </span>
                      )}
                    </td>
                    {showCostRate && (
                      <td className="px-4 py-3.5 whitespace-nowrap font-mono">
                        <span className="text-emerald-400 font-bold">
                          +{sale.profit.toLocaleString()} {t.currency}
                        </span>
                        <span className="text-slate-500 block text-[10px]">
                          نرخ: {sale.costRatePerKg} /kg
                        </span>
                      </td>
                    )}
                    <td className="px-4 py-3.5 whitespace-nowrap text-end">
                      <button
                        type="button"
                        onClick={() => setSelectedInvoice(sale)}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>بل / فاکتور</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredSales.length === 0 && (
          <div className="p-12 text-center text-slate-500">
            <TrendingUp className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-sm text-slate-400">{t.showingResults} 0 {t.records}</p>
          </div>
        )}
      </div>

      {/* New Sale Modal (Dark Theme) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 relative max-h-[92vh] overflow-y-auto text-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-white">{t.newSaleBtn}</h3>
                  <p className="text-xs text-slate-400">{t.salesDesc}</p>
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

            {errorMsg && (
              <div className="mt-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              {/* Product Selection */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-300">
                    {t.selectProduct} *
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsCustomProduct(!isCustomProduct)}
                    className="text-xs text-amber-400 hover:underline"
                  >
                    {isCustomProduct ? 'انتخاب از لیست گدام' : 'نوشتن نام دلخواه دانه'}
                  </button>
                </div>

                {!isCustomProduct ? (
                  <select
                    value={productId}
                    onChange={(e) => setProductId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                  >
                    {db.processedStock.map(p => (
                      <option key={p.id} value={p.id}>
                        {getLocalizedName(p.name)} - موجودی: {p.stockKg.toLocaleString()} kg ({Math.round(p.stockKg/50)} بوجی)
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    required
                    value={customProductName}
                    onChange={(e) => setCustomProductName(e.target.value)}
                    placeholder="نام دانه سفارشی..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                )}
              </div>

              {/* Customer details */}
              <div className="border-t border-slate-800 pt-3 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    اطلاعات مشتری (مرغداری / خریدار)
                  </span>
                  {db.customers.length > 0 && (
                    <select
                      value={customerId}
                      onChange={(e) => handleSelectCustomer(e.target.value)}
                      className="bg-slate-950 border border-slate-800 text-xs text-amber-400 rounded-lg px-2.5 py-1 focus:outline-none"
                    >
                      <option value="">{t.existingCustomerSelect}</option>
                      {db.customers.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name} {c.phone ? `(${c.phone})` : ''} - طلب: {c.balanceOwed.toLocaleString()}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      {t.customerName} *
                    </label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="نام شخص یا شرکت مرغداری"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      {t.customerPhone}
                    </label>
                    <input
                      type="text"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="07xxxxxxxx"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>

              {/* Quantity, Unit & Price */}
              <div className="border-t border-slate-800 pt-3 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      {t.saleUnit}
                    </label>
                    <select
                      value={unitType}
                      onChange={(e) => setUnitType(e.target.value as UnitType)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                    >
                      <option value="bag">{t.bag} - 50 kg</option>
                      <option value="ton">{t.ton} - 1000 kg (20 بوجی)</option>
                      <option value="kg">{t.kilo}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      {t.quantity} *
                    </label>
                    <input
                      type="number"
                      min="0.1"
                      step="any"
                      required
                      value={unitQuantity}
                      onChange={(e) => setUnitQuantity(e.target.value ? Number(e.target.value) : '')}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-amber-500"
                    />
                    <span className="text-[11px] text-slate-400 mt-1 block">
                      = {totalQuantityKg.toLocaleString()} {t.kilo}
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      {t.salePrice} ({t.currency}) *
                    </label>
                    <input
                      type="number"
                      min="1"
                      step="any"
                      required
                      value={salePricePerUnit}
                      onChange={(e) => setSalePricePerUnit(e.target.value ? Number(e.target.value) : '')}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                {/* Cost Rate & Profit Preview Box */}
                <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400 block">{t.totalSaleAmount}:</span>
                    <strong className="text-cyan-400 font-mono text-sm">{totalInvoiceAmount.toLocaleString()} {t.currency}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">{t.costRateNotice}</span>
                    <strong className="text-slate-300 font-mono text-sm">{costRatePerKg} AFN/kg</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">{t.expectedProfitNotice}</span>
                    <strong className="text-emerald-400 font-mono text-sm">+{estimatedProfit.toLocaleString()} {t.currency}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">مارجین سود:</span>
                    <strong className="text-amber-400 font-mono text-sm">
                      {totalInvoiceAmount > 0 ? Math.round((estimatedProfit / totalInvoiceAmount) * 100) : 0}%
                    </strong>
                  </div>
                </div>

                {/* Payment Breakdown */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      {t.paidAmount} ({t.currency})
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={paidAmount}
                      onChange={(e) => setPaidAmount(e.target.value ? Number(e.target.value) : '')}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      {t.remainingDebt} ({t.currency})
                    </label>
                    <div className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-sm font-bold font-mono text-rose-400">
                      {remainingDebt.toLocaleString()} {t.currency}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    یادداشت بل (شماره موتر، راننده، آدرس فارم)
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="تحویل به موتر لاری..."
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
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 text-xs font-bold shadow-lg shadow-emerald-500/20"
                >
                  {t.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invoice Receipt Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm">
          <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto text-slate-100 print:bg-white print:text-black print:border-none">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 print:hidden">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-base text-white">فاکتور فروش رسمی</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>{t.printReport}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedInvoice(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Invoice Sheet */}
            <div className="p-4 sm:p-6 bg-slate-950/90 rounded-xl border border-slate-800 mt-3 print:bg-white print:border-stone-400 print:text-black">
              <div className="text-center pb-4 border-b border-slate-800 print:border-black">
                <h2 className="text-lg sm:text-xl font-black text-white print:text-black">{t.companyName}</h2>
                <p className="text-xs text-amber-400 print:text-stone-700 font-medium">{t.companySubtitle}</p>
                
                {/* Formatted Company Contact Number in PDF / Print */}
                <div className="mt-2.5 inline-flex items-center justify-center gap-2 px-3.5 py-1 bg-slate-900 border border-slate-700/80 rounded-full print:border-stone-400 print:bg-stone-50">
                  <Phone className="w-3.5 h-3.5 text-amber-400 print:text-black shrink-0" />
                  <span className="text-xs text-slate-300 print:text-black font-medium">
                    {t.companyPhoneLabel} <strong className="font-mono text-amber-400 print:text-black font-bold tracking-wider" dir="ltr">0780 001 923</strong>
                  </span>
                </div>

                <div className="text-xs text-slate-400 print:text-stone-600 mt-2 flex items-center justify-center gap-4 flex-wrap">
                  <span>شماره بل: <span className="font-mono font-bold text-slate-200 print:text-black">{selectedInvoice.id}</span></span>
                  <span>تاریخ: <span className="font-mono font-bold text-slate-200 print:text-black">{selectedInvoice.date}</span></span>
                  <span>آدرس: <span className="text-slate-300 print:text-stone-700">{t.factoryAddress}</span></span>
                </div>
              </div>

              <div className="py-3 border-b border-slate-800 print:border-black flex justify-between text-xs">
                <div>
                  <span className="text-slate-400 print:text-stone-600">خریدار: </span>
                  <strong className="text-white print:text-black">{selectedInvoice.customerName}</strong>
                </div>
                {selectedInvoice.customerPhone && (
                  <div>
                    <span className="text-slate-400 print:text-stone-600">تماس مشتری: </span>
                    <strong className="font-mono" dir="ltr">{selectedInvoice.customerPhone}</strong>
                  </div>
                )}
              </div>

              <div className="py-4 space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-800/80">
                  <span className="text-slate-400">محصول فروخته شده:</span>
                  <strong className="text-white print:text-black">{getLocalizedName(selectedInvoice.productName)}</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/80">
                  <span className="text-slate-400">مقدار:</span>
                  <strong className="font-mono">{selectedInvoice.unitQuantity} {t[selectedInvoice.unitType] || selectedInvoice.unitType} ({selectedInvoice.quantityKg} kg)</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/80">
                  <span className="text-slate-400">قیمت فی واحد:</span>
                  <strong className="font-mono">{selectedInvoice.salePricePerUnit.toLocaleString()} {t.currency}</strong>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-800 text-sm font-bold">
                  <span>مجموع کل:</span>
                  <span className="font-mono text-cyan-400 print:text-black">{selectedInvoice.totalAmount.toLocaleString()} {t.currency}</span>
                </div>
                <div className="flex justify-between py-1 text-emerald-400 print:text-black">
                  <span>رسید نقدی:</span>
                  <span className="font-mono font-bold">{selectedInvoice.paidAmount.toLocaleString()} {t.currency}</span>
                </div>
                <div className="flex justify-between py-1 text-rose-400 print:text-black font-bold">
                  <span>باقی‌داری مانده:</span>
                  <span className="font-mono">{selectedInvoice.remainingAmount.toLocaleString()} {t.currency}</span>
                </div>
              </div>

              {selectedInvoice.notes && (
                <div className="pt-2 text-[11px] text-slate-400 print:text-stone-600 italic">
                  یادداشت: {selectedInvoice.notes}
                </div>
              )}

              <div className="mt-8 pt-6 border-t border-slate-800 print:border-black flex justify-between text-center text-xs text-slate-400 print:text-black">
                <div>
                  <div className="h-10"></div>
                  <span>امضاء و مهر مدیریت فروش</span>
                </div>
                <div className="text-center">
                  <div className="h-10 flex items-center justify-center">
                    <span className="text-[11px] font-mono text-slate-500 print:text-stone-700" dir="ltr">0780 001 923</span>
                  </div>
                  <span className="text-[11px] text-slate-400 print:text-stone-600">خدمات و ثبت سفارشات</span>
                </div>
                <div>
                  <div className="h-10"></div>
                  <span>امضاء گیرنده جنس</span>
                </div>
              </div>

              {/* Official Receipt Footer Phone Notice */}
              <div className="mt-4 pt-3 border-t border-slate-800/80 print:border-stone-300 text-center text-[11px] text-slate-400 print:text-stone-600 flex items-center justify-center gap-2">
                <span>{t.companyName}</span>
                <span>•</span>
                <span>{t.companyPhoneLabel}</span>
                <strong className="font-mono text-amber-400 print:text-black font-bold" dir="ltr">0780 001 923</strong>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
