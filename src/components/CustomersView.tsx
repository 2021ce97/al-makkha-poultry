import React, { useState } from 'react';
import { useDatabase } from '../context/DatabaseContext';
import { Customer } from '../types';
import { 
  Users, 
  Search, 
  Wallet, 
  History, 
  Trash2, 
  CheckCircle, 
  DollarSign, 
  Phone,
  MapPin,
  X,
  ChevronDown,
  ChevronUp,
  ArrowDownLeft,
  Receipt,
  Printer
} from 'lucide-react';

export const CustomersView: React.FC = () => {
  const { db, t, receiveCustomerPayment, deleteCustomer } = useDatabase();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'debtors' | 'settled'>('all');
  const [receiveModalCustomer, setReceiveModalCustomer] = useState<Customer | null>(null);
  const [receivedAmount, setReceivedAmount] = useState<number | ''>('');
  const [paymentNote, setPaymentNote] = useState('');
  const [selectedHistoryCustomer, setSelectedHistoryCustomer] = useState<Customer | null>(null);
  const [customerToDelete, setCustomerToDelete] = useState<string | null>(null);
  const [expandedCustomerIds, setExpandedCustomerIds] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string) => {
    setExpandedCustomerIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Filter customers
  const filteredCustomers = db.customers.filter(c => {
    const matchesSearch = 
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.phone && c.phone.includes(searchTerm)) ||
      (c.address && c.address.toLowerCase().includes(searchTerm.toLowerCase()));
    
    let matchesStatus = true;
    if (statusFilter === 'debtors') matchesStatus = c.balanceOwed > 0;
    if (statusFilter === 'settled') matchesStatus = c.balanceOwed === 0;

    return matchesSearch && matchesStatus;
  });

  const totalSalesAll = db.customers.reduce((acc, c) => acc + c.totalPurchasedAmount, 0);
  const totalPaidAll = db.customers.reduce((acc, c) => acc + c.totalPaid, 0);
  const totalReceivableDebtAll = db.customers.reduce((acc, c) => acc + c.balanceOwed, 0);
  const debtorCount = db.customers.filter(c => c.balanceOwed > 0).length;

  const handleOpenReceiveModal = (customer: Customer) => {
    setReceiveModalCustomer(customer);
    setReceivedAmount(customer.balanceOwed);
    setPaymentNote(t.receivePayment);
  };

  const handleReceiveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiveModalCustomer || !receivedAmount || Number(receivedAmount) <= 0) return;

    receiveCustomerPayment(
      receiveModalCustomer.id,
      Number(receivedAmount),
      paymentNote
    );

    setReceiveModalCustomer(null);
    setReceivedAmount('');
    setPaymentNote('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-100 text-blue-700">
              <Users className="w-5 h-5" />
            </div>
            <span>{t.customersTitle}</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            {t.customersDesc}
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-80">
          <div className="absolute inset-y-0 start-0 flex items-center ps-3.5 pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder={t.search}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full ps-10 pe-4 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-600 shadow-2xs"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute inset-y-0 end-0 pe-3 flex items-center text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Financial Summary Banners */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500">{t.totalSaleAmount || 'مجموع خریدها'}</span>
            <div className="text-xl font-bold font-mono text-slate-900 mt-1">
              {totalSalesAll.toLocaleString()} {t.currency}
            </div>
            <span className="text-xs text-slate-500">{db.customers.length} {t.navCustomers}</span>
          </div>
          <div className="p-3 bg-blue-100 text-blue-700 rounded-xl border border-blue-200">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500">{t.totalReceived || 'مجموع دریافت نقدی'}</span>
            <div className="text-xl font-bold font-mono text-emerald-700 mt-1">
              {totalPaidAll.toLocaleString()} {t.currency}
            </div>
            <span className="text-xs text-emerald-600">دریافت شده از مشتریان</span>
          </div>
          <div className="p-3 bg-emerald-100 text-emerald-700 rounded-xl border border-emerald-200">
            <Wallet className="w-6 h-6" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500">{t.balanceOwedToCustomer || 'مجموع باقی‌داری مشتریان'}</span>
            <div className="text-xl font-bold font-mono text-rose-700 mt-1">
              {totalReceivableDebtAll.toLocaleString()} {t.currency}
            </div>
            <span className="text-xs text-rose-600 font-medium">
              {debtorCount} فارم / مشتری قرض‌دار
            </span>
          </div>
          <div className="p-3 bg-rose-100 text-rose-700 rounded-xl border border-rose-200">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Comprehensive Row Layout / Line Structure Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Table Toolbar & Filters */}
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-600" />
            <h3 className="font-bold text-sm text-slate-900">
              لیست خطی و جامع حساب مشتریان
            </h3>
            <span className="text-xs text-slate-500 font-mono">({filteredCustomers.length} مورد)</span>
          </div>

          {/* Quick Filter Buttons */}
          <div className="flex items-center gap-1 bg-white border border-slate-200 p-1 rounded-xl text-xs">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                statusFilter === 'all' 
                  ? 'bg-blue-600 text-white shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              همه ({db.customers.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('debtors')}
              className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                statusFilter === 'debtors' 
                  ? 'bg-rose-600 text-white shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              قرض‌داران ({debtorCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('settled')}
              className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                statusFilter === 'settled' 
                  ? 'bg-emerald-600 text-white shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              تسویه کامل ({db.customers.length - debtorCount})
            </button>
          </div>
        </div>

        {/* Structured Row / Line Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs sm:text-sm min-w-[850px]">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold text-[11px] uppercase">
              <tr>
                <th className="py-3.5 px-4 text-start">نام و هویت مشتری</th>
                <th className="py-3.5 px-4 text-start">اطلاعات تماس و آدرس</th>
                <th className="py-3.5 px-4 text-start">مجموع خرید</th>
                <th className="py-3.5 px-4 text-start">پرداخت نقدی</th>
                <th className="py-3.5 px-4 text-start">باقی‌داری (قرض)</th>
                <th className="py-3.5 px-4 text-center">تاریخچه تراکنش‌ها</th>
                <th className="py-3.5 px-4 text-center">عملیات مالی</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCustomers.map((cust) => {
                const hasDebt = cust.balanceOwed > 0;
                const isExpanded = !!expandedCustomerIds[cust.id];
                const transactionsCount = cust.transactions?.length || 0;

                return (
                  <React.Fragment key={cust.id}>
                    <tr className={`transition-colors ${hasDebt ? 'bg-rose-50/20 hover:bg-rose-50/40' : 'hover:bg-slate-50/80'}`}>
                      {/* Name & Identity */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => toggleExpand(cust.id)}
                            className="p-1 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                            title="باز/بسته کردن تاریخچه تراکنش‌ها"
                          >
                            {isExpanded ? <ChevronUp className="w-4 h-4 text-blue-600" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                          <div>
                            <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                              <span>{cust.name}</span>
                              {hasDebt ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
                                  قرض‌دار
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200 inline-flex items-center gap-0.5">
                                  <CheckCircle className="w-3 h-3" />
                                  <span>تسویه</span>
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono">
                              کد شناسایی: #{cust.id.slice(-6).toUpperCase()}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Contact & Address */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          {cust.phone ? (
                            <a 
                              href={`tel:${cust.phone}`}
                              className="inline-flex items-center gap-1.5 text-xs text-slate-700 hover:text-blue-600 font-mono transition-colors"
                              dir="ltr"
                            >
                              <Phone className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                              <span>{cust.phone}</span>
                            </a>
                          ) : (
                            <span className="text-slate-400 text-xs">-</span>
                          )}
                          {cust.address && (
                            <div className="text-[11px] text-slate-500 flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="truncate max-w-[200px]" title={cust.address}>{cust.address}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Total Purchases */}
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        {cust.totalPurchasedAmount.toLocaleString()} {t.currency}
                      </td>

                      {/* Total Payments */}
                      <td className="py-3.5 px-4 font-mono font-bold text-emerald-700">
                        {cust.totalPaid.toLocaleString()} {t.currency}
                      </td>

                      {/* Remaining Debt */}
                      <td className="py-3.5 px-4">
                        {hasDebt ? (
                          <div className="inline-flex flex-col">
                            <span className="font-mono font-bold text-rose-700 text-sm">
                              {cust.balanceOwed.toLocaleString()} {t.currency}
                            </span>
                            <span className="text-[10px] text-rose-600 font-medium">نیاز به تسویه</span>
                          </div>
                        ) : (
                          <span className="font-mono text-slate-500 text-xs">
                            ۰ {t.currency}
                          </span>
                        )}
                      </td>

                      {/* Transaction Histories Toggle / Count */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => toggleExpand(cust.id)}
                            className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                              isExpanded 
                                ? 'bg-blue-600 text-white' 
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                            }`}
                          >
                            <History className="w-3.5 h-3.5" />
                            <span>تاریخچه ({transactionsCount})</span>
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </td>

                      {/* Action Buttons */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {hasDebt && (
                            <button
                              type="button"
                              onClick={() => handleOpenReceiveModal(cust)}
                              className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
                            >
                              {t.receivePayment}
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => setSelectedHistoryCustomer(cust)}
                            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                            title="چاپ و صورتحساب رسمی"
                          >
                            <Printer className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setCustomerToDelete(cust.id)}
                            className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title={t.delete}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Inline Expandable Transaction Histories Row */}
                    {isExpanded && (
                      <tr className="bg-slate-50/90 border-b border-slate-200">
                        <td colSpan={7} className="p-4">
                          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
                            <div className="p-3 bg-slate-100/70 border-b border-slate-200 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <History className="w-4 h-4 text-blue-600" />
                                <span className="font-bold text-xs text-slate-800">
                                  ریز سوابق و تاریخچه تراکنش‌های {cust.name}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => setSelectedHistoryCustomer(cust)}
                                className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                              >
                                <Printer className="w-3.5 h-3.5" />
                                <span>چاپ صورتحساب کامل</span>
                              </button>
                            </div>

                            {cust.transactions && cust.transactions.length > 0 ? (
                              <div className="overflow-x-auto">
                                <table className="w-full text-xs text-start">
                                  <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 text-[10px]">
                                    <tr>
                                      <th className="py-2 px-3 text-start">تاریخ</th>
                                      <th className="py-2 px-3 text-start">نوع عملیات</th>
                                      <th className="py-2 px-3 text-start">توضیحات / قلم معامله</th>
                                      <th className="py-2 px-3 text-start">مبلغ فاکتور</th>
                                      <th className="py-2 px-3 text-start">پرداخت نقدی</th>
                                      <th className="py-2 px-3 text-start">مانده باقی‌داری</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100">
                                    {cust.transactions.map((tr) => (
                                      <tr key={tr.id} className="hover:bg-slate-50/50">
                                        <td className="py-2.5 px-3 font-mono text-slate-600">{tr.date}</td>
                                        <td className="py-2.5 px-3">
                                          {tr.type === 'sale' ? (
                                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                                              <Receipt className="w-3 h-3" />
                                              فروش دانه
                                            </span>
                                          ) : (
                                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                                              <ArrowDownLeft className="w-3 h-3" />
                                              دریافت نقدی
                                            </span>
                                          )}
                                        </td>
                                        <td className="py-2.5 px-3 text-slate-700 font-medium">{tr.description}</td>
                                        <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                                          {tr.amount ? `${tr.amount.toLocaleString()} ${t.currency}` : '-'}
                                        </td>
                                        <td className="py-2.5 px-3 font-mono font-bold text-emerald-700">
                                          {tr.paidAmount.toLocaleString()} {t.currency}
                                        </td>
                                        <td className="py-2.5 px-3 font-mono font-bold text-rose-700">
                                          {tr.remainingAmount.toLocaleString()} {t.currency}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            ) : (
                              <div className="p-6 text-center text-slate-400 text-xs">
                                هنوز هیچ تراکنشی برای این مشتری ثبت نشده است.
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}

              {filteredCustomers.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm font-medium">هیچ مشتری با این مشخصات یافت نشد.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Receive Customer Payment Modal */}
      {receiveModalCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 relative text-slate-900">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-100 text-blue-700">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {t.receivePayment}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {receiveModalCustomer.name} (باقی‌داری فعلی: {receiveModalCustomer.balanceOwed.toLocaleString()} {t.currency})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setReceiveModalCustomer(null)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReceiveSubmit} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  مبلغ دریافتی ({t.currency}) *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    required
                    min="1"
                    max={receiveModalCustomer.balanceOwed}
                    value={receivedAmount}
                    onChange={(e) => setReceivedAmount(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm font-mono font-bold text-slate-900 focus:outline-none focus:border-amber-600 shadow-2xs"
                  />
                  <span className="absolute end-3 top-2.5 text-xs text-slate-500 font-medium">
                    {t.currency}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  توضیحات یا نمبر رسید نقدی / بانکی
                </label>
                <input
                  type="text"
                  value={paymentNote}
                  onChange={(e) => setPaymentNote(e.target.value)}
                  placeholder="مثال: دریافت نقدی در دفتر کارخانه"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-amber-600 shadow-2xs"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setReceiveModalCustomer(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/25 cursor-pointer"
                >
                  {t.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer Transaction History / Statement Modal */}
      {selectedHistoryCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden text-slate-900">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-100 text-blue-700">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    صورتحساب و تاریخچه حساب ({selectedHistoryCustomer.name})
                  </h3>
                  <span className="text-[11px] text-slate-500 font-mono">
                    تماس: {selectedHistoryCustomer.phone || '-'} • باقی‌داری کل: {selectedHistoryCustomer.balanceOwed.toLocaleString()} {t.currency}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>چاپ</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedHistoryCustomer(null)}
                  className="text-slate-400 hover:text-slate-900 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-4 max-h-96 overflow-y-auto space-y-2.5">
              {selectedHistoryCustomer.transactions && selectedHistoryCustomer.transactions.length > 0 ? (
                selectedHistoryCustomer.transactions.map((h) => (
                  <div key={h.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex justify-between items-center text-xs shadow-2xs">
                    <div>
                      <div className="font-mono text-slate-500">{h.date}</div>
                      <div className="text-slate-800 mt-0.5 font-medium">{h.description}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        نوع: {h.type === 'sale' ? 'فاکتور فروش' : 'دریافت نقدی'}
                      </div>
                    </div>
                    <div className="text-end">
                      <div className="font-bold font-mono text-emerald-700 text-sm">
                        پرداخت: {h.paidAmount.toLocaleString()} {t.currency}
                      </div>
                      <div className="text-[11px] text-rose-700 font-mono mt-0.5">
                        مانده قرض: {h.remainingAmount.toLocaleString()} {t.currency}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-slate-500 text-xs">
                  هیچ تراکنشی در سیستم ثبت نشده است.
                </div>
              )}
            </div>

            {/* Print Statement Footer with Branding */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 text-center">
              <div className="text-[10px] font-mono text-slate-500">
                Developed by: rayan-tech-solutions.tech
              </div>
            </div>
          </div>
        </div>
      )}

      {/* In-app Confirmation Modal for Customer Deletion */}
      {customerToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-200 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-2">
              {t.delete}
            </h3>
            <p className="text-xs text-slate-600 mb-6">
              {t.confirmDelete}
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setCustomerToDelete(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteCustomer(customerToDelete);
                  setCustomerToDelete(null);
                }}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 text-xs font-bold text-white hover:bg-rose-700 transition-colors cursor-pointer"
              >
                {t.delete}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
