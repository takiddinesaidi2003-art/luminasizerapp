import { useState, useMemo, useEffect } from "react";
import { Slider } from "@/components/ui/slider";
import { Sun, AlertTriangle, CheckCircle2, Info, Download } from "lucide-react";
import { useLang, T } from "@/lib/i18n";

export interface SpacingData {
  L: number; tilt: number; lat: number; d: number;
  dMin: number; gcr: number;
  solarElevWinter: number; solarElevSummer: number;
  shadowLengthWinter: number; shadowLengthSummer: number;
  shadedFraction: number; annualLoss: number;
}

function deg2rad(d: number) { return (d * Math.PI) / 180; }

interface ShadingCalc {
  solarElevWinter: number;
  solarElevSummer: number;
  solarElevEquinox: number;
  shadowLengthWinter: number;
  shadowLengthSummer: number;
  dMin:          number;
  shadedFraction: number;
  annualLoss:    number;
  gcr:           number;
  rowsPerHectare: number;
}

function calcShading(L: number, tilt: number, lat: number, d: number): ShadingCalc {
  const calcElev = (decl: number) => Math.max(1, 90 - lat + decl);
  const solarElevWinter  = calcElev(-23.45);
  const solarElevSummer  = Math.min(89, calcElev(+23.45));
  const solarElevEquinox = calcElev(0);

  const beta  = deg2rad(tilt);
  const elev  = deg2rad(solarElevWinter);
  const panelH       = L * Math.sin(beta);
  const panelGround  = L * Math.cos(beta);
  const shadowLength = panelH / Math.tan(elev);
  const shadowSummer = panelH / Math.tan(deg2rad(Math.max(1, solarElevSummer)));
  const dMin         = panelGround + shadowLength;
  const overhang     = Math.max(0, shadowLength - d + panelGround);
  const shadeH       = overhang * Math.tan(elev);
  const shadedFraction = Math.min(1, panelH > 0 ? shadeH / panelH : 0);
  const annualLoss   = shadedFraction > 0 ? Math.min(shadedFraction * 0.65 * 25, 40) : 0;
  const gcr          = panelGround / d;
  const rowsPerHectare = d > 0 ? Math.floor(10000 / (d * 10)) : 0;

  return {
    solarElevWinter, solarElevSummer, solarElevEquinox,
    shadowLengthWinter: shadowLength, shadowLengthSummer: shadowSummer,
    dMin, shadedFraction, annualLoss, gcr, rowsPerHectare
  };
}

function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
  return (
    <div className="w-full bg-muted/40 rounded-full h-1.5 overflow-hidden">
      <div className={`h-full rounded-full transition-all duration-500 ${color}`}
        style={{ width: `${Math.min(100, (value / max) * 100)}%` }} />
    </div>
  );
}

function ElevationView({ L, tilt, d, calc }: { L: number; tilt: number; d: number; calc: ShadingCalc }) {
  const VW = 520, VH = 230;
  const SC = 42;
  const bt = deg2rad(tilt);
  const pH = L * Math.sin(bt) * SC;
  const pD = L * Math.cos(bt) * SC;
  const ground = VH - 50;
  const baseX  = 40;

  const p0 = { x: baseX,      y: ground };
  const p1 = { x: baseX + pD, y: ground - pH };
  const shadowPx   = calc.shadowLengthWinter * SC;
  const shadowEndX = baseX + pD + shadowPx;
  const nextBase   = baseX + pD + d * SC;
  const np0 = { x: nextBase,      y: ground };
  const np1 = { x: nextBase + pD, y: ground - pH };

  const overlapPx     = Math.max(0, shadowEndX - nextBase);
  const shadedH       = overlapPx * Math.tan(deg2rad(calc.solarElevWinter));
  const npShadeTopX   = nextBase + pD * Math.min(1, shadedH / (L * Math.sin(bt)));
  const npShadeTopY   = ground - shadedH;

  const sunElev = deg2rad(calc.solarElevWinter);
  const sunX = p1.x - 70 * Math.cos(sunElev);
  const sunY = p1.y - 70 * Math.sin(sunElev);

  const maxX = Math.max(np1.x + 20, shadowEndX + 10, sunX + 20);
  const scale = maxX > VW - 15 ? (VW - 25) / maxX : 1;

  const sx = (x: number) => x * scale;
  const sy = (y: number) => ground - (ground - y) * scale;

  const np2Base = nextBase + pD + d * SC;
  const show3 = np2Base * scale < VW - 10;

  return (
    <svg viewBox={`0 0 ${VW} ${VH}`} width="100%" height={VH} style={{ display: "block" }}>
      <defs>
        <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1e3a5f" />
          <stop offset="100%" stopColor="#0f172a" />
        </linearGradient>
        <linearGradient id="gndGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1e293b" />
          <stop offset="100%" stopColor="#0f172a" />
        </linearGradient>
        <linearGradient id="shadGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="rgba(234,179,8,0.4)" />
          <stop offset="100%" stopColor="rgba(234,179,8,0)" />
        </linearGradient>
        <radialGradient id="sunGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(254,240,138,0.5)" />
          <stop offset="100%" stopColor="rgba(254,240,138,0)" />
        </radialGradient>
        <filter id="glow">
          <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur" />
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      <rect x={0} y={0} width={VW} height={sy(ground)} fill="url(#skyGrad)" />
      <rect x={0} y={sy(ground)} width={VW} height={VH - sy(ground)} fill="url(#gndGrad)" />
      <line x1={0} y1={sy(ground)} x2={VW} y2={sy(ground)} stroke="#334155" strokeWidth="1.5" />
      {Array.from({length:30},(_,i)=>(
        <line key={i} x1={i*20} y1={sy(ground)} x2={i*20-8} y2={sy(ground)+7}
          stroke="#1e3a2f" strokeWidth="1" opacity="0.6" />
      ))}

      {(baseX + calc.dMin * SC) * scale < VW - 10 && (
        <>
          <line x1={sx(baseX + calc.dMin * SC)} y1={sy(ground)-10} x2={sx(baseX + calc.dMin * SC)} y2={sy(ground)+5}
            stroke="#22c55e" strokeWidth="1.5" strokeDasharray="5 3" opacity="0.9" />
          <text x={sx(baseX + calc.dMin * SC)+3} y={sy(ground)-13} fontSize="8" fill="#22c55e" opacity="0.9">
            d_min
          </text>
        </>
      )}

      <rect x={sx(baseX+pD)} y={sy(ground)-2} width={Math.max(0, sx(shadowPx))} height={4}
        fill="url(#shadGrad)" />
      <line x1={sx(p1.x)} y1={sy(p1.y)} x2={sx(shadowEndX)} y2={sy(ground)}
        stroke="#fbbf24" strokeWidth="1" strokeDasharray="6 3" opacity="0.7" />

      {shadedH > 0 && nextBase * scale < VW && (
        <polygon
          points={`${sx(np0.x)},${sy(np0.y)} ${sx(npShadeTopX)},${sy(npShadeTopY)} ${sx(np0.x)},${sy(ground)}`}
          fill="rgba(239,68,68,0.40)" stroke="rgba(239,68,68,0.75)" strokeWidth="0.8"
        />
      )}

      {show3 && (
        <line x1={sx(np2Base)} y1={sy(ground)} x2={sx(np2Base + pD)} y2={sy(ground - pH)}
          stroke="#3b82f6" strokeWidth="5" strokeLinecap="round" opacity="0.25" />
      )}

      <line x1={sx(p0.x)} y1={sy(p0.y)} x2={sx(p1.x)} y2={sy(p1.y)}
        stroke="#3b82f6" strokeWidth="7" strokeLinecap="round" filter="url(#glow)" />
      <line x1={sx(p0.x)+1} y1={sy(p0.y)-1} x2={sx(p1.x)+1} y2={sy(p1.y)-1}
        stroke="rgba(255,255,255,0.2)" strokeWidth="2" strokeLinecap="round" />
      {[0.25, 0.5, 0.75].map(tv => (
        <line key={tv}
          x1={sx(p0.x + tv*pD)} y1={sy(p0.y - tv*pH)}
          x2={sx(p0.x + tv*pD)+1} y2={sy(p0.y - tv*pH)-1}
          stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
      ))}

      {nextBase * scale < VW && (
        <line x1={sx(np0.x)} y1={sy(np0.y)} x2={sx(np1.x)} y2={sy(np1.y)}
          stroke={shadedH > 0 ? "#6366f1" : "#3b82f6"} strokeWidth="7" strokeLinecap="round"
          filter={shadedH === 0 ? "url(#glow)" : undefined} />
      )}

      <path d={`M ${sx(p0.x)+20},${sy(p0.y)} A 20 20 0 0 0 ${sx(p0.x)+20*Math.cos(-bt)},${sy(p0.y)-20*Math.sin(-bt)}`}
        fill="none" stroke="#64748b" strokeWidth="1.5" />
      <text x={sx(p0.x)+24} y={sy(p0.y)-7} fontSize="10" fill="#94a3b8" fontWeight="bold">{tilt}°</text>

      {nextBase * scale < VW && (
        <>
          <line x1={sx(baseX+pD)} y1={sy(ground)+20} x2={sx(nextBase)} y2={sy(ground)+20}
            stroke="#94a3b8" strokeWidth="1" />
          <line x1={sx(baseX+pD)} y1={sy(ground)+14} x2={sx(baseX+pD)} y2={sy(ground)+26} stroke="#94a3b8" strokeWidth="1" />
          <line x1={sx(nextBase)} y1={sy(ground)+14} x2={sx(nextBase)} y2={sy(ground)+26} stroke="#94a3b8" strokeWidth="1" />
          <text x={(sx(baseX+pD)+sx(nextBase))/2} y={sy(ground)+36} fontSize="10" fill="#94a3b8" textAnchor="middle" fontWeight="bold">
            d = {d.toFixed(2)} m
          </text>
        </>
      )}

      {sx(sunX) < VW + 20 && (
        <>
          <circle cx={sx(sunX)} cy={sy(sunY)} r={18} fill="url(#sunGlow)" />
          <circle cx={sx(sunX)} cy={sy(sunY)} r={10} fill="#fef08a" stroke="#f59e0b" strokeWidth="1.5" />
          {[0,45,90,135,180,225,270,315].map(a=>{
            const ar=deg2rad(a);
            return <line key={a}
              x1={sx(sunX)+12*Math.cos(ar)} y1={sy(sunY)+12*Math.sin(ar)}
              x2={sx(sunX)+18*Math.cos(ar)} y2={sy(sunY)+18*Math.sin(ar)}
              stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round" />;
          })}
          <text x={sx(sunX)+20} y={sy(sunY)+4} fontSize="9" fill="#fbbf24" fontWeight="bold">
            {calc.solarElevWinter.toFixed(0)}°
          </text>
        </>
      )}

      <text x={(sx(p0.x)+sx(p1.x))/2-8} y={(sy(p0.y)+sy(p1.y))/2-6} fontSize="9" fill="#93c5fd" fontWeight="bold">
        L={L}m
      </text>
    </svg>
  );
}

function NumInput({ label, value, onChange, unit, min, max, step, hint }: {
  label: string; value: number; onChange: (v: number) => void;
  unit?: string; min?: number; max?: number; step?: number; hint?: string;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-1">
        <label className="text-xs font-medium text-muted-foreground">{label}</label>
        {hint && <span className="text-[9px] text-muted-foreground/60 italic hidden sm:block">{hint}</span>}
      </div>
      <div className="flex items-center gap-1.5">
        <input
          type="number" value={value} min={min} max={max} step={step ?? 0.1}
          onChange={e => onChange(parseFloat(e.target.value) || 0)}
          className="w-full h-9 px-2.5 rounded-lg border border-border bg-background text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
        />
        {unit && <span className="text-xs font-medium text-muted-foreground shrink-0 min-w-[28px]">{unit}</span>}
      </div>
    </div>
  );
}

function MetricTile({ label, value, unit, sub, colorClass }: {
  label: string; value: string; unit?: string; sub?: string; colorClass?: string;
}) {
  return (
    <div className="rounded-xl bg-muted/30 border border-border/40 p-3 text-center space-y-0.5">
      <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider">{label}</p>
      <p className={`text-lg font-bold tabular-nums ${colorClass ?? ""}`}>
        {value}<span className="text-xs font-normal ml-0.5">{unit}</span>
      </p>
      {sub && <p className="text-[9px] text-muted-foreground">{sub}</p>}
    </div>
  );
}

export function PanelSpacingTool({
  externalLat,
  externalTilt,
  onSpacingChange,
}: {
  externalLat?: number;
  externalTilt?: number;
  onSpacingChange?: (data: SpacingData) => void;
} = {}) {
  const { lang } = useLang();
  const t = T[lang];

  const [L,    setL]    = useState(2.0);
  const [tilt, setTilt] = useState(externalTilt ?? 30);
  const [lat,  setLat]  = useState(externalLat ?? 36.0);

  const initCalc = useMemo(() => calcShading(L, tilt, lat, 999), [L, tilt, lat]);
  const [d, setD] = useState(() => {
    const c = calcShading(2.0, externalTilt ?? 30, externalLat ?? 36.0, 999);
    return +(c.dMin * 1.15).toFixed(2);
  });

  useEffect(() => {
    const newD = +(initCalc.dMin * 1.15).toFixed(2);
    setD(newD);
  }, [L, tilt, lat, initCalc.dMin]);

  const calc = useMemo(() => calcShading(L, tilt, lat, d), [L, tilt, lat, d]);

  useEffect(() => {
    onSpacingChange?.({ L, tilt, lat, d, dMin: calc.dMin, gcr: calc.gcr,
      solarElevWinter: calc.solarElevWinter, solarElevSummer: calc.solarElevSummer,
      shadowLengthWinter: calc.shadowLengthWinter, shadowLengthSummer: calc.shadowLengthSummer,
      shadedFraction: calc.shadedFraction, annualLoss: calc.annualLoss });
  }, [L, tilt, lat, d, calc, onSpacingChange]);

  const isOk   = d >= calc.dMin;
  const isWarn = d >= calc.dMin * 0.75 && d < calc.dMin;
  const sliderMin = Math.max(0.3, calc.dMin * 0.3);
  const sliderMax = Math.min(20, calc.dMin * 2.5);

  const statusColor = isOk ? "emerald" : isWarn ? "amber" : "red";
  const statusMsg   = isOk ? t.noShading : isWarn ? t.partialShading : t.severeShading;

  const handleExport = () => {
    const txt = [
      `LuminaSizer — Panel Spacing Report`,
      `───────────────────────────────────`,
      `Panel Length (L):     ${L} m`,
      `Tilt Angle (β):       ${tilt}°`,
      `Latitude:             ${lat}°N`,
      `Row Spacing (d):      ${d.toFixed(2)} m`,
      ``,
      `Winter Sun Elevation: ${calc.solarElevWinter.toFixed(1)}°`,
      `Summer Sun Elevation: ${calc.solarElevSummer.toFixed(1)}°`,
      `Winter Shadow Length: ${calc.shadowLengthWinter.toFixed(2)} m`,
      `Summer Shadow Length: ${calc.shadowLengthSummer.toFixed(2)} m`,
      `Min Spacing (d_min):  ${calc.dMin.toFixed(2)} m`,
      `Shaded Fraction:      ${(calc.shadedFraction * 100).toFixed(1)}%`,
      `Annual Loss est.:     ${calc.annualLoss.toFixed(1)}%`,
      `Ground Coverage Ratio (GCR): ${(calc.gcr * 100).toFixed(1)}%`,
      `Status: ${statusMsg}`,
      ``,
      `Formula: d_min = L·cos(β) + L·sin(β) / tan(α_winter)`,
      `       = ${L}·cos(${tilt}°) + ${L}·sin(${tilt}°) / tan(${calc.solarElevWinter.toFixed(1)}°)`,
      `       = ${calc.dMin.toFixed(3)} m`,
    ].join("\n");
    const blob = new Blob([txt], { type: "text/plain" });
    const url  = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url;
    a.download = `LuminaSizer_PanelSpacing_${lat}N_${tilt}deg.txt`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      {/* ── inputs + metrics ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {/* LEFT — Inputs */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <NumInput label={t.panelLength} value={L} onChange={setL} unit="m" min={0.5} max={4} step={0.05} hint="0.5–4 m" />
            <NumInput label={t.tiltAngle}   value={tilt} onChange={setTilt} unit="°" min={5} max={60} step={1} hint="5–60°" />
          </div>
          <NumInput label={t.latitude} value={lat} onChange={setLat} unit="°N" min={18} max={38} step={0.5} hint={t.algRange} />

          {/* Spacing slider */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-medium text-muted-foreground">{t.rowSpacing}</label>
              <span className={`text-lg font-bold tabular-nums font-mono
                ${statusColor === "emerald" ? "text-emerald-500" : statusColor === "amber" ? "text-amber-500" : "text-red-500"}`}>
                {d.toFixed(2)} m
              </span>
            </div>
            <Slider min={sliderMin} max={sliderMax} step={0.05} value={[d]}
              onValueChange={([v]) => setD(+v.toFixed(2))} data-testid="slider-spacing" />
            <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
              <span>{sliderMin.toFixed(1)} m</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">d_min = {calc.dMin.toFixed(2)} m</span>
              <span>{sliderMax.toFixed(1)} m</span>
            </div>
            <MiniBar value={d} max={sliderMax} color={
              statusColor === "emerald" ? "bg-emerald-500" : statusColor === "amber" ? "bg-amber-500" : "bg-red-500"
            } />
          </div>
        </div>

        {/* RIGHT — Metrics */}
        <div className="space-y-3">
          {/* Status card */}
          <div className={`rounded-xl border-2 p-4 flex items-start gap-3
            ${isOk ? "border-emerald-500/40 bg-emerald-500/5" : isWarn ? "border-amber-500/40 bg-amber-500/5" : "border-red-500/40 bg-red-500/5"}`}>
            {isOk
              ? <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              : <AlertTriangle className={`w-5 h-5 shrink-0 mt-0.5 ${isWarn ? "text-amber-500" : "text-red-500"}`} />}
            <div>
              <p className={`font-bold text-sm ${isOk ? "text-emerald-600 dark:text-emerald-400" : isWarn ? "text-amber-600 dark:text-amber-400" : "text-red-600 dark:text-red-400"}`}>
                {statusMsg}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {isOk
                  ? `${t.aboveMin}+${(d - calc.dMin).toFixed(2)} m`
                  : isWarn
                  ? `${t.belowMin} ${(calc.dMin - d).toFixed(2)} m ${t.belowMin2}`
                  : `${t.mustIncrease} ${(calc.dMin - d).toFixed(2)} m ${t.mustIncrease2}`}
              </p>
            </div>
          </div>

          {/* Metric grid */}
          <div className="grid grid-cols-3 gap-2">
            <MetricTile label={t.winterShadow} value={calc.shadowLengthWinter.toFixed(2)} unit="m"
              sub={t.dec21} colorClass="text-blue-500" />
            <MetricTile label={t.dMin} value={calc.dMin.toFixed(2)} unit="m"
              sub="min" colorClass="text-emerald-500" />
            <MetricTile label={t.annualLoss} value={calc.annualLoss.toFixed(1)} unit="%"
              sub={t.estimate} colorClass={calc.annualLoss > 15 ? "text-red-500" : calc.annualLoss > 5 ? "text-amber-500" : "text-emerald-500"} />
            <MetricTile label={t.winterElev} value={calc.solarElevWinter.toFixed(1)} unit="°"
              sub={t.dec21} colorClass="text-amber-500" />
            <MetricTile label={t.summerElev} value={calc.solarElevSummer.toFixed(1)} unit="°"
              sub="Jun" colorClass="text-amber-400" />
            <MetricTile label={t.coverageRatio} value={(calc.gcr * 100).toFixed(1)} unit="%"
              sub={t.coverageDensity}
              colorClass={calc.gcr > 0.45 ? "text-amber-500" : calc.gcr > 0.3 ? "text-emerald-500" : "text-blue-500"} />
          </div>

          {/* Formula */}
          <div className="rounded-lg bg-muted/20 border border-border/30 px-3 py-2.5 space-y-1">
            <div className="flex items-center gap-1.5 mb-1">
              <Info className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">{t.formula}</span>
            </div>
            <p className="text-[10px] font-mono text-foreground/80 leading-relaxed">
              d_min = L·cos(β) + L·sin(β) / tan(α)
            </p>
            <p className="text-[10px] font-mono text-primary/90 leading-relaxed">
              = {L}·cos({tilt}°) + {L}·sin({tilt}°)/tan({calc.solarElevWinter.toFixed(1)}°)
              = <strong>{calc.dMin.toFixed(3)} m</strong>
            </p>
          </div>
        </div>
      </div>

      {/* ── Additional insights ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
        {[
          { label: t.summerShadow,    value: calc.shadowLengthSummer.toFixed(2), unit: "m",  note: "Jun 21" },
          { label: t.shadingPct,      value: (calc.shadedFraction * 100).toFixed(1), unit: "%", note: t.fromHeight },
          { label: t.rowsPer100m,     value: calc.rowsPerHectare.toString(), unit: "rows", note: t.width100m },
          { label: t.panelDepth,      value: (L * Math.cos(deg2rad(tilt))).toFixed(2), unit: "m", note: t.groundProjection },
        ].map((m, i) => (
          <div key={i} className="rounded-xl bg-muted/20 border border-border/30 p-3">
            <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-wide">{m.label}</p>
            <p className="text-base font-bold font-mono mt-1">{m.value}<span className="text-xs font-normal ml-0.5">{m.unit}</span></p>
            <p className="text-[9px] text-muted-foreground mt-0.5">{m.note}</p>
          </div>
        ))}
      </div>

      {/* ── 2D Elevation View ── */}
      <div className="rounded-xl bg-slate-900 overflow-hidden">
        <div className="px-4 pt-3 pb-1 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{t.elevSection}</span>
          <button
            type="button"
            onClick={handleExport}
            className="flex items-center gap-1.5 text-[10px] text-slate-400 hover:text-primary transition-colors px-2 py-1 rounded hover:bg-white/5"
            data-testid="button-export-spacing"
          >
            <Download className="w-3 h-3" />
            {t.exportSpacing}
          </button>
        </div>
        <div className="px-3 pb-2 overflow-x-auto">
          <ElevationView L={L} tilt={tilt} d={d} calc={calc} />
        </div>
        <div className="px-4 pb-3 flex flex-wrap gap-x-5 gap-y-1.5 text-[10px] text-slate-400 border-t border-slate-800/60 pt-2">
          <span className="flex items-center gap-1.5"><span className="w-4 h-1.5 rounded bg-blue-500 inline-block" />Solar panel</span>
          <span className="flex items-center gap-1.5"><span className="w-4 h-1.5 rounded bg-indigo-400 inline-block" />Partially shaded panel</span>
          <span className="flex items-center gap-1.5"><span className="w-4 h-1.5 rounded bg-red-400/70 inline-block" />Shading zone</span>
          <span className="flex items-center gap-1.5">
            <span className="inline-flex w-4" style={{borderTop:"2px dashed #22c55e"}} />
            d_min limit
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-flex w-4" style={{borderTop:"2px dashed #fbbf24"}} />
            Winter shadow ray
          </span>
        </div>
      </div>

      {/* ── Recommendations ── */}
      <div className="rounded-xl border border-border/40 bg-muted/10 p-4 space-y-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
          <Sun className="w-3.5 h-3.5 text-amber-500" /> {t.siteRecommendations}
        </p>
        <ul className="space-y-1.5 text-sm">
          <li className="flex items-start gap-2">
            <span className="text-emerald-500 shrink-0 mt-0.5">•</span>
            <span>{t.minRecommended} <strong className="font-mono">{calc.dMin.toFixed(2)} m</strong> — {t.noShadingWinter}</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-500 shrink-0 mt-0.5">•</span>
            <span>{t.optimalGcr} <strong>30–45%</strong> — {t.currentIs} <strong className={`font-mono ${calc.gcr > 0.45 ? "text-amber-500" : "text-emerald-500"}`}>{(calc.gcr * 100).toFixed(1)}%</strong></span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-amber-500 shrink-0 mt-0.5">•</span>
            <span>{t.optTilt} <strong>{lat}°N</strong>: {t.between} <strong>{Math.max(10, lat - 10).toFixed(0)}°</strong> {t.and} <strong>{Math.min(60, lat + 5).toFixed(0)}°</strong></span>
          </li>
          {calc.annualLoss > 5 && (
            <li className="flex items-start gap-2">
              <span className="text-red-500 shrink-0 mt-0.5">⚠</span>
              <span className="text-rose-600 dark:text-rose-400">{t.highLossWarning} <strong>{calc.annualLoss.toFixed(1)}%</strong> — {t.advisedSpacing} {(calc.dMin * 1.1).toFixed(2)} m</span>
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
