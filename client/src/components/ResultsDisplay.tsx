import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Sun, Battery, Zap, Droplets, Gauge, Cpu, Layers, Wifi, FileDown } from "lucide-react";
import { useLang, MONTHS_SHORT, T } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { SystemDiagram } from "./SystemDiagram";
import { CostCalculator } from "./CostCalculator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Badge } from "./ui/badge";
import { ALGERIAN_MARKET_COMPONENTS, INTERNATIONAL_MARKET_COMPONENTS } from "@/lib/sizing-engine";
import { generateProjectPdf, computeDefaultCosts } from "@/lib/generatePdf";
import type { MonthlyRow } from "./LocationPicker";

type ComponentMarket = "algeria" | "international" | "both";

const MARKET_LABELS: Record<ComponentMarket, { label: string; flag: string }> = {
  algeria:       { label: "Algeria",       flag: "🇩🇿" },
  international: { label: "International", flag: "🌍" },
  both:          { label: "All",           flag: "🌐" },
};

interface ResultsDisplayProps {
  type: string;
  results: any;
  inputs?: any;
  projectName?: string;
  location?: { lat: number; lon: number; psh: number } | null;
  monthly?: MonthlyRow[] | null;
  spacing?: any;
}

export function ResultsDisplay({ type, results, inputs, projectName, location, monthly, spacing }: ResultsDisplayProps) {
  const { lang } = useLang();
  const t = T[lang];

  if (!results) return null;

  const handleDownloadPdf = () => {
    const { costs, roi } = computeDefaultCosts(type, results);
    generateProjectPdf({
      projectName:   projectName || "Solar Project",
      systemType:    type,
      location:      location ?? null,
      results,
      costs,
      roi,
      monthly:       monthly ?? undefined,
      spacing:       spacing ?? undefined,
      lang:          "en",
    });
  };

  const getCards = () => {
    const base = [
      { title: t.kpiPeakPower,   value: `${results.peakPowerWp} Wp`,                          desc: "Required STC Power",  icon: Zap,    color: "text-amber-600",   bg: "bg-amber-600/10"   },
      { title: t.kpiTotalPanels, value: `${results.numberOfPanels} units`,                    desc: `${results.systemCapacitykW} kW`, icon: Sun, color: "text-amber-500", bg: "bg-amber-500/10" },
      { title: t.kpiPanelConfig, value: `${results.panelsInSeries}S / ${results.panelsInParallel}P`, desc: "Series/Parallel",    icon: Layers, color: "text-blue-500",    bg: "bg-blue-500/10"    },
    ];

    switch (type) {
      case 'on-grid':
        return [
          ...base,
          { title: t.kpiInverter,       value: `${results.inverterCapacitykW} kW`,    icon: Gauge, color: "text-emerald-500", bg: "bg-emerald-500/10" },
          { title: t.kpiDcCablePanelInv,value: `${results.cables.panelToInv} mm²`,    icon: Zap,   color: "text-orange-500",  bg: "bg-orange-500/10"  },
          { title: t.kpiAcCableInvMain,  value: `${results.cables.invToMain} mm²`,     icon: Zap,   color: "text-blue-500",    bg: "bg-blue-500/10"    },
          { title: t.kpiDailyProd,       value: `${results.dailyProductionkWh} kWh`,   icon: Zap,   color: "text-purple-500",  bg: "bg-purple-500/10"  },
        ];
      case 'off-grid':
      case 'hybrid':
        const offGridCards = [
          ...base,
          { title: t.kpiBattBank,      value: `${results.totalBatteries} units`, desc: `${results.batteryCapacityAh} Ah @ ${results.systemVoltage}V`, icon: Battery, color: "text-emerald-500", bg: "bg-emerald-500/10" },
          { title: t.kpiInverter,       value: `${results.inverterCapacityW} W`,  desc: `Pure Sine Wave`,    icon: Gauge, color: "text-purple-500",  bg: "bg-purple-500/10"  },
          { title: t.kpiMpptReg,        value: `${results.mpptRatingA} A`,        desc: `Charge Controller`, icon: Cpu,   color: "text-rose-500",    bg: "bg-rose-500/10"    },
          { title: t.kpiDcPanelReg,     value: `${results.cables.panelToReg} mm²`,  icon: Zap, color: "text-orange-500",  bg: "bg-orange-500/10"  },
          { title: t.kpiDcRegBatt,      value: `${results.cables.regToBatt} mm²`,   icon: Zap, color: "text-orange-600",  bg: "bg-orange-600/10"  },
          { title: t.kpiDcBattInv,      value: `${results.cables.battToInv} mm²`,   icon: Zap, color: "text-orange-700",  bg: "bg-orange-700/10"  },
          { title: t.kpiAcInvLoad,      value: `${results.cables.invToLoad} mm²`,   icon: Zap, color: "text-blue-600",    bg: "bg-blue-600/10"    },
        ];
        if (results.dcDcConverter) {
          offGridCards.push({
            title: "DC-DC Converter",
            value: `${results.dcDcConverter.ratingA} A`,
            desc: results.dcDcConverter.voltage,
            icon: Cpu,
            color: "text-cyan-500",
            bg: "bg-cyan-500/10"
          });
          offGridCards.push({
            title: "DC Cable (Batt-DC)",
            value: `${results.cables.battToDcDc} mm²`,
            icon: Zap,
            color: "text-cyan-600",
            bg: "bg-cyan-600/10"
          });
        }
        return offGridCards;
      case 'pumping':
        return [
          ...base,
          { title: t.kpiPumpPower, value: `${results.pumpPowerHp} HP`, desc: `${results.pumpPowerW} W`, icon: Droplets, color: "text-emerald-500", bg: "bg-emerald-500/10" },
        ];
      default:
        return base;
    }
  };

  const cards = getCards();

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-display font-bold">Detailed Results</h2>
          <p className="text-muted-foreground">Comprehensive system specifications.</p>
        </div>
        <Button
          onClick={handleDownloadPdf}
          variant="outline"
          size="sm"
          className="gap-2 border-primary/30 text-primary hover:bg-primary/5 hover:border-primary/60 shrink-0"
          data-testid="button-download-pdf"
        >
          <FileDown className="w-4 h-4" />
          {t.downloadProjectPdf}
        </Button>
      </div>

      <SystemDiagram type={type} results={results} formValues={inputs} />

      {/* ─── Hybrid Grid Config Summary ─── */}
      {type === 'hybrid' && results.gridConfig && (
        <Card className="border-blue-500/20 bg-blue-500/5">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-blue-500/15 text-blue-500 flex items-center justify-center">
                <Wifi className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-blue-700 dark:text-blue-400">Grid Configuration</h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
              {[
                { label: "Grid Voltage",  value: `${results.gridConfig.voltage} V` },
                { label: "Frequency",     value: `${results.gridConfig.frequency} Hz` },
                { label: "Priority Mode", value: results.gridConfig.priorityMode?.replace("-first", " first") ?? "Solar first" },
                { label: "Grid Export",   value: results.gridConfig.exportEnabled ? (results.gridConfig.exportLimitW > 0 ? `${results.gridConfig.exportLimitW} W max` : "Unlimited") : "Disabled" },
                { label: "Grid Charging", value: results.gridConfig.gridCharging ? "Enabled" : "Disabled" },
              ].map((item, i) => (
                <div key={i} className="bg-white/60 dark:bg-white/5 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-1">{item.label}</p>
                  <p className="font-semibold text-foreground">{item.value}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {cards.map((card, i) => {
          const Icon = card.icon;
          return (
            <Card key={i} className="glass-card hover-lift overflow-hidden relative group border-border/50">
              <div className={`absolute top-0 right-0 w-20 h-20 rounded-bl-full ${card.bg} -z-10`} />
              <CardContent className="p-6">
                <div className={`w-10 h-10 rounded-xl ${card.bg} ${card.color} flex items-center justify-center mb-4`}>
                  <Icon className="w-5 h-5" />
                </div>
                <p className="text-xs font-medium text-muted-foreground mb-1">{card.title}</p>
                <h3 className="text-xl font-display font-bold text-foreground">{card.value}</h3>
                {card.desc && <p className="text-xs text-muted-foreground mt-1">{card.desc}</p>}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {monthly && monthly.length === 12 && (
        <SolarProductionCalendar monthly={monthly} results={results} systemType={type} />
      )}

      <MarketComponents type={type} results={results} />

      <CostCalculator type={type} results={results} />
    </div>
  );
}

// ─────────────── Monthly Production Calendar ────────────────────────────────
function SolarProductionCalendar({ monthly, results }: {
  monthly: MonthlyRow[]; results: any; systemType: string;
}) {
  const { lang } = useLang();
  const t = T[lang];
  const [selectedBar, setSelectedBar] = useState<number | null>(null);

  const PR = 0.82;
  const capacityKW = results.systemCapacitykW || 1;
  const monthlyKwh = monthly.map(m => +(m.irr * capacityKW * PR * 30).toFixed(0));
  const maxKwh = Math.max(...monthlyKwh);
  const minKwh = Math.min(...monthlyKwh);
  const annualKwh = monthlyKwh.reduce((a,b)=>a+b,0);

  const hasVariation = maxKwh !== minKwh;
  const peakIdx = hasVariation ? monthlyKwh.indexOf(maxKwh) : -1;
  const lowIdx  = hasVariation ? monthlyKwh.lastIndexOf(minKwh) : -1;

  const monthLabels = MONTHS_SHORT[lang];

  const barColor = (i: number, v: number) => {
    if (i === peakIdx) return "#f59e0b";
    if (i === lowIdx)  return "#60a5fa";
    if (v > 0.85) return "#fbbf24";
    if (v > 0.70) return "#34d399";
    if (v > 0.55) return "#2dd4bf";
    return "#93c5fd";
  };

  return (
    <div className="rounded-2xl border border-border/50 bg-card shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border/40 bg-gradient-to-r from-amber-500/5 to-transparent">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
            <Sun className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base">{t.monthlyCalendar}</h3>
            <p className="text-xs text-muted-foreground">NASA POWER · PR = {(PR*100).toFixed(0)}%</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">{t.annualProduction}</p>
          <p className="text-lg font-bold text-amber-600 dark:text-amber-400 font-mono">
            {(annualKwh / 1000).toFixed(2)} MWh
          </p>
        </div>
      </div>

      {/* Bar chart */}
      <div className="px-4 pt-5 pb-1">
        <div className="relative">
          <svg
            viewBox="0 0 360 120"
            className="w-full cursor-pointer"
            style={{ height: 120 }}
            preserveAspectRatio="none"
          >
            {monthlyKwh.map((kwh, i) => {
              const barW   = 360 / 12;
              const gap    = 2;
              const x      = i * barW + gap / 2;
              const w      = barW - gap;
              const ratio  = maxKwh > 0 ? kwh / maxKwh : 0;
              const barH   = ratio * 100;
              const y      = 110 - barH;
              const fill   = barColor(i, ratio);
              const rx     = 2;
              const isSelected = selectedBar === i;
              return (
                <g key={i} onClick={() => setSelectedBar(isSelected ? null : i)} style={{ cursor: "pointer" }}>
                  <rect
                    x={x} y={y} width={w} height={barH}
                    fill={fill} rx={rx} ry={rx}
                    opacity={isSelected ? 1 : 0.9}
                    stroke={isSelected ? "#fff" : "none"}
                    strokeWidth={isSelected ? 1 : 0}
                  />
                  {(i === peakIdx || i === lowIdx) && (
                    <text
                      x={x + w / 2} y={y - 3}
                      textAnchor="middle"
                      fontSize="8"
                      fill={i === peakIdx ? "#f59e0b" : "#60a5fa"}
                      fontWeight="bold"
                    >
                      {i === peakIdx ? "▲" : "▼"}
                    </text>
                  )}
                  {/* Click tooltip */}
                  {isSelected && (
                    <>
                      <rect
                        x={Math.min(x + w / 2 - 22, 315)} y={Math.max(y - 22, 2)}
                        width={44} height={16} rx={3} ry={3}
                        fill="#1e293b" opacity={0.92}
                      />
                      <text
                        x={Math.min(x + w / 2, 337)} y={Math.max(y - 10, 14)}
                        textAnchor="middle" fontSize="7.5" fill="#fff" fontWeight="bold"
                      >
                        {kwh.toLocaleString("en-US")} kWh
                      </text>
                    </>
                  )}
                  <title>{monthLabels[i]}: {kwh.toLocaleString("en-US")} kWh</title>
                </g>
              );
            })}
            <line x1="0" y1="60" x2="360" y2="60" stroke="#e5e7eb" strokeWidth="0.5" strokeDasharray="3,3" />
          </svg>
        </div>

        {/* Month labels */}
        <div className="flex mt-1 mb-2">
          {monthLabels.map((m, i) => (
            <div key={i} className="flex-1 text-center">
              <span className={`text-[8.5px] font-medium leading-none
                ${i === peakIdx ? "text-amber-500 font-bold" : i === lowIdx ? "text-blue-400 font-bold" : "text-muted-foreground"}
                ${selectedBar === i ? "text-foreground font-bold" : ""}`}>
                {m.slice(0, 3)}
              </span>
            </div>
          ))}
        </div>
        {selectedBar !== null && (
          <p className="text-xs text-center text-muted-foreground mb-1">
            <span className="font-semibold text-foreground">{monthLabels[selectedBar]}</span>: {monthlyKwh[selectedBar].toLocaleString("en-US")} kWh
          </p>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 border-t border-border/30 divide-x divide-border/30 rtl:divide-x-reverse">
        {[
          {
            label: t.peakMonth,
            val: peakIdx >= 0 ? monthLabels[peakIdx] : "—",
            sub: peakIdx >= 0 ? `${monthlyKwh[peakIdx].toLocaleString("en-US")} kWh` : "—",
            color: "text-amber-500",
          },
          {
            label: t.lowMonth,
            val: lowIdx >= 0 ? monthLabels[lowIdx] : "—",
            sub: lowIdx >= 0 ? `${monthlyKwh[lowIdx].toLocaleString("en-US")} kWh` : "—",
            color: "text-blue-400",
          },
          {
            label: t.avgMonthly,
            val: `${(annualKwh/12).toFixed(0)} kWh`,
            sub: `${capacityKW} kW × PR ${PR}`,
            color: "text-emerald-500",
          },
        ].map((s,i) => (
          <div key={i} className="px-4 py-3 text-center">
            <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider">{s.label}</p>
            <p className={`text-sm font-bold ${s.color}`}>{s.val}</p>
            <p className="text-[9px] text-muted-foreground font-mono">{s.sub}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────── Market Components ──────────────────────────────────────────
function MarketComponents({ type, results }: { type: string; results: any }) {
  const { lang } = useLang();
  const [compMarket, setCompMarket] = useState<ComponentMarket>("both");
  const [selectedInverter, setSelectedInverter] = useState<string>("");
  const [selectedRegulator, setSelectedRegulator] = useState<string>("");

  const allInverters = useMemo(() => {
    const dz = ALGERIAN_MARKET_COMPONENTS.inverters;
    const intl = INTERNATIONAL_MARKET_COMPONENTS.inverters;
    const pool = compMarket === "algeria" ? dz : compMarket === "international" ? intl : [...dz, ...intl];

    const reqW = type === "on-grid"
      ? (results.inverterCapacitykW || 0) * 1000
      : results.inverterCapacityW || 0;

    const typeMatch = (invType: string) => {
      if (type === "on-grid") return invType.includes("On-Grid");
      if (type === "off-grid") return invType.includes("Off-Grid") || invType.includes("Hybrid");
      if (type === "hybrid") return invType.includes("Hybrid") || invType.includes("Off-Grid");
      return true;
    };

    return pool
      .filter(inv => typeMatch(inv.type) && inv.powerW >= reqW)
      .map(inv => ({ ...inv, market: dz.includes(inv) ? "algeria" : "international" }));
  }, [compMarket, type, results.inverterCapacitykW, results.inverterCapacityW]);

  const allRegulators = useMemo(() => {
    if (type === "on-grid" || type === "pumping") return [];
    const dz = ALGERIAN_MARKET_COMPONENTS.regulators;
    const intl = INTERNATIONAL_MARKET_COMPONENTS.regulators;
    const pool = compMarket === "algeria" ? dz : compMarket === "international" ? intl : [...dz, ...intl];
    const reqA = results.mpptRatingA || 0;
    return pool
      .filter(reg => reg.currentA >= reqA)
      .map(reg => ({ ...reg, market: dz.includes(reg) ? "algeria" : "international" }));
  }, [compMarket, type, results.mpptRatingA]);

  const showSection = allInverters.length > 0 || allRegulators.length > 0;
  if (!showSection) return null;

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold">Component Selection</h2>
          <p className="text-muted-foreground text-sm">Filter compatible components for the calculated system</p>
        </div>
        <div className="flex gap-1 p-1 bg-muted rounded-xl text-sm w-fit shrink-0">
          {(Object.keys(MARKET_LABELS) as ComponentMarket[]).map(m => (
            <button
              key={m}
              onClick={() => { setCompMarket(m); setSelectedInverter(""); setSelectedRegulator(""); }}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg font-medium transition-all ${
                compMarket === m
                  ? "bg-background shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span>{MARKET_LABELS[m].flag}</span>
              <span>{MARKET_LABELS[m].label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {allInverters.length > 0 && (
          <Card className="glass-card border-border/50">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                  <Gauge className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold">Compatible Inverters</h3>
                  <p className="text-xs text-muted-foreground">{allInverters.length} models available</p>
                </div>
              </div>

              <Select value={selectedInverter} onValueChange={setSelectedInverter}>
                <SelectTrigger className="h-auto min-h-10">
                  <SelectValue placeholder="Choose inverter…" />
                </SelectTrigger>
                <SelectContent className="max-h-80 w-[var(--radix-select-trigger-width)]">
                  {allInverters.map((inv, idx) => (
                    <SelectItem key={idx} value={`${inv.brand}::${inv.model}`} className="py-2">
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <span className="font-medium truncate">
                          {inv.market === "algeria" ? "🇩🇿 " : "🌍 "}{inv.brand} – {inv.model}
                        </span>
                        <span className="text-xs text-muted-foreground font-mono">
                          {inv.powerW >= 1000 ? `${(inv.powerW/1000).toFixed(1)} kW` : `${inv.powerW} W`} · η {inv.efficiency}% · {inv.type}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedInverter && (() => {
                const inv = allInverters.find(i => `${i.brand}::${i.model}` === selectedInverter);
                if (!inv) return null;
                return (
                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-emerald-700 text-sm">Selected:</span>
                      <Badge variant="outline" className="text-xs">
                        {inv.market === "algeria" ? "🇩🇿 Algeria" : "🌍 International"}
                      </Badge>
                    </div>
                    <p className="font-mono font-bold text-emerald-600">{inv.brand} – {inv.model}</p>
                    <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                      <div><span className="block font-medium text-foreground">{inv.powerW >= 1000 ? `${(inv.powerW/1000).toFixed(1)} kW` : `${inv.powerW} W`}</span>Power</div>
                      <div><span className="block font-medium text-foreground">{inv.efficiency}%</span>Efficiency</div>
                      <div><span className="block font-medium text-foreground">{inv.type}</span>Type</div>
                    </div>
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        )}

        {allRegulators.length > 0 && (
          <Card className="glass-card border-border/50">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center">
                  <Cpu className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold">Compatible MPPT Regulators</h3>
                  <p className="text-xs text-muted-foreground">{allRegulators.length} models · min {results.mpptRatingA}A</p>
                </div>
              </div>

              <Select value={selectedRegulator} onValueChange={setSelectedRegulator}>
                <SelectTrigger className="h-auto min-h-10">
                  <SelectValue placeholder="Choose regulator…" />
                </SelectTrigger>
                <SelectContent className="max-h-80 w-[var(--radix-select-trigger-width)]">
                  {allRegulators.map((reg, idx) => (
                    <SelectItem key={idx} value={`${reg.brand}::${reg.model}`} className="py-2">
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <span className="font-medium truncate">
                          {reg.market === "algeria" ? "🇩🇿 " : "🌍 "}{reg.brand} – {reg.model}
                        </span>
                        <span className="text-xs text-muted-foreground font-mono">
                          {reg.currentA} A MPPT · Voc max {reg.maxVoc} V
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedRegulator && (() => {
                const reg = allRegulators.find(r => `${r.brand}::${r.model}` === selectedRegulator);
                if (!reg) return null;
                return (
                  <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-rose-700 text-sm">Selected:</span>
                      <Badge variant="outline" className="text-xs">
                        {reg.market === "algeria" ? "🇩🇿 Algeria" : "🌍 International"}
                      </Badge>
                    </div>
                    <p className="font-mono font-bold text-rose-600">{reg.brand} – {reg.model}</p>
                    <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                      <div><span className="block font-medium text-foreground">{reg.currentA} A</span>MPPT Current</div>
                      <div><span className="block font-medium text-foreground">{reg.maxVoc} V</span>Max Voc</div>
                    </div>
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
