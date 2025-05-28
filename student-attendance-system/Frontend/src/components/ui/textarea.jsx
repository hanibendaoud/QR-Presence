import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({
  className,
  ...props
}) {
  return (
    <textarea
  data-slot="textarea"
  className={cn(
    "border border-gray-300 placeholder:text-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-400 transition-[border-color,box-shadow] duration-200 ease-in-out",
    "flex field-sizing-content min-h-16 w-full rounded-md px-3 py-2 text-base shadow-xs outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
    className
  )}
  {...props}
/>

  );
}

export { Textarea }
