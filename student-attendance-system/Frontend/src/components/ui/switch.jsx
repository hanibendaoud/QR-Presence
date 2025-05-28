import * as React from "react"
import * as SwitchPrimitive from "@radix-ui/react-switch"

import { cn } from "@/lib/utils"

function Switch({
  className,
  ...props
}) {
  return (
<SwitchPrimitive.Root
  data-slot="switch"
  className={cn(
    "peer data-[state=checked]:bg-[#1E40AF] data-[state=unchecked]:bg-gray-300 focus-visible:border-[#1A237E] focus-visible:ring-[#1A237E]/50 dark:data-[state=unchecked]:bg-gray-500 inline-flex h-[1.15rem] w-8 shrink-0 items-center rounded-full border border-transparent shadow-xs transition-all outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50",
    className
  )}
  {...props}
>
  <SwitchPrimitive.Thumb
    data-slot="switch-thumb"
    className={cn(
      "bg-white dark:data-[state=unchecked]:bg-gray-200 dark:data-[state=checked]:bg-white pointer-events-none block size-4 rounded-full ring-0 transition-transform data-[state=checked]:translate-x-[calc(100%-2px)] data-[state=unchecked]:translate-x-0"
    )}
  />
</SwitchPrimitive.Root>

  );
}

export { Switch }
