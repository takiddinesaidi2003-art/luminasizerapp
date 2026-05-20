import { Link } from "wouter";
import { Plus, Sun, Battery, Droplets, Zap, Trash2, ArrowRight, Sparkles, ChevronRight } from "lucide-react";
import { useProjects, useDeleteProject } from "@/hooks/use-projects";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useLang, T } from "@/lib/i18n";

const typeConfig: Record<string, { icon: any; color: string; label: string; glow: string; accent: string }> = {
  'on-grid':  { icon: Sun,      color: "text-amber-500  bg-amber-500/10  border-amber-500/20",  label: "On-Grid",  glow: "group-hover:shadow-amber-500/10",   accent: "from-amber-500/20 to-amber-500/5"   },
  'off-grid': { icon: Battery,  color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20", label: "Off-Grid", glow: "group-hover:shadow-emerald-500/10", accent: "from-emerald-500/20 to-emerald-500/5" },
  'hybrid':   { icon: Zap,      color: "text-purple-500 bg-purple-500/10 border-purple-500/20", label: "Hybrid",   glow: "group-hover:shadow-purple-500/10",   accent: "from-purple-500/20 to-purple-500/5"  },
  'pumping':  { icon: Droplets, color: "text-blue-500   bg-blue-500/10   border-blue-500/20",   label: "Pumping",  glow: "group-hover:shadow-blue-500/10",    accent: "from-blue-500/20 to-blue-500/5"    },
};

const SYSTEM_TYPES = [
  {
    id: "on-grid",
    icon: Sun,
    iconColor: "text-amber-500",
    bg: "bg-amber-500/10",
    border: "border-amber-500/30 hover:border-amber-500/60",
    glow: "hover:shadow-amber-500/15",
    gradient: "from-amber-500/8",
    badge: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  },
  {
    id: "off-grid",
    icon: Battery,
    iconColor: "text-emerald-500",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30 hover:border-emerald-500/60",
    glow: "hover:shadow-emerald-500/15",
    gradient: "from-emerald-500/8",
    badge: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  },
  {
    id: "hybrid",
    icon: Zap,
    iconColor: "text-purple-500",
    bg: "bg-purple-500/10",
    border: "border-purple-500/30 hover:border-purple-500/60",
    glow: "hover:shadow-purple-500/15",
    gradient: "from-purple-500/8",
    badge: "bg-purple-500/15 text-purple-600 dark:text-purple-400",
  },
  {
    id: "pumping",
    icon: Droplets,
    iconColor: "text-blue-500",
    bg: "bg-blue-500/10",
    border: "border-blue-500/30 hover:border-blue-500/60",
    glow: "hover:shadow-blue-500/15",
    gradient: "from-blue-500/8",
    badge: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  },
];

function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-border/40 bg-card overflow-hidden">
      <div className="p-6 space-y-4">
        <div className="flex justify-between">
          <div className="h-6 w-24 rounded-full bg-muted animate-pulse" />
          <div className="h-6 w-6 rounded-lg bg-muted animate-pulse" />
        </div>
        <div className="h-6 w-40 rounded-lg bg-muted animate-pulse" />
        <div className="h-4 w-28 rounded bg-muted animate-pulse" />
        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="h-16 rounded-xl bg-muted animate-pulse" />
          <div className="h-16 rounded-xl bg-muted animate-pulse" />
        </div>
      </div>
      <div className="px-6 py-4 border-t border-border/40">
        <div className="h-9 w-full rounded-lg bg-muted animate-pulse" />
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { data: projects, isLoading } = useProjects();
  const deleteMutation = useDeleteProject();
  const { toast } = useToast();
  const { lang } = useLang();
  const t = T[lang];

  const handleDelete = (id: number) => {
    deleteMutation.mutate(id, {
      onSuccess: () => toast({ title: t.delete }),
    });
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-7xl">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3 animate-fade-down">
        <div>
          <h1 className="text-3xl lg:text-4xl font-display font-bold text-foreground tracking-tight">
            {t.projectsOverview}
          </h1>
          <p className="text-muted-foreground mt-1 text-base">{t.manageSolar}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[0.9fr_1.1fr] gap-4 xl:gap-5 items-start">
        <div className="animate-fade-up">
          <h2 className="text-xl lg:text-2xl font-display font-bold text-foreground mb-3">{t.myProjects}</h2>

          {isLoading && (
            <div className="grid grid-cols-1 gap-4">
              {[1, 2].map(i => <SkeletonCard key={i} />)}
            </div>
          )}

          {!isLoading && (!projects || projects.length === 0) && (
            <div className="animate-scale-in flex flex-col items-center justify-center py-14 text-center border-2 border-dashed border-border rounded-3xl bg-card/30">
              <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-4 animate-pulse-ring">
                <Sparkles className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-display font-bold mb-2">{t.noProjectsYet}</h3>
              <p className="text-muted-foreground max-w-sm text-sm leading-relaxed">{t.noProjectsDesc}</p>
            </div>
          )}

          {!isLoading && projects && projects.length > 0 && (
            <div className="grid grid-cols-1 gap-4">
            {projects.map((project, index) => {
              const config = typeConfig[project.systemType] || typeConfig['on-grid'];
              const Icon = config.icon;

              return (
                <Card
                  key={project.id}
                  className={`glass-card flex flex-col group border-border/50 hover:border-border
                    hover:-translate-y-1.5 hover:shadow-2xl ${config.glow}
                    transition-all duration-300 ease-out`}
                  style={{ animationDelay: `${index * 80}ms` }}
                  data-animated="true"
                  data-testid={`card-project-${project.id}`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <Badge variant="outline" className={`font-medium px-3 py-1 ${config.color} transition-all`}>
                        <Icon className="w-3.5 h-3.5 mr-1.5" />
                        {config.label}
                      </Badge>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all duration-200 active:scale-90"
                            data-testid={`button-delete-${project.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="animate-scale-in">
                          <AlertDialogHeader>
                            <AlertDialogTitle>{t.deleteProject}</AlertDialogTitle>
                            <AlertDialogDescription>
                              {t.deleteConfirm} "{project.name}"? {t.deleteCannotUndo}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="transition-all active:scale-95">{t.cancel}</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(project.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-all active:scale-95"
                              data-testid={`button-confirm-delete-${project.id}`}
                            >
                              {t.delete}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>

                    <CardTitle className="text-lg mt-4 font-display line-clamp-1 group-hover:text-primary transition-colors duration-200">
                      {project.name}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {t.created} {format(new Date(project.createdAt), 'MMM d, yyyy')}
                    </p>
                  </CardHeader>

                  <CardContent className="flex-1">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      {project.results && typeof project.results === 'object' && 'systemCapacitykW' in project.results && (
                        <div className="bg-secondary/50 hover:bg-secondary/80 rounded-xl p-3 transition-colors duration-200">
                          <p className="text-muted-foreground mb-1 text-xs font-medium">{t.capacity}</p>
                          <p className="font-bold text-foreground">{(project.results as any).systemCapacitykW} kW</p>
                        </div>
                      )}
                      {project.results && typeof project.results === 'object' && 'numberOfPanels' in project.results && (
                        <div className="bg-secondary/50 hover:bg-secondary/80 rounded-xl p-3 transition-colors duration-200">
                          <p className="text-muted-foreground mb-1 text-xs font-medium">{t.panels}</p>
                          <p className="font-bold text-foreground">{(project.results as any).numberOfPanels}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>

                  <CardFooter className="pt-4 border-t border-border/50">
                    <Link href={`/project/${project.id}`} className="w-full">
                      <Button
                        variant="ghost"
                        className="w-full justify-between hover:bg-primary/8 hover:text-primary group/btn active:scale-95 transition-all duration-200"
                        data-testid={`button-view-${project.id}`}
                      >
                        {t.viewDetails}
                        <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform duration-200" />
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              );
            })}
            </div>
          )}
        </div>

        <div className="animate-fade-up xl:sticky xl:top-20">
          <h2 className="text-xl lg:text-2xl font-display font-bold text-foreground mb-3">{t.quickStartSection}</h2>
          <p className="text-muted-foreground text-sm mb-3">{t.quickStartSub}</p>
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {SYSTEM_TYPES.map((sys, idx) => {
              const Icon = sys.icon;
              const label = sys.id === 'on-grid' ? 'On-Grid'
                        : sys.id === 'off-grid' ? 'Off-Grid'
                        : sys.id === 'hybrid'   ? 'Hybrid'
                        : 'Pumping';
              const subtitle = t[sys.id === 'on-grid' ? 'onGridSubtitle'
                                : sys.id === 'off-grid' ? 'offGridSubtitle'
                                : sys.id === 'hybrid'   ? 'hybridSubtitle'
                                : 'pumpingSubtitle'];
              const desc = t[sys.id === 'on-grid' ? 'onGridDesc'
                            : sys.id === 'off-grid' ? 'offGridDesc'
                            : sys.id === 'hybrid'   ? 'hybridDesc'
                            : 'pumpingDesc'];

              return (
                <Link href={`/new?type=${sys.id}`} key={sys.id}>
                  <div
                    className={`group relative flex flex-col rounded-2xl border bg-card p-4 sm:p-5 cursor-pointer
                      transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl ${sys.glow} ${sys.border}
                      overflow-hidden`}
                    style={{ animationDelay: `${idx * 60}ms` }}
                    data-testid={`card-system-${sys.id}`}
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${sys.gradient} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                    <div className="relative">
                      <div className={`inline-flex items-center justify-center w-11 h-11 rounded-xl ${sys.bg} mb-3 transition-transform duration-300 group-hover:scale-110`}>
                        <Icon className={`w-6 h-6 ${sys.iconColor}`} />
                      </div>
                      <span className={`inline-block text-xs font-bold px-2 py-0.5 rounded-full mb-2 ${sys.badge}`}>
                        {label}
                      </span>
                      <h3 className="text-sm sm:text-base font-display font-bold text-foreground leading-tight mb-1">
                        {subtitle}
                      </h3>
                      <p className="hidden sm:block text-xs text-muted-foreground leading-relaxed line-clamp-2">
                        {desc}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
