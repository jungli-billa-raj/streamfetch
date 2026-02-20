import { cn } from "../../lib/cn";

function Input({ as = "input", label, className, inputClassName, children, ...props }) {
  const Comp = as;
  const isSelect = as === "select";

  return (
    <label className={cn("flex flex-col gap-2", className)}>
      {label && <span className="text-xs font-medium uppercase tracking-wide text-app-muted">{label}</span>}
      <Comp
        className={cn(
          "h-12 w-full rounded-2xl border border-app-border bg-app-card px-4 text-sm text-app-text outline-none transition-all duration-200 ease-out placeholder:text-app-muted focus:border-app-accent focus:ring-4 focus:ring-app-accent/10",
          isSelect && "pr-8",
          inputClassName
        )}
        {...props}
      >
        {children}
      </Comp>
    </label>
  );
}

export default Input;
