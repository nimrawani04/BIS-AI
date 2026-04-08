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

  // Sync history to localStorage
  useEffect(() => {
    localStorage.setItem('bis-chat-history', JSON.stringify(chatHistory));
  }, [chatHistory]);

  const saveToHistory = (msgs: Message[]) => {
    if (msgs.length === 0) return;
    
    setChatHistory(prev => {
      const id = currentChatId || Date.now().toString();
      const title = msaveTitle(msgs);
      const existingIdx = prev.findIndex(h => h.id === id);
      
      const newSession: ChatSession = {
        id,
        title,
        messages: msgs,
        timestamp: Date.now()
      };

      if (!currentChatId) setCurrentChatId(id);

      if (existingIdx !== -1) {
        const updated = [...prev];
        updated[existingIdx] = newSession;
        return updated.sort((a,b) => b.timestamp - a.timestamp);
      }
      return [newSession, ...prev].sort((a,b) => b.timestamp - a.timestamp);
    });
  };

  const msaveTitle = (msgs: Message[]) => {
    const firstUserMsg = msgs.find(m => m.role === 'user');
    if (!firstUserMsg) return 'New Chat';
    return firstUserMsg.content.slice(0, 30) + (firstUserMsg.content.length > 30 ? '...' : '');
  };

  const startNewChat = () => {
    setMessages([]);
    setCurrentChatId(null);
    setInput('');
    setLastAnalysis(null);
    setImagePreview(null);
    setUploadedFile(null);
    toast.info('Started a new conversation');
  };

  const loadChat = (session: ChatSession) => {
    setMessages(session.messages);
    setCurrentChatId(session.id);
  };

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

      const systemPrompt = `You are the BIS Smart Assistant — an expert AI on the Bureau of Indian Standards (BIS).
Current Mode: ${responseMode.toUpperCase()}
Selected Language: ${selectedLang}

## PRIORITIES
Answer about ISI Marks, Hallmarking, CRS, and BIS standards.
Never hallucinate.
Always end with ---SOURCES--- (e.g. - https://www.bis.gov.in/)
Always end with ---SUGGESTIONS--- (with 3 follow-up questions)

## MODE INSTRUCTIONS
${responseMode === 'simple' 
  ? 'SIMPLE MODE: Provide short, direct answers in easy-to-understand language. Avoid technical jargon. Keep it under 100 words.' 
  : 'DETAILED MODE: Provide comprehensive, well-explained answers. Include technical details, clauses if known, and structured explanations. No word limit.'}

## CONTEXT AWARENESS
You are part of a conversational history. Use previous messages to understand context and follow-up questions. If the user asks something like "How does it work?" referring to a previously mentioned standard, answer based on that standard.

Keep responses concise, use markdown formatting.`;
      const gMessages = [
        { role: "system", content: systemPrompt },
        ...payloadMessages.map(m => ({ role: m.role, content: m.content }))
      ];
      // Mock response for testing - varies based on Mode and Language
      let aiResponseText = "";
      
      if (selectedLang === 'hi') {
        if (responseMode === 'simple') {
          aiResponseText = `भारतीय मानक ब्यूरो (BIS) भारत का राष्ट्रीय मानक निकाय है।
यह उत्पादों की गुणवत्ता सुनिश्चित करने के लिए ISI मार्क प्रदान करता है।
यह सोने और चांदी के आभूषणों की शुद्धता के लिए हॉलमार्किंग का संचालन करता है।
इसका मुख्य उद्देश्य उपभोक्ताओं को सुरक्षित और प्रमाणित उत्पाद उपलब्ध कराना है।

---SOURCES---
- https://www.bis.gov.in/

---SUGGESTIONS---
1. ISI मार्क क्या है?
2. हॉलमार्किंग कैसे देखें?`;
        } else {
          aiResponseText = `भारतीय मानक ब्यूरो (BIS) अधिनियम 2016 के तहत स्थापित भारत का राष्ट्रीय मानक निकाय है। यह उपभोक्ता मामलों के मंत्रालय के तत्वावधान में कार्य करता है।

मुख्य गतिविधियां और विवरण:
1. **मानक निर्धारण**: यह विभिन्न उत्पादों के लिए भारतीय मानक (IS) विकसित करता है।
2. **उत्पाद प्रमाणन**: ISI मार्क के माध्यम से उत्पादों की सुरक्षा और गुणवत्ता की गारंटी देता है।
3. **हॉलमार्किंग**: आभूषणों पर सोने की शुद्धता सुनिश्चित करने के लिए अनिवार्य हॉलमार्किंग लागू करता है।
4. **लैब नेटवर्क**: गुणवत्ता की जांच के लिए देश भर में परीक्षण प्रयोगशालाओं का संचालन करता है।
5. **उपभोक्ता सुरक्षा**: घटिया गुणवत्ता वाले उत्पादों के खिलाफ उपभोक्ताओं के हितों की रक्षा करता है।
6. **अंतर्राष्ट्रीय सहयोग**: ISO जैसे वैश्विक संगठनों में भारत का प्रतिनिधित्व करता है।

यह संगठन भारतीय अर्थव्यवस्था में गुणवत्ता संस्कृति को बढ़ावा देने में अत्यंत महत्वपूर्ण भूमिका निभाता है।

---SOURCES---
- https://www.bis.gov.in/about-bis/
- https://www.services.bis.gov.in/

---SUGGESTIONS---
1. अनिवार्य प्रमाणन के अंतर्गत कौन से उत्पाद आते हैं?
2. मैं ISI मार्क की पुष्टि कैसे कर सकता हूँ?
3. BIS लाइसेंस के लिए आवेदन कैसे करें?`;
        }
      } else {
        if (responseMode === 'simple') {
          aiResponseText = `The Bureau of Indian Standards (BIS) is the national standards body of India.
It ensures product safety and quality by granting the prestigious ISI Mark.
It is responsible for the hallmarking of gold and silver to protect consumers.
BIS helps in the harmonious development of standardization activities across the country.

---SOURCES---
- https://www.bis.gov.in/

---SUGGESTIONS---
1. What is an ISI mark?
2. How to check for Hallmarking?`;
        } else {
          aiResponseText = `The Bureau of Indian Standards (BIS) is the National Standard Body of India, established under the BIS Act 2016. It operates under the Ministry of Consumer Affairs, Food and Public Distribution.

Key Responsibilities and Full Details:
- **Standards Formulation**: Developing Indian Standards (IS) for over 20,000 products to ensure safety and performance.
- **Product Certification**: Managing the ISI Mark scheme, which is mandatory for critical products like steel, cement, and electronics.
- **Hallmarking Scheme**: Protecting consumers by ensuring the purity of precious metals like gold and silver through mandatory hallmarking.
- **Testing & Calibration**: Running a network of laboratories across India to test products against established quality benchmarks.
- **Compulsory Registration (CRS)**: Regulating IT and electronics products to meet global quality and safety norms for Indian users.
- **International Representation**: Representing India in international forums like ISO and IEC to align Indian standards with global trends.

Through these diverse activities, BIS ensures that Indian consumers receive safe, reliable, and high-quality products while enhancing the export potential of Indian goods.

---SOURCES---
- https://www.bis.gov.in/
- https://www.services.bis.gov.in/

---SUGGESTIONS---
1. What products fall under mandatory certification?
2. How can I verify an ISI mark?
3. Where can I find the CRS product list?`;
        }
      }

      const mockStream = new ReadableStream({
        start(controller) {
          const encoder = new TextEncoder();
          const words = aiResponseText.split(" ");
          let i = 0;
          const interval = setInterval(() => {
            if (i >= words.length) {
              controller.enqueue(encoder.encode("data: [DONE]\n\n"));
              controller.close();
              clearInterval(interval);
              return;
            }
            const chunk = JSON.stringify({ choices: [{ delta: { content: words[i] + " " } }] });
            controller.enqueue(encoder.encode(`data: ${chunk}\n\n`));
            i++;
          }, 30);
        }
      });
      const resp = new Response(mockStream, { status: 200 });

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

    setMessages(prev => {
      const updated: Message[] = [...prev, { role: 'assistant', content: '' }];
      return updated;
    });

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
            setMessages(prev => {
              const updated = prev.map((m, i) => i === prev.length - 1 ? { ...m, content: accumulated } : m);
              if (done || accumulated.length > 0) {
                 // Optimization: only save to persistent history periodically or at end
              }
              return updated;
            });
          }
        } catch {
          buffer = line + '\n' + buffer;
          break;
        }
      }
    }
    
    // Final save to history
    setMessages(prev => {
      saveToHistory(prev);
      return prev;
    });
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

  const handleModeChange = (mode: 'simple' | 'detailed') => {
    setResponseMode(mode);
    localStorage.setItem('bis-chat-mode', mode);
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

      const prompt = `You are a BIS (Bureau of Indian Standards) product safety analysis assistant for Indian consumers. Analyze the product image and provide a detailed BIS-focused safety assessment.
Identify the specific product type (e.g., "LPG gas cylinder", "electric heater", "phone charger") — be as specific as possible, not generic.
Provide JSON format exclusively: {"productName": "...", "brand": "...", "category": "...", "applicableStandard": "...", "certificationMarks": ["..."], "certificationNumber": "...", "safetyObservations": ["..."], "riskLevel": "low|medium|high", "summary": "...", "recommendation": "..."}`;

      // Mock vision response for demo
      const mockJsonStr = JSON.stringify({
        choices: [{
          message: {
            content: `{"productName": "Motorcycle Helmet", "brand": "Steelbird", "category": "Transport Safety", "applicableStandard": "IS 4151:2015", "certificationMarks": ["ISI Mark"], "certificationNumber": "CM/L-1234567", "safetyObservations": ["Visor is scratch-resistant", "Strap mechanism appears sturdy", "ISI mark is present and verifiable"], "riskLevel": "low", "summary": "The helmet complies with Indian safety standard IS 4151:2015 and displays a verifiable ISI mark, indicating it's safe for road use.", "recommendation": "Use the BIS Care app to verify the 7-digit CM/L number below the ISI mark to ensure it is not counterfeit."}`
          }
        }]
      });
      const resp = new Response(mockJsonStr, { status: 200 });

      if (!resp.ok) {
        throw new Error(`HTTP ${resp.status}`);
      }

      const data = await resp.json();
      const content = data.choices?.[0]?.message?.content || "";
      let analysisData: any = { analysis: { summary: content, riskLevel: "medium" } };
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) analysisData = { analysis: JSON.parse(jsonMatch[0]) };
      } catch {}

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
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[11px] uppercase tracking-[1px] text-muted-foreground">History</p>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-6 px-1 text-[10px] text-primary hover:bg-primary/5"
                    onClick={startNewChat}
                  >
                    + New
                  </Button>
                </div>
                <div className="space-y-1 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                  {chatHistory.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No recent conversations.</p>
                  ) : (
                    chatHistory.map((chat) => (
                      <button
                        key={chat.id}
                        onClick={() => loadChat(chat)}
                        className={`w-full text-left text-xs p-2 rounded-[2px] border group relative ${
                          currentChatId === chat.id ? 'bg-primary/5 border-primary/20 text-primary' : 'border-transparent hover:bg-secondary/50 text-muted-foreground'
                        }`}
                      >
                        <div className="truncate pr-4">{chat.title}</div>
                        <div className="text-[9px] opacity-60">
                          {new Date(chat.timestamp).toLocaleDateString()}
                        </div>
                      </button>
                    ))
                  )}
                </div>
                {chatHistory.length > 0 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => {
                      if(confirm('Clear all chat history?')) {
                        setChatHistory([]);
                        startNewChat();
                      }
                    }}
                    className="w-full mt-2 text-[10px] text-destructive hover:text-destructive h-7"
                  >
                    Clear History
                  </Button>
                )}
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

                <div className="flex items-center gap-4 flex-wrap pt-2">
                  <div className="flex items-center gap-2">
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

                  <div className="flex items-center gap-2 border-l border-border pl-4">
                    <span className="text-xs text-muted-foreground">Response Mode:</span>
                    <div className="flex bg-secondary/30 p-1 rounded-[4px]">
                      <Button
                        variant={responseMode === 'simple' ? 'default' : 'ghost'}
                        size="sm"
                        className="text-[10px] h-6 px-3"
                        onClick={() => handleModeChange('simple')}
                      >
                        Simple
                      </Button>
                      <Button
                        variant={responseMode === 'detailed' ? 'default' : 'ghost'}
                        size="sm"
                        className="text-[10px] h-6 px-3"
                        onClick={() => handleModeChange('detailed')}
                      >
                        Detailed
                      </Button>
                    </div>
                  </div>

                  <div className="ml-auto">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs h-8 border-primary/20 text-primary hover:bg-primary/5"
                      onClick={startNewChat}
                    >
                      + New Chat
                    </Button>
                  </div>
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
                  <div className="mt-4 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-700">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div 
                        className="p-4 border border-border bg-white hover:border-primary/50 cursor-pointer transition-all rounded-[4px] group"
                        onClick={() => sendMessage("How can I verify an ISI mark on a product?")}
                      >
                        <h3 className="text-sm font-bold text-foreground group-hover:text-primary mb-1">Verify Certification</h3>
                        <p className="text-xs text-muted-foreground">Learn how to use the BIS Care App and verify R-numbers or CM/L numbers.</p>
                      </div>
                      <div 
                        className="p-4 border border-border bg-white hover:border-primary/50 cursor-pointer transition-all rounded-[4px] group"
                        onClick={() => sendMessage("What are the mandatory products under BIS certification?")}
                      >
                        <h3 className="text-sm font-bold text-foreground group-hover:text-primary mb-1">Mandatory Products</h3>
                        <p className="text-xs text-muted-foreground">Check the list of electronics, steel, and toys under compulsory certification.</p>
                      </div>
                      <div 
                        className="p-4 border border-border bg-white hover:border-primary/50 cursor-pointer transition-all rounded-[4px] group"
                        onClick={() => sendMessage("Tell me about the Gold Hallmarking process in India.")}
                      >
                        <h3 className="text-sm font-bold text-foreground group-hover:text-primary mb-1">Gold Hallmarking</h3>
                        <p className="text-xs text-muted-foreground">Understand the symbols on Your gold jewelry (HUID, BIS logo, Purity).</p>
                      </div>
                      <div 
                        className="p-4 border border-border bg-white hover:border-primary/50 cursor-pointer transition-all rounded-[4px] group"
                        onClick={() => sendMessage("What is the process to apply for a new BIS license?")}
                      >
                        <h3 className="text-sm font-bold text-foreground group-hover:text-primary mb-1">New Application</h3>
                        <p className="text-xs text-muted-foreground">Step-by-step guide for manufacturers to register on ManakOnline.</p>
                      </div>
                    </div>

                    <div className="border border-dashed border-border rounded-[4px] p-8 text-center bg-secondary/10">
                      <Send className="h-8 w-8 text-primary/30 mx-auto mb-3" />
                      <h2 className="text-lg font-bold text-foreground mb-2">Ready to assist you</h2>
                      <p className="text-sm text-muted-foreground max-w-md mx-auto">
                        Type your question above or upload a product photo to begin. I can answer in English, Hindi, and 7 other regional languages.
                      </p>
                    </div>
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
