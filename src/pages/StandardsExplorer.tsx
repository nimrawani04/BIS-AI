import { BISHeader } from '@/components/BISHeader';
import { Footer } from '@/components/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link } from 'react-router-dom';
import { useState, useMemo } from 'react';
import {
  Cpu, Building2, UtensilsCrossed, Shirt, FlaskConical,
  Cog, Zap, Droplets, Car, MessageSquare, Search, X, Sparkles,
  BookOpen, ChevronRight
} from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { type SupportedLanguage } from '@/data/offlineKnowledgeMultilingual';

const explorerTranslations: Record<SupportedLanguage, any> = {
  en: {
    home: 'Home',
    explorer: 'Standards Explorer',
    govt: 'Government of India',
    bis: 'Bureau of Indian Standards',
    title: 'BIS Standards Explorer',
    updated: 'Search and browse over 20,000 Indian Standards (IS)',
    desc: 'Explore technical specifications and quality benchmarks set by BIS. Select a category to find relevant standards or ask the AI assistant for specific guidance.',
    searchTitle: 'Search Standards Knowledge Base',
    placeholder: 'Search by keywords (e.g. cement, helmet, batteries, safety)...',
    results: 'Categor{0} Matching Results',
    categories: 'Technical Product Categories',
    needAsst: "Can't find the standard you're looking for?",
    asstDesc: 'Our AI assistant has access to the comprehensive BIS knowledge repository and can help you identify specific requirements.',
    askBtn: 'Ask BIS AI',
    consult: 'Consult AI for',
  },
  hi: {
    home: 'होम',
    explorer: 'मानक एक्सप्लोरर',
    govt: 'भारत सरकार',
    bis: 'भारतीय मानक ब्यूरो',
    title: 'BIS मानक एक्सप्लोरर',
    updated: '20,000 से अधिक भारतीय मानकों (IS) को खोजें और ब्राउज़ करें',
    desc: 'BIS द्वारा निर्धारित तकनीकी विशिष्टताओं और गुणवत्ता मानकों का पता लगाएं। प्रासंगिक मानक खोजने के लिए एक श्रेणी चुनें या विशिष्ट मार्गदर्शन के लिए AI सहायक से पूछें।',
    searchTitle: 'मानक ज्ञान भंडार खोजें',
    placeholder: 'कीवर्ड द्वारा खोजें (जैसे सीमेंट, हेलमेट, बैटरी, सुरक्षा)...',
    results: '{0} श्रेणियां मेल खा रही हैं',
    categories: 'तकनीकी उत्पाद श्रेणियां',
    needAsst: 'वह मानक नहीं मिल रहा जो आप खोज रहे हैं?',
    asstDesc: 'हमारे AI सहायक के पास व्यापक BIS ज्ञान भंडार तक पहुंच है और वह विशिष्ट आवश्यकताओं को पहचानने में आपकी सहायता कर सकता है।',
    askBtn: 'BIS AI से पूछें',
    consult: 'AI से परामर्श करें',
  }
};

const categories = [
  {
    name: 'Electronics & IT',
    icon: Cpu,
    count: '500+',
    description: 'Standards for electronic devices, IT equipment, batteries, and telecom products. Includes CRS requirements.',
    examples: ['IS 616 - Audio equipment', 'IS 13252 - IT equipment safety', 'IS 1293 - Batteries'],
    query: 'What BIS standards apply to electronics and IT products?',
  },
  {
    name: 'Construction & Building',
    icon: Building2,
    count: '800+',
    description: 'Standards for cement, steel, bricks, pipes, and building materials for safe construction.',
    examples: ['IS 269 - Ordinary Portland Cement', 'IS 1786 - Steel bars', 'IS 2062 - Structural steel'],
    query: 'What BIS standards apply to construction and building materials?',
  },
  {
    name: 'Food Safety',
    icon: UtensilsCrossed,
    count: '400+',
    description: 'Standards for food products, packaging, and safety including drinking water.',
    examples: ['IS 10500 - Drinking water', 'IS 7466 - Packaged food', 'IS 4162 - Edible oil'],
    query: 'What are BIS food safety standards?',
  },
  {
    name: 'Textiles',
    icon: Shirt,
    count: '300+',
    description: 'Standards for fabrics, garments, and textile products ensuring quality and safety.',
    examples: ['IS 1390 - Cotton fabrics', 'IS 3871 - Handloom products', 'IS 7064 - Wool products'],
    query: 'What BIS standards apply to textiles and garments?',
  },
  {
    name: 'Chemical',
    icon: FlaskConical,
    count: '350+',
    description: 'Standards for chemicals, pesticides, fertilizers, and related products.',
    examples: ['IS 4707 - Paints', 'IS 5182 - Air quality', 'IS 10500 - Water quality'],
    query: 'What BIS standards apply to chemical products?',
  },
  {
    name: 'Mechanical Engineering',
    icon: Cog,
    count: '600+',
    description: 'Standards for machinery, tools, fasteners, and mechanical components.',
    examples: ['IS 2062 - Steel products', 'IS 1367 - Fasteners', 'IS 5765 - LPG cylinders'],
    query: 'What BIS standards apply to mechanical engineering products?',
  },
  {
    name: 'Electrical',
    icon: Zap,
    count: '450+',
    description: 'Standards for electrical equipment, wiring, switches, and safety devices.',
    examples: ['IS 694 - PVC cables', 'IS 3854 - Switches', 'IS 1293 - Batteries'],
    query: 'What BIS standards apply to electrical equipment?',
  },
  {
    name: 'Water Resources',
    icon: Droplets,
    count: '200+',
    description: 'Standards related to water supply, irrigation, and water quality management.',
    examples: ['IS 10500 - Drinking water', 'IS 4984 - HDPE pipes', 'IS 12235 - Water meters'],
    query: 'What BIS standards apply to water resources and quality?',
  },
  {
    name: 'Transport',
    icon: Car,
    count: '250+',
    description: 'Standards for vehicles, helmets, automotive parts, and transportation safety.',
    examples: ['IS 4151 - Helmets', 'IS 14164 - Seat belts', 'IS 2553 - Automotive glass'],
    query: 'What BIS standards apply to transport and vehicles?',
  },
];

export default function StandardsExplorer() {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const { language } = useLanguage();
  const t = explorerTranslations[language];

  const filtered = useMemo(() => {
    if (!search.trim()) return categories;
    const q = search.toLowerCase();
    return categories.filter(
      cat =>
        cat.name.toLowerCase().includes(q) ||
        cat.description.toLowerCase().includes(q) ||
        cat.examples.some(ex => ex.toLowerCase().includes(q))
    );
  }, [search]);

  return (
    <div className="min-h-screen bg-background">
      <BISHeader />
      <main>
        {/* Official Breadcrumbs */}
        <div className="max-w-7xl mx-auto px-4 py-3 text-[11px] text-muted-foreground">
          <Link to="/" className="hover:text-primary transition-colors">{t.home}</Link> &gt; {t.explorer}
        </div>

        {/* Hero Section matching BISHome */}
        <section className="px-4 py-6 bg-background">
          <div className="max-w-5xl mx-auto space-y-3">
            <div className="text-[11px] text-muted-foreground uppercase tracking-[1px]">
              <div>{t.govt}</div>
              <div>{t.bis}</div>
              <div>{t.explorer}</div>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              {t.title}
            </h1>
            <div className="text-[11px] text-muted-foreground">
              {t.updated}
            </div>
            <p className="text-sm sm:text-base text-muted-foreground max-w-3xl leading-relaxed">
              {t.desc}
            </p>
          </div>
        </section>

        <div className="max-w-5xl mx-auto px-4 pb-12">
          {/* Search bar */}
          <div className="mb-10 p-6 bg-white dark:bg-card border border-border rounded-[4px] shadow-sm">
            <h2 className="text-xs font-bold uppercase tracking-wider text-primary mb-4 flex items-center gap-2">
              <Search className="h-4 w-4" />
              {t.searchTitle}
            </h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                value={search} 
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t.placeholder}
                className="pl-10 pr-10 h-12 text-sm rounded-[4px] border-border focus-visible:ring-primary/20 shadow-none" 
              />
              {search && (
                <button 
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            {search && (
              <p className="text-[11px] text-muted-foreground mt-3 font-medium uppercase tracking-tight">
                {t.results.replace('{0}', filtered.length)}
              </p>
            )}
          </div>

          <div className="gov-section-header mb-6">
            <h2 className="text-lg font-bold text-foreground">{t.categories}</h2>
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-16 animate-fade-in">
              <Search className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground">No categories match "{search}"</p>
              <Button variant="ghost" size="sm" onClick={() => setSearch('')} className="mt-2">Clear search</Button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((cat) => {
                const isOpen = expanded === cat.name;
                return (
                  <Card key={cat.name}
                    className={`cursor-pointer transition-all hover:shadow-md animate-fade-in ${isOpen ? 'ring-2 ring-primary' : ''}`}
                    onClick={() => setExpanded(isOpen ? null : cat.name)}>
                    <CardContent className="p-5">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <cat.icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold text-foreground">{cat.name}</h3>
                          <Badge variant="secondary" className="text-[10px] mt-1">{cat.count} standards</Badge>
                        </div>
                      </div>
                      <p className="text-muted-foreground text-xs mb-2">{cat.description}</p>
                      {isOpen && (
                        <div className="mt-3 pt-3 border-t border-border animate-fade-in">
                          <p className="text-xs font-medium text-foreground mb-2">Example Standards:</p>
                          <ul className="space-y-1">
                            {cat.examples.map((ex) => (
                              <li key={ex} className="text-xs text-muted-foreground">• {ex}</li>
                            ))}
                          </ul>
                          <Link to={`/chat?q=${encodeURIComponent(cat.query)}`} onClick={(e) => e.stopPropagation()}>
                            <Button size="sm" className="w-full text-[10px] font-bold uppercase tracking-wider gap-2 bg-primary hover:bg-primary/90 text-white rounded-[4px] h-9">
                              <Sparkles className="h-3 w-3" />
                              {t.consult} {cat.name}
                            </Button>
                          </Link>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Assistant CTA */}
          <div className="mt-12 p-6 border border-border border-l-4 border-l-primary bg-white dark:bg-card rounded-[4px] flex flex-col md:flex-row items-center gap-6 animate-fade-in">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <MessageSquare className="h-7 w-7" />
            </div>
            <div className="flex-1 text-center md:text-left">
              <h3 className="text-lg font-bold text-foreground">{t.needAsst}</h3>
              <p className="text-sm text-muted-foreground mt-1">{t.asstDesc}</p>
            </div>
            <Link to="/chat">
              <Button className="rounded-[4px] h-11 px-6 bg-primary hover:bg-primary/90 text-[10px] font-bold uppercase tracking-widest text-white shrink-0">
                {t.askBtn}
              </Button>
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
