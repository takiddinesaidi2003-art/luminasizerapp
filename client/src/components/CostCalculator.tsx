import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine
} from "recharts";
import {
  TrendingUp, Wallet, Zap, Clock, Calendar,
  ChevronDown, ChevronUp, PencilLine
} from "lucide-react";
import { useLang, T } from "@/lib/i18n";

const DEFAULT_PRICES = {
  panelPerWatt: 55,
  batteryPerAh12V: 145,
  inverterPerWatt: 28,
  regulatorPerAmp: 450,
  installationPct: 15,
  cableAndMiscFixed: 25000,
  sonelgazTariff: 5.0,
};

function fmt(n: number) {
  return n.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

function Stat({ label, value, sub, color = "text-foreground" }: any) {
  return (
    <div className="flex flex-col gap-0.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-lg font-display font-bold ${color}`}>{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

function PriceRow({ label, unit, value, min, max, step = 1, onChange }: any) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-sm font-mono font-bold text-primary">
          {fmt(value)} {unit}
        </span>
      </div>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={([v]) => onChange(v)}
        className="w-full"
      />
    </div>
  );
}

export function CostCalculator({ type, results }: { type: string; results: any }) {
  const { lang } = useLang();
  const t = T[lang];

  const [prices, setPrices] = useState(DEFAULT_PRICES);
  const [showPriceEditor, setShowPriceEditor] = useState(false);
  const [systemLifeYears] = useState(25);

  const set = (key: keyof typeof DEFAULT_PRICES) => (v: number) =>
    setPrices(prev => ({ ...prev, [key]: v }));

  const costs = useMemo(() => {
    const panelsCost = (results.systemCapacitykW || 0) * 1000 * prices.panelPerWatt;

    const batteriesCost = (type === "off-grid" || type === "hybrid")
      ? results.totalBatteries * 200 * prices.batteryPerAh12V
      : 0;

    const inverterW = type === "on-grid"
      ? results.inverterCapacitykW * 1000
      : results.inverterCapacityW || 0;
    const inverterCost = inverterW * prices.inverterPerWatt;

    const regulatorA = results.mpptRatingA || 0;
    const regulatorCost = regulatorA * prices.regulatorPerAmp;

    const materialCost = panelsCost + batteriesCost + inverterCost + regulatorCost + prices.cableAndMiscFixed;
    const installCost = materialCost * (prices.installationPct / 100);
    const totalCost = materialCost + installCost;

    return {
      panels: panelsCost,
      batteries: batteriesCost,
      inverter: inverterCost,
      regulator: regulatorCost,
      cableAndMisc: prices.cableAndMiscFixed,
      installation: installCost,
      material: materialCost,
      total: totalCost,
    };
  }, [results, type, prices]);

  const annualProductionkWh = useMemo(() => {
    if (type === "on-grid" && results.dailyProductionkWh) {
      return results.dailyProductionkWh * 365;
    }
    const kw = results.systemCapacitykW || 0;
    const psh = 5;
    return kw * psh * 365 * 0.82;
  }, [results, type]);

  const roi = useMemo(() => {
    const annualSavings = annualProductionkWh * prices.sonelgazTariff;
    const paybackYears = costs.total / annualSavings;
    const savingsOver25 = annualSavings * systemLifeYears - costs.total;

    const chartData = Array.from({ length: systemLifeYears + 1 }, (_, y) => ({
      year: y,
      cumulative: Math.round(y * annualSavings - costs.total),
    }));

    return { annualSavings, paybackYears, savingsOver25, chartData };
  }, [costs.total, annualProductionkWh, prices.sonelgazTariff, systemLifeYears]);

  const cur = t.costCurrency;
  const yr = t.costYearUnit;

  const costRows = [
    { label: `${t.costLabelPanels} (×${results.numberOfPanels})`, value: costs.panels, color: "bg-amber-500" },
    ...(costs.batteries > 0 ? [{ label: `${t.costLabelBatteries} (×${results.totalBatteries})`, value: costs.batteries, color: "bg-emerald-500" }] : []),
    { label: t.costLabelInverter, value: costs.inverter, color: "bg-purple-500" },
    ...(costs.regulator > 0 ? [{ label: t.costLabelMppt, value: costs.regulator, color: "bg-rose-500" }] : []),
    { label: t.costLabelCables, value: costs.cableAndMisc, color: "bg-orange-400" },
    { label: t.costLabelInstallation, value: costs.installation, color: "bg-blue-400" },
  ].filter(r => r.value > 0);

  const paybackReached = roi.paybackYears <= systemLifeYears;

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-display font-bold">{t.costTitle}</h2>
          <p className="text-muted-foreground text-sm">{t.costSubtitle}</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowPriceEditor(v => !v)}
          className="gap-2"
          data-testid="button-edit-prices"
        >
          <PencilLine className="w-4 h-4" />
          {t.costEditPrices}
          {showPriceEditor ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </Button>
      </div>

      {/* Price editor */}
      {showPriceEditor && (
        <Card className="glass-card border-primary/30">
          <CardContent className="p-6 space-y-5">
            <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-wide">{t.costAdjustPrices}</h3>
            <PriceRow label={t.costPricePerWatt}    unit={`${cur}/W`}   value={prices.panelPerWatt}     min={30}  max={120} onChange={set("panelPerWatt")} />
            <PriceRow label={t.costPriceBattery}    unit={`${cur}/Ah`}  value={prices.batteryPerAh12V}  min={80}  max={250} onChange={set("batteryPerAh12V")} />
            <PriceRow label={t.costPriceInverter}   unit={`${cur}/W`}   value={prices.inverterPerWatt}  min={15}  max={60}  onChange={set("inverterPerWatt")} />
            <PriceRow label={t.costPriceMppt}       unit={`${cur}/A`}   value={prices.regulatorPerAmp}  min={200} max={900} step={50} onChange={set("regulatorPerAmp")} />
            <PriceRow label={t.costPriceInstallPct} unit="%"            value={prices.installationPct}  min={5}   max={30}  onChange={set("installationPct")} />
            <PriceRow label={t.costPriceTariff}     unit={`${cur}/kWh`} value={prices.sonelgazTariff}   min={2}   max={12}  step={0.5} onChange={set("sonelgazTariff")} />
            <div className="flex justify-end">
              <Button variant="ghost" size="sm" onClick={() => setPrices(DEFAULT_PRICES)}>
                {t.costReset}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Cost breakdown */}
        <Card className="glass-card border-border/50">
          <CardContent className="p-6 space-y-5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
                <Wallet className="w-4 h-4" />
              </div>
              <h3 className="font-bold">{t.costBreakdown}</h3>
            </div>

            {/* Visual cost bar */}
            <div className="w-full h-4 rounded-full overflow-hidden flex">
              {costRows.map((r, i) => (
                <div
                  key={i}
                  className={`${r.color} transition-all duration-500`}
                  style={{ width: `${(r.value / costs.total) * 100}%` }}
                  title={`${r.label}: ${fmt(r.value)} ${cur}`}
                />
              ))}
            </div>

            {/* Line items */}
            <div className="space-y-2">
              {costRows.map((r, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${r.color}`} />
                    <span>{r.label}</span>
                  </div>
                  <span className="font-mono font-semibold">{fmt(r.value)} {cur}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-border/50 pt-3 flex justify-between items-center">
              <span className="font-bold">{t.costEstimatedTotal}</span>
              <span className="text-xl font-display font-bold text-primary">{fmt(costs.total)} {cur}</span>
            </div>
          </CardContent>
        </Card>

        {/* KPI cards */}
        <div className="grid grid-cols-2 gap-4 content-start">
          <Card className="glass-card border-border/50">
            <CardContent className="p-5">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-3">
                <Zap className="w-4 h-4" />
              </div>
              <Stat
                label={t.costAnnualProduction}
                value={`${fmt(annualProductionkWh)} kWh`}
                sub={t.costEnergyPerYear}
                color="text-emerald-600"
              />
            </CardContent>
          </Card>

          <Card className="glass-card border-border/50">
            <CardContent className="p-5">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-3">
                <TrendingUp className="w-4 h-4" />
              </div>
              <Stat
                label={t.costAnnualSavings}
                value={`${fmt(roi.annualSavings)} ${cur}`}
                sub={t.costFromSonelgaz}
                color="text-amber-600"
              />
            </CardContent>
          </Card>

          <Card className="glass-card border-border/50">
            <CardContent className="p-5">
              <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center mb-3">
                <Clock className="w-4 h-4" />
              </div>
              <Stat
                label={t.costPaybackPeriod}
                value={paybackReached ? `${roi.paybackYears.toFixed(1)} ${yr}` : `> 25 ${yr}`}
                sub={paybackReached ? t.costThenProfit : t.costCheckPrices}
                color={paybackReached && roi.paybackYears <= 10 ? "text-emerald-600" : "text-rose-600"}
              />
            </CardContent>
          </Card>

          <Card className="glass-card border-border/50">
            <CardContent className="p-5">
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center mb-3">
                <Calendar className="w-4 h-4" />
              </div>
              <Stat
                label={`${t.costNetProfit} / ${systemLifeYears} ${yr}`}
                value={`${roi.savingsOver25 >= 0 ? "+" : ""}${fmt(roi.savingsOver25)} ${cur}`}
                sub={t.costAfterPayback}
                color={roi.savingsOver25 >= 0 ? "text-emerald-600" : "text-rose-600"}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Cumulative chart */}
      <Card className="glass-card border-border/50">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold">{t.costCumulativeReturn} — {systemLifeYears} {yr}</h3>
              <p className="text-xs text-muted-foreground">{t.costCumulativeDesc}</p>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={roi.chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="roiGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0.03} />
                </linearGradient>
                <linearGradient id="roiGradNeg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F87171" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#F87171" stopOpacity={0.03} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.07} />
              <XAxis
                dataKey="year"
                tickFormatter={v => `${v}${lang === "ar" ? "س" : "y"}`}
                tick={{ fontSize: 11 }}
                stroke="currentColor"
                opacity={0.4}
              />
              <YAxis
                tickFormatter={v => `${v >= 0 ? "+" : ""}${(v / 1000).toFixed(0)}k`}
                tick={{ fontSize: 11 }}
                stroke="currentColor"
                opacity={0.4}
                unit={` ${cur}`}
              />
              <Tooltip
                formatter={(v: any) => [`${fmt(v)} ${cur}`, t.costCumulativeFlow]}
                labelFormatter={l => lang === "ar" ? `السنة ${l}` : `Year ${l}`}
                contentStyle={{ fontSize: 12, borderRadius: 8 }}
              />
              <ReferenceLine
                y={0}
                stroke="#10B981"
                strokeDasharray="6 3"
                strokeWidth={2}
                label={{ value: t.costBreakEven, fill: "#10B981", fontSize: 11 }}
              />
              <Area
                type="monotone"
                dataKey="cumulative"
                stroke="#10B981"
                strokeWidth={2.5}
                fill="url(#roiGrad)"
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>

          {paybackReached && (
            <div className="flex items-center gap-2 text-sm text-emerald-600 bg-emerald-500/10 p-3 rounded-lg">
              <TrendingUp className="w-4 h-4 shrink-0" />
              {lang === "ar" ? (
                <span>
                  يسترد النظام تكلفته بعد <strong>{roi.paybackYears.toFixed(1)} {yr}</strong>، ثم يوفر
                  تلقائياً <strong>{fmt(roi.annualSavings)} {cur}/{yr}</strong> لما تبقى من عمره.
                </span>
              ) : (
                <span>
                  The system recoups its cost after <strong>{roi.paybackYears.toFixed(1)} {yr}</strong>, then
                  automatically saves <strong>{fmt(roi.annualSavings)} {cur}/{yr}</strong> for the rest of its lifetime.
                </span>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Disclaimer */}
      <p className="text-xs text-muted-foreground text-center">
        {t.costDisclaimer}
      </p>

    </div>
  );
}
