"use client";

import type { ReactNode } from "react";
import { colors, typography, styles, borderRadius } from "../../lib/design/tokens";

type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  centered?: boolean;
};

export default function PageHeader({
  eyebrow,
  title,
  subtitle,
  actions,
  centered = false,
}: PageHeaderProps) {
  return (
    <div className={`relative mb-12 ${centered ? 'text-center' : ''}`}>
      <div className={`flex flex-col gap-6 lg:flex-row lg:items-center ${centered ? 'lg:justify-center' : 'lg:justify-between'}`}>
        <div className={centered ? 'mx-auto' : ''}>
          {eyebrow && (
            <div className="inline-flex items-center gap-2 mb-4">
              <div 
                className="h-2 w-2 rounded-full animate-pulse" 
                style={{ backgroundColor: colors.accent }} 
              />
              <span 
                className="text-xs font-bold uppercase tracking-[0.2em]"
                style={{ 
                  ...styles.displayHeader,
                  color: colors.accent
                }}
              >
                {eyebrow}
              </span>
            </div>
          )}
          <h1 
            className="text-4xl font-black tracking-[-0.03em] md:text-5xl"
            style={{ 
              ...styles.displayHeader,
              color: colors.white
            }}
          >
            {title}
          </h1>
          {subtitle && (
            <p 
              className="mt-4 text-lg leading-8 font-light"
              style={{ 
                fontFamily: typography.body,
                color: colors.muted
              }}
            >
              {subtitle}
            </p>
          )}
        </div>

        {actions && (
          <div className="flex items-center gap-4">{actions}</div>
        )}
      </div>
    </div>
  );
}
