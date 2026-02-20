import { cn } from "../../lib/cn";

const VARIANT_CLASSES = {
  info: "border-blue-100 bg-blue-50 text-app-accent",
  success: "border-emerald-100 bg-emerald-50 text-emerald-600",
  warning: "border-amber-100 bg-amber-50 text-amber-700",
  error: "border-red-100 bg-red-50 text-red-600",
  muted: "border-slate-200 bg-slate-50 text-app-muted"
};

function Badge({ variant = "muted", className, children }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium leading-none",
        VARIANT_CLASSES[variant] || VARIANT_CLASSES.muted,
        className
      )}
    >
      {children}
    </span>
  );
}

export default Badge;
