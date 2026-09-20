import React, { useState } from 'react';
import { useDatabase } from '../context/DatabaseContext';
import { 
  Truck, 
  Search, 
  Trash2, 
  CheckCircle, 
  Phone, 
  Wallet, 
  History, 
  CreditCard,
  AlertCircle,
  X
} from 'lucide-react';
import { Supplier } from '../types';

export const SuppliersView: React.FC = () => {
  const { db, t, settleSupplierPayment, deleteSupplier } = useDatabase();
  const [searchTerm, setSearchTerm] = useState('');
  const [settleModalSupplier, setSettleModalSupplier] = useState<Supplier | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number | ''>('');
  const [paymentNote, setPaymentNote] = useState('');
  const [selectedHistorySupplier, setSelectedHistorySupplier] = useState<Supplier | null>(null);

  // Filter suppliers
  const filteredSuppliers = db.suppliers.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.phone && s.phone.includes(searchTerm)) ||
    (s.address && s.address.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalPurchasesAll = db.suppliers.reduce((acc, s) => acc + s.totalPurchasedAmount, 0);
  const totalPaidAll = db.suppliers.reduce((acc, s) => acc + s.totalPaid, 0);
  const totalOwedAll = db.suppliers.reduce((acc, s) => acc + s.balanceOwed, 0);

  const handleOpenSettleModal = (supplier: Supplier) => {
    setSettleModalSupplier(supplier);
    setPaymentAmount(supplier.balanceOwed);
    setPaymentNote(t.settlePayment);
  };

  const handleSettleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!settleModalSupplier || !paymentAmount || Number(paymentAmount) <= 0) return;

    settleSupplierPayment(
      settleModalSupplier.id,
      Number(paymentAmount),
      paymentNote
    );

    setSettleModalSupplier(null);
    setPaymentAmount('');
    setPaymentNote('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400">
              <Truck className="w-5 h-5" />
            </div>
            <span>{t.suppliersTitle}</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            {t.suppliersDesc}
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
            <span className="text-xs font-semibold text-slate-400">{t.totalPurchases}</span>
            <div className="text-xl font-bold font-mono text-white mt-1">
              {totalPurchasesAll.toLocaleString()} {t.currency}
            </div>
            <span className="text-xs text-slate-400">{db.suppliers.length} {t.records}</span>
          </div>
          <div className="p-3 bg-slate-800 text-slate-300 rounded-xl border border-slate-700">
            <CreditCard className="w-6 h-6" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400">{t.totalPaidMoney}</span>
            <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
              {totalPaidAll.toLocaleString()} {t.currency}
            </div>
            <span className="text-xs text-slate-400">{t.statusPaid}</span>
          </div>
          <div className="p-3 bg-emerald-500/15 text-emerald-400 rounded-xl border border-emerald-500/20">
            <CheckCircle className="w-6 h-6" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-rose-500/30 bg-rose-950/20 shadow-lg flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-rose-300">{t.remainingOwed}</span>
            <div className="text-xl font-bold font-mono text-rose-400 mt-1">
              {totalOwedAll.toLocaleString()} {t.currency}
            </div>
            <span className="text-xs text-rose-300 font-medium">{t.oweSuppliersCard}</span>
          </div>
          <div className="p-3 bg-rose-500/15 text-rose-400 rounded-xl border border-rose-500/30">
            <AlertCircle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Suppliers Table */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white">
            {t.suppliersTitle} ({filteredSuppliers.length} {t.records})
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-slate-300 text-start">
            <thead className="bg-slate-950/80 text-slate-400 text-[11px] font-semibold uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 text-start">{t.supplierName}</th>
                <th className="py-3 px-4 text-start">{t.phone}</th>
                <th className="py-3 px-4 text-end">{t.totalPurchases}</th>
                <th className="py-3 px-4 text-end">{t.totalPaidMoney}</th>
                <th className="py-3 px-4 text-end">{t.remainingOwed}</th>
                <th className="py-3 px-4 text-center">{t.action}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredSuppliers.map((supplier) => {
                const hasDebt = supplier.balanceOwed > 0;
                return (
                  <tr key={supplier.id} className="hover:bg-slate-850/50 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-white">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold text-xs shrink-0 border border-rose-500/30">
                          {supplier.name.charAt(0)}
                        </div>
                        <div>
                          <div>{supplier.name}</div>
                          {supplier.address && (
                            <span className="text-[11px] text-slate-400 block font-normal">
                              {supplier.address}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-400 font-mono">
                      {supplier.phone || '---'}
                    </td>

                    <td className="py-3.5 px-4 text-end font-mono font-medium text-slate-200">
                      {supplier.totalPurchasedAmount.toLocaleString()} {t.currency}
                    </td>

                    <td className="py-3.5 px-4 text-end font-mono font-medium text-emerald-400">
                      {supplier.totalPaid.toLocaleString()} {t.currency}
                    </td>

                    <td className="py-3.5 px-4 text-end font-mono">
                      {hasDebt ? (
                        <span className="inline-flex items-center gap-1 font-bold text-rose-400 bg-rose-500/10 px-2.5 py-0.5 rounded-lg border border-rose-500/20">
                          {supplier.balanceOwed.toLocaleString()} {t.currency}
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
                            onClick={() => handleOpenSettleModal(supplier)}
                            className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 rounded-lg text-xs font-bold transition-all shadow-md shadow-amber-500/20"
                          >
                            {t.settlePayment}
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => setSelectedHistorySupplier(supplier)}
                          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                          title={t.records}
                        >
                          <History className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`${t.confirmDelete} (${supplier.name})`)) {
                              deleteSupplier(supplier.id);
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

              {filteredSuppliers.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <Truck className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                    <p>{t.showingResults} 0 {t.records}</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Settle Payment Modal (Dark Theme) */}
      {settleModalSupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl border border-slate-800 overflow-hidden text-slate-100">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Wallet className="w-4 h-4 text-amber-400" />
                <span>{t.settleModalTitle}</span>
              </h3>
              <button
                type="button"
                onClick={() => setSettleModalSupplier(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSettleSubmit} className="p-5 space-y-4">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">{t.supplierName}:</span>
                  <span className="font-bold text-white">{settleModalSupplier.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">{t.remainingOwed}:</span>
                  <span className="font-bold text-rose-400 font-mono">
                    {settleModalSupplier.balanceOwed.toLocaleString()} {t.currency}
                  </span>
                </div>
                <div className="flex justify-between border-t border-slate-800 pt-1.5">
                  <span className="text-slate-400">{t.moneyInHandCard}:</span>
                  <span className="font-bold text-emerald-400 font-mono">
                    {db.cashInHand.toLocaleString()} {t.currency}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {t.amountToPay} *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    required
                    min="1"
                    max={settleModalSupplier.balanceOwed}
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm font-mono font-bold text-white focus:outline-none focus:border-amber-500"
                  />
                  <span className="absolute end-3 top-2.5 text-xs text-slate-500 font-medium">
                    {t.currency}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  توضیحات یا نمبر رسید بانکی / حواله صرافی
                </label>
                <input
                  type="text"
                  value={paymentNote}
                  onChange={(e) => setPaymentNote(e.target.value)}
                  placeholder="مثال: رسید حواله صرافی شمس"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/20 text-[11px] text-amber-300">
                {t.paymentSourceNotice}
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSettleModalSupplier(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 text-xs font-bold"
                >
                  {t.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Supplier Transaction History Modal */}
      {selectedHistorySupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl border border-slate-800 overflow-hidden text-slate-100">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <History className="w-4 h-4 text-amber-400" />
                <span>تاریخچه حساب ({selectedHistorySupplier.name})</span>
              </h3>
              <button
                type="button"
                onClick={() => setSelectedHistorySupplier(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 max-h-96 overflow-y-auto space-y-2">
              {selectedHistorySupplier.transactions && selectedHistorySupplier.transactions.length > 0 ? (
                selectedHistorySupplier.transactions.map((h) => (
                  <div key={h.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-center text-xs">
                    <div>
                      <div className="font-mono text-slate-400">{h.date}</div>
                      <div className="text-slate-300 mt-0.5">{h.description}</div>
                    </div>
                    <div className="text-end">
                      <div className="font-bold font-mono text-emerald-400 text-sm">
                        {h.paidAmount.toLocaleString()} {t.currency}
                      </div>
                      {h.remainingAmount > 0 && (
                        <div className="text-[10px] text-rose-400 font-mono">
                          {t.remainingOwed}: {h.remainingAmount.toLocaleString()}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-slate-500 text-xs">
                  {t.noSuppliers}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
