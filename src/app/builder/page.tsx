import { FirstVisitGate } from "@/components/ui/first-visit-gate";

export default function BuilderPage() {
  return (
    <FirstVisitGate>
      <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "var(--color-secondary)", fontFamily: "var(--font-body)" }}>
          Builder — coming soon
        </p>
      </main>
    </FirstVisitGate>
  );
}
