import { BuilderCanvas } from "@/components/builder/builder-canvas";
import { FirstVisitGate } from "@/components/ui/first-visit-gate";

export default function BuilderPage() {
  return (
    <FirstVisitGate>
      <BuilderCanvas />
    </FirstVisitGate>
  );
}
