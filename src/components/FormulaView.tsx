import React, { useState } from 'react';
import { useDatabase } from '../context/DatabaseContext';
import { 
  Scale, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  PackageCheck, 
  CalendarClock, 
  Sparkles, 
  DollarSign
} from 'lucide-react';

export const FormulaView: React.FC = () => {
  const { db, t, lang, createFormulaAndProduce, getLocalizedName } = useDatabase();

  // Recipe Builder State
  const [formulaName, setFormulaName] = useState('');
  const [description, setDescription] = useState('');
  const [operatorName, setOperatorName] = useState('');
  const [ingredients, setIngredients] = useState<
    { rawMaterialId: string; weightKg: number }[]
  >([
    { rawMaterialId: db.rawMaterials[0]?.id || '', weightKg: 500 },
    { rawMaterialId: db.rawMaterials[1]?.id || '', weightKg: 300 },
    { rawMaterialId: db.rawMaterials[2]?.id || '', weightKg: 100 },
  ]);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Quick Preset Templates
  const applyTemplate = (type: 'starter' | 'grower' | 'layer') => {
    if (db.rawMaterials.length === 0) return;

    const corn = db.rawMaterials.find(r => r.name.includes('Corn') || r.name.includes('جواری') || r.name.includes('جوار')) || db.rawMaterials[0];
    const soya = db.rawMaterials.find(r => r.name.includes('Soy') || r.name.includes('سویا')) || db.rawMaterials[1] || db.rawMaterials[0];
    const oilCake = db.rawMaterials.find(r => r.name.includes('Cake') || r.name.includes('کنجاره') || r.name.includes('کنجاړه')) || db.rawMaterials[2] || db.rawMaterials[0];
    const premix = db.rawMaterials.find(r => r.name.includes('Premix') || r.name.includes('ویتامین') || r.name.includes('ویټامین')) || db.rawMaterials[3] || db.rawMaterials[0];

    if (type === 'starter') {
      setFormulaName(lang === 'fa' ? 'دانه آغازین برویلر (سوپر استارتر)' : lang === 'ps' ? 'د برویلر پیلنی دانه (سوپر سټارټر)' : 'Broiler Starter Feed (Super Starter)');
      setDescription(lang === 'fa' ? 'پروتئین ۲۲ فیصد مخصوص جوجه گوشتی روز ۱ تا ۱۰' : lang === 'ps' ? '۲۲ سلنه پروتین د غوښینو چرګوړو ۱ تر ۱۰ ورځو لپاره' : '22% Protein for broiler chicks days 1-10');
      setIngredients([
        { rawMaterialId: corn.id, weightKg: 550 },
        { rawMaterialId: soya.id, weightKg: 350 },
        { rawMaterialId: oilCake.id, weightKg: 75 },
        { rawMaterialId: premix.id, weightKg: 25 },
      ]);
    } else if (type === 'grower') {
      setFormulaName(lang === 'fa' ? 'دانه رشد برویلر (گروور)' : lang === 'ps' ? 'د برویلر د ودې دانه (ګروور)' : 'Broiler Grower Feed');
      setDescription(lang === 'fa' ? 'پروتئین ۲۰ فیصد رشد سریع روز ۱۱ تا ۲۵' : lang === 'ps' ? '۲۰ سلنه پروتین د چټکې ودې لپاره ۱۱ تر ۲۵ ورځو' : '20% Protein for rapid broiler growth days 11-25');
      setIngredients([
        { rawMaterialId: corn.id, weightKg: 600 },
        { rawMaterialId: soya.id, weightKg: 280 },
        { rawMaterialId: oilCake.id, weightKg: 95 },
        { rawMaterialId: premix.id, weightKg: 25 },
      ]);
    } else {
      setFormulaName(lang === 'fa' ? 'دانه مرغ تخمی (لیر)' : lang === 'ps' ? 'د هګیو د چرګانو دانه (لیر)' : 'Layer Hen Feed');
      setDescription(lang === 'fa' ? 'فرمول تخمگذاری با کلسیم و فسفر غنی شده' : lang === 'ps' ? 'د هګیو اچولو ځانګړی فورمول د کلسیم او فاسفورس سره' : 'Layer feed enriched with calcium and phosphorus');
      setIngredients([
        { rawMaterialId: corn.id, weightKg: 620 },
        { rawMaterialId: soya.id, weightKg: 220 },
        { rawMaterialId: oilCake.id, weightKg: 135 },
        { rawMaterialId: premix.id, weightKg: 25 },
      ]);
    }
  };

  const handleAddIngredientRow = () => {
    const defaultRm = db.rawMaterials[0]?.id || '';
    setIngredients(prev => [...prev, { rawMaterialId: defaultRm, weightKg: 100 }]);
  };

  const handleRemoveIngredientRow = (index: number) => {
    setIngredients(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpdateIngredient = (index: number, field: 'rawMaterialId' | 'weightKg', val: any) => {
    setIngredients(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: val };
      return updated;
    });
  };

  // Calculations
  let totalBatchWeight = 0;
  let totalBatchCost = 0;

  ingredients.forEach(ing => {
    const raw = db.rawMaterials.find(r => r.id === ing.rawMaterialId);
    const weight = Number(ing.weightKg) || 0;
    const cost = raw ? raw.unitPrice * weight : 0;
    totalBatchWeight += weight;
    totalBatchCost += cost;
  });

  const costPerKg = totalBatchWeight > 0 ? totalBatchCost / totalBatchWeight : 0;
  const costPerBag = costPerKg * 50;
  const totalBags = Math.round(totalBatchWeight / 50);

  const handleProduce = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!formulaName.trim()) {
      setMessage({ type: 'error', text: 'لطفاً نام دانه / فرمول را وارد کنید.' });
      return;
    }

    if (totalBatchWeight <= 0) {
      setMessage({ type: 'error', text: 'وزن کل مواد مصرفی باید بیشتر از صفر باشد.' });
      return;
    }

    // Check if we have enough raw materials in stock
    for (const ing of ingredients) {
      const raw = db.rawMaterials.find(r => r.id === ing.rawMaterialId);
      if (!raw) {
        setMessage({ type: 'error', text: 'یک ماده خام نامعتبر انتخاب شده است.' });
        return;
      }
      if (raw.stockKg < ing.weightKg) {
        setMessage({ 
          type: 'error', 
          text: `موجودی "${getLocalizedName(raw.name)}" کافی نیست! موجودی انبار: ${raw.stockKg} کجوری، مقدار درخواستی: ${ing.weightKg} کیلو.` 
        });
        return;
      }
    }

    createFormulaAndProduce(
      formulaName.trim(),
      ingredients,
      description.trim() || undefined,
      operatorName.trim() || undefined,
      true
    );

    setMessage({ 
      type: 'success', 
      text: `پروسس دانه "${formulaName}" با موفقیت انجام شد! ${totalBatchWeight.toLocaleString()} کیلو دانه آماده به انبار اضافه گردید.` 
    });

    // Reset form
    setFormulaName('');
    setDescription('');
    setOperatorName('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-100 text-amber-700">
              <Scale className="w-5 h-5" />
            </div>
            <span>{t.formulaTitle}</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            {t.formulaDesc}
          </p>
        </div>

        {/* Quick Presets */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 hidden md:inline">پیش‌فرض‌های کارخانه:</span>
          <button
            type="button"
            onClick={() => applyTemplate('starter')}
            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
          >
            استارتر (۲۲٪)
          </button>
          <button
            type="button"
            onClick={() => applyTemplate('grower')}
            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
          >
            گروور (۲۰٪)
          </button>
          <button
            type="button"
            onClick={() => applyTemplate('layer')}
            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
          >
            تخمی (لیر)
          </button>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-xl border flex items-center gap-3 text-xs sm:text-sm ${
          message.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
            : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" /> : <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Main Recipe Builder & Production Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ingredients Form (2 Columns) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-600" />
            <span>تنظیمات بچ تولید و ترکیب مواد خام</span>
          </h3>

          <form onSubmit={handleProduce} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  نام دانه / فرمول تولید شده *
                </label>
                <input
                  type="text"
                  required
                  value={formulaName}
                  onChange={(e) => setFormulaName(e.target.value)}
                  placeholder="مثال: دانه برویلر گروور ممتاز"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-amber-600 shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  نام اپراتور خط تولید
                </label>
                <input
                  type="text"
                  value={operatorName}
                  onChange={(e) => setOperatorName(e.target.value)}
                  placeholder="نام مسئول پروسس"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-amber-600 shadow-2xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                توضیحات فرمول
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="مثال: فرمول استاندارد با ارزش پروتئین بالا"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-amber-600 shadow-2xs"
              />
            </div>

            {/* Ingredients Table / Rows */}
            <div className="mt-5 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  اقلام مواد خام مصرفی در این بچ
                </label>
                <button
                  type="button"
                  onClick={handleAddIngredientRow}
                  className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>افزودن ماده خام</span>
                </button>
              </div>

              <div className="space-y-2.5">
                {ingredients.map((ing, idx) => {
                  const selectedRaw = db.rawMaterials.find(r => r.id === ing.rawMaterialId);
                  const cost = selectedRaw ? selectedRaw.unitPrice * (Number(ing.weightKg) || 0) : 0;
                  const isInsufficient = selectedRaw && selectedRaw.stockKg < (Number(ing.weightKg) || 0);

                  return (
                    <div 
                      key={idx}
                      className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        isInsufficient ? 'bg-rose-50 border-rose-200' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <label className="block text-[10px] text-slate-500 mb-1">انتخاب ماده خام #{idx + 1}</label>
                        <select
                          value={ing.rawMaterialId}
                          onChange={(e) => handleUpdateIngredient(idx, 'rawMaterialId', e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-amber-600 shadow-2xs font-medium"
                        >
                          {db.rawMaterials.map(rm => (
                            <option key={rm.id} value={rm.id}>
                              {getLocalizedName(rm.name)} (موجودی: {rm.stockKg.toLocaleString()} کجوری • {rm.unitPrice} {t.currency}/kg)
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="w-full sm:w-36">
                        <label className="block text-[10px] text-slate-500 mb-1">وزن (کیلوگرم)</label>
                        <input
                          type="number"
                          min="1"
                          step="any"
                          value={ing.weightKg}
                          onChange={(e) => handleUpdateIngredient(idx, 'weightKg', e.target.value ? Number(e.target.value) : 0)}
                          className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-mono focus:outline-none focus:border-amber-600 shadow-2xs"
                        />
                      </div>

                      <div className="w-full sm:w-32 text-end sm:pt-4">
                        <span className="text-[10px] text-slate-500 block">هزینه کل</span>
                        <span className="text-xs font-bold text-amber-700 font-mono">
                          {cost.toLocaleString()} {t.currency}
                        </span>
                      </div>

                      <div className="sm:pt-4">
                        <button
                          type="button"
                          onClick={() => handleRemoveIngredientRow(idx)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
              <button
                type="submit"
                className="px-6 py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm shadow-md shadow-amber-600/25 transition-all flex items-center gap-2"
              >
                <PackageCheck className="w-4 h-4" />
                <span>ثبت پروسس و تولید دانه</span>
              </button>
            </div>
          </form>
        </div>

        {/* Real-time Calculation Panel (1 Column) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-6">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              <span>محاسبه خودکار وزن و قیمت تمام‌شد</span>
            </h3>

            <div className="space-y-3 mt-4">
              {/* Total Weight */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-xs text-slate-500 block">{t.totalFormulaWeight}</span>
                <div className="text-2xl font-black font-mono text-slate-900 mt-1">
                  {totalBatchWeight.toLocaleString()} {t.kilo}
                </div>
                <div className="text-xs text-amber-700 mt-1 font-mono font-medium">
                  معادل {totalBags.toLocaleString()} {t.bag} • {(totalBatchWeight / 1000).toFixed(2)} {t.ton}
                </div>
              </div>

              {/* Total Batch Cost */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-xs text-slate-500 block">{t.totalBatchCost}</span>
                <div className="text-xl font-bold font-mono text-cyan-700 mt-1">
                  {totalBatchCost.toLocaleString()} {t.currency}
                </div>
                <span className="text-xs text-slate-500">مجموع هزینه مواد خام مصرفی</span>
              </div>

              {/* Cost per Kilo Result */}
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                <span className="text-xs font-semibold text-emerald-700 block">
                  {t.costPerKiloResult}:
                </span>
                <div className="text-2xl font-black font-mono text-emerald-800 mt-1">
                  {costPerKg.toFixed(2)} {t.currency}
                </div>
                <span className="text-xs text-emerald-700 block mt-1 font-mono">
                  {t.costPerBagResult}: <strong>{costPerBag.toFixed(0)} {t.currency}</strong>
                </span>
              </div>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600">
            💡 این نرخ تمام‌شد به صورت خودکار در صفحه فروشات نمایش داده می‌شود تا از سوددهی فاکتور اطمینان حاصل شود.
          </div>
        </div>
      </div>

      {/* Processed Stock Inventory & History Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Processed Feed Stock */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-3">
            <PackageCheck className="w-4 h-4 text-emerald-600" />
            <span>موجودی دانه پروسس شده در انبار (آماده فروش)</span>
          </h3>

          <div className="space-y-2.5">
            {db.processedStock.map(p => {
              const bags = Math.round(p.stockKg / 50);
              return (
                <div
                  key={p.id}
                  className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 flex items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{getLocalizedName(p.name)}</h4>
                    <span className="text-[11px] text-slate-500">
                      نرخ تمام‌شد: <strong className="font-mono text-amber-700">{p.averageCostPerKg} {t.currency}</strong> /kg
                    </span>
                  </div>
                  <div className="text-end">
                    <div className="font-bold font-mono text-emerald-700 text-sm">
                      {p.stockKg.toLocaleString()} {t.kilo}
                    </div>
                    <span className="text-[11px] text-slate-500">
                      ({bags} {t.bag})
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Production Batches */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-3">
            <CalendarClock className="w-4 h-4 text-amber-600" />
            <span>تاریخچه خط تولید و پروسس روزانه</span>
          </h3>

          <div className="space-y-2.5">
            {db.productionBatches.slice(0, 5).map(b => (
              <div
                key={b.id}
                className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 flex items-center justify-between text-xs"
              >
                <div>
                  <h4 className="font-bold text-slate-900">{getLocalizedName(b.formulaName)}</h4>
                  <span className="text-[11px] text-slate-500">
                    تاریخ: {b.date} {b.operatorName ? `• اپراتور: ${b.operatorName}` : ''}
                  </span>
                </div>
                <div className="text-end">
                  <span className="font-bold font-mono text-slate-900 block">
                    {b.totalWeightKg.toLocaleString()} {t.kilo}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {Math.round(b.totalWeightKg / 50)} {t.bag}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
