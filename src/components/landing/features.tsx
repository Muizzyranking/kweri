import {
  Download,
  Eye,
  GitBranch,
  GripVertical,
  History,
  Layers,
  ShieldCheck,
  Zap,
} from "lucide-react";
import "./landing.css";

const FEATURES = [
  {
    icon: GitBranch,
    title: "Unlimited nesting",
    desc: "AND/OR groups inside groups, to any depth. No complexity limit.",
    accent: "orange",
  },
  {
    icon: Eye,
    title: "Live query preview",
    desc: "Switch between SQL, MongoDB, and GraphQL output in real time.",
    accent: "teal",
  },
  {
    icon: Layers,
    title: "Schema-driven UI",
    desc: "Fields, operators, inputs adapt to your schema — dates, enums, numbers.",
    accent: "orange",
  },
  {
    icon: Zap,
    title: "Query execution",
    desc: "Run against mock datasets instantly. See results, counts, pagination.",
    accent: "teal",
  },
  {
    icon: GripVertical,
    title: "Drag & drop",
    desc: "Rearrange conditions and groups by dragging. Keyboard shortcuts included.",
    accent: "orange",
  },
  {
    icon: History,
    title: "Query history",
    desc: "Every query is saved automatically. Revisit, restore, or fork any past query.",
    accent: "teal",
  },
  {
    icon: Download,
    title: "Export & import",
    desc: "Export as JSON, import it back, share with your team.",
    accent: "orange",
  },
  {
    icon: ShieldCheck,
    title: "Validation engine",
    desc: "Invalid operators blocked. Empty groups flagged. Malformed queries prevented.",
    accent: "teal",
  },
];

export function Features() {
  return (
    <section className="section" id="features">
      <div className="section__inner">
        <div className="section__header">
          <div className="section__eyebrow section__eyebrow--teal">
            Features
          </div>
          <h2 className="section__title">
            Everything you need.
            <br />
            <span>Nothing you don&apos;t.</span>
          </h2>
        </div>

        <div className="features-grid">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.title} className="feature-card">
                <div
                  className={`feature-card__icon feature-card__icon--${f.accent}`}
                >
                  <Icon
                    size={17}
                    color={
                      f.accent === "orange"
                        ? "var(--color-orange)"
                        : "var(--color-teal-bright)"
                    }
                  />
                </div>
                <div className="feature-card__title">{f.title}</div>
                <div className="feature-card__desc">{f.desc}</div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
