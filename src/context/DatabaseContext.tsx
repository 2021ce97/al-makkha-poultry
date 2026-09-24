import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { 
  DatabaseState, 
  Language, 
  RawMaterialItem, 
  Supplier, 
  Customer, 
  Sale, 
  Expense, 
  ProcessedStockItem, 
  Formula, 
  ProductionBatch, 
  UnitType,
  AuthUser
} from '../types';
import { initialFactoryData } from '../initialData';
import { 
  translations, 
  getLocalizedItemName, 
  getLocalizedCategory,
  getLocalizedTransactionType,
  getLocalizedTransactionDescription 
} from '../translations';
import { supabase } from '../lib/supabase';
import { 
  loadStateFromSupabase, 
  seedInitialDataToSupabase,
  sbDeleteCustomer,
  sbDeleteRawMaterial,
  sbDeleteSupplier,
  sbDeleteExpense,
  sbDeleteFormula
} from '../lib/supabaseSync';

const STORAGE_KEY = 'mahir_poultry_feed_db_v1';
const LANG_STORAGE_KEY = 'mahir_poultry_feed_lang';
const THRESHOLD_STORAGE_KEY = 'mahir_poultry_feed_threshold';

interface DatabaseContextType {
  db: DatabaseState;
  lang: Language;
  t: typeof translations['fa'];
  setLang: (lang: Language) => void;
  // Auth
  user: AuthUser | null;
  isAuthLoading: boolean;
  isDatabaseLoading: boolean;
  login: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  // Low Stock Notification Threshold
  lowStockThreshold: number;
  setLowStockThreshold: (threshold: number) => void;
  updateRawMaterialThreshold: (id: string, threshold: number) => void;
  lowStockMaterials: RawMaterialItem[];
  // Localization helpers
  getLocalizedName: (name: string) => string;
  getLocalizedCat: (cat: string) => string;
  getLocalizedTxType: (type: string) => string;
  getLocalizedTxDesc: (desc: string) => string;
  isSupabaseConnected: boolean;
  // Inventory & Suppliers
  addRawMaterial: (
    item: Omit<RawMaterialItem, 'id' | 'dateAdded'>, 
    paidAmount: number, 
    supplierPhone?: string
  ) => void;
  deleteRawMaterial: (id: string) => void;
  settleSupplierPayment: (supplierId: string, amountToPay: number, note?: string) => void;
  deleteSupplier: (supplierId: string) => void;
  // Formulation & Production
  createFormulaAndProduce: (
    name: string,
    ingredients: { rawMaterialId: string; weightKg: number }[],
    description?: string,
    operatorName?: string,
    produceBatchImmediately?: boolean,
    batchExpenses?: number
  ) => { success: boolean; error?: string };
  deleteFormula: (formulaId: string) => void;
  // Sales & Customers
  recordSale: (saleData: {
    productId?: string;
    productName: string;
    customerId?: string;
    customerName: string;
    customerPhone?: string;
    unitType: UnitType;
    unitQuantity: number;
    salePricePerUnit: number;
    paidAmount: number;
    notes?: string;
  }) => { success: boolean; error?: string };
  receiveCustomerPayment: (customerId: string, amount: number, note?: string) => void;
  deleteCustomer: (customerId: string) => void;
  // Expenses
  addExpense: (expense: Omit<Expense, 'id' | 'date'>) => void;
  deleteExpense: (id: string) => void;
  // Backup & Reset
  exportDatabase: () => void;
  importDatabase: (jsonData: string) => boolean;
  resetToDefaultData: () => void;
}

const DatabaseContext = createContext<DatabaseContextType | undefined>(undefined);

export const DatabaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Language>(() => {
    const saved = localStorage.getItem(LANG_STORAGE_KEY);
    return (saved === 'fa' || saved === 'ps' || saved === 'en') ? (saved as Language) : 'fa';
  });

  // Authentication is managed by Supabase Auth. A local-only login cannot
  // validate users created in the Supabase dashboard.
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(Boolean(supabase));
  const [isDatabaseLoading, setIsDatabaseLoading] = useState(Boolean(supabase));

  const [isSupabaseConnected, setIsSupabaseConnected] = useState(false);
  const isRemoteStateReady = useRef(false);
  const lastSyncedState = useRef<string | null>(null);

  // User-defined Low Stock Threshold
  const [lowStockThreshold, setLowStockThresholdState] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(THRESHOLD_STORAGE_KEY);
      if (saved) {
        const num = Number(saved);
        if (!isNaN(num) && num > 0) return num;
      }
    } catch (e) {
      console.error(e);
    }
    return 5000; // default 5,000 kg threshold
  });

  const setLowStockThreshold = (threshold: number) => {
    const safeVal = Math.max(100, Number(threshold) || 1000);
    setLowStockThresholdState(safeVal);
    try {
      localStorage.setItem(THRESHOLD_STORAGE_KEY, safeVal.toString());
    } catch (e) {
      console.error(e);
    }
  };

  const [db, setDb] = useState<DatabaseState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load database from localStorage:', e);
    }
    return initialFactoryData;
  });

  const toAuthUser = (authUser: {
    email?: string;
    user_metadata?: Record<string, unknown>;
    app_metadata?: Record<string, unknown>;
  }): AuthUser => {
    const userMetadata = authUser.user_metadata || {};
    const appMetadata = authUser.app_metadata || {};
    const email = authUser.email || '';
    return {
      email,
      name: String(userMetadata.full_name || userMetadata.name || email),
      // Dashboard-created users can store this in either metadata location.
      role: String(userMetadata.role || appMetadata.role || 'User'),
      loginTime: new Date().toISOString(),
    };
  };

  // Restore a saved Supabase session and react to login/logout events.
  useEffect(() => {
    if (!supabase) {
      setIsAuthLoading(false);
      setIsDatabaseLoading(false);
      return;
    }

    let isMounted = true;
    supabase.auth.getSession().then(({ data, error }) => {
      if (!isMounted) return;
      if (error) console.error('Supabase session check failed:', error.message);
      setUser(data.session?.user ? toAuthUser(data.session.user) : null);
      setIsAuthLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;
      setUser(session?.user ? toAuthUser(session.user) : null);
      setIsAuthLoading(false);
    });

    return () => {
      isMounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  // Initial Supabase Load & Real-time Subscription
  useEffect(() => {
    if (!supabase || isAuthLoading || !user) {
      setIsSupabaseConnected(false);
      if (!isAuthLoading) setIsDatabaseLoading(false);
      return;
    }

    let isMounted = true;
    let isInitialLoadComplete = false;
    isRemoteStateReady.current = false;
    lastSyncedState.current = null;
    setIsDatabaseLoading(true);

    // 1. Fetch live tables from Supabase
    loadStateFromSupabase().then(result => {
      if (!isMounted) return;
      if (result?.hasData) {
        setIsSupabaseConnected(true);
        lastSyncedState.current = JSON.stringify(result.state);
        setDb(result.state);
        isInitialLoadComplete = true;
        isRemoteStateReady.current = true;
        setIsDatabaseLoading(false);
      } else if (result) {
        setIsSupabaseConnected(true);
        // Never replace a local backup with factory data when the remote database is empty.
        seedInitialDataToSupabase(db).finally(() => {
          lastSyncedState.current = JSON.stringify(db);
          isInitialLoadComplete = true;
          isRemoteStateReady.current = true;
          if (isMounted) setIsDatabaseLoading(false);
        });
      } else {
        setIsSupabaseConnected(false);
        console.error('Supabase hydration failed; keeping the local database backup.');
        isInitialLoadComplete = true;
        setIsDatabaseLoading(false);
      }
    });

    // 2. Real-time changes subscription
    const channel = supabase
      .channel('supabase-live-sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public' },
        () => {
          if (!isInitialLoadComplete) return;
          loadStateFromSupabase().then(result => {
            if (isMounted && result?.hasData) {
              setIsSupabaseConnected(true);
              lastSyncedState.current = JSON.stringify(result.state);
              setDb(result.state);
            }
          });
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [isAuthLoading, user?.email]);

  // Persist each completed state change as one ordered snapshot.  The old
  // code fired independent writes while React was still calculating state,
  // so customer/supplier records and their linked transactions could be
  // missing after a new login.  The sync helper serializes this snapshot and
  // writes parents before records that reference them.
  useEffect(() => {
    if (!supabase || !isRemoteStateReady.current) return;

    const stateHash = JSON.stringify(db);
    if (lastSyncedState.current === stateHash) return;

    void seedInitialDataToSupabase(db).then(saved => {
      if (saved) {
        lastSyncedState.current = stateHash;
        setIsSupabaseConnected(true);
      } else {
        setIsSupabaseConnected(false);
      }
    });
  }, [db]);

  // Keep localStorage in sync as offline backup
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
    } catch (e) {
      console.error('Failed to save database to localStorage:', e);
    }
  }, [db]);

  // Keep HTML lang & direction in sync
  useEffect(() => {
    localStorage.setItem(LANG_STORAGE_KEY, lang);
    const html = document.documentElement;
    html.lang = lang;
    html.dir = lang === 'en' ? 'ltr' : 'rtl';
  }, [lang]);

  const setLang = (newLang: Language) => {
    setLangState(newLang);
  };

  const t = translations[lang];

  const login = async (emailInput: string, passwordInput: string) => {
    if (!supabase) {
      return { success: false, error: 'Supabase is not configured. Add the VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY variables.' };
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: emailInput.trim(),
      password: passwordInput,
    });
    return error ? { success: false, error: error.message } : { success: true };
  };

  const logout = async () => {
    setUser(null);
    isRemoteStateReady.current = false;
    if (supabase) {
      const { error } = await supabase.auth.signOut();
      if (error) console.error('Supabase logout failed:', error.message);
    }
  };

  // Helper to convert units to kilos
  const convertToKg = (unitType: UnitType, quantity: number): number => {
    switch (unitType) {
      case 'bag':
        return quantity * 50;
      case 'ton':
        return quantity * 1000;
      case 'kg':
      default:
        return quantity;
    }
  };

  // 1. ADD RAW MATERIAL TO INVENTORY & AUTO-UPDATE SUPPLIER
  const addRawMaterial = (
    item: Omit<RawMaterialItem, 'id' | 'dateAdded'>,
    paidAmount: number,
    supplierPhone?: string
  ) => {
    const today = new Date().toISOString().split('T')[0];
    const newId = `rm-${Date.now()}`;
    const totalBill = item.stockKg * item.unitPrice;
    const remaining = Math.max(0, totalBill - paidAmount);

    const newItem: RawMaterialItem = {
      ...item,
      id: newId,
      dateAdded: today,
    };

    setDb(prev => {
      let updatedSuppliers = [...prev.suppliers];
      let assignedSupplierId = item.supplierId;

      if (item.supplierName && item.supplierName.trim()) {
        const supName = item.supplierName.trim();
        const existingSupIndex = updatedSuppliers.findIndex(
          s => s.id === item.supplierId || s.name.toLowerCase() === supName.toLowerCase()
        );

        const transaction = {
          id: `st-${Date.now()}`,
          date: today,
          type: 'purchase' as const,
          description: `خرید ${item.name} (${item.stockKg.toLocaleString()} کیلو)`,
          amount: totalBill,
          paidAmount: paidAmount,
          remainingAmount: remaining,
        };
        if (existingSupIndex >= 0) {
          const sup = updatedSuppliers[existingSupIndex];
          assignedSupplierId = sup.id;
          const updatedSup = {
            ...sup,
            phone: supplierPhone || sup.phone,
            totalPurchasedAmount: sup.totalPurchasedAmount + totalBill,
            totalPaid: sup.totalPaid + paidAmount,
            balanceOwed: sup.balanceOwed + remaining,
            transactions: [transaction, ...sup.transactions],
          };
          updatedSuppliers[existingSupIndex] = updatedSup;
        } else {
          assignedSupplierId = `sup-${Date.now()}`;
          const newSup: Supplier = {
            id: assignedSupplierId,
            name: supName,
            phone: supplierPhone || '',
            totalPurchasedAmount: totalBill,
            totalPaid: paidAmount,
            balanceOwed: remaining,
            transactions: [transaction],
            createdAt: today,
          };
          updatedSuppliers.unshift(newSup);
        }
      }

      newItem.supplierId = assignedSupplierId;

      return {
        ...prev,
        rawMaterials: [newItem, ...prev.rawMaterials],
        suppliers: updatedSuppliers,
        cashInHand: prev.cashInHand - paidAmount,
      };
    });

  };

  // UPDATE RAW MATERIAL THRESHOLD PER ITEM
  const updateRawMaterialThreshold = (id: string, threshold: number) => {
    setDb(prev => {
      const updatedRaw = prev.rawMaterials.map(rm => {
        if (rm.id === id) {
          const updated = { ...rm, lowStockThreshold: threshold };
          return updated;
        }
        return rm;
      });
      return {
        ...prev,
        rawMaterials: updatedRaw,
      };
    });
  };

  // DELETE RAW MATERIAL
  const deleteRawMaterial = (id: string) => {
    setDb(prev => ({
      ...prev,
      rawMaterials: prev.rawMaterials.filter(rm => rm.id !== id),
    }));
    sbDeleteRawMaterial(id);
  };

  // SETTLE PAYMENT TO SUPPLIER
  const settleSupplierPayment = (supplierId: string, amountToPay: number, note?: string) => {
    if (amountToPay <= 0) return;
    const today = new Date().toISOString().split('T')[0];

    setDb(prev => {
      const supIndex = prev.suppliers.findIndex(s => s.id === supplierId);
      if (supIndex === -1) return prev;

      const sup = prev.suppliers[supIndex];
      const actualPay = Math.min(amountToPay, sup.balanceOwed);
      const newRemaining = Math.max(0, sup.balanceOwed - actualPay);

      const transaction = {
        id: `st-${Date.now()}`,
        date: today,
        type: 'payment' as const,
        description: note || 'پرداخت قرض و تصفیه حساب با عرضه کننده',
        amount: 0,
        paidAmount: actualPay,
        remainingAmount: newRemaining,
      };

      const updatedSuppliers = [...prev.suppliers];
      const updatedSup = {
        ...sup,
        totalPaid: sup.totalPaid + actualPay,
        balanceOwed: newRemaining,
        transactions: [transaction, ...sup.transactions],
      };
      updatedSuppliers[supIndex] = updatedSup;

      return {
        ...prev,
        suppliers: updatedSuppliers,
        cashInHand: prev.cashInHand - actualPay,
      };
    });
  };

  // DELETE SUPPLIER
  const deleteSupplier = (supplierId: string) => {
    setDb(prev => ({
      ...prev,
      suppliers: prev.suppliers.filter(s => s.id !== supplierId),
    }));
    sbDeleteSupplier(supplierId);
  };

  // 2. CREATE FORMULA & PRODUCE BATCH
  const createFormulaAndProduce = (
    name: string,
    ingredients: { rawMaterialId: string; weightKg: number }[],
    description?: string,
    operatorName?: string,
    produceBatchImmediately = true,
    batchExpenses = 0
  ) => {
    // 1. Verify stock availability
    for (const ing of ingredients) {
      const raw = db.rawMaterials.find(r => r.id === ing.rawMaterialId);
      if (!raw) {
        return { success: false, error: `Raw material not found: ${ing.rawMaterialId}` };
      }
      if (raw.stockKg < ing.weightKg) {
        return { 
          success: false, 
          error: `${t.insufficientStockError} (${raw.name}: ${raw.stockKg} kg موجود، ${ing.weightKg} kg نیاز است)` 
        };
      }
    }

    const today = new Date().toISOString().split('T')[0];
    const formulaId = `form-${Date.now()}`;

    // Calculate formula ingredient costs
    let totalWeight = 0;
    let totalBatchCost = 0;

    const populatedIngredients = ingredients.map(ing => {
      const raw = db.rawMaterials.find(r => r.id === ing.rawMaterialId)!;
      const subtotal = ing.weightKg * raw.unitPrice;
      totalWeight += ing.weightKg;
      totalBatchCost += subtotal;
      return {
        rawMaterialId: raw.id,
        rawMaterialName: raw.name,
        weightKg: ing.weightKg,
        costPerKg: raw.unitPrice,
        totalCost: subtotal,
      };
    });

    const totalBatchCostWithExpenses = totalBatchCost + (Number(batchExpenses) || 0);
    const costPerKg = totalWeight > 0 ? Math.round((totalBatchCostWithExpenses / totalWeight) * 100) / 100 : 0;

    const newFormula: Formula = {
      id: formulaId,
      name,
      description,
      ingredients: populatedIngredients,
      totalWeightKg: totalWeight,
      totalBatchCost: totalBatchCostWithExpenses,
      costPerKg,
      createdDate: today,
    };

    const newBatch: ProductionBatch = {
      id: `batch-${Date.now()}`,
      formulaId,
      formulaName: name,
      date: today,
      totalWeightKg: totalWeight,
      costPerKg,
      totalCost: totalBatchCostWithExpenses,
      operatorName: operatorName || 'مسئول تولید',
      notes: `پروسس خودکار: ${name} (${totalWeight.toLocaleString()} کیلو)${batchExpenses > 0 ? ` • مصارف جانبی: ${batchExpenses.toLocaleString()} ${t.currency}` : ''}`,
    };

    setDb(prev => {
      // Deduct raw materials
      const updatedRaw = prev.rawMaterials.map(rm => {
        const used = ingredients.find(ing => ing.rawMaterialId === rm.id);
        if (used) {
          const updated = {
            ...rm,
            stockKg: Math.max(0, rm.stockKg - used.weightKg),
          };
          return updated;
        }
        return rm;
      });

      // Update or Add Processed Stock
      const existingProcessedIndex = prev.processedStock.findIndex(
        ps => ps.name.toLowerCase() === name.trim().toLowerCase()
      );

      let updatedProcessedStock: ProcessedStockItem[];
      if (existingProcessedIndex >= 0) {
        const existing = prev.processedStock[existingProcessedIndex];
        const newTotalKg = existing.stockKg + totalWeight;
        const newAvgCost = newTotalKg > 0 
          ? ((existing.stockKg * existing.averageCostPerKg) + (totalWeight * costPerKg)) / newTotalKg
          : costPerKg;

        const updatedItem: ProcessedStockItem = {
          ...existing,
          stockKg: newTotalKg,
          averageCostPerKg: Math.round(newAvgCost * 100) / 100,
          lastUpdated: today,
        };
        updatedProcessedStock = [...prev.processedStock];
        updatedProcessedStock[existingProcessedIndex] = updatedItem;
      } else {
        const newProcessedItem: ProcessedStockItem = {
          id: `ps-${Date.now()}`,
          name: name.trim(),
          formulaId,
          stockKg: totalWeight,
          averageCostPerKg: costPerKg,
          lastUpdated: today,
        };
        updatedProcessedStock = [newProcessedItem, ...prev.processedStock];
      }

      // Add expense if batch expenses were incurred
      let updatedExpenses = prev.expenses;
      let newCashInHand = prev.cashInHand;
      if (batchExpenses > 0) {
        const exp: Expense = {
          id: `exp-${Date.now()}`,
          date: today,
          category: 'electricity',
          description: `مصارف تولید بچ: ${name}`,
          amount: batchExpenses,
          paidBy: operatorName || 'مسئول فابریکه',
        };
        updatedExpenses = [exp, ...prev.expenses];
        newCashInHand -= batchExpenses;
      }

      return {
        ...prev,
        rawMaterials: updatedRaw,
        processedStock: updatedProcessedStock,
        formulas: [newFormula, ...prev.formulas],
        productionBatches: produceBatchImmediately ? [newBatch, ...prev.productionBatches] : prev.productionBatches,
        expenses: updatedExpenses,
        cashInHand: newCashInHand,
      };
    });

    return { success: true };
  };

  // DELETE FORMULA
  const deleteFormula = (formulaId: string) => {
    setDb(prev => ({
      ...prev,
      formulas: prev.formulas.filter(f => f.id !== formulaId),
    }));
    sbDeleteFormula(formulaId);
  };

  // 3. RECORD SALE (DEDUCT PROCESSED STOCK, AUTO-UPDATE CUSTOMER, ADD CASH)
  const recordSale = (saleData: {
    productId?: string;
    productName: string;
    customerId?: string;
    customerName: string;
    customerPhone?: string;
    unitType: UnitType;
    unitQuantity: number;
    salePricePerUnit: number;
    paidAmount: number;
    notes?: string;
  }) => {
    const quantityKg = convertToKg(saleData.unitType, saleData.unitQuantity);
    
    // Check processed stock
    let product = saleData.productId ? db.processedStock.find(p => p.id === saleData.productId) : undefined;
    if (!product) {
      product = db.processedStock.find(p => p.name.toLowerCase() === saleData.productName.trim().toLowerCase());
    }

    if (product && product.stockKg < quantityKg) {
      return { 
        success: false, 
        error: `موجودی دانه پروسس شده کافی نیست! موجودی فعلی: ${product.stockKg.toLocaleString()} کیلو، مقدار فروش: ${quantityKg.toLocaleString()} کیلو.` 
      };
    }

    const totalAmount = saleData.unitQuantity * saleData.salePricePerUnit;
    const remainingAmount = Math.max(0, totalAmount - saleData.paidAmount);
    const costRatePerKg = product ? product.averageCostPerKg : 30;
    const totalCostOfGoods = costRatePerKg * quantityKg;
    const profit = totalAmount - totalCostOfGoods;
    const today = new Date().toISOString().split('T')[0];
    const saleId = `sale-${Date.now()}`;

    const newSale: Sale = {
      id: saleId,
      date: today,
      customerId: saleData.customerId || '',
      customerName: saleData.customerName.trim(),
      customerPhone: saleData.customerPhone?.trim(),
      productId: product?.id || saleData.productId || '',
      productName: saleData.productName.trim(),
      unitType: saleData.unitType,
      unitQuantity: saleData.unitQuantity,
      quantityKg,
      salePricePerUnit: saleData.salePricePerUnit,
      totalAmount,
      costRatePerKg,
      totalCostOfGoods,
      profit,
      paidAmount: saleData.paidAmount,
      remainingAmount,
      notes: saleData.notes?.trim(),
    };

    setDb(prev => {
      // 1. Deduct processed stock
      let updatedProcessedStock = prev.processedStock;
      if (product) {
        updatedProcessedStock = prev.processedStock.map(p => {
          if (p.id === product!.id) {
            const updated = {
              ...p,
              stockKg: Math.max(0, p.stockKg - quantityKg),
              lastUpdated: today,
            };
            return updated;
          }
          return p;
        });
      }

      // 2. Auto register/update customer
      let updatedCustomers = [...prev.customers];
      let assignedCustId = saleData.customerId;
      const custName = saleData.customerName.trim();

      const existingCustIndex = updatedCustomers.findIndex(
        c => (saleData.customerId && c.id === saleData.customerId) || 
             c.name.toLowerCase() === custName.toLowerCase()
      );

      const customerTransaction = {
        id: `ct-${Date.now()}`,
        date: today,
        type: 'sale' as const,
        description: `فروش ${saleData.productName} (${saleData.unitQuantity} ${t[saleData.unitType] || saleData.unitType})`,
        amount: totalAmount,
        paidAmount: saleData.paidAmount,
        remainingAmount: remainingAmount,
      };
      if (existingCustIndex >= 0) {
        const existing = updatedCustomers[existingCustIndex];
        assignedCustId = existing.id;
        const updatedCust = {
          ...existing,
          phone: saleData.customerPhone || existing.phone,
          totalPurchasedAmount: existing.totalPurchasedAmount + totalAmount,
          totalPaid: existing.totalPaid + saleData.paidAmount,
          balanceOwed: existing.balanceOwed + remainingAmount,
          transactions: [customerTransaction, ...existing.transactions],
        };
        updatedCustomers[existingCustIndex] = updatedCust;
      } else {
        assignedCustId = `cust-${Date.now()}`;
        const newCust: Customer = {
          id: assignedCustId,
          name: custName,
          phone: saleData.customerPhone || '',
          totalPurchasedAmount: totalAmount,
          totalPaid: saleData.paidAmount,
          balanceOwed: remainingAmount,
          transactions: [customerTransaction],
          createdAt: today,
        };
        updatedCustomers.unshift(newCust);
      }

      newSale.customerId = assignedCustId;

      return {
        ...prev,
        processedStock: updatedProcessedStock,
        customers: updatedCustomers,
        sales: [newSale, ...prev.sales],
        cashInHand: prev.cashInHand + saleData.paidAmount,
      };
    });

    return { success: true };
  };

  // RECEIVE PAYMENT FROM CUSTOMER
  const receiveCustomerPayment = (customerId: string, amount: number, note?: string) => {
    if (amount <= 0) return;
    const today = new Date().toISOString().split('T')[0];

    setDb(prev => {
      const custIndex = prev.customers.findIndex(c => c.id === customerId);
      if (custIndex === -1) return prev;

      const cust = prev.customers[custIndex];
      const actualReceived = Math.min(amount, cust.balanceOwed);
      const newRemaining = Math.max(0, cust.balanceOwed - actualReceived);

      const transaction = {
        id: `ct-${Date.now()}`,
        date: today,
        type: 'payment_received' as const,
        description: note || 'دریافت طلب و باقی‌داری مشتری',
        amount: 0,
        paidAmount: actualReceived,
        remainingAmount: newRemaining,
      };

      const updatedCustomers = [...prev.customers];
      const updatedCust = {
        ...cust,
        totalPaid: cust.totalPaid + actualReceived,
        balanceOwed: newRemaining,
        transactions: [transaction, ...cust.transactions],
      };
      updatedCustomers[custIndex] = updatedCust;

      return {
        ...prev,
        customers: updatedCustomers,
        cashInHand: prev.cashInHand + actualReceived,
      };
    });
  };

  // DELETE CUSTOMER
  const deleteCustomer = (customerId: string) => {
    setDb(prev => ({
      ...prev,
      customers: prev.customers.filter(c => c.id !== customerId),
    }));
    sbDeleteCustomer(customerId);
  };

  // 4. ADD EXPENSE (AUTOMATICALLY DEDUCT FROM CASH IN HAND)
  const addExpense = (expense: Omit<Expense, 'id' | 'date'>) => {
    const today = new Date().toISOString().split('T')[0];
    const newExpense: Expense = {
      ...expense,
      id: `exp-${Date.now()}`,
      date: today,
    };

    setDb(prev => ({
      ...prev,
      expenses: [newExpense, ...prev.expenses],
      cashInHand: prev.cashInHand - expense.amount,
    }));

  };

  // DELETE EXPENSE
  const deleteExpense = (id: string) => {
    setDb(prev => {
      const exp = prev.expenses.find(e => e.id === id);
      const restoreCash = exp ? exp.amount : 0;
      return {
        ...prev,
        expenses: prev.expenses.filter(e => e.id !== id),
        cashInHand: prev.cashInHand + restoreCash,
      };
    });
    sbDeleteExpense(id);
  };

  // BACKUP & RESTORE
  const exportDatabase = () => {
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(db, null, 2)
    )}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    downloadAnchor.setAttribute(
      'download', 
      `mahir_poultry_feed_backup_${new Date().toISOString().split('T')[0]}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const importDatabase = (jsonData: string): boolean => {
    try {
      const parsed = JSON.parse(jsonData);
      if (parsed.rawMaterials && parsed.processedStock && parsed.suppliers && parsed.customers) {
        setDb(parsed);
        seedInitialDataToSupabase(parsed);
        return true;
      }
      return false;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  const resetToDefaultData = () => {
    setDb(initialFactoryData);
    seedInitialDataToSupabase(initialFactoryData);
  };

  // Low Stock Materials calculated per individual item threshold
  const lowStockMaterials = db.rawMaterials.filter(
    r => r.stockKg <= (r.lowStockThreshold !== undefined ? r.lowStockThreshold : lowStockThreshold)
  );

  const getLocalizedName = (name: string) => getLocalizedItemName(name, lang);
  const getLocalizedCat = (cat: string) => getLocalizedCategory(cat, lang);
  const getLocalizedTxType = (type: string) => getLocalizedTransactionType(type, lang);
  const getLocalizedTxDesc = (desc: string) => getLocalizedTransactionDescription(desc, lang);

  return (
    <DatabaseContext.Provider
      value={{
        db,
        lang,
        t,
        setLang,
        user,
        login,
        logout,
        isAuthLoading,
        isDatabaseLoading,
        lowStockThreshold,
        setLowStockThreshold,
        updateRawMaterialThreshold,
        lowStockMaterials,
        getLocalizedName,
        getLocalizedCat,
        getLocalizedTxType,
        getLocalizedTxDesc,
        isSupabaseConnected,
        addRawMaterial,
        deleteRawMaterial,
        settleSupplierPayment,
        deleteSupplier,
        createFormulaAndProduce,
        deleteFormula,
        recordSale,
        receiveCustomerPayment,
        deleteCustomer,
        addExpense,
        deleteExpense,
        exportDatabase,
        importDatabase,
        resetToDefaultData,
      }}
    >
      {children}
    </DatabaseContext.Provider>
  );
};

export const useDatabase = () => {
  const context = useContext(DatabaseContext);
  if (!context) {
    throw new Error('useDatabase must be used within a DatabaseProvider');
  }
  return context;
};
