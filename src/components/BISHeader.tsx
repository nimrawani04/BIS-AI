import { Menu, X, Sun, Moon, LogIn, LogOut, HelpCircle, WifiOff } from 'lucide-react';
import { OfflineBanner } from '@/components/OfflineBanner';
import { LowBandwidthToggle } from '@/components/LowBandwidthToggle';
import { Button } from '@/components/ui/button';
import { useState, useRef, useEffect } from 'react';
import { useTheme } from '@/components/ThemeProvider';
import { Link, useLocation } from 'react-router-dom';
import ashokaChakra from '@/assets/ashoka-chakra.png';
import { useAuth } from '@/hooks/useAuth';
import { BISLogo } from '@/components/BISLogo';
import { useLanguage } from '@/hooks/useLanguage';
import { languageLabels, type SupportedLanguage } from '@/data/offlineKnowledgeMultilingual';

const navTranslations: Record<SupportedLanguage, Record<string, string>> = {
  en: {
    home: 'Home',
    askBis: 'Ask BIS',
    riskMap: '🗺 Risk Map',
    certGuide: 'Certification Guide',
    stdExplorer: 'Standards Explorer',
    about: 'About BIS',
    signIn: 'Sign In',
    signOut: 'Sign Out',
    lang: 'Language',
    govtIndia: 'Government of India',
    bisTitle: 'Bureau of Indian Standards — भारतीय मानक ब्यूरो',
    portalDesc: 'Official Digital Knowledge Services Portal',
  },
  hi: {
    home: 'होम',
    askBis: 'BIS से पूछें',
    riskMap: '🗺 जोखिम मानचित्र',
    certGuide: 'प्रमाणन मार्गदर्शिका',
    stdExplorer: 'मानक एक्सप्लोरर',
    about: 'BIS के बारे में',
    signIn: 'साइन इन',
    signOut: 'साइन आउट',
    lang: 'भाषा',
    govtIndia: 'भारत सरकार',
    bisTitle: 'भारतीय मानक ब्यूरो — Bureau of Indian Standards',
    portalDesc: 'आधिकारिक डिजिटल ज्ञान सेवा पोर्टल',
  }
};

const navLinks = [
  { to: '/', label: 'Home' },
  { to: '/chat', label: 'Ask BIS' },
  { to: '/risk-map', label: '🗺 Risk Map' },
  { to: '/certification', label: 'Certification Guide' },
  { to: '/standards', label: 'Standards Explorer' },
  { to: '/about', label: 'About BIS' },
];

function TricolorStrip() {
  return <div className="tricolor-strip w-full" />;
}

function GovBanner({ lang }: { lang: SupportedLanguage }) {
  return (
    <div className="w-full bg-white dark:bg-card border-b border-border/50 py-2 px-4 flex items-center gap-4">
      <img src={ashokaChakra} alt="Government of India Emblem" className="h-9 w-9 object-contain shrink-0" />
      <div className="border-l border-border pl-3">
        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">{navTranslations[lang].govtIndia}</p>
        <p className="text-xs font-bold text-primary leading-tight">{navTranslations[lang].bisTitle}</p>
        <p className="text-[11px] text-muted-foreground">{navTranslations[lang].portalDesc}</p>
      </div>
    </div>
  );
}

function UserAvatarDropdown({ user, signOut }: { user: any; signOut: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const initials = user.email
    ? user.email.substring(0, 2).toUpperCase()
    : 'U';

  return (
    <div className="relative ml-1" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold ring-2 ring-primary/20 hover:ring-primary/40 transition-all"
        aria-label="User menu"
      >
        {user.user_metadata?.avatar_url ? (
          <img src={user.user_metadata.avatar_url} alt="Avatar" className="h-9 w-9 rounded-full object-cover" />
        ) : (
          initials
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-64 rounded-xl border border-border bg-card shadow-xl z-50 overflow-hidden animate-fade-in">
          <div className="px-4 py-3 border-b border-border bg-muted/30">
            <p className="text-sm font-medium text-foreground truncate">{user.user_metadata?.full_name || 'User'}</p>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          </div>
          <div className="py-1">
            <Link
              to="/about"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-secondary/50 transition-colors"
            >
              <HelpCircle className="h-4 w-4 text-muted-foreground" />
              About BIS
            </Link>
          </div>
          <div className="border-t border-border py-1">
            <button
              onClick={() => { signOut(); setOpen(false); }}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function BISHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { language, changeLanguage } = useLanguage();

  const currentNav = navTranslations[language];

  const translatedNavLinks = [
    { to: '/', label: currentNav.home },
    { to: '/chat', label: currentNav.askBis },
    { to: '/risk-map', label: currentNav.riskMap },
    { to: '/certification', label: currentNav.certGuide },
    { to: '/standards', label: currentNav.stdExplorer },
    { to: '/about', label: currentNav.about },
  ];

  return (
    <header className="sticky top-0 z-50 w-full">
      <OfflineBanner />
      <TricolorStrip />
      <GovBanner lang={language} />
      <div className="border-b border-border/50 bg-primary">
        <div className="container flex h-[60px] items-center justify-between">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <div className="flex h-7 w-7 items-center justify-center rounded bg-white/10 border border-white/20">
              <BISLogo className="h-4 w-4" />
            </div>
            <span className="text-sm font-bold text-white hidden sm:block">BIS AI</span>
          </Link>

          <nav className="hidden md:flex items-center flex-1 ml-4 h-full">
            {translatedNavLinks.map(link => (
              <Link
                key={link.to}
                to={link.to}
                className={`px-4 h-[60px] flex items-center text-xs font-medium border-r border-white/10 transition-colors ${
                  location.pathname === link.to
                    ? 'text-white bg-white/10 border-b-2 border-white'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2 ml-auto">
            <LowBandwidthToggle />
            
            <div className="flex h-8 bg-white/10 rounded overflow-hidden mr-1">
              {(Object.keys(languageLabels) as SupportedLanguage[]).map((lang) => (
                <button
                  key={lang}
                  onClick={() => changeLanguage(lang)}
                  className={`px-2 py-0.5 text-[10px] font-bold transition-colors ${
                    language === lang 
                      ? 'bg-[hsl(var(--flag-saffron))] text-white' 
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {lang.toUpperCase()}
                </button>
              ))}
            </div>

            <button
              onClick={toggleTheme}
              className="p-1.5 rounded text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5" />}
            </button>
            {user ? (
              <UserAvatarDropdown user={user} signOut={signOut} />
            ) : (
              <Link to="/auth">
                <Button size="sm" className="h-8 text-xs bg-[hsl(var(--flag-saffron))] hover:bg-[hsl(28,100%,44%)] text-white border-0 rounded-md px-3 shadow-none">
                  <LogIn className="h-3 w-3 mr-1" /> {currentNav.signIn}
                </Button>
              </Link>
            )}
            <button
              className="md:hidden p-1.5 text-white"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-b border-border bg-white dark:bg-card shadow-lg animate-fade-in">
          <nav className="flex flex-col">
            {translatedNavLinks.map(link => (
              <Link
                key={link.to}
                to={link.to}
                className={`px-4 py-3 text-sm font-medium border-b border-border/50 transition-colors ${
                  location.pathname === link.to
                    ? 'text-primary bg-primary/5'
                    : 'text-foreground hover:bg-secondary/40'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
              <span className="text-sm font-medium text-muted-foreground">{currentNav.lang}</span>
              <div className="flex bg-muted rounded overflow-hidden">
                {(Object.keys(languageLabels) as SupportedLanguage[]).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => { changeLanguage(lang); setMobileMenuOpen(false); }}
                    className={`px-3 py-1 text-xs font-bold transition-colors ${
                      language === lang 
                        ? 'bg-primary text-white' 
                        : 'text-muted-foreground hover:bg-secondary/50'
                    }`}
                  >
                    {languageLabels[lang]}
                  </button>
                ))}
              </div>
            </div>
            <div className="p-3">
              {user ? (
                <Button size="sm" variant="outline" className="w-full rounded-md" onClick={() => { signOut(); setMobileMenuOpen(false); }}>
                  <LogOut className="h-3.5 w-3.5 mr-1" /> {currentNav.signOut}
                </Button>
              ) : (
                <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                  <Button size="sm" className="w-full rounded-md bg-[hsl(var(--flag-saffron))] text-white border-0 shadow-none">
                    <LogIn className="h-3.5 w-3.5 mr-1" /> {currentNav.signIn}
                  </Button>
                </Link>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
