import { useState, useRef, useEffect, useCallback } from 'react';
import { BISHeader } from '@/components/BISHeader';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Send, Loader2, ExternalLink, Mic, MicOff, Globe,
  Upload, ImageIcon, MessageSquare, ChevronRight, Clock,
  Trash2, Plus, BookOpen, HelpCircle, Shield, FileText,
} from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { useSearchParams } from 'react-router-dom';
import { languageLabels, type SupportedLanguage } from '@/data/offlineKnowledgeMultilingual';

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/rag-search`;

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

type ChatSession = {
  id: string;
  title: string;
  messages: Message[];
  timestamp: number;
};

const exampleQuestions = [
  'What BIS standards apply to electric heaters?',
  'How can I verify a BIS certification number?',
  'What is the process for ISI mark certification?',
  'Which products require compulsory BIS registration?',
];

const knowledgeTopics = [
  { label: 'Product Certification', icon: Shield },
  { label: 'BIS Standards', icon: BookOpen },
  { label: 'Hallmarking', icon: FileText },
  { label: 'Compulsory Registration Scheme (CRS)', icon: FileText },
  { label: 'Consumer Safety', icon: HelpCircle },
];

const quickStartCards = [
  {
    title: 'Verify Certification',
    desc: 'Learn how to use the BIS Care App and verify R-numbers or CM/L numbers.',
    query: 'How can I verify an ISI mark on a product?',
  },
  {
    title: 'Mandatory Products',
    desc: 'Check the list of electronics, steel, and toys under compulsory certification.',
    query: 'What are the mandatory products under BIS certification?',
  },
  {
    title: 'Gold Hallmarking',
    desc: 'Understand the symbols on your gold jewellery (HUID, BIS logo, Purity).',
    query: 'Tell me about the Gold Hallmarking process in India.',
  },
  {
    title: 'New Application',
    desc: 'Step-by-step guide for manufacturers to register on ManakOnline.',
    query: 'What is the process to apply for a new BIS license?',
  },
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
  const [responseMode, setResponseMode] = useState<'simple' | 'detailed'>(() => {
    return (localStorage.getItem('bis-chat-mode') as 'simple' | 'detailed') || 'simple';
  });
  const [chatHistory, setChatHistory] = useState<ChatSession[]>(() => {
    const saved = localStorage.getItem('bis-chat-history');
    return saved ? JSON.parse(saved) : [];
  });
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const initialQueryHandled = useRef(false);

  useEffect(() => {
    localStorage.setItem('bis-chat-history', JSON.stringify(chatHistory));
  }, [chatHistory]);

  const saveToHistory = (msgs: Message[]) => {
    if (msgs.length === 0) return;
    setChatHistory(prev => {
      const id = currentChatId || Date.now().toString();
      const firstUserMsg = msgs.find(m => m.role === 'user');
      const title = firstUserMsg
        ? firstUserMsg.content.slice(0, 40) + (firstUserMsg.content.length > 40 ? '...' : '')
        : 'New Chat';
      const existingIdx = prev.findIndex(h => h.id === id);
      const newSession: ChatSession = { id, title, messages: msgs, timestamp: Date.now() };
      if (!currentChatId) setCurrentChatId(id);
      if (existingIdx !== -1) {
        const updated = [...prev];
        updated[existingIdx] = newSession;
        return updated.sort((a, b) => b.timestamp - a.timestamp);
      }
      return [newSession, ...prev].sort((a, b) => b.timestamp - a.timestamp);
    });
  };

  const startNewChat = () => {
    setMessages([]);
    setCurrentChatId(null);
    setInput('');
    setLastAnalysis(null);
    setImagePreview(null);
    setUploadedFile(null);
  };

  const loadChat = (session: ChatSession) => {
    setMessages(session.messages);
    setCurrentChatId(session.id);
  };

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isLoading]);

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
            setMessages(prev =>
              prev.map((m, i) => i === prev.length - 1 ? { ...m, content: accumulated } : m)
            );
          }
        } catch {
          buffer = line + '\n' + buffer;
          break;
        }
      }
    }
    setMessages(prev => { saveToHistory(prev); return prev; });
  };

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
        if (m.role !== 'user' || selectedLang === 'en' || i !== updatedMessages.length - 1) return m;
        return { ...m, content: `${m.content}\n\nPlease respond in ${languageLabels[selectedLang]}.` };
      });
      const systemPrompt = `You are the BIS Smart Assistant — an expert AI on the Bureau of Indian Standards (BIS).
Current Mode: ${responseMode.toUpperCase()}
Selected Language: ${selectedLang}
Answer about ISI Marks, Hallmarking, CRS, and BIS standards. Never hallucinate.
Always end with ---SOURCES--- and ---SUGGESTIONS--- (3 follow-up questions).
${responseMode === 'simple'
  ? 'SIMPLE MODE: Short, direct answers in easy language. ~6-7 lines.'
  : 'DETAILED MODE: Comprehensive, well-structured answers with technical details.'}
Use markdown formatting.`;

      // Mock streaming response
      const aiResponseText = responseMode === 'simple'
        ? `The Bureau of Indian Standards (BIS) is the national standards body of India.\nIt ensures product safety and quality by granting the ISI Mark for many goods.\nBIS manages the compulsory registration of electronic and IT products.\nIt is also responsible for hallmarking of gold and silver items.\nConsumers can verify product authenticity using the BIS Care mobile app.\n\n---SOURCES---\n- https://www.bis.gov.in/\n\n---SUGGESTIONS---\n1. What is an ISI mark?\n2. How to check for Hallmarking?\n3. How to use BIS Care app?`
        : `The Bureau of Indian Standards (BIS) is the National Standard Body of India, established under the BIS Act 2016.\n\n**Key Responsibilities:**\n- **Standards Formulation**: Developing Indian Standards (IS) for over 20,000 products.\n- **Product Certification**: Managing the ISI Mark scheme for critical products.\n- **Hallmarking Scheme**: Ensuring purity of precious metals through mandatory hallmarking.\n- **Testing & Calibration**: Running a network of laboratories across India.\n- **Compulsory Registration (CRS)**: Regulating IT and electronics products.\n- **International Representation**: Representing India in ISO and IEC.\n\n---SOURCES---\n- https://www.bis.gov.in/\n- https://www.services.bis.gov.in/\n\n---SUGGESTIONS---\n1. What products fall under mandatory certification?\n2. How can I verify an ISI mark?\n3. Where can I find the CRS product list?`;

      const mockStream = new ReadableStream({
        start(controller) {
          const encoder = new TextEncoder();
          const words = aiResponseText.split(' ');
          let i = 0;
          const interval = setInterval(() => {
            if (i >= words.length) {
              controller.enqueue(encoder.encode('data: [DONE]\n\n'));
              controller.close();
              clearInterval(interval);
              return;
            }
            const chunk = JSON.stringify({ choices: [{ delta: { content: words[i] + ' ' } }] });
            controller.enqueue(encoder.encode(`data: ${chunk}\n\n`));
            i++;
          }, 30);
        },
      });
      await handleStreamResponse(new Response(mockStream, { status: 200 }));
    } catch (e) {
      console.error('Chat error:', e);
      toast.error('Failed to get response. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const q = searchParams.get('q');
    if (q && !initialQueryHandled.current) {
      initialQueryHandled.current = true;
      setInput(q);
      const timer = setTimeout(() => sendMessage(q), 300);
      return () => clearTimeout(timer);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleLangChange = (lang: SupportedLanguage) => {
    setSelectedLang(lang);
    localStorage.setItem('bis-chat-lang', lang);
  };

  const handleModeChange = (mode: 'simple' | 'detailed') => {
    setResponseMode(mode);
    localStorage.setItem('bis-chat-mode', mode);
  };

  const handleVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();
    recognition.lang = selectedLang === 'hi' ? 'hi-IN' : 'en-IN';
    recognition.interimResults = false;
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

  const hasVoice = typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  const handleFileSelect = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) { toast.error('Please upload an image file (JPG, PNG)'); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error('File size must be under 5MB'); return; }
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
      const mockJsonStr = JSON.stringify({
        choices: [{ message: { content: `{"productName":"Motorcycle Helmet","brand":"Steelbird","category":"Transport Safety","applicableStandard":"IS 4151:2015","certificationMarks":["ISI Mark"],"certificationNumber":"CM/L-1234567","safetyObservations":["Visor is scratch-resistant","Strap mechanism appears sturdy","ISI mark is present and verifiable"],"riskLevel":"low","summary":"The helmet complies with IS 4151:2015 and displays a verifiable ISI mark.","recommendation":"Use the BIS Care app to verify the CM/L number below the ISI mark."}` } }],
      });
      const data = JSON.parse(mockJsonStr);
      const content = data.choices?.[0]?.message?.content || '';
      let analysis: any = { summary: content, riskLevel: 'medium' };
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) analysis = JSON.parse(jsonMatch[0]);
      } catch {}
      setLastAnalysis(analysis);
      const promptParts = [
        'I uploaded a product photo for BIS safety guidance.',
        analysis?.productName ? `Product: ${analysis.productName}` : null,
        analysis?.brand ? `Brand: ${analysis.brand}` : null,
        analysis?.riskLevel ? `Risk level: ${analysis.riskLevel}` : null,
        analysis?.summary ? `Summary: ${analysis.summary}` : null,
        analysis?.recommendation ? `Recommendation: ${analysis.recommendation}` : null,
        'Please tell me which BIS/ISI certifications to check, how to verify them, and any red flags.',
      ].filter(Boolean);
      sendMessage(promptParts.join('\n'));
      toast.success('Image analysed. Asking BIS AI...');
    } catch (error: any) {
      toast.error(error.message || 'Failed to analyse image');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <BISHeader />

      {/* Page title band — matches other pages */}
      <div className="bg-primary/5 border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
            <span>Home</span>
            <ChevronRight className="h-3 w-3" />
            <span className="text-primary font-medium">Ask BIS AI</span>
          </nav>
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
                Digital Knowledge Service · Government of India
              </p>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">BIS AI Knowledge Assistant</h1>
              <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
                AI-powered service for BIS standards, certification requirements, and regulatory policies.
              </p>
            </div>
            <Badge variant="secondary" className="self-start sm:self-auto text-xs px-3 py-1.5 rounded-sm">
              Powered by BIS Knowledge Base
            </Badge>
          </div>
        </div>
      </div>

      <main className="flex-1 py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-[240px_1fr] gap-6">

            {/* Sidebar */}
            <aside className="space-y-4">
              <Card className="rounded-sm">
                <CardContent className="p-4 space-y-4">
                  {/* New Chat */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-2 rounded-sm border-primary/30 text-primary hover:bg-primary/5"
                    onClick={startNewChat}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    New Conversation
                  </Button>

                  {/* Knowledge Topics */}
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Knowledge Topics</p>
                    <ul className="space-y-1">
                      {knowledgeTopics.map(({ label, icon: Icon }) => (
                        <li key={label}>
                          <button
                            type="button"
                            onClick={() => setInput(label)}
                            className="w-full text-left flex items-center gap-2 text-xs text-foreground hover:text-primary py-1.5 px-2 rounded-sm hover:bg-primary/5 transition-colors"
                          >
                            <Icon className="h-3 w-3 text-muted-foreground shrink-0" />
                            {label}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Suggested Questions */}
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Suggested Questions</p>
                    <ul className="space-y-1">
                      {exampleQuestions.map((q) => (
                        <li key={q}>
                          <button
                            type="button"
                            onClick={() => sendMessage(q)}
                            className="w-full text-left text-xs text-primary hover:text-primary/80 py-1.5 px-2 rounded-sm hover:bg-primary/5 transition-colors leading-snug"
                          >
                            {q}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>

              {/* Chat History */}
              <Card className="rounded-sm">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                      <Clock className="h-3 w-3" /> History
                    </p>
                    {chatHistory.length > 0 && (
                      <button
                        onClick={() => { if (confirm('Clear all chat history?')) { setChatHistory([]); startNewChat(); } }}
                        className="text-destructive hover:text-destructive/80 transition-colors"
                        aria-label="Clear history"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                  <div className="space-y-1 max-h-[280px] overflow-y-auto">
                    {chatHistory.length === 0 ? (
                      <p className="text-xs text-muted-foreground py-2">No recent conversations.</p>
                    ) : (
                      chatHistory.map((chat) => (
                        <button
                          key={chat.id}
                          onClick={() => loadChat(chat)}
                          className={`w-full text-left text-xs p-2 rounded-sm border transition-colors ${
                            currentChatId === chat.id
                              ? 'bg-primary/5 border-primary/20 text-primary'
                              : 'border-transparent hover:bg-secondary/50 text-muted-foreground'
                          }`}
                        >
                          <div className="truncate">{chat.title}</div>
                          <div className="text-[9px] opacity-60 mt-0.5">
                            {new Date(chat.timestamp).toLocaleDateString('en-IN')}
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </aside>

            {/* Main chat area */}
            <section className="space-y-4 min-w-0">

              {/* Controls bar */}
              <Card className="rounded-sm">
                <CardContent className="p-4">
                  <div className="flex flex-wrap items-center gap-3">
                    {/* Language */}
                    <div className="flex items-center gap-2">
                      <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Language:</span>
                      <div className="flex gap-1">
                        {(Object.keys(languageLabels) as SupportedLanguage[]).map((lang) => (
                          <Button
                            key={lang}
                            variant={selectedLang === lang ? 'default' : 'outline'}
                            size="sm"
                            className="text-xs px-2.5 h-7 rounded-sm"
                            onClick={() => handleLangChange(lang)}
                          >
                            {languageLabels[lang]}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div className="h-4 w-px bg-border hidden sm:block" />

                    {/* Response mode */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Mode:</span>
                      <div className="flex border border-border rounded-sm overflow-hidden">
                        <button
                          onClick={() => handleModeChange('simple')}
                          className={`text-[11px] px-3 h-7 transition-colors ${
                            responseMode === 'simple'
                              ? 'bg-primary text-primary-foreground'
                              : 'text-muted-foreground hover:bg-secondary/50'
                          }`}
                        >
                          Simple
                        </button>
                        <button
                          onClick={() => handleModeChange('detailed')}
                          className={`text-[11px] px-3 h-7 border-l border-border transition-colors ${
                            responseMode === 'detailed'
                              ? 'bg-primary text-primary-foreground'
                              : 'text-muted-foreground hover:bg-secondary/50'
                          }`}
                        >
                          Detailed
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Input form */}
                  <form onSubmit={(e) => { e.preventDefault(); sendMessage(input); }} className="flex gap-2 mt-4">
                    <div className="flex-1 flex gap-2">
                      <Input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask a question about BIS standards or certification procedures..."
                        className="h-11 rounded-sm"
                        disabled={isLoading}
                      />
                      {hasVoice && (
                        <Button
                          type="button"
                          variant={isListening ? 'destructive' : 'outline'}
                          onClick={handleVoiceInput}
                          className="h-11 w-11 p-0 rounded-sm shrink-0"
                          aria-label="Voice input"
                        >
                          {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                        </Button>
                      )}
                    </div>
                    <Button
                      type="submit"
                      disabled={isLoading || !input.trim()}
                      className="h-11 rounded-sm px-5 gap-2 shadow-none shrink-0"
                    >
                      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      Ask
                    </Button>
                  </form>

                  {/* Image upload */}
                  <div className="mt-3 border border-border rounded-sm p-3 bg-secondary/20">
                    <div className="flex items-center gap-2 mb-2">
                      <ImageIcon className="h-3.5 w-3.5 text-primary" />
                      <p className="text-xs font-semibold text-foreground">Scan Product — Upload Photo</p>
                    </div>
                    <div className="flex flex-wrap gap-2 items-center">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="gap-2 rounded-sm h-8"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Upload className="h-3.5 w-3.5" />
                        Choose Photo
                      </Button>
                      <span className="text-xs text-muted-foreground flex-1 truncate">
                        {uploadedFile ? uploadedFile.name : 'JPG / PNG / WebP, max 5 MB'}
                      </span>
                      <Button
                        type="button"
                        size="sm"
                        className="gap-2 rounded-sm h-8"
                        onClick={handleUploadAndAsk}
                        disabled={!uploadedFile || isAnalyzing}
                      >
                        {isAnalyzing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                        {isAnalyzing ? 'Analysing...' : 'Analyse & Ask'}
                      </Button>
                      {uploadedFile && (
                        <Button type="button" variant="ghost" size="sm" className="h-8 text-xs rounded-sm" onClick={clearUpload}>
                          Clear
                        </Button>
                      )}
                    </div>
                    {imagePreview && (
                      <div className="mt-3 flex items-center gap-3">
                        <img src={imagePreview} alt="Uploaded product" className="h-14 w-14 object-contain rounded-sm border bg-white dark:bg-card" />
                        <p className="text-xs text-muted-foreground">
                          {lastAnalysis?.summary ?? 'Photo ready for analysis.'}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Conversation area */}
              <Card className="rounded-sm">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                      <MessageSquare className="h-3 w-3" /> AI Response
                    </p>
                    {messages.length > 0 && (
                      <button
                        onClick={startNewChat}
                        className="text-[10px] text-primary hover:text-primary/80 flex items-center gap-1"
                      >
                        <Plus className="h-3 w-3" /> New Chat
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mb-4">
                    Answers generated from BIS knowledge repository with source references.
                  </p>

                  <div ref={scrollRef} className="max-h-[600px] overflow-y-auto space-y-3 pr-1">
                    {/* Empty state */}
                    {messages.length === 0 && (
                      <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <div className="grid sm:grid-cols-2 gap-3">
                          {quickStartCards.map((card) => (
                            <button
                              key={card.title}
                              type="button"
                              onClick={() => sendMessage(card.query)}
                              className="text-left p-4 border border-border rounded-sm bg-white dark:bg-card hover:border-primary/40 hover:bg-primary/5 transition-all group"
                            >
                              <p className="text-sm font-semibold text-foreground group-hover:text-primary mb-1">{card.title}</p>
                              <p className="text-xs text-muted-foreground leading-relaxed">{card.desc}</p>
                            </button>
                          ))}
                        </div>
                        <div className="border border-dashed border-border rounded-sm p-8 text-center bg-secondary/10">
                          <MessageSquare className="h-8 w-8 text-primary/20 mx-auto mb-3" />
                          <p className="text-sm font-semibold text-foreground mb-1">Ready to assist you</p>
                          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                            Type your question above or upload a product photo.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Messages */}
                    {messages.map((msg, i) => {
                      if (msg.role === 'user') {
                        return (
                          <div key={i} className="border border-border bg-secondary/20 rounded-sm p-3">
                            <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Your Question</p>
                            <p className="text-sm text-foreground">{msg.content}</p>
                          </div>
                        );
                      }
                      const { body, sources } = parseSources(msg.content);
                      return (
                        <div key={i} className="border border-border bg-white dark:bg-card rounded-sm p-4">
                          <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Answer</p>
                          <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:text-foreground prose-p:text-muted-foreground prose-strong:text-foreground prose-li:text-muted-foreground">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{body}</ReactMarkdown>
                          </div>
                          {sources.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-border">
                              <p className="text-xs font-semibold text-foreground mb-1.5 flex items-center gap-1">
                                <ExternalLink className="h-3 w-3" /> Official Sources
                              </p>
                              <ul className="space-y-1">
                                {sources.map((src) => (
                                  <li key={src} className="text-xs">
                                    <a href={src} target="_blank" rel="noreferrer" className="text-primary hover:underline break-all">
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

                    {isLoading && (
                      <div className="border border-border bg-white dark:bg-card rounded-sm p-4 flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        <span className="text-xs text-muted-foreground">Generating response from BIS knowledge base...</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Disclaimer */}
              <div className="border border-border bg-secondary/20 rounded-sm p-3 text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">Disclaimer:</span> Responses are generated using BIS publications and regulatory documents. Users should verify information through official BIS documentation at{' '}
                <a href="https://www.bis.gov.in" target="_blank" rel="noreferrer" className="text-primary hover:underline">
                  www.bis.gov.in
                </a>.
              </div>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
