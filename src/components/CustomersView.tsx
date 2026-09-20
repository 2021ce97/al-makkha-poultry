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
  AlertCircle, 
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400">
              <Users className="w-5 h-5" />
            </div>
            <span>{t.customersTitle}</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
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
            className="w-full ps-10 pe-4 py-2.5 text-xs sm:text-sm bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
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
      </div>

      {/* Financial Summary Banners (Dark Theme) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400">{t.totalSaleAmount}</span>
            <div className="text-xl font-bold font-mono text-cyan-400 mt-1">
              {totalSalesAll.toLocaleString()} {t.currency}
            </div>
            <span className="text-xs text-slate-400">{db.customers.length} {t.records}</span>
          </div>
          <div className="p-3 bg-cyan-500/15 text-cyan-400 rounded-xl border border-cyan-500/20">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400">{t.paidAmount}</span>
            <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
              {totalPaidAll.toLocaleString()} {t.currency}
            </div>
            <span className="text-xs text-slate-400">{t.moneyInHandCard}</span>
          </div>
          <div className="p-3 bg-emerald-500/15 text-emerald-400 rounded-xl border border-emerald-500/20">
            <CheckCircle className="w-6 h-6" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-blue-500/30 bg-blue-950/20 shadow-lg flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-blue-300">{t.remainingDebt}</span>
            <div className="text-xl font-bold font-mono text-blue-400 mt-1">
              {totalReceivableDebtAll.toLocaleString()} {t.currency}
            </div>
            <span className="text-xs text-blue-300 font-medium">{t.receivableCustomersCard}</span>
          </div>
          <div className="p-3 bg-blue-500/15 text-blue-400 rounded-xl border border-blue-500/30">
            <AlertCircle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Customers Table (Dark Theme) */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white">
            {t.customersTitle} ({filteredCustomers.length} {t.records})
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-slate-300 text-start">
            <thead className="bg-slate-950/80 text-slate-400 text-[11px] font-semibold uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 text-start">{t.customerName}</th>
                <th className="py-3 px-4 text-start">{t.phone}</th>
                <th className="py-3 px-4 text-end">{t.totalSaleAmount}</th>
                <th className="py-3 px-4 text-end">{t.paidAmount}</th>
                <th className="py-3 px-4 text-end">{t.remainingDebt}</th>
                <th className="py-3 px-4 text-center">{t.action}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredCustomers.map((customer) => {
                const hasDebt = customer.balanceOwed > 0;
                return (
                  <tr key={customer.id} className="hover:bg-slate-850/50 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-white">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs shrink-0 border border-blue-500/30">
                          {customer.name.charAt(0)}
                        </div>
                        <div>
                          <div>{customer.name}</div>
                          {customer.address && (
                            <span className="text-[11px] text-slate-400 block font-normal">
                              {customer.address}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-400 font-mono">
                      {customer.phone || '---'}
                    </td>

                    <td className="py-3.5 px-4 text-end font-mono font-medium text-slate-200">
                      {customer.totalPurchasedAmount.toLocaleString()} {t.currency}
                    </td>

                    <td className="py-3.5 px-4 text-end font-mono font-medium text-emerald-400">
                      {customer.totalPaid.toLocaleString()} {t.currency}
                    </td>

                    <td className="py-3.5 px-4 text-end font-mono">
                      {hasDebt ? (
                        <span className="inline-flex items-center gap-1 font-bold text-rose-400 bg-rose-500/10 px-2.5 py-0.5 rounded-lg border border-rose-500/20">
                          {customer.balanceOwed.toLocaleString()} {t.currency}
                        </span>
                      ) : (
                        <span className="text-emerald-400 font-medium">
                          {t.statusPaid}
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {hasDebt && (
                          <button
                            type="button"
                            onClick={() => handleOpenReceiveModal(customer)}
                            className="px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 rounded-lg text-xs font-bold transition-all shadow-md shadow-emerald-500/20"
                          >
                            {t.receivePayment}
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => setSelectedHistoryCustomer(customer)}
                          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                          title={t.records}
                        >
                          <History className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`${t.confirmDelete} (${customer.name})`)) {
                              deleteCustomer(customer.id);
                            }
                          }}
                          className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                          title={t.delete}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredCustomers.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <Users className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                    <p>{t.showingResults} 0 {t.records}</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Receive Payment Modal (Dark Theme) */}
      {receiveModalCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl border border-slate-800 overflow-hidden text-slate-100">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Wallet className="w-4 h-4 text-emerald-400" />
                <span>{t.receiveModalTitle}</span>
              </h3>
              <button
                type="button"
                onClick={() => setReceiveModalCustomer(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReceiveSubmit} className="p-5 space-y-4">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">{t.customerName}:</span>
                  <span className="font-bold text-white">{receiveModalCustomer.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">{t.remainingDebt}:</span>
                  <span className="font-bold text-rose-400 font-mono">
                    {receiveModalCustomer.balanceOwed.toLocaleString()} {t.currency}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {t.amountReceived} *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    required
                    min="1"
                    max={receiveModalCustomer.balanceOwed}
                    value={receivedAmount}
                    onChange={(e) => setReceivedAmount(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm font-mono font-bold text-white focus:outline-none focus:border-amber-500"
                  />
                  <span className="absolute end-3 top-2.5 text-xs text-slate-500 font-medium">
                    {t.currency}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  توضیحات یا نمبر رسید بانکی / حواله
                </label>
                <input
                  type="text"
                  value={paymentNote}
                  onChange={(e) => setPaymentNote(e.target.value)}
                  placeholder="مثال: نقدی تحویل به خزانه‌دار"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setReceiveModalCustomer(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-slate-950 text-xs font-bold"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl border border-slate-800 overflow-hidden text-slate-100">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <History className="w-4 h-4 text-emerald-400" />
                <span>تاریخچه حساب ({selectedHistoryCustomer.name})</span>
              </h3>
              <button
                type="button"
                onClick={() => setSelectedHistoryCustomer(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 max-h-96 overflow-y-auto space-y-2">
              {selectedHistoryCustomer.transactions && selectedHistoryCustomer.transactions.length > 0 ? (
                selectedHistoryCustomer.transactions.map((h) => (
                  <div key={h.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-center text-xs">
                    <div>
                      <div className="font-mono text-slate-400">{h.date}</div>
                      <div className="text-slate-300 mt-0.5">{h.description}</div>
                    </div>
                    <div className="text-end">
                      <div className="font-bold font-mono text-emerald-400 text-sm">
                        +{h.paidAmount.toLocaleString()} {t.currency}
                      </div>
                      {h.remainingAmount > 0 && (
                        <div className="text-[10px] text-rose-400 font-mono">
                          {t.remainingDebt}: {h.remainingAmount.toLocaleString()}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-slate-500 text-xs">
                  {t.noCustomers}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
