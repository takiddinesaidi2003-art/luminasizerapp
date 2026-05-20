import { Sun, Battery, Zap, Wind, Fuel, Plug, Home, Gauge, Droplets, Cpu } from "lucide-react";
import { WIND_TURBINES, DIESEL_GENERATORS } from "@/lib/sizing-engine";
import { useLang } from "@/lib/i18n";

interface SystemDiagramProps {
  type: string;
  formValues?: any;
  results?: any;
}

// ─── Static Tailwind colour map ────────────────────────────────────────────
const C = {
  amber:   { border: "border-amber-400",   bg: "bg-amber-400/10",   icon: "text-amber-500",  title: "text-amber-700 dark:text-amber-300",   spec: "text-amber-800 dark:text-amber-200"  },
  red:     { border: "border-red-400",     bg: "bg-red-400/10",     icon: "text-red-500",    title: "text-red-700 dark:text-red-300",       spec: "text-red-800 dark:text-red-200"      },
  emerald: { border: "border-emerald-400", bg: "bg-emerald-400/10", icon: "text-emerald-500",title: "text-emerald-700 dark:text-emerald-300",spec: "text-emerald-800 dark:text-emerald-200"},
  purple:  { border: "border-purple-400",  bg: "bg-purple-400/10",  icon: "text-purple-500", title: "text-purple-700 dark:text-purple-300",  spec: "text-purple-800 dark:text-purple-200" },
  rose:    { border: "border-rose-400",    bg: "bg-rose-400/10",    icon: "text-rose-500",   title: "text-rose-700 dark:text-rose-300",     spec: "text-rose-800 dark:text-rose-200"    },
  blue:    { border: "border-blue-400",    bg: "bg-blue-400/10",    icon: "text-blue-500",   title: "text-blue-700 dark:text-blue-300",     spec: "text-blue-800 dark:text-blue-200"    },
  sky:     { border: "border-sky-400",     bg: "bg-sky-400/10",     icon: "text-sky-500",    title: "text-sky-700 dark:text-sky-300",       spec: "text-sky-800 dark:text-sky-200"      },
  orange:  { border: "border-orange-400",  bg: "bg-orange-400/10",  icon: "text-orange-500", title: "text-orange-700 dark:text-orange-300", spec: "text-orange-800 dark:text-orange-200" },
  cyan:    { border: "border-cyan-400",    bg: "bg-cyan-400/10",    icon: "text-cyan-500",   title: "text-cyan-700 dark:text-cyan-300",     spec: "text-cyan-800 dark:text-cyan-200"    },
  teal:    { border: "border-teal-400",    bg: "bg-teal-400/10",    icon: "text-teal-500",   title: "text-teal-700 dark:text-teal-300",     spec: "text-teal-800 dark:text-teal-200"    },
};
type ColorKey = keyof typeof C;

// ─── FlowBox ───────────────────────────────────────────────────────────────
function FlowBox({ title, sub, specs, Icon, color }: {
  title: string; sub?: string; specs: string[];
  Icon: React.ElementType; color: ColorKey;
}) {
  const cl = C[color];
  return (
    <div className={`flex flex-col items-center gap-1.5 rounded-xl border-2 ${cl.border} ${cl.bg} px-3 py-3 min-w-[100px] max-w-[130px] text-center shrink-0`}>
      <Icon className={`w-5 h-5 ${cl.icon} shrink-0`} />
      <p className={`text-[11px] font-extrabold leading-tight ${cl.title}`}>{title}</p>
      {sub && <p className="text-[9px] text-muted-foreground leading-tight">{sub}</p>}
      <div className="mt-0.5 space-y-0.5 w-full">
        {specs.filter(Boolean).map((s, i) => (
          <p key={i} className={`text-[10px] font-bold font-mono ${cl.spec} leading-tight`}>{s}</p>
        ))}
      </div>
    </div>
  );
}

// ─── Horizontal arrow connector (flow diagrams) ────────────────────────────
function HArrow({ label, dc = true, dashed = false }: { label: string; dc?: boolean; dashed?: boolean }) {
  const amber = "border-t-amber-400";
  const blue  = "border-t-blue-400";
  const fill  = dc ? "bg-amber-400" : "bg-blue-400";
  const tri   = dc ? "border-l-amber-400" : "border-l-blue-400";
  const text  = dc ? "text-amber-600 dark:text-amber-400" : "text-blue-600 dark:text-blue-400";
  return (
    <div className="flex flex-col items-center justify-center gap-0.5 px-1 shrink-0 min-w-[52px]">
      <span className={`text-[9px] font-bold whitespace-nowrap ${text}`}>{label}</span>
      <div className="flex items-center w-full">
        <div
          className={`h-0.5 flex-1`}
          style={dashed
            ? { borderTop: `2px dashed`, borderColor: dc ? "rgb(251 191 36)" : "rgb(96 165 250)", height: 0 }
            : { background: dc ? "rgb(251 191 36)" : "rgb(96 165 250)" }}
        />
        <div className={`w-0 h-0 border-t-[5px] border-b-[5px] border-l-[8px] border-t-transparent border-b-transparent ${tri}`} />
      </div>
    </div>
  );
}

// ─── Summary bar ──────────────────────────────────────────────────────────
interface StatItem { label: string; value: string }
function SummaryBar({ stats }: { stats: StatItem[] }) {
  if (!stats.length) return null;
  return (
    <div className="flex flex-wrap justify-center gap-x-6 gap-y-1 px-4 py-2.5 bg-muted/30 border-t border-border/30 rounded-b-2xl">
      {stats.map((s, i) => (
        <div key={i} className="flex flex-col items-center">
          <span className="text-[9px] text-muted-foreground uppercase tracking-wide">{s.label}</span>
          <span className="text-[11px] font-extrabold text-foreground">{s.value}</span>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  HYBRID — Vertical Bus Topology
// ═══════════════════════════════════════════════════════════════════════════
function HybridBusDiagram({ fv, res }: { fv: any; res: any }) {
  const { lang } = useLang();
  const ar = lang === "ar";

  // ── What elements exist? ────────────────────────────────────────────────
  const panelCount = res?.numberOfPanels ?? 0;
  const panelWp    = fv?.panelWattage ?? 450;
  const hasPV      = panelCount > 0 || (fv?.panelWattage > 0 && (fv?.panelCount ?? fv?.numberOfPanels ?? 0) > 0);
  const hasWind    = !!(fv?.windEnabled && fv?.windTurbineModel);
  const hasDiesel  = !!(fv?.dieselEnabled && fv?.dieselGeneratorModel);

  const battCount   = res?.totalBatteries ?? 0;
  const hasBattery  = battCount > 0 || (fv?.batteryUnitCapacityAh > 0 && (fv?.daysOfAutonomy ?? 0) > 0);
  const loadsList   = fv?.loads ?? [];
  const hasLoads    = loadsList.some((l: any) => (parseFloat(l.power) || 0) > 0);
  const hasGrid     = true; // always for hybrid

  // ── Extract specs ────────────────────────────────────────────────────────
  const sysV    = res?.systemVoltage ?? fv?.batteryUnitVoltage ?? 48;
  const battAh  = res?.batteryCapacityAh ?? 0;
  const battS   = res?.batteriesInSeries ?? 1;
  const battP   = res?.batteriesInParallel ?? 1;
  const invW    = res?.inverterCapacityW ?? 0;
  const mpptA   = res?.mpptRatingA ?? 0;
  const cables  = res?.cables ?? {};

  const totalLoadW = loadsList.reduce(
    (s: number, l: any) => s + (parseFloat(l.power) || 0) * (parseFloat(l.quantity) || 0), 0);

  const windTurbine   = WIND_TURBINES.find(t => `${t.brand}||${t.model}` === fv?.windTurbineModel);
  const isGenericWind = fv?.windTurbineModel === "Generic||Custom Turbine";
  const windCount     = parseInt(fv?.windTurbineCount) || 1;
  const windRatedKw   = isGenericWind ? (fv?.windTurbineCustomKw ?? 1) : (windTurbine?.ratedKW ?? 0);

  const dieselGen   = DIESEL_GENERATORS.find(g => `${g.brand}||${g.model}` === fv?.dieselGeneratorModel);
  const dieselCount = parseInt(fv?.dieselGeneratorCount) || 1;

  // ── Build source & output node lists ─────────────────────────────────────
  type BusNode = { id: string; el: React.ReactNode };

  const sources: BusNode[] = [];
  if (hasPV) sources.push({ id: "pv",
    el: <FlowBox
          title={panelCount > 0 ? `Panel ×${panelCount}` : (ar ? "ألواح شمسية" : "Solar PV")}
          Icon={Sun} color="amber"
          specs={[
            `${((panelCount || 1) * panelWp / 1000).toFixed(1)} kW`,
            res?.panelsInSeries ? `${res.panelsInSeries}S / ${res.panelsInParallel}P` : "",
          ]}
        />
  });
  if (hasWind) sources.push({ id: "wind",
    el: <FlowBox
          title={ar ? `توربين ريح ×${windCount}` : `Wind ×${windCount}`}
          Icon={Wind} color="sky"
          specs={[
            windRatedKw > 0 ? `${(windRatedKw * windCount).toFixed(1)} kW` : "",
            windTurbine || isGenericWind ? (isGenericWind ? "Custom" : `${windTurbine?.brand}`) : "",
          ]}
        />
  });
  if (hasDiesel) sources.push({ id: "diesel",
    el: <FlowBox
          title={ar ? `ديزل ×${dieselCount}` : `Diesel ×${dieselCount}`}
          Icon={Fuel} color="orange"
          specs={[
            dieselGen ? `${(dieselGen.powerKW * dieselCount).toFixed(1)} kW` : "",
            dieselGen ? `${dieselGen.brand}` : "",
          ]}
        />
  });

  const outputs: BusNode[] = [];
  if (hasBattery) outputs.push({ id: "battery",
    el: <FlowBox
          title={battCount > 0 ? `Battery ×${battCount}` : (ar ? "بطاريات" : "Battery")}
          Icon={Battery} color="teal"
          specs={[
            battAh > 0 ? `${battAh} Ah @ ${sysV}V` : `${sysV}V`,
            battS > 0 && battP > 0 ? `${battS}S × ${battP}P` : "",
          ]}
        />
  });
  if (hasLoads) outputs.push({ id: "loads",
    el: <FlowBox
          title={ar ? "أحمال AC" : "AC Loads"}
          Icon={Home} color="rose"
          specs={[
            totalLoadW > 0 ? `${(totalLoadW / 1000).toFixed(2)} kW` : "",
            "230 V~",
          ]}
        />
  });
  if (hasGrid) outputs.push({ id: "grid",
    el: <FlowBox
          title={ar ? "شبكة الكهرباء" : "Grid"}
          Icon={Plug} color="blue"
          specs={[
            `${fv?.gridVoltage ?? "230"} V`,
            fv?.gridExportEnabled ? (ar ? "تصدير ✓" : "Export ✓") : (ar ? "استهلاك فقط" : "Import only"),
          ]}
        />
  });

  // ── Inverter box (always on bus) ──────────────────────────────────────────
  const invSpecs = [
    invW > 0 ? `W ${invW}` : (ar ? "عاكس هجين" : "Hybrid Inv."),
    mpptA > 0 ? `MPPT ${mpptA}A` : "",
  ].filter(Boolean);

  const InverterNode = (
    <div className={`flex flex-col items-center gap-1.5 rounded-xl border-2 border-purple-500 bg-background px-3 py-3 min-w-[110px] max-w-[140px] text-center shadow-lg shadow-purple-500/10 z-20 relative`}>
      <Zap className="w-5 h-5 text-purple-500" />
      <p className="text-[11px] font-extrabold leading-tight text-purple-700 dark:text-purple-300">
        {ar ? "العاكس الهجين" : "Hybrid Inverter"}
      </p>
      <div className="space-y-0.5 w-full">
        {invSpecs.map((s, i) => (
          <p key={i} className="text-[10px] font-bold font-mono text-purple-800 dark:text-purple-200 leading-tight">{s}</p>
        ))}
      </div>
    </div>
  );

  const maxLen   = Math.max(sources.length, outputs.length, 1);
  const midRow   = Math.floor((maxLen - 1) / 2);
  const emptyMsg = sources.length === 0 && outputs.length === 1 && hasGrid; // only grid → show helpful note

  // ── Summary bar ──────────────────────────────────────────────────────────
  const stats: StatItem[] = [
    { label: ar ? "القدرة الذروية" : "Peak Power",   value: `Wp ${res?.peakPowerWp ?? "—"}` },
    { label: ar ? "السعة" : "Capacity",               value: `kW ${res?.systemCapacitykW ?? "—"}` },
    { label: ar ? "جهد النظام" : "Sys. Voltage",      value: `V ${sysV}` },
    { label: ar ? "البطاريات" : "Batteries",           value: battCount > 0 ? `×${battCount}` : "—" },
    ...(res?.windConfig ? [{ label: "Wind",  value: `${res.windConfig.dailyKwh} kWh/d` }] : []),
    ...(res?.dieselConfig ? [{ label: "Diesel", value: `${res.dieselConfig.dailyFuelL} L/d` }] : []),
  ];

  // ── Cable wire component (horizontal stub to bus) ─────────────────────────
  const SourceWire = ({ cableLabel }: { cableLabel?: string }) => (
    <div className="flex flex-col items-end justify-center gap-0.5 w-12 shrink-0">
      {cableLabel && <span className="text-[8px] font-bold text-amber-600 dark:text-amber-400 whitespace-nowrap">{cableLabel}</span>}
      <div className="flex items-center w-full">
        <div className="h-px flex-1 bg-gray-700 dark:bg-gray-400" />
        <div className="w-0 h-0 border-t-[4px] border-b-[4px] border-l-[6px] border-t-transparent border-b-transparent border-l-gray-700 dark:border-l-gray-400" />
      </div>
    </div>
  );

  const OutputWire = ({ cableLabel }: { cableLabel?: string }) => (
    <div className="flex flex-col items-start justify-center gap-0.5 w-12 shrink-0">
      {cableLabel && <span className="text-[8px] font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap">{cableLabel}</span>}
      <div className="flex items-center w-full">
        <div className="h-px flex-1 bg-gray-700 dark:bg-gray-400" />
        <div className="w-0 h-0 border-t-[4px] border-b-[4px] border-l-[6px] border-t-transparent border-b-transparent border-l-gray-700 dark:border-l-gray-400" />
      </div>
    </div>
  );

  return (
    <div className="space-y-0">
      <div className="px-4 pt-5 pb-4">
        <div className="flex" style={{ minHeight: maxLen * 100 }}>

          {/* ── Left column: Sources ─────────────────────────────────── */}
          <div className="flex-1 flex flex-col justify-evenly gap-2 items-end">
            {Array.from({ length: maxLen }).map((_, i) => {
              const src = sources[i];
              if (!src) {
                return <div key={i} className="h-[80px]" />;
              }
              const cableLabel = i === 0 && cables.panelToReg ? `DC ${cables.panelToReg}mm²` : undefined;
              return (
                <div key={src.id} className="flex items-center">
                  {src.el}
                  <SourceWire cableLabel={cableLabel} />
                </div>
              );
            })}
          </div>

          {/* ── Center: Vertical Bus ─────────────────────────────────── */}
          <div className="relative flex flex-col items-center shrink-0" style={{ width: 6 }}>
            {/* Continuous black bus line */}
            <div className="absolute inset-0 flex justify-center">
              <div className="w-1.5 h-full bg-gray-900 dark:bg-gray-100 rounded-full" />
            </div>

            {/* Inverter box sits on the bus at the middle row */}
            <div
              className="absolute z-10"
              style={{
                top: `calc(${(midRow + 0.5) / maxLen * 100}%)`,
                transform: "translate(-50%, -50%)",
                left: "50%",
              }}
            >
              {InverterNode}
            </div>
          </div>

          {/* ── Right column: Outputs ────────────────────────────────── */}
          <div className="flex-1 flex flex-col justify-evenly gap-2 items-start">
            {Array.from({ length: maxLen }).map((_, i) => {
              const out = outputs[i];
              if (!out) {
                return <div key={i} className="h-[80px]" />;
              }
              const cableLabel =
                out.id === "battery" && cables.battToInv ? `DC ${cables.battToInv}mm²` :
                out.id === "loads"   && cables.invToLoad ? `AC ${cables.invToLoad}mm²` :
                out.id === "grid"    && cables.invToMain ? `AC ${cables.invToMain}mm²` : undefined;
              return (
                <div key={out.id} className="flex items-center">
                  <OutputWire cableLabel={cableLabel} />
                  {out.el}
                </div>
              );
            })}
          </div>
        </div>

        {/* Empty state hint */}
        {sources.length === 0 && (
          <p className="text-center text-[10px] text-muted-foreground mt-2">
            {ar ? "أضف ألواح شمسية أو مصادر طاقة لعرضها هنا" : "Add solar panels or energy sources to see them here"}
          </p>
        )}
      </div>
      <SummaryBar stats={stats} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  OFF-GRID — Horizontal flow
// ═══════════════════════════════════════════════════════════════════════════
function OffGridDiagram({ fv, res }: { fv: any; res: any }) {
  const { lang } = useLang();
  const ar = lang === "ar";

  const panelCount = res?.numberOfPanels ?? 0;
  const panelWp    = fv?.panelWattage ?? 450;
  const sysV       = res?.systemVoltage ?? fv?.batteryUnitVoltage ?? 24;
  const battAh     = res?.batteryCapacityAh ?? 0;
  const battCount  = res?.totalBatteries ?? 0;
  const battS      = res?.batteriesInSeries ?? 1;
  const battP      = res?.batteriesInParallel ?? 1;
  const invW       = res?.inverterCapacityW ?? 0;
  const mpptA      = res?.mpptRatingA ?? 0;
  const hasDcDc    = res?.dcDcConverter != null || fv?.hasDcDcConverter;
  const cables     = res?.cables ?? {};
  const loads      = fv?.loads ?? [];
  const totalLoadW = loads.reduce((s: number, l: any) => s + (parseFloat(l.power) || 0) * (parseFloat(l.quantity) || 0), 0);
  const dcDcSpec   = res?.dcDcConverter ?? {};

  const stats: StatItem[] = [
    { label: ar ? "القدرة الذروية" : "Peak Power",   value: `Wp ${res?.peakPowerWp ?? "—"}` },
    { label: ar ? "السعة" : "Capacity",               value: `kW ${res?.systemCapacitykW ?? "—"}` },
    { label: ar ? "جهد النظام" : "Sys. Voltage",      value: `V ${sysV}` },
    { label: ar ? "البطاريات" : "Batteries",           value: battCount > 0 ? `×${battCount}` : "—" },
    { label: "MPPT",                                   value: mpptA > 0 ? `A ${mpptA}` : "—" },
  ];

  return (
    <div className="space-y-0">
      <div className="px-4 pt-5 pb-3 space-y-3">
        {/* Main flow */}
        <div className="flex items-center justify-center flex-wrap gap-0">
          <FlowBox
            title={panelCount > 0 ? `Panel ×${panelCount}` : (ar ? "ألواح شمسية" : "Solar Panels")}
            Icon={Sun} color="amber"
            specs={[
              `${((panelCount || 1) * panelWp / 1000).toFixed(1)} kW`,
              res?.panelsInSeries ? `${res.panelsInSeries}S / ${res.panelsInParallel}P` : `${panelWp}W`,
            ]}
          />
          <HArrow label={cables.panelToReg ? `DC ${cables.panelToReg}mm²` : "DC →"} dc />
          <FlowBox
            title={ar ? "منظم MPPT" : "MPPT Controller"}
            Icon={Gauge} color="red"
            specs={[mpptA > 0 ? `A ${mpptA}` : "MPPT", res?.recommendedRegulators?.[0]?.model ?? ""]}
          />
          <HArrow label={cables.regToBatt ? `DC ${cables.regToBatt}mm²` : "DC →"} dc />
          <FlowBox
            title={battCount > 0 ? `Battery ×${battCount}` : (ar ? "بطاريات" : "Battery")}
            Icon={Battery} color="teal"
            specs={[battAh > 0 ? `${battAh} Ah @ ${sysV}V` : `${sysV}V`, battS > 0 && battP > 0 ? `${battS}S × ${battP}P` : ""]}
          />
          <HArrow label={cables.battToInv ? `DC ${cables.battToInv}mm²` : "DC →"} dc />
          <FlowBox
            title={ar ? "العاكس" : "Inverter"}
            Icon={Zap} color="purple"
            specs={[invW > 0 ? `W ${invW}` : "Inv.", res?.recommendedInverters?.[0]?.model?.substring(0, 14) ?? ""]}
          />
          <HArrow label={cables.invToLoad ? `AC ${cables.invToLoad}mm²` : "AC →"} dc={false} />
          <FlowBox
            title={ar ? "أحمال AC" : "AC Loads"}
            Icon={Home} color="rose"
            specs={[totalLoadW > 0 ? `${(totalLoadW / 1000).toFixed(1)} kW` : "", "230 V~"]}
          />
        </div>

        {/* DC-DC branch */}
        {hasDcDc && (
          <div className="flex justify-center items-center gap-0 flex-wrap">
            <div className="w-full flex justify-center">
              <div className="h-4 border-l-2 border-dashed border-amber-400/60" />
            </div>
            <div className="flex items-center gap-0">
              <FlowBox
                title={ar ? "محوّل DC-DC" : "DC-DC Converter"}
                Icon={Cpu} color="cyan"
                specs={[dcDcSpec.voltage ?? "DC-DC", dcDcSpec.ratingA ? `A ${dcDcSpec.ratingA}` : ""]}
              />
              <HArrow label="DC →" dc />
              <FlowBox
                title={ar ? "أحمال DC" : "DC Loads"}
                Icon={Home} color="blue"
                specs={["12 / 24 V"]}
              />
            </div>
          </div>
        )}
      </div>
      <SummaryBar stats={stats} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  ON-GRID — Horizontal flow
// ═══════════════════════════════════════════════════════════════════════════
function OnGridDiagram({ fv, res }: { fv: any; res: any }) {
  const { lang } = useLang();
  const ar = lang === "ar";

  const panelCount = res?.numberOfPanels ?? 0;
  const panelWp    = fv?.panelWattage ?? 450;
  const invKw      = res?.inverterCapacitykW ?? 0;
  const cables     = res?.cables ?? {};
  const kwp        = panelCount > 0 ? ((panelCount * panelWp) / 1000).toFixed(1) : "—";

  const stats: StatItem[] = [
    { label: ar ? "القدرة الذروية" : "Peak Power",   value: `Wp ${res?.peakPowerWp ?? "—"}` },
    { label: ar ? "السعة" : "Capacity",               value: `kW ${kwp}` },
    { label: ar ? "الإنتاج اليومي" : "Daily Yield",   value: `${res?.dailyProductionkWh ?? "—"} kWh` },
    { label: ar ? "العاكس" : "Inverter",               value: invKw > 0 ? `${invKw} kW` : "—" },
  ];

  return (
    <div className="space-y-0">
      <div className="px-4 pt-5 pb-3">
        <div className="flex items-center justify-center flex-wrap gap-0">
          <FlowBox
            title={panelCount > 0 ? `Panel ×${panelCount}` : (ar ? "ألواح شمسية" : "Solar Panels")}
            Icon={Sun} color="amber"
            specs={[`${kwp} kW`, res?.panelsInSeries ? `${res.panelsInSeries}S / ${res.panelsInParallel}P` : `${panelWp}W`]}
          />
          <HArrow label={cables.panelToInv ? `DC ${cables.panelToInv}mm²` : "DC →"} dc />
          <FlowBox
            title={ar ? "العاكس" : "Inverter"}
            Icon={Zap} color="purple"
            specs={[invKw > 0 ? `${invKw} kW` : "On-Grid Inv.", res?.recommendedInverters?.[0]?.model?.substring(0, 14) ?? ""]}
          />
          <HArrow label={cables.invToMain ? `AC ${cables.invToMain}mm²` : "AC →"} dc={false} />
          <FlowBox
            title={ar ? "لوحة الكهرباء" : "Main Panel"}
            Icon={Plug} color="blue"
            specs={[`${fv?.gridVoltage ?? "230"} V`, "Grid-Tied"]}
          />
        </div>
      </div>
      <SummaryBar stats={stats} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  PUMPING — Horizontal flow
// ═══════════════════════════════════════════════════════════════════════════
function PumpingDiagram({ fv, res }: { fv: any; res: any }) {
  const { lang } = useLang();
  const ar = lang === "ar";

  const panelCount = res?.numberOfPanels ?? 0;
  const panelWp    = fv?.panelWattage ?? 450;
  const mpptA      = res?.mpptRatingA ?? 0;

  const stats: StatItem[] = [
    { label: ar ? "القدرة الذروية" : "Peak Power",   value: `Wp ${res?.peakPowerWp ?? "—"}` },
    { label: ar ? "قدرة المضخة" : "Pump Power",      value: res?.pumpPowerW ? `W ${res.pumpPowerW}` : "—" },
    { label: ar ? "الارتفاع" : "Total Head",          value: res?.totalHeadM ? `${res.totalHeadM} m` : "—" },
    { label: ar ? "يومي" : "Daily Water",             value: res?.dailyWaterM3 ? `${res.dailyWaterM3} m³` : "—" },
  ];

  return (
    <div className="space-y-0">
      <div className="px-4 pt-5 pb-3">
        <div className="flex items-center justify-center flex-wrap gap-0">
          <FlowBox
            title={panelCount > 0 ? `Panel ×${panelCount}` : (ar ? "ألواح شمسية" : "Solar Panels")}
            Icon={Sun} color="amber"
            specs={[`${((panelCount || 1) * panelWp / 1000).toFixed(1)} kW`, res?.panelsInSeries ? `${res.panelsInSeries}S / ${res.panelsInParallel}P` : `${panelWp}W`]}
          />
          <HArrow label="DC →" dc />
          <FlowBox
            title={ar ? "وحدة التحكم" : "Pump Controller"}
            Icon={Gauge} color="red"
            specs={[mpptA > 0 ? `MPPT ${mpptA}A` : "VFD/MPPT"]}
          />
          <HArrow label="3Ø →" dc={false} />
          <FlowBox
            title={ar ? "مضخة مياه" : "Water Pump"}
            Icon={Droplets} color="blue"
            specs={[
              res?.pumpPowerW ? `${(res.pumpPowerW / 1000).toFixed(1)} kW` : "",
              res?.totalHeadM ? `H=${res.totalHeadM}m` : "",
              res?.dailyWaterM3 ? `${res.dailyWaterM3} m³/d` : "",
            ]}
          />
        </div>
      </div>
      <SummaryBar stats={stats} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  Main export
// ═══════════════════════════════════════════════════════════════════════════
export function SystemDiagram({ type, formValues: fv, results: res }: SystemDiagramProps) {
  const { lang } = useLang();
  const ar = lang === "ar";

  const headerText: Record<string, { en: string; ar: string }> = {
    "on-grid":  { en: "On-Grid — Solar → Inverter → Grid",                  ar: "متصل بالشبكة — ألواح ← عاكس ← شبكة"       },
    "off-grid": { en: "Off-Grid — Solar → MPPT → Battery → Inverter → Loads", ar: "مستقل — ألواح ← MPPT ← بطارية ← عاكس ← أحمال" },
    "hybrid":   { en: "Hybrid — Bus Topology",                              ar: "هجين — باص الطاقة"                         },
    "pumping":  { en: "Pumping — Solar → Controller → Pump",                ar: "ضخ شمسي — ألواح ← وحدة تحكم ← مضخة"       },
  };

  const header = headerText[type] ?? { en: type, ar: type };

  const empty = !res && !fv;

  const diagramBody = () => {
    if (empty) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
          <Sun className="w-10 h-10 opacity-20" />
          <p className="text-sm">{ar ? "أدخل بيانات النظام لعرض المخطط" : "Enter system data to display the diagram"}</p>
        </div>
      );
    }
    switch (type) {
      case "off-grid": return <OffGridDiagram fv={fv} res={res} />;
      case "on-grid":  return <OnGridDiagram  fv={fv} res={res} />;
      case "hybrid":   return <HybridBusDiagram fv={fv} res={res} />;
      case "pumping":  return <PumpingDiagram fv={fv} res={res} />;
      default:         return null;
    }
  };

  return (
    <div className="rounded-2xl border border-border/50 bg-background overflow-hidden shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/30 bg-muted/20">
        <div>
          <p className="text-[11px] font-extrabold text-muted-foreground uppercase tracking-widest">
            {ar ? "مخطط معمارية النظام" : "System Architecture"}
          </p>
          <p className="text-[9px] text-muted-foreground">{ar ? header.ar : header.en}</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-1">
            <div className="w-5 border-t-2 border-amber-400" />
            <span className="text-[8px] font-bold text-amber-600">DC</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-5 border-t-2 border-blue-400" />
            <span className="text-[8px] font-bold text-blue-600">AC</span>
          </div>
          {type === "hybrid" && (
            <div className="flex items-center gap-1">
              <div className="w-3 h-1.5 bg-gray-800 dark:bg-gray-200 rounded-sm" />
              <span className="text-[8px] font-bold text-gray-600 dark:text-gray-400">Bus</span>
            </div>
          )}
        </div>
      </div>

      {diagramBody()}
    </div>
  );
}
