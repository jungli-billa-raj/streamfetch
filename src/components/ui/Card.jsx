import { cn } from "../../lib/cn";

function Card({ as: Comp = "section", className, children, ...props }) {
  return (
    <Comp className={cn("rounded-2xl border border-app-border bg-app-card shadow-card", className)} {...props}>
      {children}
    </Comp>
  );
}

export default Card;
