import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { InputField } from "./ui/input-field";
import { Button } from "@/components/ui/button";
import { Calculator, Plus, Trash2, Info, Wind, Fuel, Zap } from "lucide-react";
import {
  onGridInputsSchema,
  offGridInputsSchema,
  hybridInputsSchema,
  pumpingInputsSchema,
  ALGERIAN_MARKET_COMPONENTS,
  INTERNATIONAL_MARKET_COMPONENTS,
  WIND_TURBINES,
  DIESEL_GENERATORS,
} from "@/lib/sizing-engine";
import { Card, CardContent } from "./ui/card";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { useLang, T } from "@/lib/i18n";

type FormProps = {
  defaultValues?: any;
  forcedPsh?: number;
  onSubmit: (data: any) => void;
  onFormChange?: (values: any) => void;
};

// ─────────────── Load Calculator (Table) ───────────────────────────────────
export function LoadCalculator({ control, register, errors }: any) {
  const { fields, append, remove } = useFieldArray({ control, name: "loads" });
  const loads = useWatch({ control, name: "loads" }) as any[] | undefined;
  const { lang } = useLang();
  const t = T[lang];

  const rowKwh = (loads ?? []).map((l: any) => {
    const p = parseFloat(l?.power) || 0;
    const q = parseFloat(l?.quantity) || 0;
    const h = parseFloat(l?.hours) || 0;
    return (p * q * h) / 1000;
  });
  const totalKwh = rowKwh.reduce((a, b) => a + b, 0);

  const cellCls = "px-2 py-1.5";
  const inputCls = "w-full h-8 px-2 rounded-md border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary/40";

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">{t.electricalLoads}</h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 text-xs px-3"
          onClick={() => append({ name: "", power: 0, quantity: 1, hours: 1 })}
          data-testid="button-add-device"
        >
          <Plus className="w-3.5 h-3.5 mr-1" /> {t.addDevice}
        </Button>
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/60 border-b border-border">
                <th className={`${cellCls} text-right font-semibold text-xs text-muted-foreground w-[34%]`}>{t.deviceCol}</th>
                <th className={`${cellCls} text-center font-semibold text-xs text-muted-foreground`}>{t.powerCol}</th>
                <th className={`${cellCls} text-center font-semibold text-xs text-muted-foreground`}>{t.qtyCol}</th>
                <th className={`${cellCls} text-center font-semibold text-xs text-muted-foreground`}>{t.hoursDayCol}</th>
                <th className={`${cellCls} text-center font-semibold text-xs text-muted-foreground`}>{t.kwhDayCol}</th>
                <th className={`${cellCls} w-8`}></th>
              </tr>
            </thead>
            <tbody>
              {fields.map((field, i) => (
                <tr key={field.id} className="border-b border-border/50 last:border-b-0 hover:bg-muted/20 transition-colors">
                  <td className={cellCls}>
                    <input
                      {...register(`loads.${i}.name`)}
                      placeholder={t.devicePH}
                      className={inputCls}
                      data-testid={`input-device-name-${i}`}
                    />
                    {errors?.loads?.[i]?.name && (
                      <p className="text-[10px] text-destructive mt-0.5">{errors.loads[i].name.message}</p>
                    )}
                  </td>
                  <td className={cellCls}>
                    <input
                      type="number"
                      {...register(`loads.${i}.power`)}
                      className={`${inputCls} text-center`}
                      data-testid={`input-device-power-${i}`}
                    />
                  </td>
                  <td className={cellCls}>
                    <input
                      type="number"
                      {...register(`loads.${i}.quantity`)}
                      className={`${inputCls} text-center`}
                      data-testid={`input-device-qty-${i}`}
                    />
                  </td>
                  <td className={cellCls}>
                    <input
                      type="number" step="0.5"
                      {...register(`loads.${i}.hours`)}
                      className={`${inputCls} text-center`}
                      data-testid={`input-device-hours-${i}`}
                    />
                  </td>
                  <td className={`${cellCls} text-center`}>
                    <span className="font-mono font-medium text-amber-600 dark:text-amber-400">
                      {rowKwh[i]?.toFixed(3) ?? "0.000"}
                    </span>
                  </td>
                  <td className={cellCls}>
                    <button
                      type="button"
                      onClick={() => remove(i)}
                      className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                      data-testid={`button-remove-device-${i}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}

              {fields.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-6 text-muted-foreground text-sm">
                    {t.noDevices}
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr className="bg-muted/40 border-t-2 border-border">
                <td colSpan={4} className={`${cellCls} text-right text-xs font-semibold text-muted-foreground`}>
                  {t.dailyTotal}
                </td>
                <td className={`${cellCls} text-center`}>
                  <span className="font-mono font-bold text-primary text-base">{totalKwh.toFixed(3)}</span>
                  <span className="text-xs text-muted-foreground ml-1">kWh</span>
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─────────────── Panel Market Toggle ───────────────────────────────────────
type PanelMarket = "algeria" | "international" | "both";
const MARKET_LABELS: Record<PanelMarket, string> = {
  algeria: "🇩🇿 Algeria",
  international: "🌍 International",
  both: "🌐 All",
};

function PanelSpecs({ register, errors, setValue }: any) {
  const [market, setMarket] = useState<PanelMarket>("both");
  const { lang } = useLang();
  const t = T[lang];

  const panels =
    market === "algeria"
      ? ALGERIAN_MARKET_COMPONENTS.panels
      : market === "international"
      ? INTERNATIONAL_MARKET_COMPONENTS.panels
      : [...ALGERIAN_MARKET_COMPONENTS.panels, ...INTERNATIONAL_MARKET_COMPONENTS.panels];

  const onPanelChange = (val: string) => {
    const panel = panels.find((p) => `${p.brand}||${p.model}` === val);
    if (panel) {
      setValue("panelWattage", panel.wattage);
      setValue("panelVmp", panel.vmp);
      setValue("panelImp", panel.imp);
      setValue("panelVoc", panel.voc);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <Label className="text-sm font-medium shrink-0">{t.panelSelection}</Label>
        <div className="flex gap-1 p-1 bg-muted rounded-lg text-xs w-fit">
          {(Object.keys(MARKET_LABELS) as PanelMarket[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMarket(m)}
              className={`px-3 py-1.5 rounded-md font-medium transition-all whitespace-nowrap ${
                market === m
                  ? "bg-background shadow text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {MARKET_LABELS[m]}
            </button>
          ))}
        </div>
      </div>

      <Select onValueChange={onPanelChange}>
        <SelectTrigger className="h-auto min-h-10">
          <SelectValue placeholder={t.panelPH} />
        </SelectTrigger>
        <SelectContent className="max-h-80 w-[var(--radix-select-trigger-width)]">
          {panels.map((p) => (
            <SelectItem
              key={`${p.brand}||${p.model}`}
              value={`${p.brand}||${p.model}`}
              className="py-2"
            >
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="font-medium truncate">
                  {p.brand} – {p.model}
                </span>
                <span className="text-xs text-muted-foreground font-mono">
                  {p.wattage} W · Vmp {p.vmp} V · Voc {p.voc} V · Imp {p.imp} A
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-primary/5 p-4 rounded-xl">
        <InputField label="Wattage" unit="W" {...register("panelWattage")} error={errors?.panelWattage?.message} />
        <InputField label="Vmp" unit="V" {...register("panelVmp")} error={errors?.panelVmp?.message} />
        <InputField label="Imp" unit="A" {...register("panelImp")} error={errors?.panelImp?.message} />
        <InputField label="Voc" unit="V" {...register("panelVoc")} error={errors?.panelVoc?.message} />
      </div>
    </div>
  );
}

// ─────────────── Checkbox Field ─────────────────────────────────────────────
function CheckboxField({
  id,
  label,
  description,
  register,
}: {
  id: string;
  label: string;
  description?: string;
  register: any;
}) {
  return (
    <label
      htmlFor={id}
      className="flex items-start gap-3 p-4 rounded-xl bg-secondary/30 hover:bg-secondary/50 cursor-pointer transition-colors border border-border/50"
    >
      <input
        type="checkbox"
        id={id}
        {...register(id)}
        className="mt-0.5 w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary shrink-0"
      />
      <div>
        <p className="text-sm font-medium">{label}</p>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>
    </label>
  );
}

// ─────────────── Submit Button ───────────────────────────────────────────────
function SubmitButton() {
  const { lang } = useLang();
  const t = T[lang];
  return (
    <Button type="submit" size="lg" className="w-full font-bold shadow-md shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5 active:scale-95 transition-all duration-200" data-testid="button-calculate">
      <Calculator className="w-5 h-5 mr-2" />
      {t.calculate}
    </Button>
  );
}

// ─────────────── On-Grid Form ───────────────────────────────────────────────
export function OnGridForm({ defaultValues, forcedPsh, onSubmit }: FormProps) {
  const { lang } = useLang();
  const t = T[lang];
  const form = useForm({
    resolver: zodResolver(onGridInputsSchema),
    defaultValues: defaultValues || {
      monthlyConsumption: 500,
      peakPowerKw: undefined,
      panelWattage: 450,
      panelVmp: 41.5,
      panelImp: 10.8,
      panelVoc: 49.5,
      peakSunHours: 5,
      systemLosses: 15,
      distPanelToInverter: 20,
      distInverterToMainPanel: 5,
    },
  });

  useEffect(() => {
    if (forcedPsh) form.setValue("peakSunHours", forcedPsh);
  }, [forcedPsh, form]);

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <PanelSpecs register={form.register} errors={form.formState.errors} setValue={form.setValue} />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <InputField
          label={t.monthlyConsumption}
          unit="kWh"
          {...form.register("monthlyConsumption")}
          error={form.formState.errors.monthlyConsumption?.message}
        />
        <InputField
          label={t.peakSunHours}
          unit="hrs/day"
          {...form.register("peakSunHours")}
          error={form.formState.errors.peakSunHours?.message}
        />
      </div>

      {/* Peak Power override */}
      <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 space-y-2">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-500" />
          <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">
            {lang === "ar" ? "القدرة الذروية (اختياري)" : "Peak Power Override (optional)"}
          </p>
        </div>
        <p className="text-xs text-muted-foreground">
          {lang === "ar"
            ? "إذا كانت لديك قدرة ذروية محددة مسبقاً، أدخلها هنا (تلغي الحساب من الاستهلاك الشهري)"
            : "Enter a specific peak power to override the consumption-based calculation"}
        </p>
        <InputField
          label={lang === "ar" ? "القدرة الذروية" : "Peak Power"}
          unit="kWp"
          placeholder={lang === "ar" ? "اتركها فارغة للحساب التلقائي" : "Leave empty to auto-calculate"}
          {...form.register("peakPowerKw")}
        />
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold border-b pb-2">{t.cableDistances}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InputField label={t.panelToInverter} unit="m" {...form.register("distPanelToInverter")} />
          <InputField label={t.inverterToMain} unit="m" {...form.register("distInverterToMainPanel")} />
        </div>
      </div>

      <SubmitButton />
    </form>
  );
}

// ─────────────── Off-Grid Form ──────────────────────────────────────────────
export function OffGridForm({ defaultValues, forcedPsh, onSubmit }: FormProps) {
  const { lang } = useLang();
  const t = T[lang];
  const form = useForm({
    resolver: zodResolver(offGridInputsSchema),
    defaultValues: defaultValues || {
      loads: [{ name: "Lighting", power: 100, quantity: 5, hours: 6 }],
      daysOfAutonomy: 2,
      batteryDOD: 80,
      batteryUnitVoltage: 12,
      batteryUnitCapacityAh: 200,
      inverterEfficiency: 95,
      panelWattage: 450,
      panelVmp: 41.5,
      panelImp: 10.8,
      panelVoc: 49.5,
      peakSunHours: 5,
      systemLosses: 15,
      hasDcDcConverter: false,
      distPanelToRegulator: 10,
      distRegulatorToBattery: 2,
      distBatteryToInverter: 1,
      distInverterToLoad: 10,
      distBatteryToDcDc: 1,
    },
  });

  useEffect(() => {
    if (forcedPsh) form.setValue("peakSunHours", forcedPsh);
  }, [forcedPsh, form]);

  const hasDcDc = form.watch("hasDcDcConverter");

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <PanelSpecs register={form.register} errors={form.formState.errors} setValue={form.setValue} />
      <LoadCalculator control={form.control} register={form.register} errors={form.formState.errors} />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <InputField label={t.autonomyDays} unit="days" {...form.register("daysOfAutonomy")} />
        <InputField label={t.batteryVoltage} unit="V" {...form.register("batteryUnitVoltage")} />
        <InputField label={t.batteryCapacity} unit="Ah" {...form.register("batteryUnitCapacityAh")} />
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold border-b pb-2">{t.cableDistances}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InputField label={t.panelToReg} unit="m" {...form.register("distPanelToRegulator")} />
          <InputField label={t.regToBatt} unit="m" {...form.register("distRegulatorToBattery")} />
          <InputField label={t.battToInv} unit="m" {...form.register("distBatteryToInverter")} />
          <InputField label={t.invToLoad} unit="m" {...form.register("distInverterToLoad")} />
        </div>
      </div>

      <div className="space-y-3">
        <CheckboxField
          id="hasDcDcConverter"
          label={t.hasDcDc}
          description={t.hasDcDcDesc}
          register={form.register}
        />
        {hasDcDc && (
          <div className="ml-7 animate-fade-up">
            <InputField
              label="Battery → DC-DC Converter (DC)"
              unit="m"
              {...form.register("distBatteryToDcDc")}
            />
          </div>
        )}
      </div>

      <SubmitButton />
    </form>
  );
}

// ─────────────── Hybrid Form ────────────────────────────────────────────────
export function HybridForm({ defaultValues, forcedPsh, onSubmit, onFormChange }: FormProps) {
  const { lang } = useLang();
  const t = T[lang];
  const form = useForm({
    resolver: zodResolver(hybridInputsSchema),
    defaultValues: defaultValues || {
      loads: [{ name: "Lighting", power: 100, quantity: 5, hours: 6 }],
      daysOfAutonomy: 2,
      batteryDOD: 80,
      batteryUnitVoltage: 12,
      batteryUnitCapacityAh: 200,
      inverterEfficiency: 95,
      panelWattage: 450,
      panelVmp: 41.5,
      panelImp: 10.8,
      panelVoc: 49.5,
      peakSunHours: 5,
      systemLosses: 15,
      hasDcDcConverter: false,
      distPanelToRegulator: 10,
      distRegulatorToBattery: 2,
      distBatteryToInverter: 1,
      distInverterToLoad: 10,
      distBatteryToDcDc: 1,
      gridVoltage: "230",
      gridFrequency: "50",
      gridExportEnabled: true,
      gridExportLimitW: 0,
      gridCharging: false,
      priorityMode: "solar-first",
      windEnabled: false,
      windTurbineModel: "",
      windSpeedMps: 5,
      windTurbineCount: 1,
      dieselEnabled: false,
      dieselGeneratorModel: "",
      dieselHoursPerDay: 4,
      dieselGeneratorCount: 1,
    },
  });

  useEffect(() => {
    if (forcedPsh) form.setValue("peakSunHours", forcedPsh);
  }, [forcedPsh, form]);

  // Live values for diagram + conditional rendering
  const watchedAll = useWatch({ control: form.control });
  useEffect(() => {
    if (onFormChange) onFormChange(watchedAll);
  }, [watchedAll, onFormChange]);

  const hasDcDc    = form.watch("hasDcDcConverter");
  const gridExport = form.watch("gridExportEnabled");
  const windOn     = form.watch("windEnabled");
  const dieselOn   = form.watch("dieselEnabled");

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <PanelSpecs register={form.register} errors={form.formState.errors} setValue={form.setValue} />
      <LoadCalculator control={form.control} register={form.register} errors={form.formState.errors} />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <InputField label={t.autonomyDays} unit="days" {...form.register("daysOfAutonomy")} />
        <InputField label={t.batteryVoltage} unit="V" {...form.register("batteryUnitVoltage")} />
        <InputField label={t.batteryCapacity} unit="Ah" {...form.register("batteryUnitCapacityAh")} />
      </div>

      {/* ── Grid Configuration ── */}
      <div className="space-y-4 rounded-xl border border-blue-500/20 bg-blue-500/5 p-5">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-7 h-7 rounded-lg bg-blue-500/15 flex items-center justify-center">
            <Info className="w-4 h-4 text-blue-500" />
          </div>
          <h3 className="text-sm font-semibold text-blue-700 dark:text-blue-400">{t.gridConfig}</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">{t.gridVoltage}</Label>
            <Select defaultValue={defaultValues?.gridVoltage ?? "230"} onValueChange={(v) => form.setValue("gridVoltage", v as any)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="230"><div className="flex flex-col"><span className="font-medium">230 V</span><span className="text-xs text-muted-foreground">Single-phase — Algeria standard</span></div></SelectItem>
                <SelectItem value="400"><div className="flex flex-col"><span className="font-medium">400 V</span><span className="text-xs text-muted-foreground">Three-phase — industrial use</span></div></SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Grid Frequency</Label>
            <Select defaultValue={defaultValues?.gridFrequency ?? "50"} onValueChange={(v) => form.setValue("gridFrequency", v as any)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="50"><div className="flex flex-col"><span className="font-medium">50 Hz</span><span className="text-xs text-muted-foreground">Algeria, Europe, Africa</span></div></SelectItem>
                <SelectItem value="60"><div className="flex flex-col"><span className="font-medium">60 Hz</span><span className="text-xs text-muted-foreground">North America</span></div></SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label className="text-sm font-medium">Operation Priority Mode</Label>
            <Select defaultValue={defaultValues?.priorityMode ?? "solar-first"} onValueChange={(v) => form.setValue("priorityMode", v as any)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="solar-first"><div className="flex flex-col"><span className="font-medium">☀️ Solar First</span><span className="text-xs text-muted-foreground">Solar → Battery → Grid (recommended)</span></div></SelectItem>
                <SelectItem value="battery-first"><div className="flex flex-col"><span className="font-medium">🔋 Battery First</span><span className="text-xs text-muted-foreground">Battery → Solar → Grid</span></div></SelectItem>
                <SelectItem value="grid-first"><div className="flex flex-col"><span className="font-medium">🔌 Grid First</span><span className="text-xs text-muted-foreground">Grid → Solar → Battery (keeps battery full)</span></div></SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <CheckboxField id="gridExportEnabled" label="Enable Grid Export (Feed-in Tariff)" description="Allow excess solar power to be fed back to the grid." register={form.register} />
          {gridExport && (
            <div className="ml-7 animate-fade-up">
              <InputField label="Export Limit" unit="W (0 = unlimited)" {...form.register("gridExportLimitW")} />
            </div>
          )}
          <CheckboxField id="gridCharging" label={t.hasGridBackup} description={t.hasGridBackupDesc} register={form.register} />
        </div>
      </div>

      {/* ── Wind Energy Section ── */}
      <div className={`rounded-xl border-2 transition-all duration-300 overflow-hidden ${windOn ? "border-sky-500/30 bg-sky-500/5" : "border-border/50 bg-muted/10"}`}>
        <label className="flex items-center gap-3 px-5 py-4 cursor-pointer select-none">
          <input
            type="checkbox"
            {...form.register("windEnabled")}
            className="w-4 h-4 rounded border-gray-300 text-sky-500 focus:ring-sky-500 shrink-0"
            data-testid="checkbox-wind-enabled"
          />
          <div className="flex items-center gap-2.5 flex-1">
            <div className={`p-1.5 rounded-lg transition-colors ${windOn ? "bg-sky-500/15 text-sky-500" : "bg-muted text-muted-foreground"}`}>
              <Wind className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-semibold">{lang === "ar" ? "طاقة الرياح" : "Wind Energy"}</p>
              <p className="text-xs text-muted-foreground">{lang === "ar" ? "إضافة توربين رياح كمصدر طاقة إضافي" : "Add wind turbine as supplementary energy source"}</p>
            </div>
          </div>
        </label>

        {windOn && (
          <div className="px-5 pb-5 space-y-4 border-t border-sky-500/20 pt-4 animate-fade-up">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">{lang === "ar" ? "موديل التوربين" : "Turbine Model"}</Label>
              <Select
                defaultValue={defaultValues?.windTurbineModel ?? ""}
                onValueChange={(v) => form.setValue("windTurbineModel", v)}
              >
                <SelectTrigger className="h-auto min-h-10">
                  <SelectValue placeholder={lang === "ar" ? "اختر موديل التوربين…" : "Select turbine model…"} />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {WIND_TURBINES.map(t => (
                    <SelectItem key={`${t.brand}||${t.model}`} value={`${t.brand}||${t.model}`} className="py-2">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-medium">{t.brand} — {t.model}</span>
                        <span className="text-xs text-muted-foreground font-mono">
                          {t.ratedKW} kW · Cut-in {t.cutInMs} m/s · Rated {t.ratedMs} m/s · Ø {t.rotorDm} m
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Custom power field — visible only when Generic is selected */}
            {form.watch("windTurbineModel") === "Generic||Custom Turbine" && (
              <div className="animate-fade-up">
                <InputField
                  label={lang === "ar" ? "القدرة المقيّسة للتوربين" : "Turbine Rated Power"}
                  unit="kW"
                  {...form.register("windTurbineCustomKw")}
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              {form.watch("windTurbineModel") !== "Generic||Custom Turbine" && (
                <InputField
                  label={lang === "ar" ? "سرعة الريح" : "Wind Speed"}
                  unit="m/s"
                  {...form.register("windSpeedMps")}
                />
              )}
              <InputField
                label={lang === "ar" ? "عدد التوربينات" : "Turbine Count"}
                unit={lang === "ar" ? "وحدة" : "units"}
                {...form.register("windTurbineCount")}
              />
            </div>
          </div>
        )}
      </div>

      {/* ── Diesel Generator Section ── */}
      <div className={`rounded-xl border-2 transition-all duration-300 overflow-hidden ${dieselOn ? "border-orange-500/30 bg-orange-500/5" : "border-border/50 bg-muted/10"}`}>
        <label className="flex items-center gap-3 px-5 py-4 cursor-pointer select-none">
          <input
            type="checkbox"
            {...form.register("dieselEnabled")}
            className="w-4 h-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500 shrink-0"
            data-testid="checkbox-diesel-enabled"
          />
          <div className="flex items-center gap-2.5 flex-1">
            <div className={`p-1.5 rounded-lg transition-colors ${dieselOn ? "bg-orange-500/15 text-orange-500" : "bg-muted text-muted-foreground"}`}>
              <Fuel className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-semibold">{lang === "ar" ? "مولد ديزل احتياطي" : "Diesel Generator Backup"}</p>
              <p className="text-xs text-muted-foreground">{lang === "ar" ? "إضافة مولد ديزل لتغطية أوقات انعدام الشمس أو الرياح" : "Add diesel generator for low solar/wind periods"}</p>
            </div>
          </div>
        </label>

        {dieselOn && (
          <div className="px-5 pb-5 space-y-4 border-t border-orange-500/20 pt-4 animate-fade-up">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">{lang === "ar" ? "موديل المولد" : "Generator Model"}</Label>
              <Select
                defaultValue={defaultValues?.dieselGeneratorModel ?? ""}
                onValueChange={(v) => form.setValue("dieselGeneratorModel", v)}
              >
                <SelectTrigger className="h-auto min-h-10">
                  <SelectValue placeholder={lang === "ar" ? "اختر موديل المولد…" : "Select generator model…"} />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {DIESEL_GENERATORS.map(g => (
                    <SelectItem key={`${g.brand}||${g.model}`} value={`${g.brand}||${g.model}`} className="py-2">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-medium">{g.brand} — {g.model}</span>
                        <span className="text-xs text-muted-foreground font-mono">
                          {g.powerKW} kW ({g.powerKVA} kVA) · {g.fuelLph} L/h · Tank {g.fuelTankL} L
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <InputField
                label={lang === "ar" ? "ساعات التشغيل" : "Hours / Day"}
                unit="h/day"
                {...form.register("dieselHoursPerDay")}
              />
              <InputField
                label={lang === "ar" ? "عدد المولدات" : "Generator Count"}
                unit={lang === "ar" ? "وحدة" : "units"}
                {...form.register("dieselGeneratorCount")}
              />
            </div>
          </div>
        )}
      </div>

      {/* ── Cable Distances ── */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold border-b pb-2">{t.cableDistances}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InputField label={t.panelToReg} unit="m" {...form.register("distPanelToRegulator")} />
          <InputField label={t.regToBatt} unit="m" {...form.register("distRegulatorToBattery")} />
          <InputField label={t.battToInv} unit="m" {...form.register("distBatteryToInverter")} />
          <InputField label={t.invToLoad} unit="m" {...form.register("distInverterToLoad")} />
        </div>
      </div>

      <div className="space-y-3">
        <CheckboxField id="hasDcDcConverter" label={t.hasDcDc} description={t.hasDcDcDesc} register={form.register} />
        {hasDcDc && (
          <div className="ml-7 animate-fade-up">
            <InputField label="Battery → DC-DC Converter (DC)" unit="m" {...form.register("distBatteryToDcDc")} />
          </div>
        )}
      </div>

      <SubmitButton />
    </form>
  );
}

// ─────────────── Pumping Form ────────────────────────────────────────────────
export function PumpingForm({ defaultValues, forcedPsh, onSubmit }: FormProps) {
  const { lang } = useLang();
  const t = T[lang];
  const form = useForm({
    resolver: zodResolver(pumpingInputsSchema),
    defaultValues: defaultValues || {
      panelWattage: 450,
      panelVmp: 41.5,
      panelImp: 10.8,
      panelVoc: 49.5,
      peakSunHours: 5,
      systemLosses: 15,
      pumpPowerW: 750,
      pumpingHoursPerDay: 6,
      pumpHeadM: 20,
      flowRateLph: 3000,
      distPanelToInverter: 20,
    },
  });

  useEffect(() => {
    if (forcedPsh) form.setValue("peakSunHours", forcedPsh);
  }, [forcedPsh, form]);

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <PanelSpecs register={form.register} errors={form.formState.errors} setValue={form.setValue} />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <InputField label={t.pumpPower} unit="W" {...form.register("pumpPowerW")} error={form.formState.errors.pumpPowerW?.message} />
        <InputField label={t.pumpingHours} unit="h/day" {...form.register("pumpingHoursPerDay")} error={form.formState.errors.pumpingHoursPerDay?.message} />
        <InputField label={t.pumpHead} unit="m" {...form.register("pumpHeadM")} />
        <InputField label={t.flowRate} unit="L/h" {...form.register("flowRateLph")} />
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold border-b pb-2">{t.cableDistances}</h3>
        <InputField label={t.panelToInverter} unit="m" {...form.register("distPanelToInverter")} />
      </div>

      <SubmitButton />
    </form>
  );
}
