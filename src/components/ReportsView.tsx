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
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-100 text-amber-700">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <span>{t.reportsTitle}</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            {t.reportsDesc}
          </p>
        </div>

        {/* Period Selector & Print CTA */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            {(['daily', 'weekly', 'monthly', 'all'] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  period === p 
                    ? 'bg-amber-600 text-white shadow-xs' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {p === 'daily' ? 'امروز' : p === 'weekly' ? 'هفته گذشته' : p === 'monthly' ? 'ماه گذشته' : 'همه'}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-600/25 transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>چاپ گزارش</span>
          </button>
        </div>
      </div>

      {importStatus && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{importStatus}</span>
        </div>
      )}

      {/* Printable Report Section */}
      <div className="space-y-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm print:shadow-none print:border-none print:p-0">
        {/* Report Header for Print */}
        <div className="hidden print:block text-center pb-6 border-b-2 border-black">
          <h1 className="text-2xl font-black">{t.companyName}</h1>
          <p className="text-sm font-medium mt-1">{t.companySubtitle}</p>
          <p className="text-xs text-slate-600 mt-1">گزارش بیلان مالی و تولید کارخانه ({period}) • تاریخ: {todayStr}</p>
        </div>

        {/* Financial & Production KPI Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
            <span className="text-xs font-semibold text-slate-500">مجموع فروش دوره</span>
            <div className="text-xl font-bold font-mono text-slate-900 mt-1">
              {totalSalesRevenue.toLocaleString()} {t.currency}
            </div>
            <span className="text-xs text-amber-700 font-medium">{filteredSales.length} فاکتور ثبت شده</span>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
            <span className="text-xs font-semibold text-slate-500">مجموع مصارف کارخانه</span>
            <div className="text-xl font-bold font-mono text-rose-700 mt-1">
              {totalExpensesSum.toLocaleString()} {t.currency}
            </div>
            <span className="text-xs text-rose-600 font-medium">{filteredExpenses.length} فقره مصرف</span>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
            <span className="text-xs font-semibold text-slate-500">سود ناخالص عملیاتی</span>
            <div className="text-xl font-bold font-mono text-emerald-700 mt-1">
              {totalGrossProfit.toLocaleString()} {t.currency}
            </div>
            <span className="text-xs text-emerald-600 font-medium">کسر بهای تمام‌شده کالا</span>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
            <span className="text-xs font-semibold text-slate-500">سود خالص نهایی</span>
            <div className={`text-xl font-bold font-mono mt-1 ${netProfit >= 0 ? 'text-emerald-800' : 'text-rose-700'}`}>
              {netProfit.toLocaleString()} {t.currency}
            </div>
            <span className="text-xs text-slate-500">پس از کسر کلیه مصارف</span>
          </div>
        </div>

        {/* Production Output Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500">دانه تولید شده در این دوره</span>
              <div className="text-xl font-bold font-mono text-slate-900 mt-1">
                {totalProducedKg.toLocaleString()} {t.kilo}
              </div>
              <span className="text-xs text-amber-700 font-medium">معادل {totalProducedBags.toLocaleString()} {t.bag}</span>
            </div>
            <div className="p-3 bg-amber-100 text-amber-700 rounded-xl">
              <PackageCheck className="w-6 h-6" />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500">بچ‌های تولیدی خط</span>
              <div className="text-xl font-bold font-mono text-slate-900 mt-1">
                {filteredBatches.length} {t.records}
              </div>
              <span className="text-xs text-slate-500">خط پروسس خودکار</span>
            </div>
            <div className="p-3 bg-blue-100 text-blue-700 rounded-xl">
              <Scale className="w-6 h-6" />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500">مواد خام مصرفی انبار</span>
              <div className="text-xl font-bold font-mono text-slate-900 mt-1">
                {db.rawMaterials.reduce((acc, r) => acc + r.stockKg, 0).toLocaleString()} {t.kilo}
              </div>
              <span className="text-xs text-slate-500">موجودی فعلی سیلوها</span>
            </div>
            <div className="p-3 bg-emerald-100 text-emerald-700 rounded-xl">
              <Wheat className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Database Backup & Restore / Reset Section (Print Hidden) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm print:hidden">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-2">
          <FileText className="w-4 h-4 text-amber-600" />
          <span>مدیریت اطلاعات و پشتیبان‌گیری دیتابیس (Backup & Restore)</span>
        </h3>
        <p className="text-xs text-slate-600 mb-6">
          شما می‌توانید از تمامی اطلاعات کارخانه (موجودی انبار، مشتریان، تامین‌کنندگان، فاکتورها و مصارف) فایل پشتیبان تهیه کرده و یا در صورت لزوم بازیابی کنید.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Export JSON */}
          <button
            type="button"
            onClick={exportDatabase}
            className="p-4 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-900 flex items-center gap-3 transition-colors text-start group"
          >
            <div className="p-3 rounded-lg bg-amber-100 text-amber-700 group-hover:bg-amber-200 transition-colors">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold block text-sm">دانلود فایل پشتیبان (JSON)</span>
              <span className="text-xs text-slate-500">ذخیره تمام اطلاعات در رایانه</span>
            </div>
          </button>

          {/* Import JSON */}
          <label className="p-4 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-900 flex items-center gap-3 transition-colors text-start cursor-pointer group">
            <div className="p-3 rounded-lg bg-blue-100 text-blue-700 group-hover:bg-blue-200 transition-colors">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold block text-sm">بازیابی اطلاعات (Upload)</span>
              <span className="text-xs text-slate-500">بارگذاری فایل پشتیبان قبلی</span>
            </div>
            <input
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>

          {/* Reset to Factory Defaults */}
          <button
            type="button"
            onClick={() => {
              if (window.confirm('آیا مطمئن هستید که می‌خواهید همه اطلاعات را به حالت پیش‌فرض کارخانه بازنشانی کنید؟')) {
                resetToDefaultData();
              }
            }}
            className="p-4 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-rose-700 flex items-center gap-3 transition-colors text-start group"
          >
            <div className="p-3 rounded-lg bg-rose-100 text-rose-700 group-hover:bg-rose-200 transition-colors">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold block text-sm">بازنشانی کارخانه</span>
              <span className="text-xs text-rose-600">پاکسازی و بارگذاری اطلاعات نمونه</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
