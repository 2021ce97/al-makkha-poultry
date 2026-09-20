import React, { useState } from 'react';
import { useDatabase } from '../context/DatabaseContext';
import { 
  FileSpreadsheet, 
  Calendar, 
  Printer, 
  Download, 
  Upload, 
  RotateCcw, 
  TrendingUp, 
  PackageCheck, 
  Receipt, 
  Scale, 
  DollarSign,
  Wheat,
  CheckCircle2,
  FileText
} from 'lucide-react';

export const ReportsView: React.FC = () => {
  const { db, t, lang, exportDatabase, importDatabase, resetToDefaultData, getLocalizedName } = useDatabase();
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'all'>('daily');
  const [importStatus, setImportStatus] = useState<string | null>(null);

  // Helper date filtering
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  const getStartDate = () => {
    const d = new Date();
    if (period === 'daily') return todayStr;
    if (period === 'weekly') {
      d.setDate(d.getDate() - 7);
      return d.toISOString().split('T')[0];
    }
    if (period === 'monthly') {
      d.setDate(d.getDate() - 30);
      return d.toISOString().split('T')[0];
    }
    return '1970-01-01';
  };

  const startDate = getStartDate();

  // Filter items in period
  const filteredSales = db.sales.filter(s => period === 'all' || (s.date >= startDate && s.date <= todayStr));
  const filteredBatches = db.productionBatches.filter(b => period === 'all' || (b.date >= startDate && b.date <= todayStr));
  const filteredExpenses = db.expenses.filter(e => period === 'all' || (e.date >= startDate && e.date <= todayStr));

  // Financial aggregates
  const totalSalesRevenue = filteredSales.reduce((acc, s) => acc + s.totalAmount, 0);
  const totalSalesCogs = filteredSales.reduce((acc, s) => acc + s.totalCostOfGoods, 0);
  const totalExpensesSum = filteredExpenses.reduce((acc, e) => acc + e.amount, 0);
  const totalGrossProfit = totalSalesRevenue - totalSalesCogs;
  const netProfit = totalGrossProfit - totalExpensesSum;

  const totalProducedKg = filteredBatches.reduce((acc, b) => acc + b.totalWeightKg, 0);
  const totalProducedBags = Math.round(totalProducedKg / 50);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const success = importDatabase(content);
        if (success) {
          setImportStatus('دیتابیس با موفقیت بارگذاری و بازیابی شد.');
          setTimeout(() => setImportStatus(null), 4000);
        } else {
          setImportStatus('خطا در بارگذاری فایل دیتابیس.');
          setTimeout(() => setImportStatus(null), 4000);
        }
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      {/* Header with period toggle and print */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-xl print:hidden">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <span>{t.reportsTitle}</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            {t.reportsDesc}
          </p>
        </div>

        {/* Period Selector & Print CTA */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
            {(['daily', 'weekly', 'monthly', 'all'] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  period === p
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {p === 'daily' ? t.periodDaily : p === 'weekly' ? t.periodWeekly : p === 'monthly' ? t.periodMonthly : t.all}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition-colors"
          >
            <Printer className="w-4 h-4 text-amber-400" />
            <span>{t.printReport}</span>
          </button>
        </div>
      </div>

      {importStatus && (
        <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{importStatus}</span>
        </div>
      )}

      {/* Printable Sheet Wrapper */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-xl p-6 space-y-6 print:bg-white print:text-black print:border-none print:shadow-none print:p-0">
        
        {/* Printable Report Header */}
        <div className="border-b border-slate-800 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-black text-white print:text-black">{t.companyName}</h1>
            <p className="text-xs text-amber-400 print:text-stone-600 mt-0.5">{t.companySubtitle}</p>
            <span className="text-xs text-slate-400 print:text-stone-500 block mt-1">
              گزارش عملکرد: {period === 'daily' ? t.periodDaily : period === 'weekly' ? t.periodWeekly : period === 'monthly' ? t.periodMonthly : t.all}
            </span>
          </div>

          <div className="text-start sm:text-end text-xs text-slate-400 print:text-stone-600 font-mono space-y-1">
            <div className="text-amber-400 print:text-black font-semibold">
              {t.companyPhoneLabel} <span className="font-bold tracking-wider" dir="ltr">0780 001 923</span>
            </div>
            <div>تاریخ گزارش: {todayStr}</div>
            <div>ارز محاسباتی: {t.currency} (افغانی)</div>
          </div>
        </div>

        {/* 4 Primary Financial Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 print:bg-stone-50 print:border-stone-300">
            <span className="text-xs text-slate-400 print:text-stone-600 block">{t.totalSaleAmount}</span>
            <div className="text-xl font-bold font-mono text-cyan-400 print:text-black mt-1">
              {totalSalesRevenue.toLocaleString()} {t.currency}
            </div>
            <span className="text-[11px] text-slate-500 block mt-1">{filteredSales.length} {t.records}</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 print:bg-stone-50 print:border-stone-300">
            <span className="text-xs text-slate-400 print:text-stone-600 block">{t.totalBatchCost}</span>
            <div className="text-xl font-bold font-mono text-amber-400 print:text-black mt-1">
              {totalSalesCogs.toLocaleString()} {t.currency}
            </div>
            <span className="text-[11px] text-slate-500 block mt-1">هزینه مواد دانه فروخته شده</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 print:bg-stone-50 print:border-stone-300">
            <span className="text-xs text-slate-400 print:text-stone-600 block">{t.totalExpensesCard}</span>
            <div className="text-xl font-bold font-mono text-orange-400 print:text-black mt-1">
              {totalExpensesSum.toLocaleString()} {t.currency}
            </div>
            <span className="text-[11px] text-slate-500 block mt-1">{filteredExpenses.length} {t.records} مصارف جاری</span>
          </div>

          <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/30 print:bg-stone-100 print:border-stone-400">
            <span className="text-xs text-emerald-300 print:text-stone-700 block font-bold">{t.netProfit}</span>
            <div className="text-2xl font-black font-mono text-emerald-400 print:text-black mt-1">
              {netProfit.toLocaleString()} {t.currency}
            </div>
            <span className="text-[11px] text-emerald-300 print:text-stone-600 block mt-1">
              سود خالص نهایی
            </span>
          </div>
        </div>

        {/* Detailed Breakdown Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Production Output */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 print:border-stone-300">
            <h3 className="text-sm font-bold text-white print:text-black flex items-center gap-2 mb-3">
              <PackageCheck className="w-4 h-4 text-emerald-400" />
              <span>{t.dailyProcessedCard}</span>
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between py-2 border-b border-slate-800 text-xs">
                <span className="text-slate-400">مجموع تولید دوره:</span>
                <span className="font-bold font-mono text-white print:text-black">{totalProducedKg.toLocaleString()} {t.kilo}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-800 text-xs">
                <span className="text-slate-400">تعداد بوجی (۵۰ کیلویی):</span>
                <span className="font-bold font-mono text-amber-400 print:text-black">{totalProducedBags.toLocaleString()} {t.bag}</span>
              </div>
              <div className="flex justify-between py-2 text-xs">
                <span className="text-slate-400">تعداد دفعات میکس / بتچ:</span>
                <span className="font-bold font-mono text-white print:text-black">{filteredBatches.length} {t.records}</span>
              </div>
            </div>
          </div>

          {/* Cash & Assets Overview */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 print:border-stone-300">
            <h3 className="text-sm font-bold text-white print:text-black flex items-center gap-2 mb-3">
              <DollarSign className="w-4 h-4 text-amber-400" />
              <span>وضعیت نقدی و طلبات فعال</span>
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between py-2 border-b border-slate-800 text-xs">
                <span className="text-slate-400">{t.moneyInHandCard}:</span>
                <span className="font-bold font-mono text-emerald-400 print:text-black">{db.cashInHand.toLocaleString()} {t.currency}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-800 text-xs">
                <span className="text-slate-400">{t.receivableCustomersCard}:</span>
                <span className="font-bold font-mono text-cyan-400 print:text-black">
                  {db.customers.reduce((a, c) => a + c.balanceOwed, 0).toLocaleString()} {t.currency}
                </span>
              </div>
              <div className="flex justify-between py-2 text-xs">
                <span className="text-slate-400">{t.oweSuppliersCard}:</span>
                <span className="font-bold font-mono text-rose-400 print:text-black">
                  {db.suppliers.reduce((a, s) => a + s.balanceOwed, 0).toLocaleString()} {t.currency}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Official Printable Report Footer */}
        <div className="hidden print:block border-t border-stone-300 pt-6 mt-8 text-xs text-stone-800">
          <div className="flex justify-between text-center pb-6">
            <div>
              <div className="h-12"></div>
              <span className="font-semibold">امضاء و مهر مدیریت مالی و اداری</span>
            </div>
            <div>
              <div className="h-12"></div>
              <span className="font-semibold">امضاء مدیر عمومی کارخانه</span>
            </div>
          </div>
          <div className="text-center text-[11px] text-stone-600 border-t border-stone-200 pt-2.5 flex items-center justify-between">
            <span className="font-bold">{t.companyName}</span>
            <span>{t.companyPhoneLabel} <strong className="font-mono font-bold text-stone-900" dir="ltr">0780 001 923</strong></span>
            <span>{t.factoryAddress}</span>
          </div>
        </div>

        {/* Database Backup & Export Section (Hidden on Print) */}
        <div className="border-t border-slate-800 pt-6 print:hidden">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-2">
            <FileText className="w-4 h-4 text-amber-400" />
            <span>مدیریت و پشتیبان‌گیری دیتابیس (Backup & Restore)</span>
          </h3>
          <p className="text-xs text-slate-400 mb-4">
            می‌توانید تمام اطلاعات گدام، فرمول‌ها، فروشات، عرضه کنندگان و حسابات را دانلود نموده و ذخیره نگهدارید.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={exportDatabase}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-950 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition-colors"
            >
              <Download className="w-4 h-4 text-cyan-400" />
              <span>{t.exportJson}</span>
            </button>

            <label className="flex items-center gap-2 px-4 py-2.5 bg-slate-950 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer">
              <Upload className="w-4 h-4 text-amber-400" />
              <span>{t.importJson}</span>
              <input
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            <button
              type="button"
              onClick={() => {
                if (window.confirm(t.confirmResetDatabase)) {
                  resetToDefaultData();
                }
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-semibold transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              <span>{t.resetDatabase}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
