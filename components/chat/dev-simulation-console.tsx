'use client';

import React from 'react';

interface DevSimulationConsoleProps {
  simulation: string;
  setSimulation: (value: string) => void;
}

const SIMULATION_OPTIONS = [
  { label: 'Normal', value: 'none' },
  { label: 'Offline', value: 'offline' },
  { label: 'Slow Network (18s)', value: 'slow-response' },
  { label: 'Timeout (40s)', value: 'timeout' },
  { label: 'Rate Limit (429)', value: 'rate-limit' },
  { label: 'Server Error (500)', value: 'server' },
];

export function DevSimulationConsole({ simulation, setSimulation }: DevSimulationConsoleProps) {
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="px-4 pb-2 bg-background border-t">
      <div className="mx-auto max-w-3xl p-3 bg-muted/40 border rounded-lg text-xs flex flex-col gap-2">
        <div className="flex items-center justify-between font-semibold text-muted-foreground uppercase tracking-wider text-[10px]">
          <span>Simulation Console</span>
          <span className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded text-center leading-none">DEV ONLY</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {SIMULATION_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setSimulation(opt.value)}
              className={`px-2.5 py-1 rounded transition-colors border font-medium cursor-pointer ${
                simulation === opt.value
                  ? 'bg-primary text-primary-foreground border-primary shadow-sm hover:bg-primary/90'
                  : 'bg-background hover:bg-muted text-muted-foreground border-border'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
