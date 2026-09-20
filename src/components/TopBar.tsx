import React, { useState } from 'react';
import { useDatabase } from '../context/DatabaseContext';
import { 
  Menu, 
  Bell, 
  Wallet, 
  AlertTriangle, 
  SlidersHorizontal, 
  CheckCircle2, 
  LogOut, 
  Globe2,
  X,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';
import { ActiveTab } from './Sidebar';
import { Language } from '../types';

interface TopBarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenMobileMenu: () => void;
  onOpenRestockModal?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  activeTab,
  setActiveTab,
  onOpenMobileMenu,
  onOpenRestockModal,
}) => {
  const { 
    lang, 
    setLang, 
    t, 
    db, 
    user, 
    logout, 
    lowStockThreshold, 
    setLowStockThreshold, 
    lowStockMaterials,
    getLocalizedName
  } = useDatabase();

  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [editingThreshold, setEditingThreshold] = useState(false);
  const [thresholdInput, setThresholdInput] = useState(lowStockThreshold.toString());

  const isRtl = lang === 'fa' || lang === 'ps';

  const getTabTitle = (): string => {
    switch (activeTab) {
      case 'dashboard': return t.navDashboard;
      case 'inventory': return t.navInventory;
      case 'formula': return t.navFormula;
      case 'sales': return t.navSales;
      case 'suppliers': return t.navSuppliers;
      case 'customers': return t.navCustomers;
      case 'expenses': return t.navExpenses;
      case 'reports': return t.navReports;
      default: return t.companyName;
    }
  };

  const handleSaveThreshold = (e: React.FormEvent) => {
    e.preventDefault();
    const val = Number(thresholdInput);
    if (!isNaN(val) && val > 0) {
      setLowStockThreshold(val);
      setEditingThreshold(false);
    }
  };

  const handleGoToInventory = () => {
    setActiveTab('inventory');
    setShowNotificationModal(false);
    if (onOpenRestockModal) {
      onOpenRestockModal();
    }
  };

  return (
    <>
      <header className="sticky top-0 z-20 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
        {/* Left / Start: Mobile Menu Toggle & Title */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onOpenMobileMenu}
            className="lg:hidden p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div>
            <h1 className="text-base sm:text-lg font-bold text-white tracking-tight truncate flex items-center gap-2">
              <span>{getTabTitle()}</span>
            </h1>
            <span className="text-[11px] text-slate-400 hidden md:inline-flex items-center gap-1.5">
              <span>{t.companyName}</span>
              <span className="text-slate-600">•</span>
              <span className="text-amber-400/90 font-mono" dir="ltr">0780 001 923</span>
            </span>
          </div>
        </div>

        {/* Right / End: Notification Bell, Cash Balance, Language & Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Cash in Hand Quick Badge */}
          <div 
            onClick={() => setActiveTab('expenses')}
            className="cursor-pointer hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/80 hover:border-amber-500/50 transition-all text-xs"
            title={t.moneyInHandCard}
          >
            <Wallet className="w-4 h-4 text-emerald-400" />
            <div className="flex flex-col text-start">
              <span className="text-[10px] text-slate-400 leading-none">{t.moneyInHandCard}</span>
              <span className="font-bold text-emerald-300 font-mono">
                {db.cashInHand.toLocaleString()} {t.currency}
              </span>
            </div>
          </div>

          {/* Low Stock Notification Bell */}
          <button
            type="button"
            onClick={() => setShowNotificationModal(true)}
            className={`relative p-2 rounded-xl border transition-all ${
              lowStockMaterials.length > 0
                ? 'bg-rose-500/15 border-rose-500/40 text-rose-300 hover:bg-rose-500/25 animate-pulse'
                : 'bg-slate-800/80 border-slate-700/80 text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
            title={t.notifications}
          >
            <Bell className="w-5 h-5" />
            {lowStockMaterials.length > 0 && (
              <span className="absolute -top-1 -end-1 w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center shadow-md">
                {lowStockMaterials.length}
              </span>
            )}
          </button>

          {/* Language Switcher in Top Bar */}
          <div className="flex items-center gap-0.5 bg-slate-800/80 border border-slate-700/80 p-1 rounded-xl text-xs">
            <Globe2 className="w-3.5 h-3.5 text-slate-400 mx-1 hidden sm:block" />
            {(['fa', 'ps', 'en'] as Language[]).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLang(l)}
                className={`px-2 py-0.5 text-[11px] font-bold rounded-lg transition-all ${
                  lang === l
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {l === 'fa' ? 'دری' : l === 'ps' ? 'پښتو' : 'EN'}
              </button>
            ))}
          </div>

          {/* User Sign Out */}
          {user && (
            <button
              type="button"
              onClick={logout}
              title={t.logoutBtn}
              className="p-2 rounded-xl bg-slate-800/80 border border-slate-700/80 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </header>

      {/* Visual Notification System Modal */}
      {showNotificationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div 
            className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto text-slate-100"
            dir={isRtl ? 'rtl' : 'ltr'}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${lowStockMaterials.length > 0 ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-white">{t.lowStockNotificationTitle}</h3>
                  <p className="text-xs text-slate-400">{t.notifications}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowNotificationModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Threshold Configuration Banner */}
            <div className="mt-4 p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs text-slate-400 block">{t.lowStockThresholdLabel}</span>
                <span className="text-base font-bold text-amber-400 font-mono">
                  {lowStockThreshold.toLocaleString()} {t.kilo}
                </span>
              </div>
              
              {!editingThreshold ? (
                <button
                  type="button"
                  onClick={() => {
                    setThresholdInput(lowStockThreshold.toString());
                    setEditingThreshold(true);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-1.5 transition-colors self-start sm:self-auto"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>{t.configureThreshold}</span>
                </button>
              ) : (
                <form onSubmit={handleSaveThreshold} className="flex items-center gap-2">
                  <input
                    type="number"
                    min="100"
                    step="100"
                    value={thresholdInput}
                    onChange={(e) => setThresholdInput(e.target.value)}
                    className="w-28 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs font-mono text-white focus:outline-none focus:border-amber-500"
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
                    className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs"
                  >
                    {t.cancel}
                  </button>
                </form>
              )}
            </div>

            {/* Low Stock Items List */}
            <div className="mt-5 space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                {lowStockMaterials.length > 0 ? t.itemsNeedRestock : t.statusNormal}
              </h4>

              {lowStockMaterials.length === 0 ? (
                <div className="p-6 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-emerald-300">
                    {t.allStockHealthy}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    {t.lowStockThresholdLabel} {lowStockThreshold.toLocaleString()} {t.kilo}
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-64 overflow-y-auto pe-1">
                  {lowStockMaterials.map((item) => {
                    const percent = Math.min(100, Math.round((item.stockKg / lowStockThreshold) * 100));
                    return (
                      <div
                        key={item.id}
                        className="p-3.5 rounded-xl bg-slate-950/70 border border-rose-500/30 flex items-center justify-between gap-3 hover:border-rose-500/60 transition-colors"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-white truncate">
                              {getLocalizedName(item.name)}
                            </span>
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                              {t.statusLow}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                            <span>
                              {t.currentStockLabel}: <strong className="text-rose-400 font-mono">{item.stockKg.toLocaleString()} {t.kilo}</strong>
                            </span>
                            <span>•</span>
                            <span>
                              {t.thresholdLimitLabel}: <span className="font-mono">{lowStockThreshold.toLocaleString()} {t.kilo}</span>
                            </span>
                          </div>
                          {/* Progress bar */}
                          <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2 overflow-hidden">
                            <div 
                              className="bg-rose-500 h-1.5 rounded-full transition-all"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={handleGoToInventory}
                          className="px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shrink-0 transition-colors"
                        >
                          {t.restockNow}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                {t.companyName} • {t.activeFactory}
              </span>
              <button
                type="button"
                onClick={() => setShowNotificationModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
              >
                {t.cancel}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
