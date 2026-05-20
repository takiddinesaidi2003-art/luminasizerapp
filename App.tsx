import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { Navbar } from "@/components/layout/Navbar";
import Dashboard from "@/pages/Dashboard";
import ProjectWizard from "@/pages/ProjectWizard";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { LangProvider } from "@/lib/i18n";

function PageTransition({ children, pageKey }: { children: React.ReactNode; pageKey: string }) {
  return (
    <div key={pageKey} className="animate-fade-up w-full">
      {children}
    </div>
  );
}

function Router() {
  const [location] = useLocation();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 w-full relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-primary/5 to-transparent -z-10 pointer-events-none" />
        <PageTransition pageKey={location}>
          <Switch>
            <Route path="/"            component={Dashboard}     />
            <Route path="/new"         component={ProjectWizard} />
            <Route path="/project/:id" component={ProjectWizard} />
            <Route component={NotFound} />
          </Switch>
        </PageTransition>
      </main>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <LangProvider>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <Router />
            <Toaster />
          </TooltipProvider>
        </QueryClientProvider>
      </LangProvider>
    </ErrorBoundary>
  );
}

export default App;
