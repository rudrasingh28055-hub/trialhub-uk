"use client";

import type { ReactNode } from "react";

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
    <div className={`relative mb-12 rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl p-8 shadow-2xl ${centered ? 'text-center' : ''}`}>
      <div className={`relative flex flex-col gap-6 lg:flex-row lg:items-center ${centered ? 'lg:justify-center' : 'lg:justify-between'}`}>
        <div className={centered ? 'mx-auto' : ''}>
          {eyebrow && (
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-400/20 bg-gradient-to-r from-sky-500/10 to-blue-500/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-sky-300 shadow-lg backdrop-blur-sm">
              <div className="h-2 w-2 rounded-full bg-sky-400 animate-pulse" />
              {eyebrow}
            </div>
          )}
          <h1 className="mt-4 text-4xl font-black tracking-[-0.03em] text-white md:text-5xl">
            <span className="bg-gradient-to-r from-white to-sky-100 bg-clip-text text-transparent">
              {title}
            </span>
          </h1>
          {subtitle && (
            <p className="mt-4 text-lg leading-8 text-slate-300 font-light">{subtitle}</p>
          )}
        </div>

        {actions && (
          <div className="flex items-center gap-4">{actions}</div>
        )}
      </div>
    </div>
  );
}

