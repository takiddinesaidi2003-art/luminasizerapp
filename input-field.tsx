import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  unit?: string;
}

export const InputField = React.forwardRef<HTMLInputElement, InputFieldProps>(
  ({ label, error, unit, className, id, ...props }, ref) => {
    const inputId = id || props.name;
    
    return (
      <div className="space-y-2">
        <Label htmlFor={inputId} className="text-sm font-medium text-foreground/80">
          {label}
        </Label>
        <div className="relative">
          <Input
            id={inputId}
            ref={ref}
            className={`transition-all duration-200 focus:ring-2 focus:ring-primary/20 ${
              unit ? "pr-12" : ""
            } ${error ? "border-destructive focus:ring-destructive/20" : ""} ${className}`}
            {...props}
          />
          {unit && (
            <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-sm text-muted-foreground pointer-events-none">
              {unit}
            </span>
          )}
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    );
  }
);
InputField.displayName = "InputField";
