import { useState, useRef, useEffect, useCallback } from 'react';
import { BISHeader } from '@/components/BISHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Send, Loader2, ExternalLink, Mic, MicOff, Globe, Upload, ImageIcon } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { useSearchParams } from 'react-router-dom';
import { languageLabels, type SupportedLanguage } from '@/data/offlineKnowledgeMultilingual';

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/rag-search`;

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

const exampleQuestions = [
  'What BIS standards apply to electric heaters?',
  'How can I verify a BIS certification number?',
  'What is the process for ISI mark certification?',
  'Which products require compulsory BIS registration?',
];

const knowledgeTopics = [
  'Product Certification',
  'BIS Standards',
  'Hallmarking',
  'Compulsory Registration Scheme (CRS)',
  'Consumer Safety',
];

function parseSources(text: string): { body: string; sources: string[] } {
  let body = text;
  let sources: string[] = [];

  const srcIdx = text.indexOf('---SOURCES---');
  if (srcIdx !== -1) {
    const afterSrc = text.slice(srcIdx + 13);
    const sugInSrc = afterSrc.indexOf('---SUGGESTIONS---');
    const srcBlock = sugInSrc !== -1 ? afterSrc.slice(0, sugInSrc) : afterSrc;
    sources = srcBlock.split('\n').map(l => l.replace(/^\-\s*/, '').trim()).filter(l => l.startsWith('http'));
    body = text.slice(0, srcIdx).trim();
  }

  return { body, sources };
}

const offlineKnowledge: Record<string, string> = {
  'what is bis': `The Bureau of Indian Standards (BIS) is the national standards body of India, established under the BIS Act 2016. It operates under the Ministry of Consumer Affairs, Food and Public Distribution. BIS develops Indian Standards, runs product certification (ISI Mark), hallmarking of precious metals, and the Compulsory Registration Scheme (CRS) for electronics.

---SOURCES---
- https://www.bis.gov.in/index.php/about-bis/

---SUGGESTIONS---
- What certification schemes does BIS offer?
- How to apply for BIS certification?
- What is ISI mark?`,
  'how to apply for bis certification': `Steps to apply for BIS certification:
1. Visit manakonline.bis.gov.in and create an account
2. Submit online application with documents (test reports, factory details, quality control plan)
3. BIS reviews and assigns an officer
4. Factory/premises inspection
5. Product samples tested at BIS labs
6. If compliant, license is granted
7. Annual surveillance and periodic renewal required

---SOURCES---
- https://www.bis.gov.in/index.php/certification/product-certification/
- https://manakonline.bis.gov.in

---SUGGESTIONS---
- What documents are needed for BIS certification?
- How long does BIS certification take?
- What are the fees for BIS certification?`,
};

function getOfflineAnswer(query: string): string | null {
  const q = query.toLowerCase().trim().replace(/[?।]/g, '');
  for (const [key, answer] of Object.entries(offlineKnowledge)) {
    if (q.includes(key) || key.includes(q)) return answer;
  }
  return null;
}

export default function BISChat() {
  const [searchParams] = useSearchParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLang, setSelectedLang] = useState<SupportedLanguage>(() => {
    return (localStorage.getItem('bis-chat-lang') as SupportedLanguage) || 'en';
  });
  const [isListening, setIsListening] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastAnalysis, setLastAnalysis] = useState<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const initialQueryHandled = useRef(false);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isLoading]);

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    const userMsg: Message = { role: 'user', content: trimmed };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput('');
    setIsLoading(true);

    try {
      const offlineAnswer = getOfflineAnswer(trimmed);
      if (offlineAnswer && !navigator.onLine) {
        setMessages(prev => [...prev, { role: 'assistant', content: offlineAnswer }]);
        setIsLoading(false);
        return;
      }

      const payloadMessages = updatedMessages.map((m, i) => {
        if (m.role !== 'user') return m;
        if (selectedLang === 'en') return m;
        if (i !== updatedMessages.length - 1) return m;
        return {
          ...m,
          content: `${m.content}\n\nPlease respond in ${languageLabels[selectedLang]}.`,
        };
      });

      const resp = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: payloadMessages.map(m => ({ role: m.role, content: m.content })),
        }),
      });

      await handleStreamResponse(resp);
    } catch (e) {
      console.error('Chat error:', e);
      toast.error('Failed to get response. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStreamResponse = async (resp: Response) => {
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({ error: 'Request failed' }));
      if (resp.status === 429) toast.error('Rate limit reached. Please wait and try again.');
      else if (resp.status === 402) toast.error('AI usage limit reached.');
      else toast.error(err.error || 'Something went wrong');
      return;
    }

    const reader = resp.body?.getReader();
    if (!reader) throw new Error('No response stream');

    const decoder = new TextDecoder();
    let buffer = '';
    let accumulated = '';

    setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

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
            setMessages(prev => prev.map((m, i) => i === prev.length - 1 ? { ...m, content: accumulated } : m));
          }
        } catch {
          buffer = line + '\n' + buffer;
          break;
        }
      }
    }
  };

  useEffect(() => {
    const q = searchParams.get('q');
    if (q && !initialQueryHandled.current) {
      initialQueryHandled.current = true;
      setInput(q);
      const timer = setTimeout(() => {
        sendMessage(q);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleLangChange = (lang: SupportedLanguage) => {
    setSelectedLang(lang);
    localStorage.setItem('bis-chat-lang', lang);
  };

  const handleVoiceInput = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    const langMap: Record<string, string> = {
      en: 'en-IN',
      hi: 'hi-IN',
      ur: 'ur-PK',
      ta: 'ta-IN',
      te: 'te-IN',
      bn: 'bn-IN',
      kn: 'kn-IN',
      ml: 'ml-IN',
      ks: 'ks-IN',
    };
    recognition.lang = langMap[selectedLang] || 'en-IN';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      sendMessage(transcript);
    };

    recognition.start();
  };

  const hasVoice =
    typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  const handleFileSelect = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file (JPG, PNG)');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be under 5MB');
      return;
    }
    setUploadedFile(file);
    setLastAnalysis(null);
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target?.result as string);
    reader.readAsDataURL(file);
  }, []);

  const clearUpload = () => {
    setUploadedFile(null);
    setImagePreview(null);
    setLastAnalysis(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleUploadAndAsk = async () => {
    if (!uploadedFile || isAnalyzing) return;

    setIsAnalyzing(true);
    try {
      // Convert image to base64 data URL directly — no Supabase Storage needed
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(uploadedFile);
      });

      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
      const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      const resp = await fetch(`${SUPABASE_URL}/functions/v1/analyze-product-image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_KEY}`,
        },
        body: JSON.stringify({ imageUrl: dataUrl }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: 'Analysis failed' }));
        throw new Error(err.error || `HTTP ${resp.status}`);
      }

      const analysisData = await resp.json();

      const analysis = analysisData.analysis;
      setLastAnalysis(analysis);

      const promptParts = [
        'I uploaded a product photo for BIS safety guidance.',
        analysis?.productName ? `Product: ${analysis.productName}` : null,
        analysis?.brand ? `Brand: ${analysis.brand}` : null,
        analysis?.category ? `Category: ${analysis.category}` : null,
        analysis?.riskLevel ? `Risk level: ${analysis.riskLevel}` : null,
        analysis?.summary ? `Summary: ${analysis.summary}` : null,
        analysis?.certificationMarks?.length ? `Certification marks: ${analysis.certificationMarks.join(', ')}` : null,
        analysis?.safetyObservations?.length ? `Safety observations: ${analysis.safetyObservations.join('; ')}` : null,
        analysis?.recommendation ? `Recommendation: ${analysis.recommendation}` : null,
        'Please tell me which BIS/ISI certifications to check, how to verify them, and any red flags.',
      ].filter(Boolean);

      sendMessage(promptParts.join('\n'));
      toast.success('Image analyzed. Asking BIS AI...');
    } catch (error: any) {
      console.error('Analysis error:', error);
      toast.error(error.message || 'Failed to analyze image');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <BISHeader />
      <main className="py-6 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-sm text-muted-foreground">Home &gt; Ask BIS AI</div>

          <div className="grid md:grid-cols-[260px_1fr] gap-6 mt-4">
            <aside className="border border-border bg-white dark:bg-card rounded-[2px] p-4 space-y-5">
              <div>
                <p className="text-[11px] uppercase tracking-[1px] text-muted-foreground mb-2">Knowledge Topics</p>
                <ul className="space-y-1">
                  {knowledgeTopics.map((topic) => (
                    <li key={topic}>
                      <button
                        type="button"
                        onClick={() => setInput(topic)}
                        className="text-left text-sm text-foreground hover:text-primary"
                      >
                        {topic}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[1px] text-muted-foreground mb-2">Suggested Questions</p>
                <ul className="space-y-1">
                  {exampleQuestions.map((q) => (
                    <li key={q}>
                      <button
                        type="button"
                        onClick={() => sendMessage(q)}
                        className="text-left text-sm text-primary hover:text-primary/80"
                      >
                        {q}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[1px] text-muted-foreground mb-2">Recent Questions</p>
                <p className="text-xs text-muted-foreground">No recent questions yet.</p>
              </div>
            </aside>

            <section className="space-y-4">
              <div className="border border-border bg-white dark:bg-card rounded-[2px] p-4 space-y-2">
                <div className="text-[11px] uppercase tracking-[1px] text-muted-foreground">Digital Knowledge Service</div>
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground">BIS AI Knowledge Assistant</h1>
                <p className="text-sm text-muted-foreground">Government of India ? Bureau of Indian Standards</p>
                <p className="text-sm text-muted-foreground max-w-3xl">
                  AI-powered knowledge service for BIS standards, certification requirements, and regulatory policies.
                </p>

                <div className="flex items-center gap-2 flex-wrap pt-2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Language:</span>
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

                <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 pt-2">
                  <div className="flex-1 flex gap-2">
                    <Input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Ask a question about BIS standards or certification procedures"
                      className="h-12 rounded-[4px]"
                      disabled={isLoading}
                    />
                    {hasVoice && (
                      <Button
                        type="button"
                        variant={isListening ? 'destructive' : 'outline'}
                        onClick={handleVoiceInput}
                        className="h-12 w-12 p-0"
                        aria-label="Voice input"
                      >
                        {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                      </Button>
                    )}
                  </div>
                  <Button type="submit" disabled={isLoading || !input.trim()} className="h-12 rounded-[4px] px-5 gap-2 shadow-none">
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    Ask
                  </Button>
                </form>

                <div className="mt-4 border border-border rounded-[4px] p-3 bg-[#f9fafb] dark:bg-secondary/30">
                  <div className="flex items-center gap-2 mb-2">
                    <ImageIcon className="h-4 w-4 text-primary" />
                    <p className="text-xs font-semibold text-foreground">Scan Product (Upload Photo)</p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 items-center">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileSelect(file);
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="gap-2 w-full sm:w-auto"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="h-4 w-4" />
                      Choose Photo
                    </Button>
                    <div className="text-xs text-muted-foreground flex-1 truncate">
                      {uploadedFile ? uploadedFile.name : 'JPG/PNG/WebP, max 5MB'}
                    </div>
                    <Button
                      type="button"
                      className="w-full sm:w-auto gap-2"
                      onClick={handleUploadAndAsk}
                      disabled={!uploadedFile || isAnalyzing}
                    >
                      {isAnalyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      {isAnalyzing ? 'Analyzing...' : 'Analyze & Ask'}
                    </Button>
                    {uploadedFile && (
                      <Button
                        type="button"
                        variant="ghost"
                        className="text-xs"
                        onClick={clearUpload}
                      >
                        Clear
                      </Button>
                    )}
                  </div>
                  {imagePreview && (
                    <div className="mt-3 flex items-center gap-3">
                      <img src={imagePreview} alt="Uploaded product" className="h-16 w-16 object-contain rounded border bg-white dark:bg-card" />
                      <div className="text-xs text-muted-foreground">
                        {lastAnalysis?.summary ? lastAnalysis.summary : 'Photo ready for analysis.'}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="border border-border bg-white dark:bg-card rounded-[2px] p-4" ref={scrollRef}>
                <p className="text-[11px] uppercase tracking-[1px] text-muted-foreground">AI Response</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Answer generated from BIS knowledge repository with source references.
                </p>

                {messages.length === 0 && (
                  <div className="mt-3 border border-border bg-white dark:bg-secondary/20 rounded-[2px] p-4 text-sm text-muted-foreground">
                    Enter a question above to view the official BIS knowledge response here.
                  </div>
                )}

                {messages.map((msg, i) => {
                  if (msg.role === 'user') {
                    return (
                      <div key={i} className="mt-4 border border-border bg-white dark:bg-secondary/20 rounded-[2px] p-4">
                        <p className="text-[11px] uppercase tracking-[1px] text-muted-foreground">Question</p>
                        <p className="text-sm text-foreground mt-1">{msg.content}</p>
                      </div>
                    );
                  }

                  const { body, sources } = parseSources(msg.content);

                  return (
                    <div key={i} className="mt-3 border border-border bg-white dark:bg-card rounded-[2px] p-4">
                      <p className="text-[11px] uppercase tracking-[1px] text-muted-foreground">Answer</p>
                      <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:text-foreground prose-p:text-muted-foreground prose-strong:text-foreground prose-li:text-muted-foreground mt-2">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{body}</ReactMarkdown>
                      </div>
                      {sources.length > 0 && (
                        <div className="mt-3 border-t border-border pt-2">
                          <p className="text-xs font-semibold text-foreground mb-1 flex items-center gap-1">
                            <ExternalLink className="h-3 w-3" /> Sources
                          </p>
                          <ul className="list-disc list-inside text-xs text-muted-foreground space-y-1">
                            {sources.map((src) => (
                              <li key={src}>
                                <a href={src} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                                  {src}
                                </a>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="border border-border bg-[#f9fafb] dark:bg-secondary/30 rounded-[2px] p-4 text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">Note:</span> Responses are generated using BIS publications and regulatory documents. Users should verify information through official BIS documentation.
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
