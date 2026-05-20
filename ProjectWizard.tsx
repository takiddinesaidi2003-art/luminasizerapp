import { useState, useEffect, useCallback } from "react";
import { useLocation, useParams } from "wouter";
import { Sun, Battery, Droplets, Zap, ArrowLeft, Save, CheckCircle2, MapPin, Ruler, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useCreateProject, useUpdateProject, useProject } from "@/hooks/use-projects";
import { calculateSystem } from "@/lib/sizing-engine";
import { OnGridForm, OffGridForm, HybridForm, PumpingForm } from "@/components/SystemForms";
import { ResultsDisplay } from "@/components/ResultsDisplay";
import { LocationPicker } from "@/components/LocationPicker";
import { PanelSpacingTool } from "@/components/PanelSpacingTool";
import { SystemDiagram } from "@/components/SystemDiagram";
import { useLang, T } from "@/lib/i18n";

function StepPane({ stepKey, children }: { stepKey: string | number; children: React.ReactNode }) {
  return <div key={stepKey} className="animate-fade-up">{children}</div>;
}

export default function ProjectWizard() {
  const [_, setLocation] = useLocation();
  const { id } = useParams();
  const isEditing  = !!id;
  const projectId  = id ? parseInt(id) : null;

  const { data: existingProject, isLoading } = useProject(projectId);
  const createMutation = useCreateProject();
  const updateMutation = useUpdateProject();
  const { toast } = useToast();
  const { lang } = useLang();
  const t = T[lang];

  // Read ?type= from URL to pre-select system type (skip step 2 when set)
  const preType = (() => {
    try {
      const p = new URLSearchParams(window.location.search).get("type");
      return ["on-grid","off-grid","hybrid","pumping"].includes(p ?? "") ? p : null;
    } catch { return null; }
  })();

  const STEPS = [t.stepLocation, t.stepSystem, t.stepParams, t.stepResults];

  const systemTypes = [
    { id: "on-grid",  title: "On-Grid",  subtitle: t.onGridSubtitle,  desc: t.onGridDesc,  icon: Sun,      color: "text-amber-500",   bg: "bg-amber-500/10  border-amber-500/20",  ring: "ring-amber-500/60",  glow: "hover:shadow-amber-500/20"  },
    { id: "off-grid", title: "Off-Grid", subtitle: t.offGridSubtitle, desc: t.offGridDesc, icon: Battery,  color: "text-emerald-500", bg: "bg-emerald-500/10 border-emerald-500/20", ring: "ring-emerald-500/60", glow: "hover:shadow-emerald-500/20" },
    { id: "hybrid",   title: "Hybrid",   subtitle: t.hybridSubtitle,  desc: t.hybridDesc,  icon: Zap,      color: "text-purple-500",  bg: "bg-purple-500/10  border-purple-500/20",  ring: "ring-purple-500/60",  glow: "hover:shadow-purple-500/20"  },
    { id: "pumping",  title: "Pumping",  subtitle: t.pumpingSubtitle, desc: t.pumpingDesc, icon: Droplets, color: "text-blue-500",    bg: "bg-blue-500/10    border-blue-500/20",    ring: "ring-blue-500/60",    glow: "hover:shadow-blue-500/20"    },
  ];

  const [step,         setStep]          = useState(1);
  const [projectName,  setProjectName]   = useState("");
  const [systemType,   setSystemType]    = useState<string | null>(preType);
  const [inputs,       setInputs]        = useState<any>(null);
  const [results,      setResults]       = useState<any>(null);
  const [locData,      setLocData]       = useState<{ lat: number; lon: number; psh: number } | null>(null);
  const [monthly,      setMonthly]       = useState<any[]>([]);
  const [spacingData,  setSpacingData]   = useState<any>(null);
  // Live form values for real-time diagram (hybrid only)
  const [liveFormValues, setLiveFormValues] = useState<any>(null);
  const [showDiagram,    setShowDiagram]    = useState(true);

  useEffect(() => {
    if (existingProject && isEditing) {
      setProjectName(existingProject.name);
      setSystemType(existingProject.systemType);
      setInputs(existingProject.inputs);
      setResults(existingProject.results);
      if (existingProject.inputs?.location) setLocData(existingProject.inputs.location);
      setStep(4);
    }
  }, [existingProject, isEditing]);

  // When pre-type is set, skip step 2
  const goBack = () => {
    if (isEditing) { setLocation("/"); return; }
    if (step === 3 && preType) { setStep(1); return; } // skip step 2 backwards
    if (step > 1) setStep(s => s - 1);
    else setLocation("/");
  };

  const handleLocationSelect = (lat: number, lon: number, psh: number) => {
    setLocData({ lat, lon, psh });
  };

  const handleCalculate = (formData: any) => {
    try {
      const computed = calculateSystem(systemType!, formData);
      setInputs(formData);
      setResults(computed);
      if (!isEditing) setStep(4);
    } catch (err: any) {
      toast({ title: t.calcError, description: err.message, variant: "destructive" });
    }
  };

  const handleFormChange = useCallback((values: any) => {
    setLiveFormValues(values);
  }, []);

  const handleSave = () => {
    if (!projectName.trim()) {
      toast({ title: t.nameRequired, description: t.nameRequiredDesc, variant: "destructive" });
      return;
    }
    const payload = {
      name: projectName,
      systemType: systemType!,
      inputs: { ...inputs, location: locData },
      results,
    };
    if (isEditing) {
      updateMutation.mutate({ id: projectId!, ...payload }, {
        onSuccess: () => { toast({ title: t.savedOk }); setLocation("/"); },
      });
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => { toast({ title: t.projectSaved }); setLocation("/"); },
      });
    }
  };

  if (isEditing && isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4 animate-fade-up">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center animate-pulse">
            <Sun className="w-6 h-6 text-primary" />
          </div>
          <p className="text-muted-foreground text-sm">{t.loadingData}</p>
        </div>
      </div>
    );
  }

  const activeType = systemTypes.find(tp => tp.id === systemType);

  // Stepper: when preType set, we have 3 effective steps (location, params, results)
  // Visual step numbers: 1=Location, 2=Params, 3=Results (step 2 hidden)
  const effectiveStepLabels = preType
    ? [t.stepLocation, t.stepParams, t.stepResults]
    : STEPS;

  const effectiveStep = preType
    ? (step === 1 ? 1 : step === 3 ? 2 : 3)
    : step;

  // Whether to show the diagram panel for this system type
  const canShowDiagram = systemType === "hybrid" || systemType === "off-grid";

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl py-6 lg:py-8">

      {/* ── Header ── */}
      <div className="flex items-center mb-8 gap-3 animate-fade-down">
        <Button
          variant="ghost" size="icon"
          onClick={goBack}
          className="shrink-0 hover:bg-muted active:scale-90 transition-all duration-200"
          data-testid="button-back"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl font-display font-bold leading-tight truncate">
            {isEditing ? t.editProject : t.newCalc}
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {isEditing ? existingProject?.name : effectiveStepLabels[effectiveStep - 1]}
          </p>
        </div>
        {/* Diagram toggle for hybrid/off-grid at step 3 */}
        {step === 3 && canShowDiagram && !isEditing && (
          <Button
            variant={showDiagram ? "default" : "outline"}
            size="sm"
            onClick={() => setShowDiagram(v => !v)}
            className="gap-2 text-sm"
          >
            <LayoutGrid className="w-4 h-4" />
            {lang === "ar" ? "المخطط" : "Diagram"}
          </Button>
        )}
      </div>

      {/* ── Stepper ── */}
      {!isEditing && (
        <div className="mb-10 animate-fade-down" style={{ animationDelay: "50ms" }}>
          <div className="flex items-center gap-0">
            {effectiveStepLabels.map((label, i) => {
              const s      = i + 1;
              const done   = s < effectiveStep;
              const active = s === effectiveStep;
              return (
                <div key={s} className="flex items-center flex-1 last:flex-none">
                  <div className="flex flex-col items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        if (done) {
                          // Map effective step back to actual step
                          if (preType) {
                            const actualSteps = [1, 3, 4];
                            setStep(actualSteps[i]);
                          } else {
                            setStep(s);
                          }
                        }
                      }}
                      disabled={!done}
                      className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all duration-300
                        ${done   ? "bg-primary border-primary text-primary-foreground cursor-pointer hover:scale-105" : ""}
                        ${active ? "bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/30" : ""}
                        ${!done && !active ? "bg-background border-border text-muted-foreground cursor-default" : ""}
                      `}
                    >
                      {done ? <CheckCircle2 className="w-4 h-4" /> : s}
                    </button>
                    <span className={`text-xs font-medium whitespace-nowrap transition-colors duration-300 hidden sm:block
                      ${active ? "text-primary" : done ? "text-primary/70" : "text-muted-foreground"}
                    `}>{label}</span>
                  </div>
                  {i < effectiveStepLabels.length - 1 && (
                    <div className="flex-1 h-0.5 mx-2 mb-5 bg-border overflow-hidden rounded-full">
                      <div
                        className="h-full bg-primary transition-all duration-500 ease-out rounded-full"
                        style={{ width: effectiveStep > s ? "100%" : "0%" }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ════════════════ STEP 1: Location ════════════════ */}
      {step === 1 && !isEditing && (
        <StepPane stepKey="location">
          <Card className="border-border/50 shadow-xl shadow-black/5">
            <CardContent className="p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-6 pb-5 border-b border-border/50">
                <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500 shadow-sm">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-display font-bold">{t.chooseLocation}</h2>
                  <p className="text-xs text-muted-foreground">{t.chooseLocationDesc}</p>
                </div>
              </div>

              <LocationPicker
                onLocationSelect={handleLocationSelect}
                onMonthlyData={rows => setMonthly(rows)}
                initialLat={locData?.lat}
                initialLon={locData?.lon}
              />
            </CardContent>
          </Card>

          <div className="mt-6 flex justify-end">
            <Button
              size="lg"
              onClick={() => setStep(preType ? 3 : 2)}
              disabled={!locData}
              className="h-12 px-8 font-bold shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 active:scale-95 transition-all duration-200"
              data-testid="button-next-step1"
            >
              {preType ? t.nextParams : t.nextSystemType}
              <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
            </Button>
          </div>
          {!locData && (
            <p className="text-center text-xs text-muted-foreground mt-3">{t.locationRequired}</p>
          )}
        </StepPane>
      )}

      {/* ════════════════ STEP 2: System Type (only if not pre-selected) ════════════════ */}
      {step === 2 && !isEditing && !preType && (
        <StepPane stepKey="system-type">
          {locData && (
            <div className="mb-5 p-3 rounded-xl bg-amber-500/8 border border-amber-500/20 flex items-center gap-3 text-sm">
              <Sun className="w-4 h-4 text-amber-500 shrink-0" />
              <span className="text-muted-foreground">{t.solarIrr}</span>
              <span className="font-bold text-amber-600 dark:text-amber-400">{locData.psh.toFixed(2)} kWh/m²/d</span>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="ml-auto text-xs text-muted-foreground hover:text-primary transition-colors underline-offset-2 hover:underline shrink-0"
              >
                {t.changeLocation}
              </button>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {systemTypes.map((type, i) => {
              const Icon     = type.icon;
              const selected = systemType === type.id;
              return (
                <Card
                  key={type.id}
                  className={`cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${type.glow}
                    active:scale-[0.98] border-2
                    ${selected ? `ring-2 ${type.ring} ${type.bg} border-transparent` : "border-border/50 hover:border-border"}`}
                  style={{ animationDelay: `${i * 60}ms` }}
                  onClick={() => { setSystemType(type.id); setTimeout(() => setStep(3), 180); }}
                  data-testid={`card-system-${type.id}`}
                >
                  <CardContent className="p-6 flex items-start gap-4">
                    <div className={`p-3 rounded-xl ${type.bg} ${type.color} transition-transform duration-200 ${selected ? "scale-110" : ""}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2">
                        <h3 className="text-lg font-bold font-display">{type.title}</h3>
                        <span className="text-xs text-muted-foreground">{type.subtitle}</span>
                      </div>
                      <p className="text-muted-foreground text-sm mt-1 leading-relaxed">{type.desc}</p>
                    </div>
                    {selected && <CheckCircle2 className="w-5 h-5 text-primary ml-auto shrink-0 animate-scale-in" />}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </StepPane>
      )}

      {/* ════════════════ STEP 3: Parameters ════════════════ */}
      {(step === 3 || (isEditing && step < 4)) && (
        <StepPane stepKey="params">
          {/* Solar irradiance info bar when preType is set */}
          {preType && locData && (
            <div className="mb-5 p-3 rounded-xl bg-amber-500/8 border border-amber-500/20 flex items-center gap-3 text-sm">
              <Sun className="w-4 h-4 text-amber-500 shrink-0" />
              <span className="text-muted-foreground">{t.solarIrr}</span>
              <span className="font-bold text-amber-600 dark:text-amber-400">{locData.psh.toFixed(2)} kWh/m²/d</span>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="ml-auto text-xs text-muted-foreground hover:text-primary transition-colors underline-offset-2 hover:underline shrink-0"
              >
                {t.changeLocation}
              </button>
            </div>
          )}

          {/* Two-column layout for hybrid/off-grid when diagram is shown */}
          <div className={`${canShowDiagram && showDiagram && !isEditing ? "grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6" : ""}`}>

            {/* Form card */}
            <Card className="border-border/50 shadow-xl shadow-black/5">
              <CardContent className="p-6 sm:p-8">
                {activeType && (
                  <div className="flex items-center gap-3 mb-6 pb-5 border-b border-border/50">
                    <div className={`p-2.5 rounded-xl ${activeType.bg} ${activeType.color} shadow-sm`}>
                      <activeType.icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-xl font-display font-bold">{activeType.title} — {t.parametersTitle}</h2>
                      <p className="text-xs text-muted-foreground">{t.parametersDesc}</p>
                    </div>
                    {!isEditing && !preType && (
                      <button
                        className="text-xs text-muted-foreground hover:text-primary transition-colors underline-offset-2 hover:underline"
                        onClick={() => setStep(2)}
                      >
                        {t.changeType}
                      </button>
                    )}
                  </div>
                )}
                {systemType === "on-grid"  && <OnGridForm  defaultValues={inputs} forcedPsh={locData?.psh} onSubmit={handleCalculate} />}
                {systemType === "off-grid" && <OffGridForm defaultValues={inputs} forcedPsh={locData?.psh} onSubmit={handleCalculate} />}
                {systemType === "hybrid"   && <HybridForm  defaultValues={inputs} forcedPsh={locData?.psh} onSubmit={handleCalculate} onFormChange={handleFormChange} />}
                {systemType === "pumping"  && <PumpingForm defaultValues={inputs} forcedPsh={locData?.psh} onSubmit={handleCalculate} />}
              </CardContent>
            </Card>

            {/* Diagram panel (hybrid/off-grid) */}
            {canShowDiagram && showDiagram && !isEditing && (
              <div className="space-y-4">
                <div className="sticky top-4">
                  <SystemDiagram
                    type={systemType!}
                    formValues={liveFormValues || inputs}
                    results={null}
                  />
                  <p className="text-[10px] text-muted-foreground text-center mt-2">
                    {lang === "ar" ? "المخطط يتحدث لحظياً مع إدخال البيانات" : "Diagram updates as you fill in the form"}
                  </p>
                </div>
              </div>
            )}
          </div>
        </StepPane>
      )}

      {/* ════════════════ STEP 4: Results ════════════════ */}
      {step === 4 && results && (
        <StepPane stepKey="results">
          <div className="space-y-8">

            {/* Results — always full width */}
            <div className="animate-fade-up">
              <ResultsDisplay
                type={systemType!}
                results={results}
                inputs={inputs}
                projectName={projectName}
                location={locData}
                monthly={monthly.length > 0 ? monthly : null}
                spacing={spacingData}
              />
            </div>

            {/* System Topology — full width below results for hybrid/off-grid */}
            {canShowDiagram && (
              <div className="animate-fade-up" style={{ animationDelay: "40ms" }}>
                <div className="rounded-xl border border-border/50 overflow-hidden shadow-sm">
                  <div className="px-5 py-3 border-b border-border/30 bg-muted/20 flex items-center gap-3">
                    <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="6" height="6" rx="1"/><rect x="16" y="3" width="6" height="6" rx="1"/><rect x="9" y="15" width="6" height="6" rx="1"/><path d="M5 9v3a4 4 0 0 0 4 4h2M19 9v3a4 4 0 0 1-4 4h-2"/></svg>
                    </div>
                    <p className="text-sm font-semibold">{lang === "ar" ? "مخطط توبولوجيا النظام" : "System Topology Diagram"}</p>
                  </div>
                  <div className="p-4">
                    <SystemDiagram
                      type={systemType!}
                      formValues={inputs}
                      results={results}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ── Panel Spacing Tool ── */}
            <div className="animate-fade-up rounded-xl border border-violet-500/20 bg-violet-500/5 overflow-hidden shadow-sm" style={{ animationDelay: "60ms" }}>
              <div className="px-5 py-4 border-b border-violet-500/15 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-violet-500/10 text-violet-500">
                  <Ruler className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{t.rowSpacingTitle}</p>
                  <p className="text-xs text-muted-foreground">{t.rowSpacingDesc}</p>
                </div>
              </div>
              <div className="p-5">
                <PanelSpacingTool
                  externalLat={locData?.lat}
                  onSpacingChange={setSpacingData}
                />
              </div>
            </div>

            {/* Save card */}
            <div className="animate-fade-up" style={{ animationDelay: "120ms" }}>
              <Card className="bg-primary/5 border-primary/20 shadow-none">
                <CardContent className="p-6 flex flex-col sm:flex-row gap-4 items-end">
                  <div className="flex-1 w-full space-y-2">
                    <Label htmlFor="projectName" className="text-foreground font-medium text-base">
                      {t.projectNameLabel}
                    </Label>
                    <Input
                      id="projectName"
                      placeholder={t.projectNamePH}
                      value={projectName}
                      onChange={e => setProjectName(e.target.value)}
                      className="text-base py-6 bg-background shadow-inner focus:ring-2 focus:ring-primary/30 transition-shadow"
                      data-testid="input-project-name"
                    />
                  </div>
                  <Button
                    size="lg"
                    onClick={handleSave}
                    disabled={createMutation.isPending || updateMutation.isPending}
                    className="w-full sm:w-auto h-14 px-8 font-bold shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 active:scale-95 transition-all duration-200 text-base"
                    data-testid="button-save-project"
                  >
                    <Save className="w-5 h-5 mr-2" />
                    {createMutation.isPending || updateMutation.isPending
                      ? t.saving
                      : isEditing ? t.saveChanges : t.saveProject}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </StepPane>
      )}
    </div>
  );
}
