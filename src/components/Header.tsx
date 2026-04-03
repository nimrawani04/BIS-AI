import { Menu, X, Sun, Moon, Phone, Mail, Globe } from 'lucide-react';
import { OfflineBanner } from '@/components/OfflineBanner';
import { LowBandwidthToggle } from '@/components/LowBandwidthToggle';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { useTheme } from '@/components/ThemeProvider';
import ashokaChakra from '@/assets/ashoka-chakra.png';
import { BISLogo } from '@/components/BISLogo';

function TricolorStrip() {
  return <div className="tricolor-strip w-full" />;
}

// Top utility bar — like NIC portals
function GovUtilityBar() {
  return (
    <div className="w-full bg-[hsl(var(--flag-navy))] text-white/80 text-[10px] py-1 px-4 hidden sm:flex items-center justify-between">
      <div className="flex items-center gap-4">
        <span className="flex items-center gap-1"><Phone className="h-2.5 w-2.5" /> 1800-11-4000 (Toll Free)</span>
        <span className="flex items-center gap-1"><Mail className="h-2.5 w-2.5" /> info@bis.gov.in</span>
      </div>
      <div className="flex items-center gap-3">
        <a href="https://www.bis.gov.in" target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-white transition-colors">
          <Globe className="h-2.5 w-2.5" /> bis.gov.in
        </a>
        <span className="opacity-40">|</span>
        <span>Skip to Main Content</span>
        <span className="opacity-40">|</span>
        <span>Screen Reader Access</span>
      </div>
    </div>
  );
}

// Main GoI identity banner
function GovBanner() {
  return (
    <div className="w-full bg-white dark:bg-card border-b-2 border-primary/20 py-2 px-4">
      <div className="max-w-7xl mx-auto flex items-center gap-4">
        {/* Emblem */}
        <div className="flex items-center gap-3 shrink-0">
          <img
            src={ashokaChakra}
            alt="Government of India Emblem"
            className="h-10 w-10 sm:h-12 sm:w-12 object-contain"
          />
          <div className="hidden sm:block border-l border-border pl-3">
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">Government of India</p>
            <p className="text-[10px] text-muted-foreground">Ministry of Consumer Affairs, Food &amp; Public Distribution</p>
          </div>
        </div>

        {/* Portal identity */}
        <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
          <div>
            <h1 className="text-base sm:text-lg font-bold text-primary leading-tight" style={{ fontFamily: "'Noto Sans', sans-serif" }}>
              Bureau of Indian Standards
            </h1>
            <p className="text-[10px] sm:text-xs text-muted-foreground font-medium tracking-wide">
              भारतीय मानक ब्यूरो &nbsp;|&nbsp; BIS AI Consumer Safety Portal
            </p>
          </div>
        </div>

        {/* BIS logo badge */}
        <div className="shrink-0 flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded bg-primary/5 border border-primary/20">
            <BISLogo className="h-6 w-6" />
          </div>
          <div className="hidden md:block text-right">
            <p className="text-xs font-bold text-primary">BIS AI</p>
            <p className="text-[10px] text-muted-foreground">Product Safety</p>
          </div>
        </div>
      </div>
    </div>
  );
}

const navLinks = [
  { href: '#alerts', label: 'Safety Alerts' },
  { href: '#verify', label: 'Verify Product' },
  { href: '#safety-assistant', label: 'AI Guide' },
  { href: '#scanner', label: 'Home Scanner' },
  { href: '#riskmap', label: 'Risk Map' },
  { href: '#knowledge', label: 'Knowledge Hub' },
];

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-50 w-full">
      <OfflineBanner />
      <TricolorStrip />
      <GovUtilityBar />
      <GovBanner />

      {/* Navigation bar */}
      <nav className="w-full bg-primary border-b border-primary/80">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-10">
          {/* Desktop nav */}
          <div className="hidden md:flex items-center">
            {navLinks.map((link, i) => (
              <a
                key={link.href}
                href={link.href}
                className={`px-4 h-10 flex items-center text-xs font-medium text-white/85 hover:text-white hover:bg-white/10 transition-colors border-r border-white/10 ${i === 0 ? 'border-l border-white/10' : ''}`}
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <LowBandwidthToggle />
            <button
              onClick={toggleTheme}
              className="p-1.5 rounded text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5" />}
            </button>
            <a href="#report">
              <Button size="sm" className="h-7 text-xs bg-[hsl(var(--flag-saffron))] hover:bg-[hsl(var(--flag-saffron))/90] text-white border-0 rounded-sm px-3">
                Report Unsafe
              </Button>
            </a>
            <button
              className="md:hidden p-1.5 text-white"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </nav>

      {mobileMenuOpen && (
        <div className="md:hidden border-b border-border bg-white dark:bg-card shadow-lg animate-fade-in">
          <nav className="flex flex-col">
            {navLinks.map(link => (
              <a
                key={link.href}
                href={link.href}
                className="px-4 py-3 text-sm font-medium text-foreground hover:bg-primary/5 border-b border-border/50 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <div className="p-3">
              <a href="#report" onClick={() => setMobileMenuOpen(false)}>
                <Button size="sm" className="w-full bg-[hsl(var(--flag-saffron))] hover:bg-[hsl(var(--flag-saffron))/90] text-white rounded-sm">
                  Report Unsafe Product
                </Button>
              </a>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
