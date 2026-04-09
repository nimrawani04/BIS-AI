import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import ReactMarkdown from 'react-markdown';
import {
  ShieldCheck,
  Send,
  Loader2,
  Sparkles,
  HardHat,
  Plug,
  Flame,
  Baby,
  Microwave,
  Search,
  WifiOff,
} from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { OfflineSafetyAssistant } from '@/components/OfflineSafetyAssistant';
import { searchMultilingualKnowledge } from '@/data/offlineKnowledgeMultilingual';

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/safety-assistant`;

const quickPrompts = [
  { label: 'Helmet', icon: HardHat },
  { label: 'Extension Board', icon: Plug },
  { label: 'Electric Heater', icon: Flame },
  { label: 'Pressure Cooker', icon: Microwave },
  { label: 'Toys', icon: Baby },
];

export function SmartSafetyAssistant() {
  const isOnline = useOnlineStatus();

  // If offline, render the offline assistant
  if (!isOnline) {
    return <OfflineSafetyAssistant />;
  }

  return <OnlineSafetyAssistant />;
}

function OnlineSafetyAssistant() {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const responseRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (responseRef.current && response) {
      responseRef.current.scrollTop = responseRef.current.scrollHeight;
    }
  }, [response]);

  const handleSearch = async (searchQuery: string) => {
    const trimmed = searchQuery.trim();
    if (!trimmed || isLoading) return;

    setIsLoading(true);
    setHasSearched(true);
    setResponse('');

    try {
      // Use live API call to Supabase Edge Function
      const response = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || ''}`,
        },
        body: JSON.stringify({ query: trimmed }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response stream');

      const decoder = new TextDecoder();
      let buffer = '';
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let newlineIdx: number;
        while ((newlineIdx = buffer.indexOf('\n')) !== -1) {
          let line = buffer.slice(0, newlineIdx);
          buffer = buffer.slice(newlineIdx + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              accumulated += content;
              setResponse(accumulated);
            }
          } catch {
            // Partial JSON potentially across chunks - skip for now
          }
        }
      }
    } catch (e) {
      console.error('Safety assistant error:', e);
      toast.error('Failed to get safety guide. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(query);
  };

  return (
    <section id="safety-assistant" className="py-16 px-4 bg-gradient-to-b from-background to-secondary/30">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-medium mb-4">
            <Sparkles className="h-4 w-4" />
            AI-Powered
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
            Smart Safety Assistant
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto text-lg">
            Ask before you buy. Get instant safety guides for any product — know the certifications, checks, and red flags.
          </p>
        </div>

        {/* Search Bar */}
        <Card className="mb-6 border-2 border-primary/20 shadow-lg">
          <CardContent className="p-4">
            <form onSubmit={handleSubmit} className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder='Try "helmet", "pressure cooker", "electric heater"...'
                  className="pl-10 h-12 text-base"
                  disabled={isLoading}
                />
              </div>
              <Button
                type="submit"
                disabled={isLoading || !query.trim()}
                className="h-12 px-6 gap-2"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Ask
              </Button>
            </form>

            {/* Quick Prompts */}
            {!hasSearched && (
              <div className="flex flex-wrap gap-2 mt-4">
                <span className="text-sm text-muted-foreground self-center mr-1">Quick search:</span>
                {quickPrompts.map(({ label, icon: Icon }) => (
                  <Button
                    key={label}
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-sm"
                    onClick={() => {
                      setQuery(label);
                      handleSearch(label);
                    }}
                    disabled={isLoading}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {label}
                  </Button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Response Area */}
        {hasSearched && (
          <Card className="overflow-hidden">
            <CardHeader className="bg-primary/5 border-b border-border">
              <CardTitle className="flex items-center gap-2 text-lg">
                <ShieldCheck className="h-5 w-5 text-primary" />
                Safety Guide
                {isLoading && (
                  <Badge variant="secondary" className="ml-auto gap-1.5 animate-pulse">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Analyzing...
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div
                ref={responseRef}
                className="prose prose-sm max-w-none dark:prose-invert
                  prose-headings:text-foreground prose-p:text-muted-foreground
                  prose-strong:text-foreground prose-li:text-muted-foreground
                  prose-h2:text-xl prose-h2:mt-0 prose-h2:mb-3
                  prose-h3:text-base prose-h3:mt-4 prose-h3:mb-2
                  max-h-[600px] overflow-y-auto"
              >
                {response ? (
                  <ReactMarkdown>{response}</ReactMarkdown>
                ) : isLoading ? (
                  <div className="flex items-center gap-3 text-muted-foreground py-8 justify-center">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    <span>Generating your safety guide...</span>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    No results. Try searching for a product.
                  </p>
                )}
              </div>

              {/* Search again */}
              {!isLoading && response && (
                <div className="mt-6 pt-4 border-t border-border flex flex-wrap gap-2">
                  <span className="text-sm text-muted-foreground self-center mr-1">Search another:</span>
                  {quickPrompts.map(({ label, icon: Icon }) => (
                    <Button
                      key={label}
                      variant="ghost"
                      size="sm"
                      className="gap-1.5 text-xs"
                      onClick={() => {
                        setQuery(label);
                        handleSearch(label);
                      }}
                    >
                      <Icon className="h-3 w-3" />
                      {label}
                    </Button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </section>
  );
}
