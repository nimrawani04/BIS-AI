import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import ReactMarkdown from 'react-markdown';
import {
  WifiOff,
  Search,
  ShieldCheck,
  HardHat,
  Plug,
  Flame,
  Baby,
  Microwave,
  Mic,
  MicOff,
  Globe,
  MessageSquare,
  BookOpen,
  FileText,
  AlertTriangle,
} from 'lucide-react';
import { searchOfflineKnowledge, type KnowledgeEntry } from '@/data/offlineKnowledgeBase';
import {
  searchMultilingualKnowledge,
  languageLabels,
  type SupportedLanguage,
} from '@/data/offlineKnowledgeMultilingual';
import { DownloadOfflinePack } from '@/components/OfflineBanner';
import { Link } from 'react-router-dom';

const quickPrompts = [
  { label: 'Helmet', icon: HardHat },
  { label: 'Extension Board', icon: Plug },
  { label: 'Electric Heater', icon: Flame },
  { label: 'Pressure Cooker', icon: Microwave },
  { label: 'Toys', icon: Baby },
];

const offlineQuickLinks = [
  { label: 'About BIS', to: '/about', icon: ShieldCheck },
  { label: 'Certification Guide', to: '/certification', icon: FileText },
  { label: 'Standards Explorer', to: '/standards', icon: BookOpen },
];

export function OfflineSafetyAssistant() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ question: string; answer: string; category: string }[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [selectedLang, setSelectedLang] = useState<SupportedLanguage>(() => {
    return (localStorage.getItem('bis-offline-lang') as SupportedLanguage) || 'en';
  });

  const handleSearch = (searchQuery: string) => {
    const trimmed = searchQuery.trim();
    if (!trimmed) return;
    setHasSearched(true);

    // Search multilingual knowledge first, then fallback to original
    const multiResults = searchMultilingualKnowledge(trimmed, selectedLang);
    if (multiResults.length > 0) {
      setResults(multiResults);
    } else {
      const fallback = searchOfflineKnowledge(trimmed);
      setResults(fallback.map(e => ({ question: e.question, answer: e.answer, category: e.category })));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(query);
  };

  const handleLangChange = (lang: SupportedLanguage) => {
    setSelectedLang(lang);
    localStorage.setItem('bis-offline-lang', lang);
    if (hasSearched && query.trim()) {
      // Re-search with new language
      const multiResults = searchMultilingualKnowledge(query.trim(), lang);
      if (multiResults.length > 0) {
        setResults(multiResults);
      }
    }
  };

  const handleVoice = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    const langMap: Record<string, string> = {
      en: 'en-IN', hi: 'hi-IN',
    };
    recognition.lang = langMap[selectedLang] || 'hi-IN';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setQuery(transcript);
      handleSearch(transcript);
    };

    recognition.start();
  };

  const hasVoice =
    typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  return (
    <section className="py-16 px-4 bg-gradient-to-b from-background to-secondary/30">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-warning/15 text-warning px-4 py-1.5 rounded-full text-sm font-medium mb-4">
            <WifiOff className="h-4 w-4" />
            Offline Mode
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
            BIS Safety Guide (Offline)
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto text-lg">
            Access essential BIS standards and safety information without internet connection.
          </p>
        </div>

        {/* AI Chatbot Offline Notice */}
        <Card className="mb-6 border-warning/30 bg-warning/5">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-foreground mb-1">
                AI assistant requires internet connection
              </p>
              <p className="text-xs text-muted-foreground mb-3">
                Please reconnect to ask questions to the AI chatbot. Meanwhile, use offline search below or browse these sections:
              </p>
              <div className="flex flex-wrap gap-2">
                {offlineQuickLinks.map((link) => (
                  <Link key={link.to} to={link.to}>
                    <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                      <link.icon className="h-3 w-3" />
                      {link.label}
                    </Button>
                  </Link>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Language Selector */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <Globe className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Language:</span>
          {(Object.keys(languageLabels) as SupportedLanguage[]).map((lang) => (
            <Button
              key={lang}
              variant={selectedLang === lang ? 'default' : 'outline'}
              size="sm"
              className="text-xs px-2 py-1 h-7"
              onClick={() => handleLangChange(lang)}
            >
              {languageLabels[lang]}
            </Button>
          ))}
        </div>

        {/* Search Bar */}
        <Card className="mb-6 border-2 border-warning/20 shadow-lg">
          <CardContent className="p-4">
            <form onSubmit={handleSubmit} className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={selectedLang === 'hi' ? '"हेलमेट", "प्रेशर कुकर", "शिकायत"...' : '"helmet", "pressure cooker", "complaint"...'}
                  className="pl-10 h-12 text-base"
                />
              </div>
              {hasVoice && (
                <Button
                  type="button"
                  variant={isListening ? 'destructive' : 'outline'}
                  onClick={handleVoice}
                  className="h-12 w-12 p-0"
                  aria-label="Voice search"
                >
                  {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </Button>
              )}
              <Button type="submit" disabled={!query.trim()} className="h-12 px-6 gap-2">
                <Search className="h-4 w-4" />
                Search
              </Button>
            </form>

            {!hasSearched && (
              <div className="flex flex-wrap gap-2 mt-4">
                <span className="text-sm text-muted-foreground self-center mr-1">Quick search:</span>
                {quickPrompts.map(({ label, icon: Icon }) => (
                  <Button
                    key={label}
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-sm"
                    onClick={() => { setQuery(label); handleSearch(label); }}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {label}
                  </Button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results */}
        {hasSearched && (
          <div className="space-y-4">
            {results.length > 0 ? (
              results.map((entry, i) => (
                <Card key={i} className="overflow-hidden">
                  <CardHeader className="bg-warning/5 border-b border-border py-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <ShieldCheck className="h-5 w-5 text-primary" />
                      {entry.question}
                      <Badge variant="secondary" className="ml-auto text-xs capitalize">
                        {entry.category}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-5">
                    <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:text-foreground prose-p:text-muted-foreground prose-strong:text-foreground prose-li:text-muted-foreground">
                      <ReactMarkdown>{entry.answer}</ReactMarkdown>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <WifiOff className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground mb-2">
                    No offline results found for "<strong>{query}</strong>"
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Try searching for common topics like "helmet", "ISI mark", "complaint", or "electrical safety".
                  </p>
                </CardContent>
              </Card>
            )}

            <div className="flex flex-wrap gap-2 justify-center pt-2">
              <span className="text-sm text-muted-foreground self-center mr-1">Search another:</span>
              {quickPrompts.map(({ label, icon: Icon }) => (
                <Button
                  key={label}
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 text-xs"
                  onClick={() => { setQuery(label); handleSearch(label); }}
                >
                  <Icon className="h-3 w-3" />
                  {label}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Download Pack */}
        <div className="mt-8">
          <DownloadOfflinePack />
        </div>
      </div>
    </section>
  );
}
