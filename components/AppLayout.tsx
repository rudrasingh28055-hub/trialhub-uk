"use client";

import { createClient } from "@/lib/supabase/client";
import { ReactNode } from "react";
import { colors, typography, borderRadius, glassPanel, gradient, pitchGrid } from "@/lib/design/tokens";

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen">
      {children}
    </div>
  );
}
