import { Link, useLocation } from "wouter";
import { Sun, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLang, T, type Lang } from "@/lib/i18n";

const LANG_OPTIONS: { value: Lang; label: string; flag: string }[] = [
  { value: "ar", label: "العربية", flag: "🇩🇿" },
  { value: "en", label: "English",  flag: "🇬🇧" },
];

export function Navbar() {
  const [location] = useLocation();
  const { lang, setLang } = useLang();
  const t = T[lang];
  const isHome = location === "/";
  const current = LANG_OPTIONS.find(o => o.value === lang) ?? LANG_OPTIONS[0];

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto max-w-7xl flex h-14 sm:h-16 items-center px-3 sm:px-4 justify-between gap-2">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group shrink-0">
          <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-primary to-accent shadow-lg shadow-primary/25 group-hover:shadow-primary/40 group-hover:scale-105 active:scale-95 transition-all duration-200">
            <Sun className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
          </div>
          <span className="font-display text-lg sm:text-xl font-bold tracking-tight group-hover:text-primary transition-colors duration-200 hidden sm:block">
            LuminaSizer
          </span>
        </Link>

        {/* Nav links */}
        <div className="flex items-center gap-1 shrink-0">

          {/* Language selector */}
          <div className="relative group mr-1">
            <button
              type="button"
              data-testid="btn-lang-selector"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border/60 bg-muted/40 hover:bg-muted/70 text-sm font-medium transition-all"
            >
              <span>{current.flag}</span>
              <span className="hidden sm:inline text-xs">{current.label}</span>
              <span className="text-muted-foreground text-[10px]">▾</span>
            </button>
            {/* Dropdown */}
            <div className="absolute top-full right-0 mt-1 py-1 min-w-[130px] bg-background border border-border rounded-xl shadow-xl z-[200] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150">
              {LANG_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setLang(opt.value)}
                  data-testid={`btn-lang-${opt.value}`}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted/60 transition-colors
                    ${lang === opt.value ? "text-primary font-semibold" : "text-foreground"}`}
                >
                  <span>{opt.flag}</span>
                  <span>{opt.label}</span>
                  {lang === opt.value && <span className="ml-auto text-primary text-xs">✓</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Projects */}
          <Link href="/">
            <Button
              variant="ghost"
              size="sm"
              data-testid="nav-projects"
              className={`relative font-medium transition-all duration-200 active:scale-95 px-2.5 sm:px-4
                ${isHome ? "text-primary bg-primary/8" : "text-muted-foreground hover:text-foreground hover:bg-muted/60"}
              `}
            >
              <LayoutGrid className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">{t.projects}</span>
              {isHome && (
                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-primary rounded-full animate-scale-in" />
              )}
            </Button>
          </Link>

        </div>
      </div>
    </nav>
  );
}
