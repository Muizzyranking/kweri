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

export const FEATURES = [
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
