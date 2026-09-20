import React, { useState } from 'react';
import { useDatabase } from '../context/DatabaseContext';
import { ExpenseCategory } from '../types';
import { 
  Receipt, 
  Plus, 
  Fuel, 
  Users, 
  Utensils, 
  Zap, 
  Wrench, 
  Truck, 
  Building, 
  MoreHorizontal, 
  Trash2, 
  Wallet,
  Calendar,
  AlertCircle,
  X
} from 'lucide-react';

export const ExpensesView: React.FC = () => {
  const { db, t, addExpense, deleteExpense } = useDatabase();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');

  // Form State
  const [category, setCategory] = useState<ExpenseCategory>('fuel');
  const [amount, setAmount] = useState<number | ''>('');
  const [description, setDescription] = useState('');
  const [paidBy, setPaidBy] = useState('');
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Category Configs with Icons (Dark Theme friendly)
  const categoryConfig: Record<ExpenseCategory, { name: string; icon: any; color: string; bg: string; border: string }> = {
    fuel: {
      name: t.expenseCategories.fuel,
      icon: Fuel,
      color: 'text-amber-400',
      bg: 'bg-amber-500/15',
      border: 'border-amber-500/30',
    },
    salary: {
      name: t.expenseCategories.salary,
      icon: Users,
      color: 'text-blue-400',
      bg: 'bg-blue-500/15',
      border: 'border-blue-500/30',
    },
    food: {
      name: t.expenseCategories.food,
      icon: Utensils,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/15',
      border: 'border-emerald-500/30',
    },
    electricity: {
      name: t.expenseCategories.electricity,
      icon: Zap,
      color: 'text-yellow-400',
      bg: 'bg-yellow-500/15',
      border: 'border-yellow-500/30',
    },
    maintenance: {
      name: t.expenseCategories.maintenance,
      icon: Wrench,
      color: 'text-purple-400',
      bg: 'bg-purple-500/15',
      border: 'border-purple-500/30',
    },
    transport: {
      name: t.expenseCategories.transport,
      icon: Truck,
      color: 'text-cyan-400',
      bg: 'bg-cyan-500/15',
      border: 'border-cyan-500/30',
    },
    rent: {
      name: t.expenseCategories.rent,
      icon: Building,
      color: 'text-rose-400',
      bg: 'bg-rose-500/15',
      border: 'border-rose-500/30',
    },
    other: {
      name: t.expenseCategories.other,
      icon: MoreHorizontal,
      color: 'text-slate-400',
      bg: 'bg-slate-800',
      border: 'border-slate-700',
    },
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) {
      setErrorMsg(t.expenseAmount);
      return;
    }
    if (!description.trim()) {
      setErrorMsg(t.expenseDescLabel);
      return;
    }

    addExpense({
      category,
      amount: Number(amount),
      description: description.trim(),
      paidBy: paidBy.trim() || undefined,
      notes: notes.trim() || undefined,
    });

    setIsModalOpen(false);
    setAmount('');
    setDescription('');
    setPaidBy('');
    setNotes('');
    setErrorMsg('');
  };

  const totalAllExpenses = db.expenses.reduce((acc, e) => acc + e.amount, 0);

  const categoriesList: ExpenseCategory[] = [
    'fuel',
    'salary',
    'food',
    'electricity',
    'maintenance',
    'transport',
    'rent',
    'other',
  ];

  const filteredExpenses = db.expenses.filter(e => 
    selectedCategoryFilter === 'all' || e.category === selectedCategoryFilter
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-orange-500/20 text-orange-400">
              <Receipt className="w-5 h-5" />
            </div>
            <span>{t.expensesTitle}</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            {t.expensesDesc}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-slate-950 font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-orange-500/20 transition-all cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>{t.addExpenseBtn}</span>
          </button>
        </div>
      </div>

      {/* Financial Banners (Dark Theme) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400">{t.totalExpensesCard}</span>
            <div className="text-2xl font-black font-mono text-orange-400 mt-1">
              {totalAllExpenses.toLocaleString()} {t.currency}
            </div>
            <span className="text-xs text-slate-400">{db.expenses.length} {t.records}</span>
          </div>
          <div className="p-3.5 bg-orange-500/15 text-orange-400 rounded-xl border border-orange-500/20">
            <Receipt className="w-7 h-7" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-emerald-500/30 bg-emerald-950/20 shadow-lg flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-emerald-300">{t.moneyInHandCard}</span>
            <div className="text-2xl font-black font-mono text-emerald-400 mt-1">
              {db.cashInHand.toLocaleString()} {t.currency}
            </div>
            <span className="text-xs text-emerald-300">{t.moneyInHandNotice}</span>
          </div>
          <div className="p-3.5 bg-emerald-500/15 text-emerald-400 rounded-xl border border-emerald-500/30">
            <Wallet className="w-7 h-7" />
          </div>
        </div>
      </div>

      {/* Category breakdown chips (Clickable filter) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
        <button
          type="button"
          onClick={() => setSelectedCategoryFilter('all')}
          className={`p-3 rounded-xl border transition-all text-center ${
            selectedCategoryFilter === 'all'
              ? 'bg-amber-500 text-slate-950 border-amber-500 font-bold'
              : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-850'
          }`}
        >
          <div className="text-xs">{t.allCategories}</div>
          <div className="font-mono text-xs mt-1">({db.expenses.length})</div>
        </button>

        {categoriesList.map(cat => {
          const cfg = categoryConfig[cat];
          const Icon = cfg.icon;
          const sumCat = db.expenses.filter(e => e.category === cat).reduce((s, e) => s + e.amount, 0);
          const isSelected = selectedCategoryFilter === cat;

          return (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategoryFilter(isSelected ? 'all' : cat)}
              className={`p-2.5 rounded-xl border transition-all flex flex-col items-center justify-between text-center ${
                isSelected
                  ? 'bg-slate-800 border-amber-500 ring-1 ring-amber-500 text-white'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-850'
              }`}
            >
              <div className={`p-1.5 rounded-lg ${cfg.bg} ${cfg.color} mb-1`}>
                <Icon className="w-3.5 h-3.5" />
              </div>
              <span className="text-[11px] font-semibold block line-clamp-1">{cfg.name}</span>
              <span className="text-[10px] font-mono text-slate-400 mt-0.5">
                {sumCat > 0 ? `${(sumCat / 1000).toFixed(0)}k` : '0'}
              </span>
            </button>
          );
        })}
      </div>

      {/* Expenses History Table (Dark Theme) */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white">
            {t.expensesHistory} ({filteredExpenses.length} {t.records})
          </h3>
          {selectedCategoryFilter !== 'all' && (
            <button
              type="button"
              onClick={() => setSelectedCategoryFilter('all')}
              className="text-xs text-amber-400 hover:underline"
            >
              {t.clearFilters}
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-slate-300 text-start">
            <thead className="bg-slate-950/80 text-slate-400 text-[11px] font-semibold uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 text-start">{t.date}</th>
                <th className="py-3 px-4 text-start">{t.category}</th>
                <th className="py-3 px-4 text-start">{t.expenseDescription}</th>
                <th className="py-3 px-4 text-start">{t.paidByPerson}</th>
                <th className="py-3 px-4 text-end">{t.expenseAmount}</th>
                <th className="py-3 px-4 text-center">{t.action}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredExpenses.map((expense) => {
                const cfg = categoryConfig[expense.category] || categoryConfig.other;
                const Icon = cfg.icon;

                return (
                  <tr key={expense.id} className="hover:bg-slate-850/50 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-slate-400 whitespace-nowrap">
                      {expense.date}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-lg ${cfg.bg} ${cfg.color} border ${cfg.border}`}>
                        <Icon className="w-3.5 h-3.5" />
                        <span>{cfg.name}</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-white">{expense.description}</div>
                      {expense.notes && (
                        <div className="text-[11px] text-slate-400 italic mt-0.5">{expense.notes}</div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">
                      {expense.paidBy || '---'}
                    </td>
                    <td className="py-3.5 px-4 text-end font-mono font-bold text-orange-400 whitespace-nowrap">
                      {expense.amount.toLocaleString()} {t.currency}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`${t.confirmDelete} (${expense.description})`)) {
                            deleteExpense(expense.id);
                          }
                        }}
                        className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                        title={t.delete}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filteredExpenses.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <Receipt className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                    <p>{t.showingResults} 0 {t.records}</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Expense Modal (Dark Theme) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl border border-slate-800 overflow-hidden text-slate-100">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Receipt className="w-4 h-4 text-orange-400" />
                <span>{t.addExpenseBtn}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="m-4 p-3 bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {t.category} *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                >
                  {categoriesList.map(cat => (
                    <option key={cat} value={cat}>
                      {categoryConfig[cat].name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {t.expenseAmount} ({t.currency}) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  step="any"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value ? Number(e.target.value) : '')}
                  placeholder="5000"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm font-mono font-bold text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {t.expenseDescription} *
                </label>
                <input
                  type="text"
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="مثال: خرید ۲۰۰ لیتر تیل دیزل برای جنراتور"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {t.paidByPerson}
                </label>
                <input
                  type="text"
                  value={paidBy}
                  onChange={(e) => setPaidBy(e.target.value)}
                  placeholder="نام شخص پرداخت کننده یا خزانه‌دار"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  یادداشت بیشتر
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="شماره فاکتور پمپ بنزین..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/20 text-[11px] text-amber-300">
                {t.paymentSourceNotice}
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-slate-950 text-xs font-bold"
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
