import { cn } from "@/lib/utils";

interface CodeProps extends React.HTMLAttributes<HTMLPreElement> {}

export function Code({ className, children, ...props }: CodeProps) {
  return (
    <pre
      className={cn(
        "rounded-lg bg-muted p-4 overflow-x-auto text-sm",
        className
      )}
      {...props}
    >
      <code>{children}</code>
    </pre>
  );
}