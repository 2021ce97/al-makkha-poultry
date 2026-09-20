import React from 'react';
import { useDatabase } from '../context/DatabaseContext';
import { 
  LayoutDashboard, 
  Warehouse, 
  FlaskConical, 
  ShoppingCart, 
  Truck, 
  Users, 
  Receipt, 
  BarChart3, 
  LogOut, 
  Wheat, 
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Globe2,
  ShieldCheck,
  X
} from 'lucide-react';
import { Language } from '../types';

export type ActiveTab = 
  | 'dashboard'
  | 'inventory'
  | 'formula'
  | 'sales'
  | 'suppliers'
  | 'customers'
  | 'expenses'
  | 'reports';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isMobileOpen,
  setIsMobileOpen,
  isCollapsed,
  setIsCollapsed,
}) => {
  const { lang, setLang, t, user, logout, lowStockMaterials } = useDatabase();
  const isRtl = lang === 'fa' || lang === 'ps';

  const navItems = [
    {
      id: 'dashboard' as ActiveTab,
      label: t.navDashboard,
      icon: LayoutDashboard,
      badge: lowStockMaterials.length > 0 ? lowStockMaterials.length : undefined,
      badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    },
    {
      id: 'inventory' as ActiveTab,
      label: t.navInventory,
      icon: Warehouse,
      badge: lowStockMaterials.length > 0 ? lowStockMaterials.length : undefined,
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    },
    {
      id: 'formula' as ActiveTab,
      label: t.navFormula,
      icon: FlaskConical,
    },
    {
      id: 'sales' as ActiveTab,
      label: t.navSales,
      icon: ShoppingCart,
    },
    {
      id: 'suppliers' as ActiveTab,
      label: t.navSuppliers,
      icon: Truck,
    },
    {
      id: 'customers' as ActiveTab,
      label: t.navCustomers,
      icon: Users,
    },
    {
      id: 'expenses' as ActiveTab,
      label: t.navExpenses,
      icon: Receipt,
    },
    {
      id: 'reports' as ActiveTab,
      label: t.navReports,
      icon: BarChart3,
    },
  ];

  const handleSelectTab = (tab: ActiveTab) => {
    setActiveTab(tab);
    setIsMobileOpen(false);
  };

  const CollapseIcon = isRtl
    ? (isCollapsed ? ChevronLeft : ChevronRight)
    : (isCollapsed ? ChevronRight : ChevronLeft);

  const sidebarContent = (
    <div className="h-full flex flex-col justify-between bg-slate-900 border-slate-800 text-slate-200">
      {/* Top Brand */}
      <div>
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center text-slate-950 font-bold shrink-0 shadow-md shadow-amber-500/20">
              <Wheat className="w-6 h-6" />
            </div>
            {!isCollapsed && (
              <div className="truncate">
                <h2 className="font-bold text-sm tracking-tight text-white truncate">
                  {t.companyName}
                </h2>
                <div className="flex items-center gap-1.5 text-[11px] text-amber-400 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>{t.systemOnline}</span>
                </div>
              </div>
            )}
          </div>

          {/* Close on mobile */}
          <button
            type="button"
            onClick={() => setIsMobileOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation List */}
        <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-280px)]">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectTab(item.id)}
                title={isCollapsed ? item.label : undefined}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/15 font-semibold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                } ${isCollapsed ? 'justify-center' : 'justify-between'}`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-slate-950' : 'text-slate-400 group-hover:text-amber-400'}`} />
                  {!isCollapsed && (
                    <span className="truncate">{item.label}</span>
                  )}
                </div>

                {!isCollapsed && item.badge !== undefined && (
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${item.badgeColor}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Footer Section */}
      <div className="p-3 border-t border-slate-800 space-y-3 bg-slate-900/80">
        {/* Language selector */}
        <div className={`flex items-center gap-1 bg-slate-950/80 border border-slate-800 p-1 rounded-xl ${isCollapsed ? 'flex-col' : 'justify-between'}`}>
          {!isCollapsed && (
            <div className="flex items-center gap-1.5 ps-1.5 text-xs text-slate-400">
              <Globe2 className="w-3.5 h-3.5" />
              <span>{t.dir === 'rtl' ? 'زبان:' : 'Lang:'}</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            {(['fa', 'ps', 'en'] as Language[]).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLang(l)}
                className={`px-2 py-1 text-[11px] font-bold rounded-lg transition-all ${
                  lang === l
                    ? 'bg-amber-500 text-slate-950'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {l === 'fa' ? 'دری' : l === 'ps' ? 'پښتو' : 'EN'}
              </button>
            ))}
          </div>
        </div>

        {/* User Card */}
        {user && (
          <div className={`p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center gap-3 ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center font-bold text-xs shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              {!isCollapsed && (
                <div className="truncate text-xs">
                  <span className="font-bold text-white block truncate">{user.name}</span>
                  <span className="text-[10px] text-slate-400 block truncate">{user.email}</span>
                </div>
              )}
            </div>

            {!isCollapsed && (
              <button
                type="button"
                onClick={logout}
                title={t.logoutBtn}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {/* Desktop Collapse Toggle */}
        <div className="hidden lg:flex items-center justify-between pt-1">
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="w-full py-1.5 px-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-center gap-2 transition-colors"
          >
            <CollapseIcon className="w-4 h-4" />
            {!isCollapsed && (
              <span>{t.sidebarCollapse}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside 
        className={`hidden lg:block shrink-0 transition-all duration-300 z-30 h-screen sticky top-0 border-e border-slate-800 ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Backdrop & Off-canvas Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div 
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileOpen(false)}
          />
          <div 
            className={`relative z-50 w-72 max-w-[85vw] h-full shadow-2xl ${
              isRtl ? 'ms-auto' : 'me-auto'
            }`}
          >
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
