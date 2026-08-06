import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Activity, ArrowRight, FileText, MessageSquare } from 'lucide-react';
import { ModeToggle } from '@/components/mode-toggle';

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {/* Navigation */}
      <header className="flex h-16 items-center justify-between border-b px-6">
        <div className="flex items-center gap-2">
          <Activity className="h-6 w-6 text-primary" />
          <span className="text-lg font-bold">VitalSense AI</span>
        </div>
        <div className="flex items-center gap-4">
          <ModeToggle />
          <Button asChild size="sm">
            <Link href="/chat">Go to Dashboard</Link>
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-3xl mx-auto space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            VitalSense AI Lab Report Analysis
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Upload your medical lab reports to automatically parse lab values, check reference ranges, answer follow-up questions, and chat with your health assistant.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center max-w-md">
          <Button size="lg" className="gap-2" asChild>
            <Link href="/chat">
              <FileText className="h-4 w-4" /> Start Analysis <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full text-left pt-6">
          <div className="p-4 border rounded-lg bg-card">
            <FileText className="h-5 w-5 text-primary mb-2" />
            <h3 className="font-semibold text-sm">Lab Report Parsing</h3>
            <p className="text-xs text-muted-foreground mt-1">Upload PDF or images to extract lab values and compare with clinical reference ranges.</p>
          </div>
          <div className="p-4 border rounded-lg bg-card">
            <MessageSquare className="h-5 w-5 text-primary mb-2" />
            <h3 className="font-semibold text-sm">AI Health Q&A</h3>
            <p className="text-xs text-muted-foreground mt-1">Ask questions about your report and receive instant, guarded medical explanations.</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-muted-foreground border-t">
        <p>© 2026 VitalSense AI. Non-diagnostic policy — Consult a physician for medical advice.</p>
      </footer>
    </div>
  );
}

