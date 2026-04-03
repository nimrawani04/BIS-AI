import { useState } from 'react';
import { BISHeader } from '@/components/BISHeader';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link, useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';

export default function BISHome() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    navigate(`/chat?q=${encodeURIComponent(q)}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <BISHeader />
      <main>
        <div className="max-w-7xl mx-auto px-4 py-3 text-xs text-muted-foreground">
          Home &gt; BIS AI
        </div>

        <section className="px-4 py-6 bg-background">
          <div className="max-w-5xl mx-auto space-y-3">
            <div className="text-[11px] text-muted-foreground uppercase tracking-[1px]">
              <div>Government of India</div>
              <div>Bureau of Indian Standards</div>
              <div>Digital Knowledge Services</div>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              BIS AI — Official Knowledge Assistant
            </h1>
            <div className="text-[11px] text-muted-foreground">
              Last updated: 15 March 2026
            </div>
            <p className="text-sm sm:text-base text-muted-foreground max-w-3xl">
              Official AI-powered knowledge service for BIS standards, certification requirements, and regulatory policies.
            </p>
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2">
              <div className="flex-1">
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search BIS standards or ask about certification requirements"
                  className="h-10 rounded-[4px]"
                />
              </div>
              <Button type="submit" className="h-10 rounded-[4px] px-5 gap-2 shadow-none">
                <Search className="h-4 w-4" />
                Search BIS Knowledge Base
              </Button>
            </form>
            <div className="text-xs text-muted-foreground">
              Verified BIS Knowledge Repository • Source citations from BIS publications
            </div>
            <div className="text-xs text-muted-foreground">
              This service provides AI-assisted responses based on BIS publications. Always verify certification information through official BIS documentation.
            </div>
            <div className="text-xs text-muted-foreground">
              Popular Searches:
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                'Helmet certification requirements',
                'BIS mark verification',
                'Electric heater safety standards',
                'Pressure cooker certification',
              ].map((label) => (
                <button
                  key={label}
                  className="text-xs text-foreground border border-border bg-white dark:bg-card rounded-[4px] px-2.5 py-1 hover:border-primary/40 transition-colors"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 py-6">
          <div className="max-w-5xl mx-auto">
            <div className="section-divider" />
            <h2 className="text-lg font-semibold text-foreground mb-2">BIS Digital Services</h2>
            <p className="text-xs text-muted-foreground mb-4">
              Official digital services for BIS standards, certification and consumer safety.
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { title: 'Ask BIS AI', desc: 'Get AI-powered answers from BIS standards and policies.', link: '/chat', icon: '💬' },
                { title: 'Standards Explorer', desc: 'Search and browse BIS standards by product category.', link: '/standards', icon: '📄' },
                { title: 'Certification Guide', desc: 'Understand product certification procedures and requirements.', link: '/certification', icon: '📘' },
                { title: 'Consumer Safety', desc: 'Check counterfeit risk and safety alerts across regions.', link: '/risk-map', icon: '🛡' },
              ].map((item) => (
                <Link key={item.title} to={item.link} className="block">
                  <div className="border border-border bg-white dark:bg-card rounded-[4px] p-4 h-full hover:border-primary/40 transition-colors">
                    <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <span className="text-primary">{item.icon}</span>
                      {item.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{item.desc}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 py-6 bg-background">
          <div className="max-w-5xl mx-auto">
            <div className="border border-border border-l-4 border-l-primary bg-white dark:bg-card rounded-[4px] p-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">⚠ Consumer Safety Alerts</h3>
                  <p className="text-[11px] text-muted-foreground">Recent market surveillance updates</p>
                </div>
                <span className="text-[11px] text-muted-foreground">Updated: 15 March 2026</span>
              </div>
              <ul className="mt-3 space-y-2 text-xs text-muted-foreground list-disc list-inside">
                <li>Fake electrical products reported in Delhi markets.</li>
                <li>Counterfeit pressure cookers detected in Lucknow.</li>
                <li>Non-certified heaters flagged in Mumbai.</li>
              </ul>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
