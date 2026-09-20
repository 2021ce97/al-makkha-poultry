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
  DollarSign,
  Info
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
  const costPerBag = costPerKg * 50; // 50kg bag
  const totalBags = Math.round(totalBatchWeight / 50);

  const handleProduce = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!formulaName.trim()) {
      setMessage({ type: 'error', text: t.formulaTitle });
      return;
    }
    if (ingredients.length === 0 || totalBatchWeight <= 0) {
      setMessage({ type: 'error', text: t.weightToUse });
      return;
    }

    const result = createFormulaAndProduce(
      formulaName.trim(),
      ingredients.map(ing => ({
        rawMaterialId: ing.rawMaterialId,
        weightKg: Number(ing.weightKg) || 0,
      })),
      description.trim() || undefined,
      operatorName.trim() || undefined,
      true
    );

    if (!result.success) {
      setMessage({ type: 'error', text: result.error || t.insufficientStockError });
    } else {
      setMessage({
        type: 'success',
        text: `${t.statusNormal}: ${totalBatchWeight.toLocaleString()} ${t.kilo} (${totalBags} ${t.bag})`,
      });
      setFormulaName('');
      setDescription('');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
              <Scale className="w-5 h-5" />
            </div>
            <span>{t.formulaTitle}</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            {t.formulaDesc}
          </p>
        </div>

        {/* Quick template buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-400 hidden sm:inline">فورمول‌های آماده:</span>
          <button
            type="button"
            onClick={() => applyTemplate('starter')}
            className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-500 text-xs font-semibold text-slate-300 hover:text-amber-400 transition-colors"
          >
            استارتر (Starter)
          </button>
          <button
            type="button"
            onClick={() => applyTemplate('grower')}
            className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-500 text-xs font-semibold text-slate-300 hover:text-amber-400 transition-colors"
          >
            گروور (Grower)
          </button>
          <button
            type="button"
            onClick={() => applyTemplate('layer')}
            className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-500 text-xs font-semibold text-slate-300 hover:text-amber-400 transition-colors"
          >
            تخمی (Layer)
          </button>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-2xl text-xs flex items-center gap-2 border ${
          message.type === 'success'
            ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
            : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
        }`}>
          {message.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Main Production Form & Calculation Box */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form area (2 cols) */}
        <div className="lg:col-span-2 bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl">
          <form onSubmit={handleProduce} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  نام فورمول / محصول پروسس شده *
                </label>
                <input
                  type="text"
                  required
                  value={formulaName}
                  onChange={(e) => setFormulaName(e.target.value)}
                  placeholder="مثال: دانه گوشتی استارتر"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  نام مسئول یا اوپراتور خط تولید
                </label>
                <input
                  type="text"
                  value={operatorName}
                  onChange={(e) => setOperatorName(e.target.value)}
                  placeholder="مثال: استاد حمید"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                توضیحات و مشخصات تغذیه‌ای
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="فیصدی پروتین، کلسیم، ویتامین‌ها..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Ingredients Table */}
            <div className="border-t border-slate-800 pt-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  مواد خام مصرفی (میکس تولید دانه)
                </h3>
                <button
                  type="button"
                  onClick={handleAddIngredientRow}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-semibold flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{t.addIngredient}</span>
                </button>
              </div>

              <div className="space-y-2.5">
                {ingredients.map((ing, index) => {
                  const rawItem = db.rawMaterials.find(r => r.id === ing.rawMaterialId);
                  const cost = rawItem ? rawItem.unitPrice * (Number(ing.weightKg) || 0) : 0;
                  const isLow = rawItem && rawItem.stockKg < (Number(ing.weightKg) || 0);

                  return (
                    <div
                      key={index}
                      className={`p-3 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center gap-3 transition-colors ${
                        isLow ? 'bg-rose-950/20 border-rose-500/40' : 'bg-slate-950 border-slate-800'
                      }`}
                    >
                      {/* Material Select */}
                      <div className="flex-1 w-full sm:w-auto">
                        <select
                          value={ing.rawMaterialId}
                          onChange={(e) => handleUpdateIngredient(index, 'rawMaterialId', e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                        >
                          {db.rawMaterials.map(rm => (
                            <option key={rm.id} value={rm.id}>
                              {getLocalizedName(rm.name)} (موجودی: {rm.stockKg.toLocaleString()} kg | {rm.unitPrice} {t.currency}/kg)
                            </option>
                          ))}
                        </select>
                        {isLow && (
                          <span className="text-[11px] text-rose-400 font-bold block mt-1">
                            ⚠️ موجودی ناکافی است! (فقط {rawItem?.stockKg} کیلو در گدام موجود است)
                          </span>
                        )}
                      </div>

                      {/* Weight in Kilos */}
                      <div className="w-full sm:w-36">
                        <div className="relative">
                          <input
                            type="number"
                            min="1"
                            step="any"
                            value={ing.weightKg}
                            onChange={(e) => handleUpdateIngredient(index, 'weightKg', Number(e.target.value))}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono font-bold focus:outline-none focus:border-amber-500"
                          />
                          <span className="absolute end-2 top-1.5 text-[11px] text-slate-500">
                            {t.kilo}
                          </span>
                        </div>
                      </div>

                      {/* Subtotal cost display */}
                      <div className="w-full sm:w-28 text-end">
                        <span className="font-bold text-amber-400 font-mono text-xs">
                          {cost.toLocaleString()} {t.currency}
                        </span>
                      </div>

                      {/* Remove row */}
                      <button
                        type="button"
                        onClick={() => handleRemoveIngredientRow(index)}
                        disabled={ingredients.length <= 1}
                        className="p-1.5 text-slate-500 hover:text-rose-400 disabled:opacity-30 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Deduct Notice */}
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300 flex items-start gap-2">
              <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>{t.produceDeductNotice}</span>
            </div>

            {/* Submit Produce Button */}
            <div className="flex items-center justify-end pt-2">
              <button
                type="submit"
                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-emerald-500/20 transition-all cursor-pointer active:scale-95"
              >
                <PackageCheck className="w-4 h-4" />
                <span>{t.createFormulaBtn}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Real-time Calculation Card (1 col) */}
        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-xl flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2 pb-3 border-b border-slate-800">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              <span>محاسبه خودکار وزن و قیمت تمام‌شد</span>
            </h3>

            <div className="space-y-3 mt-4">
              {/* Total Weight */}
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-xs text-slate-400 block">{t.totalFormulaWeight}</span>
                <div className="text-2xl font-black font-mono text-white mt-1">
                  {totalBatchWeight.toLocaleString()} {t.kilo}
                </div>
                <div className="text-xs text-amber-400 mt-1 font-mono">
                  معادل {totalBags.toLocaleString()} {t.bag} • {(totalBatchWeight / 1000).toFixed(2)} {t.ton}
                </div>
              </div>

              {/* Total Batch Cost */}
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-xs text-slate-400 block">{t.totalBatchCost}</span>
                <div className="text-xl font-bold font-mono text-cyan-400 mt-1">
                  {totalBatchCost.toLocaleString()} {t.currency}
                </div>
                <span className="text-xs text-slate-500">مجموع هزینه مواد خام مصرفی</span>
              </div>

              {/* Cost per Kilo Result */}
              <div className="p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                <span className="text-xs font-semibold text-emerald-400 block">
                  {t.costPerKiloResult}:
                </span>
                <div className="text-2xl font-black font-mono text-emerald-300 mt-1">
                  {costPerKg.toFixed(2)} {t.currency}
                </div>
                <span className="text-xs text-emerald-400 block mt-1 font-mono">
                  {t.costPerBagResult}: <strong>{costPerBag.toFixed(0)} {t.currency}</strong>
                </span>
              </div>
            </div>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] text-slate-400">
            💡 این نرخ تمام‌شد به صورت خودکار در صفحه فروشات نمایش داده می‌شود تا از سوددهی فاکتور اطمینان حاصل شود.
          </div>
        </div>
      </div>

      {/* Processed Stock Inventory & History Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Processed Feed Stock */}
        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-xl">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
            <PackageCheck className="w-4 h-4 text-emerald-400" />
            <span>موجودی دانه پروسس شده در انبار (آماده فروش)</span>
          </h3>

          <div className="space-y-2.5">
            {db.processedStock.map(p => {
              const bags = Math.round(p.stockKg / 50);
              return (
                <div
                  key={p.id}
                  className="p-3.5 rounded-xl border border-slate-800 bg-slate-950 flex items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <h4 className="font-bold text-white text-sm">{getLocalizedName(p.name)}</h4>
                    <span className="text-[11px] text-slate-400">
                      نرخ تمام‌شد: <strong className="font-mono text-amber-400">{p.averageCostPerKg} {t.currency}</strong> /kg
                    </span>
                  </div>
                  <div className="text-end">
                    <div className="font-bold font-mono text-emerald-400 text-sm">
                      {p.stockKg.toLocaleString()} {t.kilo}
                    </div>
                    <span className="text-[11px] text-slate-400">
                      ({bags} {t.bag})
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Production Batches */}
        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-xl">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
            <CalendarClock className="w-4 h-4 text-amber-400" />
            <span>تاریخچه خط تولید و پروسس روزانه</span>
          </h3>

          <div className="space-y-2.5">
            {db.productionBatches.slice(0, 5).map(b => (
              <div
                key={b.id}
                className="p-3.5 rounded-xl border border-slate-800 bg-slate-950 flex items-center justify-between text-xs"
              >
                <div>
                  <h4 className="font-bold text-white">{getLocalizedName(b.formulaName)}</h4>
                  <span className="text-[11px] text-slate-400">
                    تاریخ: {b.date} {b.operatorName ? `• اپراتور: ${b.operatorName}` : ''}
                  </span>
                </div>
                <div className="text-end">
                  <span className="font-bold font-mono text-white block">
                    {b.totalWeightKg.toLocaleString()} {t.kilo}
                  </span>
                  <span className="text-[11px] text-slate-400">
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
