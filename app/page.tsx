import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, FileText, AlertTriangle, ArrowRight } from 'lucide-react';
import { ModeToggle } from '@/components/mode-toggle';

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {/* ── Navigation ─────────────────────────────────── */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-2">
            <Activity className="h-6 w-6 text-primary" />
            <span className="text-lg font-bold">VitalSense AI</span>
          </div>

          <nav className="hidden md:flex gap-6">
            <Link className="text-sm font-medium hover:underline underline-offset-4" href="#features">
              Features
            </Link>
            <Link className="text-sm font-medium hover:underline underline-offset-4" href="#how-it-works">
              How It Works
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            <ModeToggle />
            <div className="hidden md:flex gap-2">
              <Button asChild>
                <Link href="/agent">Get Started</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* ── Hero Section ──────────────────────────────── */}
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-linear-to-b from-primary/5 to-background overflow-hidden">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none text-foreground">
                  Decode Your Lab Reports <br className="hidden sm:inline" />
                  <span className="text-primary">in Seconds, Not Weeks</span>
                </h1>
                <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                  Stop waiting for clarity. Our AI analyzes your lab reports instantly, flagging critical values and explaining results in plain English.
                </p>
              </div>

              <div className="flex flex-col min-[400px]:flex-row gap-4 justify-center w-full max-w-sm min-[400px]:max-w-none">
                <Button size="lg" className="h-12 px-8 w-full min-[400px]:w-auto" asChild>
                  <Link href="/login">
                    Analyze My Report <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="outline" size="lg" className="h-12 px-8 w-full min-[400px]:w-auto" asChild>
                  <Link href="#how-it-works">
                    Learn More
                  </Link>
                </Button>
              </div>

              <p className="text-xs text-muted-foreground">
                *We do not diagnose. Always consult a physician for medical advice.
              </p>
            </div>
          </div>
        </section>

        {/* ── Features Section ─────────────────────────── */}
        <section id="features" className="w-full py-12 md:py-24 lg:py-32 bg-background">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-primary/10 px-3 py-1 text-sm text-primary">
                  Key Features
                </div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Smart Analysis at Your Fingertips</h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  We turn complex medical data into actionable insights using advanced AI models.
                </p>
              </div>
            </div>

            <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 py-12 md:grid-cols-3">
              <Card className="h-full transition-shadow duration-300 hover:shadow-lg hover:shadow-primary/5">
                <CardHeader>
                  <FileText className="h-10 w-10 text-primary mb-2" />
                  <CardTitle>Instant Parsing</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Upload PDF or image files of your reports. Our agent structured unstructured data instantly.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="h-full transition-shadow duration-300 hover:shadow-lg hover:shadow-orange-500/5">
                <CardHeader>
                  <AlertTriangle className="h-10 w-10 text-orange-500 mb-2" />
                  <CardTitle>Critical Alerts</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Immediately identify critical values like K+ &gt; 6.5 or Glucose &gt; 400 that require urgent attention.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="h-full transition-shadow duration-300 hover:shadow-lg hover:shadow-green-500/5">
                <CardHeader>
                  <Activity className="h-10 w-10 text-green-500 mb-2" />
                  <CardTitle>Personalized Context</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Values are compared against reference ranges adjusted for your specific age, gender, and condition.
                  </CardDescription>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* ── How It Works Section ─────────────────────── */}
        <section id="how-it-works" className="w-full py-12 md:py-24 lg:py-32 bg-muted/50">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">How It Works</h2>
              <p className="max-w-[600px] text-muted-foreground md:text-xl">
                Three simple steps to peace of mind.
              </p>
            </div>

            <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 py-12 md:grid-cols-3">
              {[
                { step: '1', title: 'Upload Report', desc: 'Take a photo or upload a PDF of your lab results.' },
                { step: '2', title: 'AI Analysis', desc: 'Our medical agent parses and checks values against your profile.' },
                { step: '3', title: 'Get Insights', desc: "Receive a clear summary of what's normal and what needs review." },
              ].map((item) => (
                <div key={item.step} className="flex flex-col items-center space-y-2 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-xl">
                    {item.step}
                  </div>
                  <h3 className="text-xl font-bold">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA Section ──────────────────────────────── */}
        <section className="w-full py-12 md:py-24 lg:py-32 bg-primary text-primary-foreground">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl text-primary-foreground">Ready to understand your health?</h2>
              <p className="max-w-[600px] text-primary-foreground/90 md:text-xl font-medium">
                Join others who use VitalSense to take control of their medical data.
              </p>
              <Button size="lg" variant="secondary" className="h-12 px-8 font-bold" asChild>
                <Link href="/agent">
                  Start Analysis Now
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ─────────────────────────────────────── */}
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t font-light text-xs text-muted-foreground">
        <p>© 2026 VitalSense AI. All rights reserved.</p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link className="hover:underline underline-offset-4" href="#">
            Terms of Service
          </Link>
          <Link className="hover:underline underline-offset-4" href="#">
            Privacy
          </Link>
        </nav>
      </footer>
    </div>
  );
}
