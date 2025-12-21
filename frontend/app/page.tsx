import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Zap, Globe, Lock, ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-zinc-950">
      {/* Navigation */}
      <header className="px-6 lg:px-8 h-16 flex items-center border-b border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-950/50 backdrop-blur-md sticky top-0 z-50">
        <div className="flex w-full items-center justify-between max-w-7xl mx-auto">
          <div className="font-bold text-xl tracking-tight">Leavey</div>
          <nav className="hidden md:flex gap-6 text-sm font-medium text-zinc-600 dark:text-zinc-400">
            <Link href="#features" className="hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors">Features</Link>
            <Link href="#pricing" className="hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors">Pricing</Link>
            <Link href="#enterprise" className="hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors">Enterprise</Link>
          </nav>
          <div className="flex gap-4">
            <Link href="/sign-in">
              <Button variant="ghost" size="sm">Log In</Button>
            </Link>
            <Link href="/sign-up">
              <Button size="sm">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="relative px-6 lg:px-8 pt-24 pb-32 overflow-hidden">
          <div className="mx-auto max-w-7xl text-center z-10 relative">
            <h1 className="mb-6 text-5xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-7xl lg:leading-[1.1]">
              Enterprise-Grade <br />
              <span className="text-blue-600 dark:text-blue-400">Leave Management</span>
            </h1>
            <p className="mx-auto mb-10 max-w-2xl text-lg text-zinc-600 dark:text-zinc-400 sm:text-xl leading-relaxed">
              Empower your global workforce with a unified platform for time-off management.
              Compliant, secure, and designed for scale.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link href="/sign-in">
                <Button size="lg" className="h-12 px-8 text-base rounded-full shadow-lg hover:shadow-xl transition-all">
                  Start Free Trial <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="#">
                <Button size="lg" variant="outline" className="h-12 px-8 text-base rounded-full">
                  Book a Demo
                </Button>
              </Link>
            </div>

            <div className="mt-16 pt-8 border-t border-zinc-200 dark:border-zinc-800">
              <p className="text-sm font-medium text-zinc-500 mb-6 uppercase tracking-wider">Trusted by industry leaders</p>
              <div className="flex flex-wrap justify-center gap-8 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
                <span className="text-xl font-bold flex items-center gap-2">ACME <span className="font-light">Corp</span></span>
                <span className="text-xl font-bold flex items-center gap-2">Global<span className="font-light">Tech</span></span>
                <span className="text-xl font-bold flex items-center gap-2">Nebula<span className="font-light">Systems</span></span>
                <span className="text-xl font-bold flex items-center gap-2">Vertex<span className="font-light">Dynamics</span></span>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Grid */}
        <section id="features" className="px-6 lg:px-8 py-24 bg-zinc-50 dark:bg-zinc-900/50">
          <div className="mx-auto max-w-7xl">
            <div className="mb-16 text-center">
              <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl">
                Built for the Modern Enterprise
              </h2>
              <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">Everything you need to manage your team&apos;s time off, without the headache.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <FeatureCard
                icon={<Globe className="h-6 w-6 text-blue-500" />}
                title="Global Compliance"
                description="Automatically adhere to local labor laws and holiday calendars across 150+ countries."
              />
              <FeatureCard
                icon={<Zap className="h-6 w-6 text-amber-500" />}
                title="Real-time Analytics"
                description="Gain instant insights into team availability, burnout risk, and carry-over balances."
              />
              <FeatureCard
                icon={<Lock className="h-6 w-6 text-emerald-500" />}
                title="Bank-Grade Security"
                description="SOC2 Type II certified. SSO, audit logs, and role-based access control included."
              />
              <FeatureCard
                icon={<ShieldCheck className="h-6 w-6 text-indigo-500" />}
                title="Seamless Integrations"
                description="Connect with Slack, MS Teams, HRIS, and Calendar apps in seconds."
              />
            </div>
          </div>
        </section>
      </main>

      <footer className="py-12 px-6 border-t border-zinc-200 dark:border-zinc-800 text-center text-zinc-500 text-sm">
        <p>&copy; {new Date().getFullYear()} Leavey Inc. All rights reserved.</p>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-shadow">
      <div className="mb-4 inline-flex items-center justify-center h-12 w-12 rounded-lg bg-zinc-100 dark:bg-zinc-900">
        {icon}
      </div>
      <h3 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50">{title}</h3>
      <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">{description}</p>
    </div>
  )
}
