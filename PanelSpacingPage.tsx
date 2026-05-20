import { Ruler } from "lucide-react";
import { PanelSpacingTool } from "@/components/PanelSpacingTool";

export default function PanelSpacingPage() {
  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-5xl">
      {/* Header */}
      <div className="mb-8 animate-fade-down">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 rounded-xl bg-violet-500/10 text-violet-500">
            <Ruler className="w-6 h-6" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold">التباعد بين الألواح</h1>
        </div>
        <p className="text-muted-foreground text-sm ml-14">
          احسب المسافة الدنيا بين صفوف الألواح الشمسية وشاهد تأثير التظليل ثلاثي الأبعاد
        </p>
      </div>

      <PanelSpacingTool />
    </div>
  );
}
