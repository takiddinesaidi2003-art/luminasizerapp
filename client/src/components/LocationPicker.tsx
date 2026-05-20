import { useState, useEffect, useRef, useCallback } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Card, CardContent } from "@/components/ui/card";
import { Sun, Thermometer, Loader2, MapPin, Search, Download, X, TrendingUp } from "lucide-react";
import { generateLocationPdf } from "@/lib/generatePdf";
import { useLang, T } from "@/lib/i18n";

import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";
L.Marker.prototype.options.icon = L.icon({ iconUrl: icon, shadowUrl: iconShadow, iconSize: [25,41], iconAnchor: [12,41] });

const SOLAR_DATA: [number, number, number][] = [
  [36.7,3.05,4.9],[35.7,-0.64,5.4],[36.36,6.61,4.9],[36.9,7.76,4.8],
  [36.72,4.05,4.6],[36.82,5.77,4.5],[36.88,6.91,4.5],[35.19,-0.63,5.4],
  [36.27,2.75,4.7],[35.37,1.32,5.2],[35.55,6.17,5.1],[35.4,8.12,5.4],
  [35.7,4.54,5.5],[34.85,5.73,5.7],[33.8,2.87,6.4],[33.36,6.86,6.2],
  [33.68,1.01,6.3],[31.62,-2.22,6.4],[32.49,3.67,6.7],[31.95,5.32,6.8],
  [30.92,2.89,7.0],[27.19,2.46,7.2],[26.48,8.48,7.1],[22.78,5.52,7.5],
  [24.55,9.48,7.3],[27.67,-8.15,6.8],[28.97,0.35,7.1],[29.5,3.0,7.1],
  [25.0,5.0,7.4],[20.0,5.0,7.3],[36.8,10.18,5.0],[32.9,13.18,6.0],
  [34.02,-6.84,5.5],[30.43,-9.59,6.2],[31.63,-8.01,5.8],[32.0,11.0,6.3],
  [15.0,2.0,7.3],[20.0,10.0,7.2],[38.0,3.0,4.5],[40.0,10.0,4.8],
  [30.0,-5.0,6.3],[35.0,12.0,5.3],[37.0,0.0,4.8],[33.5,9.0,5.8],
];

function getIrradiance(lat: number, lon: number): number {
  let sumW = 0, sumWV = 0;
  for (const [dlat, dlon, val] of SOLAR_DATA) {
    const d2 = (lat - dlat) ** 2 + (lon - dlon) ** 2;
    const w  = 1 / (d2 + 0.01);
    sumW += w; sumWV += w * val;
  }
  return sumWV / sumW;
}

function irradToRGBA(irr: number): [number, number, number, number] {
  const t = Math.max(0, Math.min(1, (irr - 4.0) / 3.5));
  let r: number, g: number, b: number;
  if (t < 0.25) {
    const s = t / 0.25;
    r = Math.round(68 + s * (59 - 68));
    g = Math.round(1  + s * (82 - 1));
    b = Math.round(84 + s * (139 - 84));
  } else if (t < 0.50) {
    const s = (t - 0.25) / 0.25;
    r = Math.round(59  + s * (33 - 59));
    g = Math.round(82  + s * (145 - 82));
    b = Math.round(139 + s * (140 - 139));
  } else if (t < 0.75) {
    const s = (t - 0.50) / 0.25;
    r = Math.round(33  + s * (253 - 33));
    g = Math.round(145 + s * (231 - 145));
    b = Math.round(140 + s * (37 - 140));
  } else {
    const s = (t - 0.75) / 0.25;
    r = Math.round(253 + s * (220 - 253));
    g = Math.round(231 + s * (50 - 231));
    b = Math.round(37  + s * (10 - 37));
  }
  return [r, g, b, 82];
}

function SolarHeatmapOverlay() {
  const map = useMap();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const size = map.getSize();
    const STEP = 6;
    const W = Math.ceil(size.x / STEP);
    const H = Math.ceil(size.y / STEP);

    const off = document.createElement("canvas");
    off.width = W; off.height = H;
    const octx = off.getContext("2d")!;
    const img = octx.createImageData(W, H);

    for (let py = 0; py < H; py++) {
      for (let px = 0; px < W; px++) {
        const ll = map.containerPointToLatLng([px * STEP + STEP / 2, py * STEP + STEP / 2]);
        const irr = getIrradiance(ll.lat, ll.lng);
        const [r, g, b, a] = irradToRGBA(irr);
        const i = (py * W + px) * 4;
        img.data[i] = r; img.data[i+1] = g; img.data[i+2] = b; img.data[i+3] = a;
      }
    }
    octx.putImageData(img, 0, 0);

    canvas.width = size.x;
    canvas.height = size.y;
    const ctx = canvas.getContext("2d")!;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.filter = "blur(6px)";
    ctx.clearRect(0, 0, size.x, size.y);
    ctx.drawImage(off, 0, 0, size.x, size.y);
    ctx.filter = "none";
  }, [map]);

  useEffect(() => {
    const container = map.getContainer();
    const canvas = document.createElement("canvas");
    canvas.style.cssText = "position:absolute;top:0;left:0;pointer-events:none;z-index:400;";
    canvasRef.current = canvas;
    container.appendChild(canvas);

    const onMove = () => render();
    map.on("move zoom resize", onMove);
    render();

    return () => {
      map.off("move zoom resize", onMove);
      if (container.contains(canvas)) container.removeChild(canvas);
      canvasRef.current = null;
    };
  }, [map, render]);

  return null;
}

function MapClickHandler({ onPick }: { onPick: (lat: number, lon: number) => void }) {
  useMapEvents({ click: e => onPick(e.latlng.lat, e.latlng.lng) });
  return null;
}
function FlyTo({ pos }: { pos: [number, number] }) {
  const map = useMap();
  useEffect(() => { map.flyTo(pos, Math.max(map.getZoom(), 7)); }, [pos]);
  return null;
}

export interface MonthlyRow { label: string; irr: number; temp: number }
const MONTH_NUMS = ["01","02","03","04","05","06","07","08","09","10","11","12"];
const MONTH_EN   = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const MONTH_FR   = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];
const MONTH_AR   = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];

function classifyIrr(irr: number): string {
  if (irr >= 6.5) return "Excellent";
  if (irr >= 5.5) return "Very Good";
  if (irr >= 4.5) return "Good";
  return "Moderate";
}
function getSeason(monthIdx: number): string {
  if ([11,0,1].includes(monthIdx)) return "Winter";
  if ([2,3,4].includes(monthIdx))  return "Spring";
  if ([5,6,7].includes(monthIdx))  return "Summer";
  return "Autumn";
}

function generateDetailedCSV(monthly: MonthlyRow[], lat: number, lon: number, locationName?: string): string {
  const avg_irr = (monthly.reduce((s,m) => s+m.irr, 0) / 12);
  const avg_tmp = (monthly.reduce((s,m) => s+m.temp, 0) / 12);
  const peak    = monthly.reduce((a,b) => a.irr > b.irr ? a : b);
  const low     = monthly.reduce((a,b) => a.irr < b.irr ? a : b);
  const annualKwhM2 = (avg_irr * 365).toFixed(0);

  const optimalTilt = Math.abs(lat).toFixed(0);
  const winterTilt  = Math.min(60, Math.abs(lat) + 15).toFixed(0);
  const summerTilt  = Math.max(10, Math.abs(lat) - 15).toFixed(0);

  const sep = ",";
  const nl  = "\n";

  const lines: string[] = [
    `╔══════════════════════════════════════════════════════════════════╗`,
    `║          LuminaSizer — Solar Site Resource Report                ║`,
    `╚══════════════════════════════════════════════════════════════════╝`,
    ``,
    `[PROJECT INFORMATION]`,
    `Generated by${sep}LuminaSizer v2.0`,
    `Report Date${sep}${new Date().toLocaleDateString("en-GB")}`,
    `Data Source${sep}NASA POWER  (ALLSKY_SFC_SW_DWN + T2M_MAX)${sep}2022–2023 avg`,
    `Location Name${sep}${locationName || "Custom Location"}`,
    `Latitude${sep}${lat.toFixed(5)}°N`,
    `Longitude${sep}${lon.toFixed(5)}°E`,
    `Climate Zone${sep}${lat > 30 ? "North Algeria — Mediterranean / Semi-Arid" : lat > 22 ? "Central Algeria — Arid / Saharan" : "Deep Sahara — Hyper-Arid"}`,
    ``,
    `[ANNUAL SOLAR SUMMARY]`,
    `Annual Average Irradiance${sep}${avg_irr.toFixed(3)} kWh/m²/day`,
    `Annual GHI${sep}${annualKwhM2} kWh/m²/year`,
    `Average Max Daytime Temp${sep}${avg_tmp.toFixed(1)} °C`,
    `Peak Month${sep}${peak.label}${sep}${peak.irr.toFixed(2)} kWh/m²/day`,
    `Lowest Month${sep}${low.label}${sep}${low.irr.toFixed(2)} kWh/m²/day`,
    `Resource Classification${sep}${classifyIrr(avg_irr)}`,
    ``,
    `[INSTALLATION RECOMMENDATIONS]`,
    `Optimal Fixed Tilt (year-round)${sep}${optimalTilt}°`,
    `Optimal Tilt (winter)${sep}${winterTilt}°`,
    `Optimal Tilt (summer)${sep}${summerTilt}°`,
    `Orientation${sep}Due South (Azimuth = 180°)`,
    ``,
    `[MONTHLY DETAILED DATA]`,
    `Month${sep}Season${sep}Irradiance (kWh/m²/d)${sep}Max Temp (°C)${sep}Est. kWh/kWp/day${sep}Classification`,
  ];

  monthly.forEach((m, i) => {
    const kwhPerKwp = (m.irr * 0.82).toFixed(2);
    lines.push(
      `${MONTH_EN[i]}${sep}${getSeason(i)}${sep}${m.irr.toFixed(3)}${sep}${m.temp.toFixed(1)}${sep}${kwhPerKwp}${sep}${classifyIrr(m.irr)}`
    );
  });

  lines.push(``);
  lines.push(`Annual Average${sep}—${sep}${avg_irr.toFixed(3)}${sep}${avg_tmp.toFixed(1)}${sep}${(avg_irr*0.82).toFixed(2)}${sep}${classifyIrr(avg_irr)}`);

  lines.push(``);
  lines.push(`[SEASONAL ANALYSIS]`);
  const seasons: Record<string, number[]> = { Winter:[11,0,1], Spring:[2,3,4], Summer:[5,6,7], Autumn:[8,9,10] };
  for (const [s, idx] of Object.entries(seasons)) {
    const avg = idx.reduce((a,i) => a + monthly[i].irr, 0) / 3;
    lines.push(`${s}${sep}${avg.toFixed(2)} kWh/m²/day${sep}${classifyIrr(avg)}`);
  }

  lines.push(``);
  lines.push(`[PERFORMANCE METRICS]`);
  lines.push(`System Performance Ratio assumption${sep}82% (PR = 0.82)`);
  lines.push(`1 kWp panel annual yield${sep}${(avg_irr * 365 * 0.82).toFixed(0)} kWh/year`);
  lines.push(`CO2 avoided per kWp/year${sep}${(avg_irr * 365 * 0.82 * 0.35).toFixed(0)} kg CO₂`);
  lines.push(`Solar fraction potential${sep}${avg_irr >= 6 ? "Very High (>80%)" : avg_irr >= 5 ? "High (65–80%)" : "Moderate (50–65%)"}`);

  lines.push(``);
  lines.push(`─────────────────────────────────────────────────────────────────`);
  lines.push(`LuminaSizer  ·  Solar PV Sizing Platform  ·  ${new Date().getFullYear()}`);
  lines.push(`Data: NASA POWER Climatology (https://power.larc.nasa.gov)`);

  return lines.join(nl);
}

function downloadCSV(content: string, lat: number, lon: number) {
  const blob = new Blob(["\uFEFF" + content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `LuminaSizer_Solar_Resources_${lat.toFixed(2)}N_${lon.toFixed(2)}E.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

interface NominatimResult { place_id: number; display_name: string; lat: string; lon: string }

interface LocationPickerProps {
  onLocationSelect: (lat: number, lon: number, psh: number) => void;
  onMonthlyData?: (monthly: MonthlyRow[]) => void;
  initialLat?: number;
  initialLon?: number;
}

export function LocationPicker({ onLocationSelect, onMonthlyData, initialLat = 28.03, initialLon = 2.0 }: LocationPickerProps) {
  const { lang } = useLang();
  const t = T[lang];

  const [position,     setPosition]     = useState<[number, number] | null>(
    initialLat !== 28.03 ? [initialLat, initialLon] : null
  );
  const [loading,      setLoading]      = useState(false);
  const [weather,      setWeather]      = useState<{ psh: number; temp: number } | null>(null);
  const [flyTo,        setFlyTo]        = useState<[number, number] | null>(null);
  const [localIrr,     setLocalIrr]     = useState<number | null>(null);
  const [monthly,      setMonthly]      = useState<MonthlyRow[] | null>(null);
  const [locationName, setLocationName] = useState<string>("");

  const [query,        setQuery]        = useState("");
  const [results,      setResults]      = useState<NominatimResult[]>([]);
  const [searching,    setSearching]    = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const handleDownloadLocationPdf = () => {
    if (!monthly || !position) return;
    generateLocationPdf({ monthly, lat: position[0], lon: position[1], locationName, lang: "en" });
  };

  useEffect(() => {
    if (query.trim().length < 2) { setResults([]); setShowDropdown(false); return; }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res  = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=6&addressdetails=0`
        );
        const data: NominatimResult[] = await res.json();
        setResults(data);
        setShowDropdown(data.length > 0);
      } catch { setResults([]); }
      finally { setSearching(false); }
    }, 450);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowDropdown(false);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  const fetchNASA = async (lat: number, lon: number) => {
    setLoading(true);
    const est = getIrradiance(lat, lon);
    setLocalIrr(est);
    onLocationSelect(lat, lon, est);

    try {
      const res  = await fetch(
        `https://power.larc.nasa.gov/api/temporal/monthly/point?parameters=ALLSKY_SFC_SW_DWN,T2M_MAX&community=RE&longitude=${lon.toFixed(4)}&latitude=${lat.toFixed(4)}&format=JSON&start=2022&end=2023`
      );
      const data = await res.json();
      if (data.properties?.parameter) {
        const sw   = data.properties.parameter.ALLSKY_SFC_SW_DWN as Record<string, number>;
        const tm   = data.properties.parameter.T2M_MAX          as Record<string, number>;

        const monthlyRows: MonthlyRow[] = MONTH_NUMS.map((mn, i) => {
          const k22 = `2022${mn}`, k23 = `2023${mn}`;
          const irrVals = [sw[k22], sw[k23]].filter(v => v != null && v !== -999 && v > 0);
          const tmpVals = [tm[k22],  tm[k23]].filter(v => v != null && v !== -999);
          const irr = irrVals.length ? irrVals.reduce((a,b)=>a+b,0)/irrVals.length : est;
          const tmp = tmpVals.length ? tmpVals.reduce((a,b)=>a+b,0)/tmpVals.length : 20 + (i < 3 || i > 9 ? -5 : i > 5 ? 8 : 2);
          return { label: MONTH_AR[i], irr, temp: tmp };
        });

        setMonthly(monthlyRows);
        onMonthlyData?.(monthlyRows);
        const avgPsh = +(monthlyRows.reduce((a,m)=>a+m.irr,0)/12).toFixed(2);
        const avgTmp = +(monthlyRows.reduce((a,m)=>a+m.temp,0)/12).toFixed(1);
        setWeather({ psh: avgPsh, temp: avgTmp });
        onLocationSelect(lat, lon, avgPsh);
      }
    } catch {
      // keep local estimate
    } finally {
      setLoading(false);
    }
  };

  const handlePick = (lat: number, lon: number) => {
    setPosition([lat, lon]);
    setLocationName("");
    fetchNASA(lat, lon);
  };

  const handleSearchSelect = (item: NominatimResult) => {
    const lat = parseFloat(item.lat);
    const lon = parseFloat(item.lon);
    const name = item.display_name.split(",")[0];
    setPosition([lat, lon]);
    setFlyTo([lat, lon]);
    setLocationName(name);
    fetchNASA(lat, lon);
    setQuery(name);
    setShowDropdown(false);
    setResults([]);
  };

  const avgIrr = weather?.psh ?? localIrr;
  const classification =
    !avgIrr ? "" :
    avgIrr >= 6.5 ? (lang === "ar" ? "ممتاز" : "Excellent") :
    avgIrr >= 5.5 ? (lang === "ar" ? "جيد جداً" : "Very Good") :
    avgIrr >= 4.5 ? (lang === "ar" ? "جيد" : "Good") :
    (lang === "ar" ? "متوسط" : "Moderate");
  const classColor =
    !avgIrr ? "" :
    avgIrr >= 6.5 ? "text-emerald-600 dark:text-emerald-400" :
    avgIrr >= 5.5 ? "text-amber-600 dark:text-amber-400" :
    avgIrr >= 4.5 ? "text-blue-600 dark:text-blue-400" : "text-rose-600 dark:text-rose-400";

  return (
    <div className="space-y-4">
      {/* Search input */}
      <div ref={searchRef} className="relative">
        <div className="flex items-center gap-2 border border-border rounded-xl bg-background px-3 py-2.5 shadow-sm focus-within:ring-2 focus-within:ring-primary/30 focus-within:border-primary/50 transition-all">
          {searching
            ? <Loader2 className="w-4 h-4 text-muted-foreground shrink-0 animate-spin" />
            : <Search className="w-4 h-4 text-muted-foreground shrink-0" />}
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onFocus={() => results.length > 0 && setShowDropdown(true)}
            placeholder={t.searchCity}
            className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground"
            data-testid="input-location-search"
          />
          {query && (
            <button type="button" onClick={() => { setQuery(""); setResults([]); setShowDropdown(false); }}>
              <X className="w-4 h-4 text-muted-foreground hover:text-foreground transition-colors" />
            </button>
          )}
        </div>

        {showDropdown && results.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-xl shadow-xl z-[9999] overflow-hidden">
            {results.map(r => (
              <button
                key={r.place_id}
                type="button"
                onClick={() => handleSearchSelect(r)}
                className="w-full text-left px-4 py-2.5 text-sm hover:bg-muted/60 transition-colors flex items-center gap-2 border-b border-border/40 last:border-b-0"
              >
                <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                <span className="truncate">{r.display_name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground flex items-center gap-1.5 -mt-1">
        <MapPin className="w-3 h-3" />
        {t.clickMap}
      </p>

      {/* Map */}
      <div className="relative rounded-xl overflow-hidden border border-border/60 shadow-md" style={{ height: 300 }}>
        <MapContainer center={[28.03, 2.0]} zoom={5} style={{ height: "100%", width: "100%" }}>
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          />
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png"
            attribution=""
            pane="shadowPane"
          />
          <SolarHeatmapOverlay />
          <MapClickHandler onPick={handlePick} />
          {position && <Marker position={position} />}
          {flyTo && <FlyTo pos={flyTo} />}
        </MapContainer>

        {/* Color legend */}
        <div className="absolute bottom-2 left-2 z-[999] bg-white/85 dark:bg-black/70 backdrop-blur-sm rounded-lg px-3 py-1.5 flex items-center gap-2 shadow">
          <span className="text-[10px] text-muted-foreground font-mono">4.0</span>
          <div className="w-20 h-2.5 rounded-full" style={{
            background: "linear-gradient(to right, #440154, #31688e, #35b779, #fde725, #dc3545)"
          }} />
          <span className="text-[10px] text-muted-foreground font-mono">7.5</span>
          <span className="text-[10px] text-muted-foreground ml-0.5">kWh/m²/d</span>
        </div>

        {!position && (
          <div className="absolute inset-0 flex items-end justify-center pb-10 z-[400] pointer-events-none">
            <div className="bg-black/55 backdrop-blur-sm text-white text-xs px-4 py-2 rounded-full flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-amber-400" />
              {t.clickMap}
            </div>
          </div>
        )}

        {loading && (
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-[1000]">
            <div className="bg-white/90 dark:bg-slate-900/90 rounded-2xl px-6 py-4 flex items-center gap-3 shadow-xl">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
              <p className="text-sm font-medium">{t.loadingNasa}</p>
            </div>
          </div>
        )}
      </div>

      {/* Data cards */}
      {(weather || localIrr) && position && (
        <div className="space-y-3 animate-fade-up">
          <div className="grid grid-cols-3 gap-3">
            <Card className="bg-amber-50 dark:bg-amber-500/8 border-amber-200 dark:border-amber-500/20">
              <CardContent className="p-3.5 flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 shrink-0">
                  <Sun className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider">{t.irradianceTitle}</p>
                  <p className="text-lg font-bold text-amber-700 dark:text-amber-400 leading-tight">
                    {weather?.psh ?? localIrr?.toFixed(2)}
                  </p>
                  <p className="text-[9px] text-muted-foreground">kWh/m²/d</p>
                </div>
              </CardContent>
            </Card>

            {weather ? (
              <Card className="bg-blue-50 dark:bg-blue-500/8 border-blue-200 dark:border-blue-500/20">
                <CardContent className="p-3.5 flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-blue-500/15 text-blue-600 dark:text-blue-400 shrink-0">
                    <Thermometer className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider">{t.tempTitle}</p>
                    <p className="text-lg font-bold text-blue-700 dark:text-blue-400 leading-tight">{weather.temp}°</p>
                    <p className="text-[9px] text-muted-foreground">Annual avg</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-muted/30 border-border/30">
                <CardContent className="p-3.5 flex items-center justify-center">
                  <p className="text-[9px] text-muted-foreground text-center">{t.loadingNasa}</p>
                </CardContent>
              </Card>
            )}

            <Card className={`border ${avgIrr && avgIrr >= 6.5 ? "bg-emerald-50 dark:bg-emerald-500/8 border-emerald-200 dark:border-emerald-500/20" : "bg-slate-50 dark:bg-slate-500/8 border-slate-200 dark:border-slate-500/20"}`}>
              <CardContent className="p-3.5 flex items-center gap-2.5">
                <div className={`p-1.5 rounded-lg shrink-0 ${avgIrr && avgIrr >= 6.5 ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" : "bg-slate-500/15 text-slate-600 dark:text-slate-400"}`}>
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider">{t.yieldTitle}</p>
                  <p className={`text-sm font-bold leading-tight ${classColor}`}>{classification || "—"}</p>
                  <p className="text-[9px] text-muted-foreground">{lang === "ar" ? "إمكانية الطاقة" : "Solar potential"}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Location info strip */}
          {position && (
            <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-muted/30 border border-border/40 text-xs text-muted-foreground">
              <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
              <span className="font-mono">{position[0].toFixed(4)}°N, {position[1].toFixed(4)}°E</span>
              {locationName && <span className="text-foreground font-medium truncate">— {locationName}</span>}
              {avgIrr && (
                <span className="ml-auto font-mono">
                  GHI ≈ <strong>{(avgIrr * 365).toFixed(0)} kWh/m²/yr</strong>
                </span>
              )}
            </div>
          )}

          {/* Download PDF button — direct English download */}
          {monthly && (
            <button
              type="button"
              onClick={handleDownloadLocationPdf}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-dashed border-primary/40 bg-primary/5 hover:bg-primary/10 text-primary text-sm font-medium transition-all hover:border-primary/60 active:scale-[0.99]"
              data-testid="button-download-report"
            >
              <Download className="w-4 h-4" />
              {t.downloadPdfReport}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
