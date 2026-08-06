'use client';

import React from 'react';
import { Bot, Sparkles, FileText, Activity, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ThreadWelcomeProps {
  onSelectPrompt: (promptText: string) => void;
}

export function ThreadWelcome({ onSelectPrompt }: ThreadWelcomeProps) {
  const suggestions = [
    {
      title: "Upload Lab Report",
      description: "Upload a PDF or image of your CBC or Lipid panel",
      icon: FileText,
      prompt: "I want to upload my lab report for analysis."
    },
    {
      title: "Check Reference Ranges",
      description: "Understand normal ranges for Potassium or Hemoglobin",
      icon: Activity,
      prompt: "What are the normal reference ranges for Potassium and Hemoglobin?"
    },
    {
      title: "Safety & Privacy Policy",
      description: "Review clinical AI guardrails and non-diagnostic policy",
      icon: ShieldCheck,
      prompt: "How does VitalSense AI protect my medical data and privacy?"
    }
  ];

  return (
    <div className="my-auto flex flex-col items-center justify-center text-center p-6 space-y-6 max-w-2xl mx-auto">
      <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-sm border">
        <Bot size={32} />
      </div>

      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          Welcome to VitalSense AI
        </h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Your assistant for analyzing medical lab reports, checking reference ranges, and answering general health questions.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full pt-4">
        {suggestions.map((item, idx) => {
          const Icon = item.icon;
          return (
            <button
              key={idx}
              type="button"
              onClick={() => onSelectPrompt(item.prompt)}
              className="flex flex-col text-left p-4 rounded-xl border bg-card hover:bg-muted/40 hover:border-primary/40 transition-all duration-200 shadow-xs group cursor-pointer"
            >
              <div className="flex items-center gap-2 text-primary font-semibold text-xs mb-1.5">
                <Icon size={16} className="shrink-0 group-hover:scale-110 transition-transform" />
                <span>{item.title}</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
                {item.description}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
