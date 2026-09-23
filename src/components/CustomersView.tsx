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
  X
} from 'lucide-react';

export const CustomersView: React.FC = () => {
  const { db, t, receiveCustomerPayment, deleteCustomer } = useDatabase();
  const [searchTerm, setSearchTerm] = useState('');
  const [receiveModalCustomer, setReceiveModalCustomer] = useState<Customer | null>(null);
  const [receivedAmount, setReceivedAmount] = useState<number | ''>('');
  const [paymentNote, setPaymentNote] = useState('');
  const [selectedHistoryCustomer, setSelectedHistoryCustomer] = useState<Customer | null>(null);
  const [customerToDelete, setCustomerToDelete] = useState<string | null>(null);

  // Filter customers
  const filteredCustomers = db.customers.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.phone && c.phone.includes(searchTerm)) ||
    (c.address && c.address.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalSalesAll = db.customers.reduce((acc, c) => acc + c.totalPurchasedAmount, 0);
  const totalPaidAll = db.customers.reduce((acc, c) => acc + c.totalPaid, 0);
  const totalReceivableDebtAll = db.customers.reduce((acc, c) => acc + c.balanceOwed, 0);

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
              className="absolute inset-y-0 end-0 pe-3 flex items-center text-slate-400 hover:text-slate-700"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Financial Summary Banners (Light Theme) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500">{t.totalSaleAmount || 'مجموع فروش'}</span>
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
            <span className="text-xs text-rose-600">قرض قابل وصول</span>
          </div>
          <div className="p-3 bg-rose-100 text-rose-700 rounded-xl border border-rose-200">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Customers Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCustomers.map((cust) => {
          const hasDebt = cust.balanceOwed > 0;
          return (
            <div 
              key={cust.id}
              className={`p-5 rounded-2xl border transition-all duration-200 flex flex-col justify-between shadow-sm ${
                hasDebt ? 'bg-rose-50/40 border-rose-200' : 'bg-white border-slate-200'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{cust.name}</h3>
                    {cust.phone && (
                      <span className="inline-flex items-center gap-1.5 text-xs text-slate-600 font-mono mt-1" dir="ltr">
                        <Phone className="w-3.5 h-3.5 text-blue-600" />
                        <span>{cust.phone}</span>
                      </span>
                    )}
                  </div>
                  {hasDebt ? (
                    <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
                      قرض‌دار
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>تسویه</span>
                    </span>
                  )}
                </div>

                {/* Account Details Box */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs my-3">
                  <div className="flex justify-between">
                    <span className="text-slate-500">مجموع خرید:</span>
                    <strong className="font-mono text-slate-900">{cust.totalPurchasedAmount.toLocaleString()} {t.currency}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">پرداخت نقدی:</span>
                    <strong className="font-mono text-emerald-700">{cust.totalPaid.toLocaleString()} {t.currency}</strong>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-slate-200 font-bold">
                    <span className="text-slate-700">باقی‌داری (قرض):</span>
                    <span className={`font-mono ${hasDebt ? 'text-rose-700 text-sm' : 'text-slate-700'}`}>
                      {cust.balanceOwed.toLocaleString()} {t.currency}
                    </span>
                  </div>
                </div>

                {cust.address && (
                  <p className="text-xs text-slate-500">
                    آدرس: {cust.address}
                  </p>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedHistoryCustomer(cust)}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1 transition-colors"
                    title="تاریخچه تراکنش‌ها"
                  >
                    <History className="w-3.5 h-3.5" />
                    <span>تاریخچه</span>
                  </button>

                  {hasDebt && (
                    <button
                      type="button"
                      onClick={() => handleOpenReceiveModal(cust)}
                      className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors shadow-xs"
                    >
                      {t.receivePayment}
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setCustomerToDelete(cust.id)}
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                  title={t.delete}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}

        {filteredCustomers.length === 0 && (
          <div className="col-span-full p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-sm">
            <Users className="w-10 h-10 text-slate-400 mx-auto mb-3" />
            <p className="text-sm text-slate-600 font-medium">
              هیچ مشتری یافت نشد.
            </p>
          </div>
        )}
      </div>

      {/* Receive Customer Payment Modal (Light Theme) */}
      {receiveModalCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 relative text-slate-900">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-100 text-blue-700">
                  <Wallet className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-900">{t.receivePayment}</h3>
                  <p className="text-xs text-slate-500">{receiveModalCustomer.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setReceiveModalCustomer(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="my-4 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <span className="text-slate-500 block">باقی‌داری فعلی مشتری:</span>
              <strong className="text-rose-700 font-mono text-base font-bold">{receiveModalCustomer.balanceOwed.toLocaleString()} {t.currency}</strong>
            </div>

            <form onSubmit={handleReceiveSubmit} className="space-y-4">
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
                  placeholder="مثال: دریافت نقدی در دفتر"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-amber-600 shadow-2xs"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setReceiveModalCustomer(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/25"
                >
                  {t.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer Transaction History Modal */}
      {selectedHistoryCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden text-slate-900">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <History className="w-4 h-4 text-blue-600" />
                <span>تاریخچه حساب مشتری ({selectedHistoryCustomer.name})</span>
              </h3>
              <button
                type="button"
                onClick={() => setSelectedHistoryCustomer(null)}
                className="text-slate-400 hover:text-slate-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 max-h-96 overflow-y-auto space-y-2">
              {selectedHistoryCustomer.transactions && selectedHistoryCustomer.transactions.length > 0 ? (
                selectedHistoryCustomer.transactions.map((h) => (
                  <div key={h.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex justify-between items-center text-xs shadow-2xs">
                    <div>
                      <div className="font-mono text-slate-500">{h.date}</div>
                      <div className="text-slate-700 mt-0.5 font-medium">{h.description}</div>
                    </div>
                    <div className="text-end">
                      <div className="font-bold font-mono text-emerald-700 text-sm">
                        {h.paidAmount.toLocaleString()} {t.currency}
                      </div>
                      {h.remainingAmount > 0 && (
                        <div className="text-[10px] text-rose-700 font-mono">
                          باقی‌داری: {h.remainingAmount.toLocaleString()}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-slate-500 text-xs">
                  هیچ تراکنشی ثبت نشده است.
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
