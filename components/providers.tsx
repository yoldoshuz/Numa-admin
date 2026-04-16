"use client";

import { useState, type ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { createQueryClient } from "@/lib/query-client";

export const Providers = ({ children }: { children: ReactNode }) => {
  const [client] = useState(() => createQueryClient());
  return (
    <QueryClientProvider client={client}>
      <TooltipProvider delayDuration={200}>
        {children}
        <Toaster richColors position="top-right" closeButton theme="light" />
      </TooltipProvider>
    </QueryClientProvider>
  );
};
