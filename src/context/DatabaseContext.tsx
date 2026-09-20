import React, { createContext, useContext, useState, useEffect } from 'react';
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
import { translations, getLocalizedItemName, getLocalizedCategory } from '../translations';

const STORAGE_KEY = 'mahir_poultry_feed_db_v1';
const LANG_STORAGE_KEY = 'mahir_poultry_feed_lang';
const AUTH_STORAGE_KEY = 'mahir_poultry_feed_auth_user';
const THRESHOLD_STORAGE_KEY = 'mahir_poultry_feed_threshold';

interface DatabaseContextType {
  db: DatabaseState;
  lang: Language;
  t: typeof translations['fa'];
  setLang: (lang: Language) => void;
  // Auth
  user: AuthUser | null;
  login: (email: string, pass: string) => boolean;
  logout: () => void;
  // Low Stock Notification Threshold
  lowStockThreshold: number;
  setLowStockThreshold: (threshold: number) => void;
  lowStockMaterials: RawMaterialItem[];
  // Localization helpers
  getLocalizedName: (name: string) => string;
  getLocalizedCat: (cat: string) => string;
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
    produceBatchImmediately?: boolean
  ) => { success: boolean; error?: string };
  // Sales & Customers
  recordSale: (saleData: {
    productId: string;
    productName: string;
    customerId?: string;
    customerName: string;
    customerPhone: string;
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

  // Authentication State with credentials Rayan@poletry.af / Rayan6789
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const saved = localStorage.getItem(AUTH_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error(e);
    }
    return null;
  });

  const login = (emailInput: string, passwordInput: string): boolean => {
    const cleanEmail = emailInput.trim().toLowerCase();
    const cleanPass = passwordInput.trim();
    if (
      (cleanEmail === 'rayan@poletry.af' || cleanEmail === 'rayan' || cleanEmail === 'rayan@poultry.af') &&
      cleanPass === 'Rayan6789'
    ) {
      const authUser: AuthUser = {
        email: 'Rayan@poletry.af',
        name: 'ریان (Rayan)',
        role: 'مدیر عمومی کارخانه (Director)',
        loginTime: new Date().toISOString(),
      };
      setUser(authUser);
      try {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authUser));
      } catch (err) {
        console.error(err);
      }
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    } catch (err) {
      console.error(err);
    }
  };

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

  // Keep localStorage in sync
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

  // Helper to convert units to kilos
  // 1 Bag = 50 kg (20 bags = 1 ton / 1000 kg as noted by user)
  // 1 Ton = 1000 kg
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
          const existing = updatedSuppliers[existingSupIndex];
          assignedSupplierId = existing.id;
          updatedSuppliers[existingSupIndex] = {
            ...existing,
            phone: supplierPhone || existing.phone,
            totalPurchasedAmount: existing.totalPurchasedAmount + totalBill,
            totalPaid: existing.totalPaid + paidAmount,
            balanceOwed: existing.balanceOwed + remaining,
            transactions: [transaction, ...existing.transactions],
          };
        } else {
          assignedSupplierId = `sup-${Date.now()}`;
          updatedSuppliers.unshift({
            id: assignedSupplierId,
            name: supName,
            phone: supplierPhone || '',
            totalPurchasedAmount: totalBill,
            totalPaid: paidAmount,
            balanceOwed: remaining,
            transactions: [transaction],
            createdAt: today,
          });
        }
      }

      // Check if this raw material item already exists by name
      const existingRawIndex = prev.rawMaterials.findIndex(
        r => r.name.toLowerCase() === item.name.trim().toLowerCase()
      );

      let updatedRawMaterials: RawMaterialItem[];
      if (existingRawIndex >= 0) {
        const existing = prev.rawMaterials[existingRawIndex];
        const combinedKg = existing.stockKg + item.stockKg;
        // Weighted average cost per kg
        const combinedCostPerKg = combinedKg > 0 
          ? ((existing.stockKg * existing.unitPrice) + (item.stockKg * item.unitPrice)) / combinedKg
          : item.unitPrice;

        updatedRawMaterials = [...prev.rawMaterials];
        updatedRawMaterials[existingRawIndex] = {
          ...existing,
          stockKg: combinedKg,
          unitPrice: Math.round(combinedCostPerKg * 100) / 100,
          supplierId: assignedSupplierId || existing.supplierId,
          supplierName: item.supplierName || existing.supplierName,
          dateAdded: today,
        };
      } else {
        const newRawMaterial: RawMaterialItem = {
          ...item,
          id: newId,
          supplierId: assignedSupplierId,
          dateAdded: today,
        };
        updatedRawMaterials = [newRawMaterial, ...prev.rawMaterials];
      }

      // Deduct paidAmount from cashInHand
      const updatedCash = prev.cashInHand - paidAmount;

      return {
        ...prev,
        rawMaterials: updatedRawMaterials,
        suppliers: updatedSuppliers,
        cashInHand: updatedCash,
      };
    });
  };

  // DELETE RAW MATERIAL
  const deleteRawMaterial = (id: string) => {
    setDb(prev => ({
      ...prev,
      rawMaterials: prev.rawMaterials.filter(r => r.id !== id),
    }));
  };

  // SETTLE SUPPLIER PAYMENT
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
        description: note || 'پرداخت باقی‌داری حساب عرضه کننده',
        amount: 0,
        paidAmount: actualPay,
        remainingAmount: newRemaining,
      };

      const updatedSuppliers = [...prev.suppliers];
      updatedSuppliers[supIndex] = {
        ...sup,
        totalPaid: sup.totalPaid + actualPay,
        balanceOwed: newRemaining,
        transactions: [transaction, ...sup.transactions],
      };

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
  };

  // 2. CREATE FORMULA & PRODUCE BATCH (DEDUCT RAW MATERIALS, ADD PROCESSED STOCK)
  const createFormulaAndProduce = (
    name: string,
    ingredients: { rawMaterialId: string; weightKg: number }[],
    description?: string,
    operatorName?: string,
    produceBatchImmediately = true
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

    const costPerKg = totalWeight > 0 ? Math.round((totalBatchCost / totalWeight) * 100) / 100 : 0;

    const newFormula: Formula = {
      id: formulaId,
      name,
      description,
      ingredients: populatedIngredients,
      totalWeightKg: totalWeight,
      totalBatchCost,
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
      totalCost: totalBatchCost,
      operatorName: operatorName || 'مسئول تولید',
      notes: `پروسس خودکار: ${name} (${totalWeight.toLocaleString()} کیلو)`,
    };

    setDb(prev => {
      // Deduct raw materials
      const updatedRaw = prev.rawMaterials.map(rm => {
        const used = ingredients.find(ing => ing.rawMaterialId === rm.id);
        if (used) {
          return {
            ...rm,
            stockKg: Math.max(0, rm.stockKg - used.weightKg),
          };
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

        updatedProcessedStock = [...prev.processedStock];
        updatedProcessedStock[existingProcessedIndex] = {
          ...existing,
          stockKg: newTotalKg,
          averageCostPerKg: Math.round(newAvgCost * 100) / 100,
          lastUpdated: today,
        };
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

      return {
        ...prev,
        rawMaterials: updatedRaw,
        processedStock: updatedProcessedStock,
        formulas: [newFormula, ...prev.formulas],
        productionBatches: produceBatchImmediately ? [newBatch, ...prev.productionBatches] : prev.productionBatches,
      };
    });

    return { success: true };
  };

  // 3. RECORD SALE (DEDUCT PROCESSED STOCK, AUTO-UPDATE CUSTOMER, ADD CASH)
  const recordSale = (saleData: {
    productId: string;
    productName: string;
    customerId?: string;
    customerName: string;
    customerPhone: string;
    unitType: UnitType;
    unitQuantity: number;
    salePricePerUnit: number;
    paidAmount: number;
    notes?: string;
  }) => {
    const quantityKg = convertToKg(saleData.unitType, saleData.unitQuantity);
    
    // Check processed stock
    const product = db.processedStock.find(p => p.id === saleData.productId);
    if (!product) {
      return { success: false, error: 'محصول انتخاب شده در گدام دانه پروسس شده یافت نشد.' };
    }
    if (product.stockKg < quantityKg) {
      return { 
        success: false, 
        error: `موجودی دانه پروسس شده کافی نیست! موجودی فعلی: ${product.stockKg.toLocaleString()} کیلو، مقدار فروش: ${quantityKg.toLocaleString()} کیلو.` 
      };
    }

    const totalAmount = saleData.unitQuantity * saleData.salePricePerUnit;
    const remainingAmount = Math.max(0, totalAmount - saleData.paidAmount);
    const costRatePerKg = product.averageCostPerKg;
    const totalCostOfGoods = costRatePerKg * quantityKg;
    const profit = totalAmount - totalCostOfGoods;
    const today = new Date().toISOString().split('T')[0];
    const saleId = `sale-${Date.now()}`;

    setDb(prev => {
      // 1. Deduct processed stock
      const updatedProcessedStock = prev.processedStock.map(p => {
        if (p.id === saleData.productId) {
          return {
            ...p,
            stockKg: Math.max(0, p.stockKg - quantityKg),
            lastUpdated: today,
          };
        }
        return p;
      });

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
        description: `فروش ${saleData.productName} (${saleData.unitQuantity} ${t[saleData.unitType]})`,
        amount: totalAmount,
        paidAmount: saleData.paidAmount,
        remainingAmount: remainingAmount,
      };

      if (existingCustIndex >= 0) {
        const existing = updatedCustomers[existingCustIndex];
        assignedCustId = existing.id;
        updatedCustomers[existingCustIndex] = {
          ...existing,
          phone: saleData.customerPhone || existing.phone,
          totalPurchasedAmount: existing.totalPurchasedAmount + totalAmount,
          totalPaid: existing.totalPaid + saleData.paidAmount,
          balanceOwed: existing.balanceOwed + remainingAmount,
          transactions: [customerTransaction, ...existing.transactions],
        };
      } else {
        assignedCustId = `cust-${Date.now()}`;
        updatedCustomers.unshift({
          id: assignedCustId,
          name: custName,
          phone: saleData.customerPhone,
          totalPurchasedAmount: totalAmount,
          totalPaid: saleData.paidAmount,
          balanceOwed: remainingAmount,
          transactions: [customerTransaction],
          createdAt: today,
        });
      }

      // 3. Record sale
      const newSale: Sale = {
        id: saleId,
        date: today,
        customerId: assignedCustId || '',
        customerName: custName,
        customerPhone: saleData.customerPhone,
        productId: saleData.productId,
        productName: saleData.productName,
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
        notes: saleData.notes,
      };

      // 4. Add paid amount to Cash in Hand
      const updatedCash = prev.cashInHand + saleData.paidAmount;

      return {
        ...prev,
        processedStock: updatedProcessedStock,
        customers: updatedCustomers,
        sales: [newSale, ...prev.sales],
        cashInHand: updatedCash,
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
      updatedCustomers[custIndex] = {
        ...cust,
        totalPaid: cust.totalPaid + actualReceived,
        balanceOwed: newRemaining,
        transactions: [transaction, ...cust.transactions],
      };

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
      if (parsed && parsed.rawMaterials && parsed.processedStock) {
        setDb(parsed);
        return true;
      }
    } catch (e) {
      console.error('Import failed:', e);
    }
    return false;
  };

  const resetToDefaultData = () => {
    if (window.confirm('آیا مطمئن هستید که می‌خواهید اطلاعات کارخانه را به حالت اولیه بازگردانید؟')) {
      setDb(initialFactoryData);
    }
  };

  const lowStockMaterials = db.rawMaterials.filter(r => r.stockKg <= lowStockThreshold);
  const getLocalizedName = (name: string) => getLocalizedItemName(name, lang);
  const getLocalizedCat = (cat: string) => getLocalizedCategory(cat, lang);

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
        lowStockThreshold,
        setLowStockThreshold,
        lowStockMaterials,
        getLocalizedName,
        getLocalizedCat,
        addRawMaterial,
        deleteRawMaterial,
        settleSupplierPayment,
        deleteSupplier,
        createFormulaAndProduce,
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
