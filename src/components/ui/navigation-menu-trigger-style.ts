import { cva } from "class-variance-authority";

const navigationMenuTriggerStyle = cva(
    "group inline-flex h-9 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium hover:text-accent-foreground focus:text-accent-foreground disabled:pointer-events-none disabled:opacity-50 data-[state=open]: data-[state=open]:text-accent-foreground data-[state=open]: data-[state=open]: focus-visible:ring-ring/50 outline-none transition-[color,box-shadow] focus-visible:ring-[3px] focus-visible:outline-1",
);

export { navigationMenuTriggerStyle };
