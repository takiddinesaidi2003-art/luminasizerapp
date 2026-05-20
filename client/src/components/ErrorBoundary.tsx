import { Component, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error("[ErrorBoundary] caught:", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="min-h-screen flex items-center justify-center p-8">
          <div className="max-w-md w-full text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-2">حدث خطأ غير متوقع</h2>
              <p className="text-muted-foreground text-sm mb-1">
                {this.state.error?.message || "خطأ غير معروف"}
              </p>
              <p className="text-muted-foreground text-xs">
                يمكنك تحديث الصفحة والمحاولة مجدداً
              </p>
            </div>
            <div className="flex gap-3 justify-center">
              <Button onClick={() => window.location.reload()} className="gap-2">
                <RefreshCw className="w-4 h-4" />
                تحديث الصفحة
              </Button>
              <Button variant="outline" onClick={() => this.setState({ hasError: false, error: null })}>
                حاول مجدداً
              </Button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
