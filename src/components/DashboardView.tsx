import React, { useState } from 'react';
import { useDatabase } from '../context/DatabaseContext';
import { 
  Wheat, 
  PackageCheck, 
  Truck, 
  Users, 
  TrendingUp, 
  Wallet, 
  Receipt, 
  CalendarClock, 
  ArrowUpRight, 
  AlertTriangle,
  CheckCircle2,
  SlidersHorizontal,
  ChevronRight,
  ChevronLeft,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  AreaChart,
  Area
} from 'recharts';

interface DashboardViewProps {
  setActiveTab: (tab: any) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ setActiveTab }) => {
  const { 
    db, 
    t, 
    lang, 
    lowStockThreshold, 
    setLowStockThreshold, 
    lowStockMaterials,
    getLocalizedName,
    isSupabaseConnected 
  } = useDatabase();

  const [editingThreshold, setEditingThreshold] = useState(false);
  const [thresholdInput, setThresholdInput] = useState(lowStockThreshold.toString());
  const isRtl = lang === 'fa' || lang === 'ps';

  // 1. RAW stock in kilo
  const totalRawStockKg = db.rawMaterials.reduce((acc, r) => acc + (r.stockKg || 0), 0);
  const totalRawStockValue = db.rawMaterials.reduce((acc, r) => acc + (r.stockKg * r.unitPrice || 0), 0);

  // 2. Processed Stock in kilo and bags (1 bag = 50 kg)
  const totalProcessedKg = db.processedStock.reduce((acc, p) => acc + (p.stockKg || 0), 0);
  const totalProcessedBags = Math.round(totalProcessedKg / 50);

  // 3. Money we owe to suppliers
  const totalOwedToSuppliers = db.suppliers.reduce((acc, s) => acc + (s.balanceOwed || 0), 0);

  // 4. Money payable by customers
  const totalReceivableFromCustomers = db.customers.reduce((acc, c) => acc + (c.balanceOwed || 0), 0);

  // 5. Total processed material sold
  const totalSalesAmount = db.sales.reduce((acc, s) => acc + (s.totalAmount || 0), 0);
  const totalSalesKg = db.sales.reduce((acc, s) => acc + (s.quantityKg || 0), 0);
  const totalGrossProfit = db.sales.reduce((acc, s) => acc + (s.profit || 0), 0);

  // 6. Money in Hand
  const moneyInHand = db.cashInHand;

  // 7. Total expenses
  const totalExpenses = db.expenses.reduce((acc, e) => acc + (e.amount || 0), 0);

  // 8. Daily Processed material (today's batches)
  const todayStr = new Date().toISOString().split('T')[0];
  const todayBatches = db.productionBatches.filter(b => b.date === todayStr);
  const dailyProcessedKg = todayBatches.reduce((acc, b) => acc + (b.totalWeightKg || 0), 0);
  const dailyProcessedBags = Math.round(dailyProcessedKg / 50);

  // Chart data for trend
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });

  const trendData = last7Days.map(date => {
    const daySales = db.sales
      .filter(s => s.date === date)
      .reduce((sum, s) => sum + s.totalAmount, 0);
    const dayCost = db.sales
      .filter(s => s.date === date)
      .reduce((sum, s) => sum + s.totalCostOfGoods, 0);
    const dayExp = db.expenses
      .filter(e => e.date === date)
      .reduce((sum, e) => sum + e.amount, 0);
    const netProfit = daySales - dayCost - dayExp;

    const parts = date.split('-');
    const label = `${parts[1]}/${parts[2]}`;

    return {
      date: label,
      sales: daySales,
      expenses: dayExp,
      profit: Math.max(0, netProfit),
    };
  });

  // Inventory breakdown for pie chart
  const COLORS = ['#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899'];
  const inventoryPieData = db.rawMaterials.map(rm => ({
    name: getLocalizedName(rm.name).split('(')[0].trim(),
    value: rm.stockKg,
  })).filter(item => item.value > 0);

  const handleSaveThreshold = (e: React.FormEvent) => {
    e.preventDefault();
    const val = Number(thresholdInput);
    if (!isNaN(val) && val > 0) {
      setLowStockThreshold(val);
      setEditingThreshold(false);
    }
  };

  // Rectangular clickable cards configuration
  const rectangularCards = [
    {
      id: 'raw-stock',
      title: t.rawStockCard,
      value: `${totalRawStockKg.toLocaleString()} ${t.kilo}`,
      subvalue: `${(totalRawStockKg / 1000).toFixed(1)} ${t.ton} (${totalRawStockValue.toLocaleString()} ${t.currency})`,
      icon: Wheat,
      bg: 'bg-slate-900/90 hover:bg-slate-850',
      border: 'border-amber-500/30 hover:border-amber-500/60',
      textColor: 'text-amber-400',
      accentColor: 'text-amber-300',
      iconBg: 'bg-amber-500/15 text-amber-400',
      tab: 'inventory',
      badge: `${db.rawMaterials.length} ${t.itemsCount}`,
      hasAlert: lowStockMaterials.length > 0,
    },
    {
      id: 'processed-stock',
      title: t.processedStockCard,
      value: `${totalProcessedKg.toLocaleString()} ${t.kilo}`,
      subvalue: `${totalProcessedBags.toLocaleString()} ${t.bag} (${(totalProcessedKg / 1000).toFixed(1)} ${t.ton})`,
      icon: PackageCheck,
      bg: 'bg-slate-900/90 hover:bg-slate-850',
      border: 'border-emerald-500/30 hover:border-emerald-500/60',
      textColor: 'text-emerald-400',
      accentColor: 'text-emerald-300',
      iconBg: 'bg-emerald-500/15 text-emerald-400',
      tab: 'formula',
      badge: `${db.processedStock.length} ${t.records}`,
    },
    {
      id: 'owe-suppliers',
      title: t.oweSuppliersCard,
      value: `${totalOwedToSuppliers.toLocaleString()} ${t.currency}`,
      subvalue: `${db.suppliers.filter(s => s.balanceOwed > 0).length} ${t.navSuppliers}`,
      icon: Truck,
      bg: 'bg-slate-900/90 hover:bg-slate-850',
      border: 'border-rose-500/30 hover:border-rose-500/60',
      textColor: 'text-rose-400',
      accentColor: 'text-rose-300',
      iconBg: 'bg-rose-500/15 text-rose-400',
      tab: 'suppliers',
      badge: totalOwedToSuppliers > 0 ? t.statusUnpaid : t.statusPaid,
    },
    {
      id: 'payable-customers',
      title: t.receivableCustomersCard,
      value: `${totalReceivableFromCustomers.toLocaleString()} ${t.currency}`,
      subvalue: `${db.customers.filter(c => c.balanceOwed > 0).length} ${t.navCustomers}`,
      icon: Users,
      bg: 'bg-slate-900/90 hover:bg-slate-850',
      border: 'border-blue-500/30 hover:border-blue-500/60',
      textColor: 'text-blue-400',
      accentColor: 'text-blue-300',
      iconBg: 'bg-blue-500/15 text-blue-400',
      tab: 'customers',
      badge: totalReceivableFromCustomers > 0 ? t.statusUnpaid : t.statusPaid,
    },
    {
      id: 'total-processed-sold',
      title: t.totalProcessedSellCard,
      value: `${totalSalesAmount.toLocaleString()} ${t.currency}`,
      subvalue: `${totalSalesKg.toLocaleString()} ${t.kilo} (${Math.round(totalSalesKg / 50)} ${t.bag})`,
      icon: TrendingUp,
      bg: 'bg-slate-900/90 hover:bg-slate-850',
      border: 'border-cyan-500/30 hover:border-cyan-500/60',
      textColor: 'text-cyan-400',
      accentColor: 'text-cyan-300',
      iconBg: 'bg-cyan-500/15 text-cyan-400',
      tab: 'sales',
      badge: `${totalGrossProfit.toLocaleString()} ${t.currency}`,
    },
    {
      id: 'money-in-hand',
      title: t.moneyInHandCard,
      value: `${moneyInHand.toLocaleString()} ${t.currency}`,
      subvalue: t.moneyInHandCard,
      icon: Wallet,
      bg: 'bg-slate-900/90 hover:bg-slate-850',
      border: 'border-emerald-400/40 hover:border-emerald-400/70',
      textColor: 'text-emerald-300',
      accentColor: 'text-emerald-200',
      iconBg: 'bg-emerald-500/20 text-emerald-300',
      tab: 'expenses',
      badge: t.currency,
    },
    {
      id: 'total-expenses',
      title: t.totalExpensesCard,
      value: `${totalExpenses.toLocaleString()} ${t.currency}`,
      subvalue: `${db.expenses.length} ${t.records}`,
      icon: Receipt,
      bg: 'bg-slate-900/90 hover:bg-slate-850',
      border: 'border-orange-500/30 hover:border-orange-500/60',
      textColor: 'text-orange-400',
      accentColor: 'text-orange-300',
      iconBg: 'bg-orange-500/15 text-orange-400',
      tab: 'expenses',
      badge: `${db.expenses.length} ${t.records}`,
    },
    {
      id: 'daily-processed',
      title: t.dailyProcessedCard,
      value: `${dailyProcessedKg.toLocaleString()} ${t.kilo}`,
      subvalue: `${dailyProcessedBags} ${t.bag} (${todayBatches.length} ${t.records})`,
      icon: CalendarClock,
      bg: 'bg-slate-900/90 hover:bg-slate-850',
      border: 'border-indigo-500/30 hover:border-indigo-500/60',
      textColor: 'text-indigo-400',
      accentColor: 'text-indigo-300',
      iconBg: 'bg-indigo-500/15 text-indigo-400',
      tab: 'formula',
      badge: `${todayBatches.length} ${t.records}`,
    },
  ];

  return (
    <div className="space-y-6">
      {/* 0. SUPABASE CONNECTION STATUS */}
      <div className="flex justify-end">
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[10px] font-bold tracking-wider backdrop-blur-md transition-all ${
          isSupabaseConnected 
            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-lg shadow-emerald-500/5' 
            : 'bg-slate-900/50 text-slate-500 border-slate-800'
        }`}>
          <div className={`w-1.5 h-1.5 rounded-full ${isSupabaseConnected ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
          <span>{isSupabaseConnected ? 'SUPABASE: ACTIVE' : 'SUPABASE: DISCONNECTED'}</span>
        </div>
      </div>

      {/* 1. VISUAL NOTIFICATION SYSTEM BANNER (LOW STOCK HIGHLIGHT) */}
      {lowStockMaterials.length > 0 ? (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-rose-950/70 via-slate-900/90 to-amber-950/60 border border-rose-500/40 shadow-xl shadow-rose-950/20 relative overflow-hidden">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-400 shrink-0 animate-pulse">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-base sm:text-lg text-white">
                    {t.lowStockNotificationTitle}
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-500 text-white">
                    {lowStockMaterials.length} {t.itemsCount}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 mt-1">
                  {t.lowStockWarningMessage
                    .replace('{count}', lowStockMaterials.length.toString())
                    .replace('{threshold}', lowStockThreshold.toLocaleString())}
                </p>
              </div>
            </div>

            {/* Threshold quick controls & Restock CTA */}
            <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-auto">
              {!editingThreshold ? (
                <button
                  type="button"
                  onClick={() => {
                    setThresholdInput(lowStockThreshold.toString());
                    setEditingThreshold(true);
                  }}
                  className="px-3 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-300 flex items-center gap-1.5 transition-colors"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
                  <span>{t.lowStockThresholdLabel} {lowStockThreshold.toLocaleString()} {t.kilo}</span>
                </button>
              ) : (
                <form onSubmit={handleSaveThreshold} className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min="100"
                    step="100"
                    value={thresholdInput}
                    onChange={(e) => setThresholdInput(e.target.value)}
                    className="w-24 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white font-mono"
                  />
                  <button
                    type="submit"
                    className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold"
                  >
                    {t.saveThreshold}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingThreshold(false)}
                    className="px-2 py-1 rounded-lg bg-slate-800 text-slate-400 text-xs"
                  >
                    {t.cancel}
                  </button>
                </form>
              )}

              <button
                type="button"
                onClick={() => setActiveTab('inventory')}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-bold shadow-md shadow-amber-500/20 transition-all flex items-center gap-1.5"
              >
                <span>{t.restockNow}</span>
                {isRtl ? <ArrowLeft className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Visual Chips of Highlighted Low Stock Materials */}
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-slate-400">{t.itemsNeedRestock}:</span>
            {lowStockMaterials.map(rm => (
              <span
                key={rm.id}
                onClick={() => setActiveTab('inventory')}
                className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-rose-500/10 border border-rose-500/30 hover:bg-rose-500/20 text-xs font-semibold text-rose-300 cursor-pointer transition-colors"
              >
                <span>{getLocalizedName(rm.name)}</span>
                <span className="font-mono bg-rose-500/30 px-1.5 py-0.5 rounded text-[11px] text-white">
                  {rm.stockKg.toLocaleString()} {t.kilo}
                </span>
              </span>
            ))}
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-emerald-500/20 flex items-center justify-between gap-3 text-xs sm:text-sm text-slate-300">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{t.allStockHealthy}</span>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {t.lowStockThresholdLabel} {lowStockThreshold.toLocaleString()} {t.kilo}
          </span>
        </div>
      )}

      {/* 2. RECTANGULAR CLICKABLE METRIC TABLES / CARDS */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-white tracking-tight">
            {t.companySubtitle}
          </h2>
          <span className="text-xs text-slate-400">
            {t.viewDetails}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {rectangularCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.id}
                onClick={() => setActiveTab(card.tab)}
                className={`p-5 rounded-2xl border transition-all duration-200 cursor-pointer group shadow-lg shadow-black/40 hover:-translate-y-0.5 ${card.bg} ${card.border}`}
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className={`p-2.5 rounded-xl ${card.iconBg} transition-transform group-hover:scale-110`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-800/80 border border-slate-700/80 text-slate-300">
                    {card.badge}
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-medium text-slate-400 block line-clamp-1">
                    {card.title}
                  </span>
                  <div className={`text-xl sm:text-2xl font-black tracking-tight font-mono ${card.textColor}`}>
                    {card.value}
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-1 pt-1 border-t border-slate-800/80">
                    {card.subvalue}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. CHARTS & ANALYTICS ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales & Profit Trend (2 Columns) */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-sm text-white">{t.salesSummary} & {t.reportsTitle}</h3>
              <p className="text-xs text-slate-400">{t.periodWeekly}</p>
            </div>
            <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
              {t.netProfit}: {totalGrossProfit.toLocaleString()} {t.currency}
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Area type="monotone" dataKey="sales" name={t.totalSaleAmount} stroke="#f59e0b" fillOpacity={1} fill="url(#salesGrad)" />
                <Area type="monotone" dataKey="profit" name={t.netProfit} stroke="#10b981" fillOpacity={1} fill="url(#profitGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Raw Material Inventory Distribution (1 Column) */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="font-bold text-sm text-white">{t.inventoryTitle}</h3>
              <p className="text-xs text-slate-400">{t.totalFormulaWeight} (kg)</p>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('inventory')}
              className="text-xs text-amber-400 hover:underline font-semibold"
            >
              {t.viewDetails}
            </button>
          </div>

          <div className="h-56 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={inventoryPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {inventoryPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff' }}
                  formatter={(value: any) => [`${Number(value).toLocaleString()} ${t.kilo}`, '']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legend chips */}
          <div className="flex flex-wrap gap-1.5 justify-center max-h-20 overflow-y-auto">
            {inventoryPieData.map((item, idx) => (
              <span key={item.name} className="inline-flex items-center gap-1.5 text-[10px] text-slate-300 bg-slate-950 px-2 py-0.5 rounded-md border border-slate-800">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                <span>{item.name}</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
