"use client";

import { useEffect, useState, useRef } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { insertWordLesson, getUser } from "@/lib/supabase";
import Stickman, { STICKMAN_POSES, StickmanPose } from "@/components/Stickman";
import JSZip from "jszip";
import { cleanSvgString } from "@/lib/svgUtils";
import AudioRecorder from "@/components/AudioRecorder";

// Lazy-load AudioMixer — only mounts in the admin panel, never affects end users
const AudioMixer = dynamic(() => import("@/components/AudioMixer"), { ssr: false });

interface SVGNode {
  tag: string;
  props: Record<string, any>;
  children?: SVGNode[];
}

const DynamicSVGNode = ({ node }: { node: SVGNode }) => {
  const Tag = node.tag as any;
  
  const sanitizedProps: Record<string, any> = {};
  for (const key in node.props) {
    if (key === "class") {
      sanitizedProps["className"] = node.props[key];
    } else if (key.includes("-") && !key.startsWith("data-") && !key.startsWith("aria-")) {
      const camelKey = key.replace(/-([a-z])/g, (_, g) => g.toUpperCase());
      sanitizedProps[camelKey] = node.props[key];
    } else {
      sanitizedProps[key] = node.props[key];
    }
  }

  if (typeof sanitizedProps.style === "string") {
    const styleObj: Record<string, string> = {};
    sanitizedProps.style.split(";").forEach((pair) => {
      const idx = pair.indexOf(":");
      if (idx !== -1) {
        let key = pair.slice(0, idx).trim();
        const value = pair.slice(idx + 1).trim();
        if (key && value) {
          if (!key.startsWith("--")) {
            key = key.replace(/-([a-z])/g, (_, g) => g.toUpperCase());
          }
          styleObj[key] = value;
        }
      }
    });
    sanitizedProps.style = styleObj;
  }

  return (
    <Tag {...sanitizedProps}>
      {node.children?.map((child, idx) => (
        <DynamicSVGNode key={idx} node={child} />
      ))}
    </Tag>
  );
};

const DEFAULT_SCREENSHOTS = [
  {
    url: "",
    title: "Daily Review Dashboard",
    subtitle: "Spaced repetition schedule tailored to your memory.",
  },
  {
    url: "",
    title: "In-Depth Word Analysis",
    subtitle: "Etymology, mnemonics, and real-world audio examples.",
  },
];

const DEFAULT_TESTIMONIALS = [
  {
    name: "Himanshu",
    initials: "H",
    quote_en: "With VocabPod, even if I forget a word, it comes back to me instantly. I found myself using these words all day...",
    quote_hi: "Vocabpod se shabd bhool jaane par bhi turant yaad aa jate hai, mai dinbhar in shabdo ka use kar raha tha..",
  },
  {
    name: "Naeema",
    initials: "N",
    quote_en: "I never thought learning vocabulary could be this intuitive. The stories just stick in my head when I'm having conversations.",
    quote_hi: "Maine kabhi nahi socha tha vocabulary seekhna itna natural ho sakta hai. Jab main baatcheet karti hu toh kahaniya dimaag mein chapp jati hain.",
  },
  {
    name: "Daksh",
    initials: "D",
    quote_en: "I used to learn new words and then completely blank out when talking. Now I actually find myself using them naturally in conversations.",
    quote_hi: "Main naye words seekhta tha par bolte waqt sab bhool jata tha. Ab main bina soche un words ko conversations mein naturally use karta hu.",
  },
];

const DEFAULT_FAQS = [
  {
    q_en: "Is there a free trial?",
    q_hi: "Kya koi free trial hai?",
    a_en: "The interactive demo above shows exactly how the system works. Since our subscription is extremely affordable at ₹99/month, we don't offer a free trial, but we do offer a 24-hour no-questions-asked money-back guarantee.",
    a_hi: "Upar diya gaya interactive demo dikhata hai ki system kaise kaam karta hai. Kyunki hamara subscription sirf ₹99/month hai, hum free trial nahi dete, par hum 24-hour money-back guarantee zarur dete hain.",
  },
  {
    q_en: "Can I do more than 5 words a day?",
    q_hi: "Kya main din mein 5 se zyada words kar sakta hu?",
    a_en: "No, and that's by design. Our data shows that users who try to do 20+ words a day burn out within a week and forget most of them. 5 words a day ensures maximum retention so they actually appear in your speech.",
    a_hi: "Nahi, aur ye jaanbuch kar kiya gaya hai. Jo log 20+ words ek din mein karte hain wo ek hafte mein thak jate hain aur sab bhool jate hain. 5 words a day se maximum retention hota hai.",
  },
  {
    q_en: "Is this only for English learners?",
    q_hi: "Kya ye sirf English learners ke liye hai?",
    a_en: "VocabPod is designed for anyone who feels at a loss for words while speaking. Whether you are preparing for an interview, an exam, or just want to sound more articulate in daily conversations, this builds practical fluency.",
    a_hi: "VocabPod un sabhi ke liye hai jinhe bolte waqt words yaad aane mein dikkat hoti hai. Chahe aap interview ki taiyari kar rahe ho ya daily conversations improve karna chahte ho.",
  },
  {
    q_en: "How does the Spaced Repetition (SRS) work?",
    q_hi: "Spaced Repetition (SRS) kaise kaam karta hai?",
    a_en: "When you learn a word, our algorithm schedules reviews at optimal forgetting intervals (e.g., 2 days, 4 days, 7 days, 14 days, 30 days). When you log in, your daily session prioritizes these due reviews before showing you new words.",
    a_hi: "Jab aap koi word seekhte hain, hamara algorithm reviews schedule karta hai (jaise 2 din, 4 din, 7 din). Daily session mein aapko pehle purane words review karaye jate hain aur fir naye.",
  },
  {
    q_en: "Do I need to download an app?",
    q_hi: "Kya mujhe koi app download karni padegi?",
    a_en: "No. VocabPod is a Progressive Web App (PWA). You can use it in any browser on your phone or laptop. You can also 'Add to Home Screen' to use it exactly like a native app.",
    a_hi: "Nahi. VocabPod ek Progressive Web App (PWA) hai. Aap isse phone ya laptop ke kisi bhi browser par chala sakte hain aur 'Add to Home Screen' karke native app ki tarah use kar sakte hain.",
  },
  {
    q_en: "What if I miss a day?",
    q_hi: "Agar main kisi din miss kar du toh kya hoga?",
    a_en: "Nothing happens! Your progress doesn't reset. The Spaced Repetition System (SRS) simply pauses and will resurface your due words whenever you return. No guilt, no lost streaks.",
    a_hi: "Kuch nahi hoga! Aapki progress reset nahi hoti. SRS bas pause ho jata hai aur jab aap wapas aayenge tab bache hue words dikhayega. Koi guilt nahi, koi streak loose nahi.",
  },
];

export default function AdminPortal() {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [activeTab, setActiveTab] = useState<"content" | "users" | "inactive" | "storage" | "bugs" | "drafts" | "sales">("content");

  // ── Sales Tab State ────────────────────────────────────────────────────────
  const [salesConfig, setSalesConfig] = useState<any>(null);
  const [isLoadingSales, setIsLoadingSales] = useState(false);
  const [isSavingSales, setIsSavingSales] = useState(false);
  const [salesSaveMsg, setSalesSaveMsg] = useState<{text: string; type: string}>({text: "", type: ""});
  // Preview words
  const [salesWordIds, setSalesWordIds] = useState<string[]>([]);
  const [salesWordsData, setSalesWordsData] = useState<any[]>([]);
  // Screenshots
  const [salesScreenshots, setSalesScreenshots] = useState<{url: string; title: string; subtitle: string}[]>([]);
  const [screenshotFiles, setScreenshotFiles] = useState<Record<number, File>>({});
  // Founder photo
  const [founderPhotoFile, setFounderPhotoFile] = useState<File | null>(null);
  const [founderPhotoUrl, setFounderPhotoUrl] = useState("");
  // Intro video
  const [introVideoUrl, setIntroVideoUrl] = useState("");
  const [introVideoHidden, setIntroVideoHidden] = useState(false);
  // FAQs
  const [salesFaqs, setSalesFaqs] = useState<{q_en: string; a_en: string; q_hi: string; a_hi: string}[]>([]);
  // Testimonials
  const [salesTestimonials, setSalesTestimonials] = useState<{name: string; initials: string; quote_en: string; quote_hi: string}[]>([]);
  
  // Bugs Stats State
  const [bugs, setBugs] = useState<any[]>([]);
  const [isLoadingBugs, setIsLoadingBugs] = useState(false);
  
  // Storage Stats State
  const [storageStats, setStorageStats] = useState<any>(null);
  const [isLoadingStorage, setIsLoadingStorage] = useState(false);
  
  // Content Tab State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [quickImportText, setQuickImportText] = useState("");
  
  // Drafts & Modal States
  const [drafts, setDrafts] = useState<any[]>([]);
  const [quickAddWord, setQuickAddWord] = useState("");
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isGeneratedModalOpen, setIsGeneratedModalOpen] = useState(false);
  const [isRecordingMode, setIsRecordingMode] = useState(false);
  const [isRecordingEditMode, setIsRecordingEditMode] = useState(false);
  const [recordingTimestamps, setRecordingTimestamps] = useState("");
  const [popupMessage, setPopupMessage] = useState<{ text: string, type: 'success' | 'error' | 'info' | '' }>({ text: "", type: "" });
  const [includeAudioDownload, setIncludeAudioDownload] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [masterPromptTemplate, setMasterPromptTemplate] = useState("[WORD] {WORD}\n[PHONETIC] {PHONETIC}\n[TYPE] word\n[DEFINITION] {DEFINITION}\n[NARRATIVE] {NARRATIVE}\n[STORY] {STORY}\n[USAGE] {USAGE}\n[SVG] {SVG}\n[QUIZ_Q] {QUIZ_Q}\n[QUIZ_A1] {QUIZ_A1}\n[QUIZ_A2] {QUIZ_A2}\n[QUIZ_A3] {QUIZ_A3}\n[QUIZ_A4] {QUIZ_A4}\n[QUIZ_EXP] {QUIZ_EXP}");
  const [masterPrompt, setMasterPrompt] = useState("");

  const [word, setWord] = useState("");
  const [phonetic, setPhonetic] = useState("");
    const [definition, setDefinition] = useState("");
  const [narrative, setNarrative] = useState("");
  const [story, setStory] = useState("");
  const [realLifeUsages, setRealLifeUsages] = useState<{context: string, example: string}[]>([{context: "", example: ""}]);
          const [audioFile, setAudioFile] = useState<File | null>(null);
  const [existingAudioUrl, setExistingAudioUrl] = useState("");
    const [svgJson, setSvgJson] = useState('[\n  {"tag": "circle", "props": {"cx": "200", "cy": "150", "r": "20", "fill": "#E04B35"}}\n]');
  const [customSvg, setCustomSvg] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState("");
  const [customStickmans, setCustomStickmans] = useState<any[]>([]);
  const [newStickmanName, setNewStickmanName] = useState("");
  const [newStickmanSvg, setNewStickmanSvg] = useState("");
  
  const [question, setQuestion] = useState("");
  const [opt1, setOpt1] = useState("");
  const [opt2, setOpt2] = useState("");
  const [opt3, setOpt3] = useState("");
  const [opt4, setOpt4] = useState("");
  const [correctOpt, setCorrectOpt] = useState(1);
  const [explanation, setExplanation] = useState("");

  const [users, setUsers] = useState<any[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [selectedDetailUser, setSelectedDetailUser] = useState<any>(null);

  // Words List State
  const [allWords, setAllWords] = useState<any[]>([]);
  const [isManageWordsModalOpen, setIsManageWordsModalOpen] = useState(false);
  const [isLoadingWords, setIsLoadingWords] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ type: 'delete' | 'toggle', userId: string, payload: any } | null>(null);
  const [isActionProcessing, setIsActionProcessing] = useState(false);
  const [inactiveUsers, setInactiveUsers] = useState<any[]>([]);
  const [isLoadingInactive, setIsLoadingInactive] = useState(false);
  const [editorMode, setEditorMode] = useState<{ type: "new" | "draft" | "existing"; id?: string; word?: string }>({ type: "new" });

  const clearEditor = () => {
    setWord("");
    setPhonetic("");
    setDefinition("");
    setNarrative("");
    setStory("");
    setRealLifeUsages([{context: "", example: ""}]);
    setAudioFile(null);
    setExistingAudioUrl("");
    setSvgJson('[\n  {"tag": "circle", "props": {"cx": "200", "cy": "150", "r": "20", "fill": "#E04B35"}}\n]');
    setCustomSvg("");
    setImageFile(null);
    setExistingImageUrl("");
    setQuestion("");
    setOpt1("");
    setOpt2("");
    setOpt3("");
    setOpt4("");
    setCorrectOpt(1);
    setExplanation("");
    setEditorMode({ type: "new" });
    localStorage.removeItem("vocabpod_editor_recovery");
  };

  // Security Check
  useEffect(() => {
    async function checkAuth() {
      const currentUser = await getUser();
      const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "").split(",").map(e => e.trim());
      
      if (!currentUser || !currentUser.email || !adminEmails.includes(currentUser.email)) {
        window.location.href = "/";
      } else {
        setIsAuthorized(true);
        setUserEmail(currentUser.email);
                fetchWordsList(currentUser.email);
        fetchCustomStickmans();
      }
    }
    checkAuth();
  }, []);

  
  useEffect(() => {
    const savedTemplate = localStorage.getItem('vocabpod_master_prompt_template');
    if (savedTemplate) {
      setMasterPromptTemplate(savedTemplate);
    }
    const savedPrompt = localStorage.getItem('vocabpod_master_prompt');
    if (savedPrompt) {
      setMasterPrompt(savedPrompt);
    }
  }, []);

  useEffect(() => {
    const savedDrafts = localStorage.getItem('vocabpod_drafts');
    if (savedDrafts) {
      try {
        setDrafts(JSON.parse(savedDrafts));
      } catch(e) {}
    }
  }, []);

  // Restore active editor session on mount
  useEffect(() => {
    const recovery = localStorage.getItem('vocabpod_editor_recovery');
    if (recovery) {
      try {
        const r = JSON.parse(recovery);
        if (r.word || r.definition || r.story) {
           setWord(r.word || "");
           setPhonetic(r.phonetic || "");
           setDefinition(r.definition || "");
           setNarrative(r.narrative || "");
           setStory(r.story || "");
           setRealLifeUsages(r.realLifeUsages && r.realLifeUsages.length > 0 ? r.realLifeUsages : [{context: "", example: ""}]);
           setSvgJson(r.svgJson || '[\n  {"tag": "circle", "props": {"cx": "200", "cy": "150", "r": "20", "fill": "#E04B35"}}\n]');
           setCustomSvg(r.customSvg || "");
           setQuestion(r.question || "");
           setOpt1(r.opt1 || "");
           setOpt2(r.opt2 || "");
           setOpt3(r.opt3 || "");
           setOpt4(r.opt4 || "");
           setCorrectOpt(r.correctOpt || 1);
           setExplanation(r.explanation || "");
           if (r.editorMode) setEditorMode(r.editorMode);
        }
      } catch (e) {}
    }
  }, []);

  // Auto-save active editor session
  useEffect(() => {
    const timeout = setTimeout(() => {
      const recoveryState = {
        word, phonetic, definition, narrative, story, realLifeUsages,
        svgJson, customSvg, question, opt1, opt2, opt3, opt4,
        correctOpt, explanation, editorMode
      };
      if (word || definition || story || narrative) {
        localStorage.setItem('vocabpod_editor_recovery', JSON.stringify(recoveryState));
      }
    }, 500);
    return () => clearTimeout(timeout);
  }, [word, phonetic, definition, narrative, story, realLifeUsages, svgJson, customSvg, question, opt1, opt2, opt3, opt4, correctOpt, explanation, editorMode]);

  const saveToDraftsRef = useRef<() => void>(() => {});
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCtrl = e.ctrlKey || e.metaKey;
      
      // Ctrl+D (Open / Toggle Draft Board Tab)
      if (isCtrl && !e.shiftKey && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        setActiveTab("drafts");
      }
      
      // Ctrl+Shift+D (Save entered content as Draft)
      if (isCtrl && e.shiftKey && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        saveToDraftsRef.current();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const saveToDrafts = () => {
    if (!word) {
      setPopupMessage({ text: "Please enter a word before saving to drafts.", type: "error" });
      return;
    }
    const existingDraft = drafts.find(d => d.word.toLowerCase() === word.toLowerCase());
    const currentDraft = {
      id: existingDraft?.id || Date.now().toString(),
      word, phonetic, type: "word", definition, narrative, story, realLifeUsages,
      svgJson, customSvg: cleanSvgString(customSvg),
      question, opt1, opt2, opt3, opt4, correctOpt, explanation,
      status: existingDraft?.status || "idea"
    };
    
    const existingIndex = drafts.findIndex(d => d.word.toLowerCase() === word.toLowerCase());
    let newDrafts = [...drafts];
    if (existingIndex !== -1) {
      newDrafts[existingIndex] = currentDraft;
    } else {
      newDrafts.push(currentDraft);
    }
    
    setDrafts(newDrafts);
    localStorage.setItem('vocabpod_drafts', JSON.stringify(newDrafts));
    setPopupMessage({ text: `Draft "${word}" saved successfully!`, type: "success" });
  };

  saveToDraftsRef.current = saveToDrafts;

  const loadDraft = (draft: any) => {
    setWord(draft.word || "");
    setPhonetic(draft.phonetic || "");
    setDefinition(draft.definition || "");
    setNarrative(draft.narrative || "");
    setStory(draft.story || "");
    setRealLifeUsages(draft.realLifeUsages && draft.realLifeUsages.length > 0 ? draft.realLifeUsages : [{context: "", example: ""}]);
    setSvgJson(draft.svgJson || '[\n  {"tag": "circle", "props": {"cx": "200", "cy": "150", "r": "20", "fill": "#E04B35"}}\n]');
    setCustomSvg(draft.customSvg || "");
    setQuestion(draft.question || "");
    setOpt1(draft.opt1 || "");
    setOpt2(draft.opt2 || "");
    setOpt3(draft.opt3 || "");
    setOpt4(draft.opt4 || "");
    setCorrectOpt(draft.correctOpt || 1);
    setExplanation(draft.explanation || "");
    
    setEditorMode({ type: "draft", id: draft.id, word: draft.word });
    setActiveTab("content");
    setPopupMessage({ text: `Draft "${draft.word}" loaded into editor!`, type: "success" });
  };

  const deleteDraft = (id: string) => {
    const newDrafts = drafts.filter(d => d.id !== id);
    setDrafts(newDrafts);
    localStorage.setItem('vocabpod_drafts', JSON.stringify(newDrafts));
    setPopupMessage({ text: "Draft deleted successfully!", type: "success" });
  };

  const moveDraft = (id: string, direction: 'left' | 'right') => {
    const statuses = ['idea', 'processed', 'recorded', 'ready'];
    const newDrafts = drafts.map(d => {
      if (d.id === id) {
        const currentIdx = statuses.indexOf(d.status || 'idea');
        let newIdx = currentIdx;
        if (direction === 'left' && currentIdx > 0) newIdx--;
        if (direction === 'right' && currentIdx < statuses.length - 1) newIdx++;
        return { ...d, status: statuses[newIdx] };
      }
      return d;
    });
    setDrafts(newDrafts);
    localStorage.setItem('vocabpod_drafts', JSON.stringify(newDrafts));
  };

  const updateDraftStatus = (id: string, newStatus: string) => {
    const newDrafts = drafts.map(d => {
      if (d.id === id) {
        return { ...d, status: newStatus };
      }
      return d;
    });
    setDrafts(newDrafts);
    localStorage.setItem('vocabpod_drafts', JSON.stringify(newDrafts));
    setPopupMessage({ text: `Draft moved to ${newStatus.toUpperCase()}`, type: "success" });
  };

  const fetchCustomStickmans = async () => {
    try {
      const res = await fetch("/api/stickmans");
      const data = await res.json();
      setCustomStickmans(data.stickmans || []);
    } catch (e) {}
  };

    const fetchWordsList = async (email: string) => {
    setIsLoadingWords(true);
    try {
      const res = await fetch("/api/words", { headers: { Authorization: `Bearer ${email}` } });
      const data = await res.json();
      setAllWords(data.words || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingWords(false);
    }
  };

  const fetchUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const res = await fetch("/api/admin/users", {
        headers: { "Authorization": `Bearer ${userEmail}` }
      });
      const data = await res.json();
      if (res.ok) setUsers(data.users || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const fetchBugs = async () => {
    setIsLoadingBugs(true);
    try {
      const res = await fetch("/api/admin/bugs", {
        headers: { "Authorization": `Bearer ${userEmail}` }
      });
      const data = await res.json();
      if (res.ok) setBugs(data.bugs || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingBugs(false);
    }
  };

  const handleToggleBugStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "open" ? "resolved" : "open";
    try {
      const res = await fetch("/api/admin/bugs", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${userEmail}`
        },
        body: JSON.stringify({ id, status: newStatus })
      });
      if (res.ok) {
        setBugs(prev => prev.map(b => b.id === id ? { ...b, status: newStatus } : b));
      } else {
        alert("Failed to update bug status");
      }
    } catch (e) {
      console.error(e);
      alert("Error updating bug");
    }
  };

  const handleDeleteUser = async (userId: string, email: string) => {
    try {
      const res = await fetch("/api/admin/users", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${userEmail}`
        },
        body: JSON.stringify({ userId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete user");
      
      setUsers(prev => prev.filter(u => u.id !== userId));
      setMessage({ text: `User "${email}" deleted successfully.`, type: "success" });
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleResetLeaderboard = async () => {
    if (!confirm("Are you SURE you want to reset all user XP to zero? This cannot be undone.")) return;
    
    try {
      const res = await fetch("/api/admin/reset-leaderboard", {
        method: "POST",
        headers: { "Authorization": `Bearer ${userEmail}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to reset leaderboard");
      
      alert("Leaderboard successfully reset to zero!");
      fetchUsers(); // Refresh the list
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleTogglePremium = async (userId: string, currentPremium: boolean) => {
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${userEmail}`
        },
        body: JSON.stringify({ userId, isPremium: !currentPremium })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update subscription");

      setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_premium: !currentPremium } : u));
      setMessage({ text: `User subscription updated successfully.`, type: "success" });
    } catch (e: any) {
      setMessage({ text: e.message || "Failed to update subscription.", type: "error" });
    }
  };

  const fetchStorageStats = async () => {
    setIsLoadingStorage(true);
    try {
      const res = await fetch("/api/admin/storage", {
        headers: { Authorization: `Bearer ${userEmail || ""}` }
      });
      const data = await res.json();
      if (res.ok) {
        setStorageStats(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingStorage(false);
    }
  };

  const formatBytes = (bytes: number, decimals = 2) => {
    if (!bytes) return "0 Bytes";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  };

  useEffect(() => {
    if (activeTab === "users" && isAuthorized) {
      fetchUsers();
    } else if (activeTab === "storage" && isAuthorized) {
      fetchStorageStats();
    }
  }, [activeTab, isAuthorized]);

  const handleQuickImport = () => {
    try {
      const text = quickImportText;
      const getField = (tag: string) => {
        const regex = new RegExp(`\\[${tag}\\]([\\s\\S]*?)(?=\\[[A-Z0-9_]+\\]|$)`);
        const match = text.match(regex);
        return match ? match[1].trim() : "";
      };

      setWord(getField("WORD"));
      setPhonetic(getField("PHONETIC"));
      
            
      setDefinition(getField("DEFINITION"));
      setNarrative(getField("NARRATIVE"));
      setStory(getField("STORY"));
      
      const usage = getField("USAGE");
      if (usage) {
        let parsed = null;
        if (usage.trim().startsWith("[")) {
          try {
            parsed = JSON.parse(usage);
          } catch (e) {
            // Not a valid JSON array, will fallback below
          }
        }

        if (Array.isArray(parsed) && parsed.length > 0) {
          setRealLifeUsages(parsed);
        } else {
          const lines = usage.trim().split("\n").map(l => l.trim()).filter(Boolean);
          const parsedLines = lines.map(l => {
            let lineContent = l;
            if (lineContent.startsWith("[") && lineContent.endsWith("]")) {
              lineContent = lineContent.slice(1, -1).trim();
            }
            const [ctx, ...ex] = lineContent.split("|");
            return { context: ctx.trim(), example: ex.join("|").trim() };
          });
          if (parsedLines.length > 0) setRealLifeUsages(parsedLines);
        }
      }
            
      const svg = getField("SVG");
      if (svg) {
        const trimmedSvg = svg.trim();
        if (trimmedSvg.startsWith("[")) {
          setSvgJson(trimmedSvg);
          setCustomSvg("");
        } else {
          setCustomSvg(trimmedSvg);
          setSvgJson("[]");
        }
      }
      
      setQuestion(getField("QUIZ_Q"));
      setOpt1(getField("QUIZ_A1").replace("[CORRECT]", "").trim());
      setOpt2(getField("QUIZ_A2").replace("[CORRECT]", "").trim());
      setOpt3(getField("QUIZ_A3").replace("[CORRECT]", "").trim());
      setOpt4(getField("QUIZ_A4").replace("[CORRECT]", "").trim());

      if (getField("QUIZ_A1").includes("[CORRECT]")) setCorrectOpt(1);
      if (getField("QUIZ_A2").includes("[CORRECT]")) setCorrectOpt(2);
      if (getField("QUIZ_A3").includes("[CORRECT]")) setCorrectOpt(3);
      if (getField("QUIZ_A4").includes("[CORRECT]")) setCorrectOpt(4);

      setExplanation(getField("QUIZ_EXP"));
      
      setMessage({ text: "Import successful! Review the fields below.", type: "success" });
    } catch (e) {
      setMessage({ text: "Failed to parse syntax.", type: "error" });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setPopupMessage({ text: "Preparing lesson injection...", type: "info" });

    try {
      let finalAudioUrl = existingAudioUrl;

      if (!audioFile && !existingAudioUrl) {
        throw new Error("Please select an audio file first.");
      }

      let parsedSvg;
      try {
        parsedSvg = JSON.parse(svgJson);
      } catch (err) {
        throw new Error("Invalid SVG JSON array format.");
      }

      if (audioFile) {
        setPopupMessage({ text: "Uploading Audio to Cloudflare R2...", type: "info" });
        
        const ext = audioFile.name.split(".").pop();
        const filename = `audio/${word.toLowerCase().replace(/[^a-z0-9]/g, '')}-${Date.now()}.${ext}`;
        
        const presignRes = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ filename, contentType: audioFile.type })
        });
        
        if (!presignRes.ok) throw new Error("Failed to get upload URL");
        
        const { uploadUrl, finalUrl } = await presignRes.json();
        finalAudioUrl = finalUrl;

        if (uploadUrl !== "fallback-mode") {
          const uploadRes = await fetch(uploadUrl, {
            method: "PUT",
            headers: { "Content-Type": audioFile.type },
            body: audioFile
          });
          
          if (!uploadRes.ok) throw new Error("Failed to upload file to Cloudflare");
        }
      }

      let finalImageUrl = existingImageUrl;
      if (imageFile) {
        setPopupMessage({ text: "Uploading Mnemonic Image to Cloudflare R2...", type: "info" });
        const ext = imageFile.name.split(".").pop();
        const filename = `images/${word.toLowerCase().replace(/[^a-z0-9]/g, '')}-${Date.now()}.${ext}`;
        
        const presignRes = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ filename, contentType: imageFile.type })
        });
        
        if (!presignRes.ok) throw new Error("Failed to get upload URL for image");
        
        const { uploadUrl, finalUrl } = await presignRes.json();
        finalImageUrl = finalUrl;

        if (uploadUrl !== "fallback-mode") {
          const uploadRes = await fetch(uploadUrl, {
            method: "PUT",
            headers: { "Content-Type": imageFile.type },
            body: imageFile
          });
          
          if (!uploadRes.ok) throw new Error("Failed to upload image file to Cloudflare");
        }
      }

      setPopupMessage({ text: "All media uploaded. Saving word lesson to database...", type: "info" });

      const payload = {
        word,
        phonetic,
        type: "word",
        definition,
        narrative,
        story,
        real_life_usage: realLifeUsages.filter(u => u.context.trim() || u.example.trim()),
        category: null,
        is_free_preview: false,
        stickman_id: null,
        custom_image_url: finalImageUrl || null,
        custom_svg: cleanSvgString(customSvg) || null,
        audio_url: finalAudioUrl,
        svg_elements: parsedSvg,
        quiz_questions: [
          {
            question,
            options: [
              { text: opt1, isCorrect: correctOpt === 1 },
              { text: opt2, isCorrect: correctOpt === 2 },
              { text: opt3, isCorrect: correctOpt === 3 },
              { text: opt4, isCorrect: correctOpt === 4 },
            ],
            explanation
          }
        ]
      } as any;

      await insertWordLesson(payload);

      fetchStorageStats();
      
      setPopupMessage({ text: `Word "${word}" lesson inserted successfully!`, type: "success" });
      
      // Reset
      setWord(""); setPhonetic(""); setDefinition(""); setNarrative(""); setStory(""); setRealLifeUsages([{context: "", example: ""}]); setAudioFile(null); setSvgJson('[\n  {"tag": "circle", "props": {"cx": "200", "cy": "150", "r": "20", "fill": "#E04B35"}}\n]');
      setQuestion(""); setOpt1(""); setOpt2(""); setOpt3(""); setOpt4(""); setCorrectOpt(1); setExplanation("");
      setExistingAudioUrl("");
      setCustomSvg("");
      setImageFile(null);
      setExistingImageUrl("");
      setEditorMode({ type: "new" });

    } catch (err: any) {
      setPopupMessage({ text: err.message || "Failed to submit word lesson.", type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  
  const generateWordMarkdown = (w: any) => {
    const usages = Array.isArray(w.real_life_usage) 
      ? w.real_life_usage.map((u: any) => `${u.context || ""} | ${u.example || ""}`).join('\n')
      : "";

    let quizQ = "";
    let quizA1 = "";
    let quizA2 = "";
    let quizA3 = "";
    let quizA4 = "";
    let quizExp = "";

    if (Array.isArray(w.quiz_questions) && w.quiz_questions.length > 0) {
      const q = w.quiz_questions[0];
      quizQ = q.question || "";
      quizA1 = (q.options?.[0]?.text || "") + (q.options?.[0]?.isCorrect ? " [CORRECT]" : "");
      quizA2 = (q.options?.[1]?.text || "") + (q.options?.[1]?.isCorrect ? " [CORRECT]" : "");
      quizA3 = (q.options?.[2]?.text || "") + (q.options?.[2]?.isCorrect ? " [CORRECT]" : "");
      quizA4 = (q.options?.[3]?.text || "") + (q.options?.[3]?.isCorrect ? " [CORRECT]" : "");
      quizExp = q.explanation || "";
    }

    const svgStr = w.custom_svg 
      ? w.custom_svg 
      : (w.svg_elements ? JSON.stringify(w.svg_elements, null, 2) : "[]");

    return `[WORD] ${w.word || ""}
[PHONETIC] ${w.phonetic || ""}
[TYPE] word
[DEFINITION] ${w.definition || ""}
[NARRATIVE] ${w.narrative || ""}
[STORY] ${w.story || ""}
[USAGE] ${usages}
[SVG] ${svgStr}
[QUIZ_Q] ${quizQ}
[QUIZ_A1] ${quizA1}
[QUIZ_A2] ${quizA2}
[QUIZ_A3] ${quizA3}
[QUIZ_A4] ${quizA4}
[QUIZ_EXP] ${quizExp}`;
  };

  const handleDownloadAll = async () => {
    setIsDownloading(true);
    setPopupMessage({ text: "Compiling markdown backup files...", type: "info" });
    try {
      const zip = new JSZip();
      
      for (const w of allWords) {
        const mdContent = generateWordMarkdown(w);
        zip.file(`${w.word.toLowerCase().replace(/[^a-z0-9]/g, '')}.md`, mdContent);
        
        if (includeAudioDownload && w.audio_url) {
          setPopupMessage({ text: `Downloading audio for "${w.word}"...`, type: "info" });
          try {
            const res = await fetch(w.audio_url);
            if (res.ok) {
              const blob = await res.blob();
              const ext = w.audio_url.split('.').pop()?.split('?')[0] || 'webm';
              zip.file(`audio/${w.word.toLowerCase().replace(/[^a-z0-9]/g, '')}.${ext}`, blob);
            }
          } catch (err) {
            console.error(`Failed to fetch audio for ${w.word}`, err);
          }
        }
      }
      
      setPopupMessage({ text: "Bundling ZIP archive...", type: "info" });
      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);
      const a = document.createElement("a");
      a.href = url;
      a.download = `vocabpod_words_backup_${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      setPopupMessage({ text: "ZIP Backup successfully downloaded!", type: "success" });
    } catch (err: any) {
      setPopupMessage({ text: err.message || "Failed to download backup.", type: "error" });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadWord = async (w: any) => {
    try {
      const mdContent = generateWordMarkdown(w);
      const wordClean = w.word.toLowerCase().replace(/[^a-z0-9]/g, '');

      if (includeAudioDownload && w.audio_url) {
        setPopupMessage({ text: `Compiling archive for "${w.word}"...`, type: "info" });
        const zip = new JSZip();
        zip.file(`${wordClean}.md`, mdContent);

        try {
          const res = await fetch(w.audio_url);
          if (res.ok) {
            const blob = await res.blob();
            const ext = w.audio_url.split('.').pop()?.split('?')[0] || 'webm';
            zip.file(`${wordClean}.${ext}`, blob);
          }
        } catch (err) {
          console.error(`Failed to fetch audio for ${w.word}`, err);
        }

        const content = await zip.generateAsync({ type: "blob" });
        const url = URL.createObjectURL(content);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${wordClean}_backup.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setPopupMessage({ text: `Backup ZIP for "${w.word}" downloaded!`, type: "success" });
      } else {
        const blob = new Blob([mdContent], { type: "text/markdown;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${wordClean}.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    } catch (err: any) {
      setPopupMessage({ text: err.message || "Failed to download word.", type: "error" });
    }
  };

  const renderWithHighlights = (text: string) => {
    if (!text) return text;
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <span key={i} className="text-terracotta font-bold">{part.slice(2, -2)}</span>;
      }
      return <span key={i}>{part}</span>;
    });
  };

  if (!isAuthorized) return null;

  return (
    <div className="min-h-screen bg-absolute-black text-light-gray font-sans selection:bg-terracotta/20 selection:text-terracotta pb-20">
      {/* Recording mode removed */}

      {/* Navigation Sidebar */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-absolute-black/80 border-b border-terracotta/20 px-4 md:px-6 py-3 md:py-4">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between space-y-3 md:space-y-0">
          <div className="flex items-center space-x-2 md:space-x-4 w-full md:w-auto justify-between md:justify-start">
            <div className="flex items-center space-x-2 md:space-x-4">
              <span className="text-terracotta font-black tracking-tight text-lg md:text-xl">VocabPod Admin</span>
              <span className="text-[10px] md:text-xs font-bold bg-terracotta/20 text-terracotta px-2 py-0.5 rounded uppercase tracking-widest shrink-0">
                God Mode
              </span>
            </div>
            {/* Mobile Exit Link - Visible only on mobile next to title */}
            <div className="flex items-center space-x-3 md:hidden">
              <Link href="/profile" className="text-[10px] font-bold border border-white/10 px-3 py-1.5 rounded-full hover:bg-white/5 transition-colors uppercase shrink-0">
                Exit
              </Link>
            </div>
          </div>
          
          <div className="hidden md:flex items-center space-x-4">
            <Link href="/" className="text-xs font-semibold text-muted-ash hover:text-light-gray shrink-0">
              View Site &rarr;
            </Link>
            <Link href="/profile" className="text-xs font-bold border border-white/10 px-4 py-2 rounded-full hover:bg-white/5 transition-colors uppercase shrink-0">
              Exit Portal
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12">
        
        {/* Tabs */}
        <div className="flex items-center space-x-2 md:space-x-4 mb-6 md:mb-8 border-b border-white/5 pb-4 overflow-x-auto whitespace-nowrap snap-x hide-scrollbar">
          <button 
            onClick={() => setActiveTab("content")}
            className={`text-sm font-bold uppercase tracking-wider px-4 py-2 rounded-full transition-all ${activeTab === "content" ? "bg-terracotta text-light-gray" : "text-muted-ash hover:text-light-gray"}`}
          >
            Content Entry
          </button>
          <button 
            onClick={() => setActiveTab("drafts")}
            className={`text-sm font-bold uppercase tracking-wider px-4 py-2 rounded-full transition-all ${activeTab === "drafts" ? "bg-terracotta text-light-gray" : "text-muted-ash hover:text-light-gray"}`}
          >
            Draft Board
          </button>
          <button 
            onClick={() => { setActiveTab("users"); if (users.length === 0) fetchUsers(); }}
            className={`text-sm font-bold uppercase tracking-wider px-4 py-2 rounded-full transition-all ${activeTab === "users" ? "bg-terracotta text-light-gray" : "text-muted-ash hover:text-light-gray"}`}
          >
            User Management
          </button>
          <button
            onClick={async () => {
              setActiveTab("inactive");
              if (inactiveUsers.length > 0) return;
              setIsLoadingInactive(true);
              try {
                const res = await fetch("/api/admin/inactive", { headers: { Authorization: `Bearer ${userEmail}` } });
                const data = await res.json();
                setInactiveUsers(data.users || []);
              } catch (e) { console.error(e); }
              finally { setIsLoadingInactive(false); }
            }}
            className={`text-sm font-bold uppercase tracking-wider px-4 py-2 rounded-full transition-all ${activeTab === "inactive" ? "bg-terracotta text-light-gray" : "text-muted-ash hover:text-light-gray"}`}
          >
            Inactive Users
          </button>
          <button
            onClick={() => {
              setActiveTab("storage");
              fetchStorageStats();
            }}
            className={`text-sm font-bold uppercase tracking-wider px-4 py-2 rounded-full transition-all ${activeTab === "storage" ? "bg-terracotta text-light-gray" : "text-muted-ash hover:text-light-gray"}`}
          >
            Storage
          </button>
          <button
            onClick={() => {
              setActiveTab("bugs");
              if (bugs.length === 0) fetchBugs();
            }}
            className={`text-sm font-bold uppercase tracking-wider px-4 py-2 rounded-full transition-all ${activeTab === "bugs" ? "bg-terracotta text-light-gray" : "text-muted-ash hover:text-light-gray"}`}
          >
            Bug Reports
          </button>
          <button
            onClick={async () => {
              setActiveTab("sales");
              if (salesConfig) return;
              setIsLoadingSales(true);
              try {
                const res = await fetch("/api/admin/sales", { headers: { Authorization: `Bearer ${userEmail}` } });
                const data = await res.json();
                if (res.ok && data.config) {
                  const c = data.config;
                  setSalesConfig(c);
                  setSalesWordIds(c.preview_word_ids || []);
                  setSalesWordsData(c.preview_words_data || []);
                  setSalesScreenshots(c.screenshots && c.screenshots.length > 0 ? c.screenshots : DEFAULT_SCREENSHOTS);
                  setFounderPhotoUrl(c.founder_photo_url || "");
                  setIntroVideoUrl(c.intro_video_url || "");
                  setIntroVideoHidden(c.intro_video_hidden || false);
                  setSalesFaqs((c.faqs && c.faqs.length > 0 ? c.faqs : DEFAULT_FAQS).map((f: any) => ({ q_en: f.q_en || "", a_en: f.a_en || "", q_hi: f.q_hi || "", a_hi: f.a_hi || "" })));
                  setSalesTestimonials((c.testimonials && c.testimonials.length > 0 ? c.testimonials : DEFAULT_TESTIMONIALS).map((t: any) => ({ name: t.name || "", initials: t.initials || "", quote_en: t.quote_en || "", quote_hi: t.quote_hi || "" })));
                }
              } catch (e) { console.error(e); }
              finally { setIsLoadingSales(false); }
            }}
            className={`text-sm font-bold uppercase tracking-wider px-4 py-2 rounded-full transition-all shrink-0 ${activeTab === "sales" ? "bg-terracotta text-light-gray" : "text-muted-ash hover:text-light-gray"}`}
          >
            🛍 Sales Page
          </button>
        </div>

        {message.text && (
          <div className={`p-4 rounded-xl mb-8 border font-bold text-sm max-w-3xl ${
            message.type === 'success' 
              ? 'bg-emerald-950/30 text-terracotta border-terracotta/30' 
              : 'bg-dark-blush text-terracotta border-terracotta/30'
          }`}>
            {message.text}
          </div>
        )}

        {/* ===================== DRAFT BOARD TAB ===================== */}
        {activeTab === "drafts" && (
          <div className="space-y-8 animate-fadeIn">
            <div>
              <h1 className="text-3xl font-black tracking-tight text-light-gray uppercase">Kanban Draft Board</h1>
              <p className="text-xs text-muted-ash mt-1">Manage and transition lesson drafts through your production workflow.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
              {[
                { title: "Word ideas", status: "idea" },
                { title: "Word processed", status: "processed" },
                { title: "Audio recorded", status: "recorded" },
                { title: "Audio edited, ready to publish", status: "ready" }
              ].map(col => {
                const colDrafts = drafts.filter(d => (d.status || 'idea') === col.status);
                return (
                  <div key={col.status} className="bg-card-gray border border-white/5 rounded-3xl p-5 space-y-4 shadow-xl">
                    <div className="flex items-center justify-between pb-3 border-b border-white/5">
                      <span className="text-xs font-black uppercase tracking-widest text-terracotta">{col.title}</span>
                      <span className="text-[10px] font-black bg-white/5 text-muted-ash px-2 py-0.5 rounded-full">{colDrafts.length}</span>
                    </div>

                    <div className="space-y-3 min-h-[300px] flex flex-col justify-start">
                      {col.status === 'idea' && (
                        <form 
                          onSubmit={(e) => {
                            e.preventDefault();
                            if (!quickAddWord.trim()) return;
                            const newDraft = {
                              id: "", word: "", phonetic: "", type: "noun", definition: "", narrative: "", story: "", realLifeUsages: [{context: "", example: ""}],
                              svgJson: "", customSvg: "",
                              question: "", opt1: "", opt2: "", opt3: "", opt4: "", correctOpt: 1, explanation: "",
                              status: "idea"
                            };
                            const newDrafts = [...drafts, newDraft];
                            setDrafts(newDrafts);
                            localStorage.setItem('vocabpod_drafts', JSON.stringify(newDrafts));
                            setQuickAddWord("");
                            setPopupMessage({ text: `Draft "${newDraft.word}" added successfully!`, type: "success" });
                          }}
                          className="flex gap-2 mb-2"
                        >
                          <input
                            type="text"
                            value={quickAddWord}
                            onChange={e => setQuickAddWord(e.target.value)}
                            placeholder="Add new word..."
                            className="flex-1 bg-deep-canvas border border-white/10 rounded-lg p-2 text-xs focus:outline-none focus:border-terracotta/50"
                          />
                          <button type="submit" className="bg-terracotta hover:bg-terracotta/80 text-light-gray px-3 py-2 rounded-lg text-xs font-bold transition-all">+</button>
                        </form>
                      )}
                      {colDrafts.length === 0 ? (
                        <div className="flex-1 flex items-center justify-center border border-dashed border-white/5 rounded-2xl p-6 text-center text-xs text-muted-ash/40">
                          Empty
                        </div>
                      ) : (
                        colDrafts.map(d => (
                          <div key={d.id} className="bg-deep-canvas border border-white/5 p-4 rounded-2xl hover:border-terracotta/20 transition-all space-y-3 shadow-lg relative group">
                            <div>
                              <h4 className="font-bold text-light-gray text-sm break-words">{d.word}</h4>
                            </div>

                            <div className="flex justify-between items-center pt-2 border-t border-white/5">
                              <div className="flex gap-1">
                                {col.status !== 'idea' && (
                                  <button
                                    onClick={() => moveDraft(d.id, 'left')}
                                    className="text-[10px] bg-white/5 hover:bg-white/10 text-muted-ash hover:text-white px-2 py-1 rounded transition-colors font-black"
                                    title="Move Left"
                                  >
                                    &larr;
                                  </button>
                                )}
                                {col.status !== 'ready' && (
                                  <button
                                    onClick={() => moveDraft(d.id, 'right')}
                                    className="text-[10px] bg-white/5 hover:bg-white/10 text-muted-ash hover:text-white px-2 py-1 rounded transition-colors font-black"
                                    title="Move Right"
                                  >
                                    &rarr;
                                  </button>
                                )}
                              </div>

                              <div className="flex gap-2">
                                <button
                                  onClick={() => {
                                    loadDraft(d);
                                    setIsRecordingMode(true);
                                  }}
                                  className="text-[10px] font-bold text-white bg-terracotta/20 hover:bg-terracotta px-2 py-0.5 rounded transition-colors uppercase tracking-wider flex items-center gap-1"
                                >
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
                                  Record
                                </button>
                                <button
                                  onClick={() => loadDraft(d)}
                                  className="text-[10px] font-bold text-terracotta hover:underline uppercase tracking-wider"
                                >
                                  Load
                                </button>
                                <button
                                  onClick={() => {
                                    if (confirm(`Are you sure you want to permanently delete draft "${d.word}"?`)) {
                                      deleteDraft(d.id);
                                    }
                                  }}
                                  className="text-[10px] font-bold text-dark-blush hover:text-terracotta uppercase tracking-wider transition-colors"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ===================== USERS TAB ===================== */}
        {activeTab === "users" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold tracking-tight">Registered Users</h1>
              <button 
                onClick={handleResetLeaderboard}
                className="bg-dark-blush hover:bg-terracotta hover:text-light-gray text-terracotta text-sm font-bold uppercase tracking-wider px-4 py-2 rounded-xl border border-terracotta/20 transition-all shadow-xl"
              >
                Reset Leaderboard
              </button>
            </div>
            {isLoadingUsers ? (
              <div className="text-muted-ash animate-pulse">Loading users...</div>
            ) : (
              <div className="bg-card-gray border border-white/5 rounded-3xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                <table className="w-full text-left text-sm min-w-[700px]">
                  <thead className="bg-white/5 text-muted-ash font-bold uppercase tracking-wider text-xs">
                    <tr>
                      <th className="px-6 py-4">Email</th>
                      <th className="px-6 py-4">Joined</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Words Learned</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {users.map((u: any) => (
                      <tr key={u.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4 font-semibold text-light-gray">{u.email}</td>
                        <td className="px-6 py-4 text-muted-ash">{new Date(u.created_at).toLocaleDateString()}</td>
                        <td className="px-6 py-4">
                          <span className={`text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full border ${
                            u.is_premium 
                              ? "bg-emerald-950/30 text-terracotta border-terracotta/30" 
                              : "bg-dark-blush text-terracotta border-terracotta/30"
                          }`}>
                            {u.is_premium ? "Premium" : "Free"}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-bold text-terracotta">
                          {u.words_learned} <span className="text-muted-ash font-normal">words</span>
                        </td>
                        <td className="px-6 py-4 text-right space-x-2">
                          <button 
                            onClick={() => setSelectedDetailUser(u)}
                            className="bg-white/5 hover:bg-white/10 text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg border border-white/10 transition-colors"
                          >
                            Details
                          </button>
                          <button 
                            onClick={() => setConfirmAction({ type: 'toggle', userId: u.id, payload: u.is_premium })}
                            className="bg-emerald-950/20 hover:bg-terracotta/80/20 text-terracotta text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg border border-terracotta/20 transition-colors"
                          >
                            Toggle Tier
                          </button>
                          <button 
                            onClick={() => setConfirmAction({ type: 'delete', userId: u.id, payload: u.email })}
                            className="bg-dark-blush hover:bg-terracotta hover:text-light-gray text-terracotta text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg border border-terracotta/20 transition-all"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* User Details Modal */}
        {selectedDetailUser && (
          <div className="fixed inset-0 z-50 bg-absolute-black/80 backdrop-blur-md flex items-center justify-center p-6">
            <div className="bg-card-gray border border-terracotta/20 rounded-3xl p-8 max-w-md w-full relative shadow-2xl space-y-6">
              <button 
                onClick={() => setSelectedDetailUser(null)}
                className="absolute top-4 right-4 text-muted-ash hover:text-light-gray font-bold text-lg"
              >
                ✕
              </button>
              <h2 className="text-xl font-black text-light-gray uppercase tracking-tight">User Details</h2>
              <div className="space-y-4 text-sm">
                <div>
                  <span className="text-xs font-bold text-muted-ash uppercase block">User ID</span>
                  <span className="font-mono text-xs text-terracotta bg-deep-canvas px-2 py-1 rounded select-all">{selectedDetailUser.id}</span>
                </div>
                <div>
                  <span className="text-xs font-bold text-muted-ash uppercase block">Email Address</span>
                  <span className="text-light-gray select-all">{selectedDetailUser.email}</span>
                </div>
                <div>
                  <span className="text-xs font-bold text-muted-ash uppercase block">Auth Provider</span>
                  <span className="text-light-gray uppercase font-semibold text-xs tracking-wider">{selectedDetailUser.provider}</span>
                </div>
                <div>
                  <span className="text-xs font-bold text-muted-ash uppercase block">Phone Number</span>
                  <span className="text-light-gray">{selectedDetailUser.phone}</span>
                </div>
                <div>
                  <span className="text-xs font-bold text-muted-ash uppercase block">Join Date</span>
                  <span className="text-light-gray">{new Date(selectedDetailUser.created_at).toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-xs font-bold text-muted-ash uppercase block">Last Active / Sign-In</span>
                  <span className="text-light-gray">
                    {selectedDetailUser.last_sign_in_at 
                      ? new Date(selectedDetailUser.last_sign_in_at).toLocaleString() 
                      : "Never signed in"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Confirmation Modal */}
        {confirmAction && (
          <div className="fixed inset-0 z-[60] bg-absolute-black/80 backdrop-blur-md flex items-center justify-center p-6">
            <div className="bg-card-gray border border-terracotta/20 rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl space-y-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-terracotta/5 to-transparent pointer-events-none"></div>
              
              <h2 className="text-xl font-black text-light-gray uppercase tracking-tight relative z-10">Confirm Action</h2>
              
              <p className="text-muted-ash text-sm relative z-10">
                {confirmAction.type === 'delete' 
                  ? `Are you absolutely sure you want to permanently delete user "${confirmAction.payload}"? This cannot be undone.` 
                  : `Are you sure you want to ${confirmAction.payload ? 'revoke' : 'grant'} Premium access for this user?`}
              </p>
              
              <div className="relative z-10">
                {isActionProcessing ? (
                  <div className="py-2 text-terracotta animate-pulse font-bold uppercase tracking-widest text-sm flex items-center justify-center space-x-2">
                    <div className="w-4 h-4 border-2 border-terracotta border-t-transparent rounded-full animate-spin"></div>
                    <span>Processing...</span>
                  </div>
                ) : (
                  <div className="flex space-x-4">
                    <button 
                      onClick={() => setConfirmAction(null)}
                      className="flex-1 bg-white/5 text-light-gray py-3 rounded-xl font-bold uppercase text-xs hover:bg-white/10 transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={async () => {
                        setIsActionProcessing(true);
                        
                        // Enforce 2 second wait time as requested
                        await new Promise(resolve => setTimeout(resolve, 2000));
                        
                        if (confirmAction.type === 'delete') {
                          await handleDeleteUser(confirmAction.userId, confirmAction.payload);
                        } else {
                          await handleTogglePremium(confirmAction.userId, confirmAction.payload);
                        }
                        
                        setIsActionProcessing(false);
                        setConfirmAction(null);
                      }}
                      className="flex-1 bg-dark-blush border border-terracotta/30 text-terracotta py-3 rounded-xl font-bold uppercase text-xs hover:bg-terracotta hover:text-light-gray transition-colors"
                    >
                      Confirm
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ===================== INACTIVE USERS TAB ===================== */}
        {activeTab === "inactive" && (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-light-gray uppercase">Inactive Users</h1>
              <p className="text-sm text-muted-ash mt-1">Users who have not opened the site in the last 2 days.</p>
            </div>

            {isLoadingInactive ? (
              <div className="text-muted-ash animate-pulse">Fetching inactive users...</div>
            ) : inactiveUsers.length === 0 ? (
              <div className="bg-card-gray border border-white/5 rounded-2xl p-8 text-center text-muted-ash">
                All users are active. Great retention!
              </div>
            ) : (
              <div className="space-y-3">
                {inactiveUsers.map(u => (
                  <div key={u.id} className="bg-card-gray border border-white/5 rounded-2xl p-5 flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2.5">
                        <p className="font-bold text-light-gray">{u.email}</p>
                        {u.is_premium ? (
                          <span className="text-[9px] font-black bg-terracotta/20 text-terracotta px-2 py-0.5 rounded uppercase tracking-widest shrink-0 border border-terracotta/10">
                            Premium
                          </span>
                        ) : (
                          <span className="text-[9px] font-black bg-white/5 text-muted-ash px-2 py-0.5 rounded uppercase tracking-widest shrink-0 border border-white/5">
                            Free
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-ash">
                        Last active: {u.last_active_date ? new Date(u.last_active_date).toLocaleString() : "Never"}
                      </p>
                    </div>
                    {u.phone ? (
                      <a
                        href={`https://wa.me/${u.phone.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-2 bg-emerald-900/30 border border-terracotta/20 text-terracotta text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full hover:bg-terracotta/80/20 transition-colors"
                      >
                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                        </svg>
                        <span>Message</span>
                      </a>
                    ) : (
                      <span className="text-xs text-muted-ash/50">No phone on file</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ===================== STORAGE TAB ===================== */}
        {activeTab === "storage" && (
          <div className="space-y-8 animate-fadeIn">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-black tracking-tight text-light-gray uppercase">Storage Metrics</h1>
                <p className="text-xs text-muted-ash mt-1">Real-time disk space and Cloudflare R2 bucket consumption.</p>
              </div>
              <button 
                onClick={fetchStorageStats}
                disabled={isLoadingStorage}
                className="bg-white/5 hover:bg-white/10 text-light-gray text-xs font-bold uppercase tracking-widest px-4 py-2.5 rounded-full border border-white/10 transition-all flex items-center space-x-2"
              >
                {isLoadingStorage ? (
                  <div className="w-3.5 h-3.5 border-2 border-t-transparent border-light-gray rounded-full animate-spin" />
                ) : (
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89M9 11l3 3L21 5" />
                  </svg>
                )}
                <span>{isLoadingStorage ? "Recalculating..." : "Refresh"}</span>
              </button>
            </div>

            {isLoadingStorage && !storageStats ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <div className="w-8 h-8 rounded-full border-2 border-t-transparent border-terracotta animate-spin" />
                <span className="text-xs font-bold tracking-widest text-muted-ash uppercase">Calculating Storage Footprint...</span>
              </div>
            ) : storageStats ? (
              <>
                {/* Fallback Mode Alert */}
                {storageStats.isFallbackMode && (
                  <div className="bg-amber-950/20 border border-amber-500/20 rounded-2xl p-4 flex items-start space-x-3">
                    <svg className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div>
                      <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider">Cloudflare R2 Offline / Fallback Simulation Mode</h4>
                      <p className="text-[11px] text-muted-ash/80 mt-1 leading-relaxed">
                        Cloudflare R2 credentials (R2_ACCOUNT_ID, R2_BUCKET_NAME, etc.) are not fully configured in your local environment.
                        Audio and image sizes are dynamically estimated based on database assets (250 KB per audio track, 150 KB per visual mnemonic).
                      </p>
                    </div>
                  </div>
                )}

                {/* Total Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  {/* Total Storage */}
                  <div className="bg-card-gray border border-white/5 rounded-3xl p-6 relative overflow-hidden shadow-2xl md:col-span-2">
                    <div className="absolute inset-0 bg-gradient-to-r from-terracotta/5 to-transparent pointer-events-none" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-ash">Total Consumption</span>
                    <h2 className="text-4xl font-black text-light-gray mt-2 tracking-tight">
                      {formatBytes(storageStats.audioSize + storageStats.imageSize + storageStats.totalTextSize)}
                    </h2>
                    <p className="text-[11px] text-muted-ash/70 mt-1">Combined size of text, audio, and visual mnemonic files.</p>
                  </div>

                  {/* Audio Storage */}
                  <div className="bg-card-gray border border-white/5 rounded-3xl p-6 shadow-2xl">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-muted-ash">Audio</span>
                      <span className="w-2 h-2 rounded-full bg-terracotta" />
                    </div>
                    <h2 className="text-2xl font-black text-terracotta tracking-tight">
                      {formatBytes(storageStats.audioSize)}
                    </h2>
                    <p className="text-[10px] text-muted-ash mt-1">{storageStats.mediaCount.audio} sound recordings</p>
                  </div>

                  {/* Visual Storage */}
                  <div className="bg-card-gray border border-white/5 rounded-3xl p-6 shadow-2xl">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-muted-ash">Images / SVGs</span>
                      <span className="w-2 h-2 rounded-full bg-sky-400" />
                    </div>
                    <h2 className="text-2xl font-black text-sky-400 tracking-tight">
                      {formatBytes(storageStats.imageSize)}
                    </h2>
                    <p className="text-[10px] text-muted-ash mt-1">{storageStats.mediaCount.images} mnemonics & SVGs</p>
                  </div>
                </div>

                {/* Storage Percentage Bar */}
                <div className="bg-card-gray border border-white/5 rounded-3xl p-6 space-y-4 shadow-2xl">
                  <h3 className="text-xs font-black uppercase tracking-widest text-muted-ash">Storage Distribution</h3>
                  {(() => {
                    const total = storageStats.audioSize + storageStats.imageSize + storageStats.totalTextSize || 1;
                    const audioPct = (storageStats.audioSize / total) * 100;
                    const imagePct = (storageStats.imageSize / total) * 100;
                    const textPct = (storageStats.totalTextSize / total) * 100;

                    return (
                      <div className="space-y-4">
                        <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden flex">
                          <div className="bg-terracotta transition-all duration-500" style={{ width: `${audioPct}%` }} title={`Audio: ${audioPct.toFixed(1)}%`} />
                          <div className="bg-sky-400 transition-all duration-500" style={{ width: `${imagePct}%` }} title={`Images: ${imagePct.toFixed(1)}%`} />
                          <div className="bg-amber-400 transition-all duration-500" style={{ width: `${textPct}%` }} title={`Text: ${textPct.toFixed(1)}%`} />
                        </div>
                        <div className="flex flex-wrap gap-6 text-[11px] font-bold text-muted-ash">
                          <div className="flex items-center space-x-2">
                            <span className="w-2.5 h-2.5 rounded bg-terracotta" />
                            <span>Audio ({audioPct.toFixed(1)}%)</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="w-2.5 h-2.5 rounded bg-sky-400" />
                            <span>Images ({imagePct.toFixed(1)}%)</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="w-2.5 h-2.5 rounded bg-amber-400" />
                            <span>Text Database ({textPct.toFixed(1)}%)</span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Breakdown Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Database Breakdown */}
                  <div className="bg-card-gray border border-white/5 rounded-3xl p-6 space-y-4 shadow-2xl">
                    <h3 className="text-xs font-black uppercase tracking-widest text-muted-ash">Database Size Breakdown</h3>
                    <div className="divide-y divide-white/5">
                      <div className="py-3 flex items-center justify-between text-xs">
                        <div>
                          <span className="font-bold text-light-gray block">Words Table</span>
                          <span className="text-[10px] text-muted-ash">{storageStats.textBreakdown.words.count} lessons</span>
                        </div>
                        <span className="font-bold text-light-gray">{formatBytes(storageStats.textBreakdown.words.size)}</span>
                      </div>
                      <div className="py-3 flex items-center justify-between text-xs">
                        <div>
                          <span className="font-bold text-light-gray block">User Progress Table</span>
                          <span className="text-[10px] text-muted-ash">{storageStats.textBreakdown.progress.count} sync states</span>
                        </div>
                        <span className="font-bold text-light-gray">{formatBytes(storageStats.textBreakdown.progress.size)}</span>
                      </div>
                      <div className="py-3 flex items-center justify-between text-xs">
                        <div>
                          <span className="font-bold text-light-gray block">User Profiles Table</span>
                          <span className="text-[10px] text-muted-ash">{storageStats.textBreakdown.profiles.count} profiles</span>
                        </div>
                        <span className="font-bold text-light-gray">{formatBytes(storageStats.textBreakdown.profiles.size)}</span>
                      </div>
                      <div className="py-3 flex items-center justify-between text-xs">
                        <div>
                          <span className="font-bold text-light-gray block">Subscriptions Table</span>
                          <span className="text-[10px] text-muted-ash">{storageStats.textBreakdown.subscriptions.count} records</span>
                        </div>
                        <span className="font-bold text-light-gray">{formatBytes(storageStats.textBreakdown.subscriptions.size)}</span>
                      </div>
                    </div>
                  </div>

                  {/* S3/R2 Details */}
                  <div className="bg-card-gray border border-white/5 rounded-3xl p-6 space-y-4 shadow-2xl flex flex-col justify-between">
                    <div>
                      <h3 className="text-xs font-black uppercase tracking-widest text-muted-ash">Storage Connection Info</h3>
                      <div className="mt-4 space-y-3 text-xs text-muted-ash">
                        <div className="flex justify-between">
                          <span>Bucket Name:</span>
                          <span className="font-bold text-light-gray">{storageStats.bucketName || "N/A"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Connection Type:</span>
                          <span className="font-bold text-light-gray">{storageStats.bucketName ? "Cloudflare S3 R2 API" : "Simulated Local Database fallback"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Region:</span>
                          <span className="font-bold text-light-gray">auto (Cloudflare)</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-deep-canvas border border-white/5 p-4 rounded-2xl text-[10px] text-muted-ash/80 mt-4 leading-relaxed">
                      💡 <strong>Tip:</strong> Storage metrics are recalculated automatically on demand. To reduce media costs, optimize audio compression (e.g. use standard Mono 64kbps MP3s) and limit custom visual image sizes to under 300KB.
                    </div>
                  </div>
                </div>
              </>
            ) : null}
          </div>
        )}

        {/* ===================== BUGS TAB ===================== */}
        {activeTab === "bugs" && (
          <div className="space-y-8 animate-fadeIn">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-black tracking-tight text-light-gray uppercase">Bug Reports</h1>
                <p className="text-xs text-muted-ash mt-1">User submitted bug reports and feedback.</p>
              </div>
              <button 
                onClick={fetchBugs}
                disabled={isLoadingBugs}
                className="bg-white/5 hover:bg-white/10 text-light-gray text-xs font-bold uppercase tracking-widest px-4 py-2.5 rounded-full border border-white/10 transition-all flex items-center space-x-2"
              >
                {isLoadingBugs ? (
                  <div className="w-3.5 h-3.5 border-2 border-t-transparent border-light-gray rounded-full animate-spin" />
                ) : (
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89M9 11l3 3L21 5" />
                  </svg>
                )}
                <span>Refresh</span>
              </button>
            </div>

            <div className="bg-card-gray border border-white/5 rounded-3xl p-8 shadow-xl">
              {isLoadingBugs ? (
                <div className="text-muted-ash animate-pulse">Loading bug reports...</div>
              ) : bugs.length === 0 ? (
                <div className="text-muted-ash py-8 text-center font-medium">No bug reports found.</div>
              ) : (
                <div className="space-y-4">
                  {bugs.map((bug) => (
                    <div key={bug.id} className="bg-deep-canvas border border-white/5 p-5 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-terracotta/20 transition-all">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-3">
                          <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border ${bug.status === "open" ? "text-amber-400 border-amber-500/20 bg-amber-950/20" : "text-terracotta border-terracotta/20 bg-emerald-950/20"}`}>
                            {bug.status}
                          </span>
                          <span className="text-[10px] text-muted-ash uppercase tracking-widest">
                            {new Date(bug.created_at).toLocaleString()}
                          </span>
                          {bug.user?.email && (
                            <span className="text-[10px] text-muted-ash bg-white/5 px-2 py-0.5 rounded-full">
                              User: {bug.user.email}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-light-gray mt-2 break-words max-w-3xl">
                          {bug.description}
                        </p>
                      </div>
                      <button
                        onClick={() => handleToggleBugStatus(bug.id, bug.status)}
                        className={`text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full border transition-all shrink-0 ${
                          bug.status === "open" 
                            ? "border-terracotta/30 text-terracotta hover:bg-terracotta/10" 
                            : "border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
                        }`}
                      >
                        {bug.status === "open" ? "Mark Resolved" : "Reopen"}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===================== CONTENT TAB ===================== */}
        {activeTab === "content" && (
          <div className="space-y-12">
            
            {/* Manage Existing Words Launcher */}
            <div className="bg-card-gray border border-white/5 rounded-3xl p-8 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <h2 className="text-xl font-bold tracking-tight">Manage Published Words</h2>
                <p className="text-xs text-muted-ash mt-1">Review, delete, or backup your system vocabulary ({allWords.length} words).</p>
              </div>
              <button
                onClick={() => setIsManageWordsModalOpen(true)}
                className="bg-white/5 hover:bg-white/10 text-light-gray font-bold px-6 py-3 rounded-full border border-white/10 transition-all uppercase tracking-widest text-xs whitespace-nowrap"
              >
                View & Manage Words
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              <div className="lg:col-span-5 bg-card-gray border border-terracotta/20 rounded-3xl p-6 md:p-8 shadow-2xl lg:sticky lg:top-24 lg:max-h-[85vh] overflow-y-auto overflow-x-hidden custom-scrollbar">
                <h2 className="text-sm font-bold uppercase tracking-widest text-terracotta mb-4 flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  Strict Syntax Importer
                </h2>
                <textarea 
                  value={quickImportText}
                  onChange={e => setQuickImportText(e.target.value)}
                  placeholder="[WORD] Ephemeral&#10;[PHONETIC] /ɪˈfemərəl/&#10;[TYPE] adjective&#10;[DEFINITION] ...&#10;[NARRATIVE] ...&#10;[USAGE] Context | Example sentence&#10;[SVG] [{...}]&#10;[QUIZ_Q] ...&#10;[QUIZ_A1] answer 1 [CORRECT]&#10;[QUIZ_A2] answer 2&#10;[QUIZ_A3] answer 3&#10;[QUIZ_A4] answer 4&#10;[QUIZ_EXP] ..."
                  className="w-full bg-deep-canvas border border-white/10 rounded-xl p-4 focus:outline-none focus:border-terracotta/50 min-h-[300px] text-xs font-mono text-muted-ash leading-relaxed"
                />
                <button 
                  onClick={handleQuickImport}
                  className="w-full mt-4 bg-white/10 text-light-gray font-bold py-3 rounded-xl hover:bg-white/20 transition-all text-xs uppercase tracking-wider"
                >
                  Auto-Fill Form Below &darr;
                </button>

                
                
                
                <div className="mt-8 border-t border-white/5 pt-6 space-y-6">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-terracotta mb-2 flex justify-between items-center">
                    Master Prompt Generator
                  </h3>
                  
                  {/* Master Template Card */}
                  <div className="bg-absolute-black/40 border border-white/5 rounded-2xl p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-muted-ash uppercase flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5 text-terracotta" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        Master Template
                      </label>
                      <div className="flex gap-1.5">
                        <button type="button" onClick={() => setIsTemplateModalOpen(true)} className="text-[10px] text-light-gray hover:text-white uppercase font-bold px-2 py-1 bg-white/5 hover:bg-white/10 rounded flex items-center gap-1 border border-white/5">
                          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 3h6v6" /><path d="M9 21H3v-6" /><path d="M21 3l-7 7" /><path d="M3 21l7-7" /></svg>
                          Expand
                        </button>
                        <button type="button" onClick={() => {
                          navigator.clipboard.writeText(masterPromptTemplate);
                          alert("Template copied to clipboard!");
                        }} className="text-[10px] text-light-gray hover:text-white uppercase font-bold px-2 py-1 bg-white/5 hover:bg-white/10 rounded flex items-center gap-1 border border-white/5">
                          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
                          Copy
                        </button>
                        <button type="button" onClick={() => {
                          localStorage.setItem('vocabpod_master_prompt_template', masterPromptTemplate);
                          alert("Template saved!");
                        }} className="text-[10px] text-terracotta hover:text-white uppercase font-bold px-2 py-1 bg-terracotta/10 rounded">Save</button>
                        <button type="button" onClick={() => {
                          localStorage.removeItem('vocabpod_master_prompt_template');
                          alert("Template deleted!");
                        }} className="text-[10px] text-red-500 hover:text-white uppercase font-bold px-2 py-1 bg-red-500/10 rounded">Delete</button>
                      </div>
                    </div>
                    <textarea 
                      value={masterPromptTemplate}
                      onChange={e => setMasterPromptTemplate(e.target.value)}
                      placeholder="Use {WORD}, {PHONETIC}, {DEFINITION}, etc."
                      className="w-full bg-deep-canvas border border-white/10 rounded-xl p-3 focus:outline-none focus:border-terracotta/50 min-h-[140px] text-[10px] font-mono text-light-gray leading-relaxed custom-scrollbar"
                    />
                  </div>

                  {/* Generated Prompt Card */}
                  <div className="bg-absolute-black/40 border border-white/5 rounded-2xl p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-muted-ash uppercase flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5 text-terracotta" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                        Generated Prompt
                      </label>
                      <div className="flex gap-1.5 flex-wrap justify-end">
                        <button type="button" onClick={() => setIsGeneratedModalOpen(true)} className="text-[10px] text-light-gray hover:text-white uppercase font-bold px-2 py-1 bg-white/5 hover:bg-white/10 rounded flex items-center gap-1 border border-white/5">
                          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 3h6v6" /><path d="M9 21H3v-6" /><path d="M21 3l-7 7" /><path d="M3 21l7-7" /></svg>
                          Expand
                        </button>
                        <button type="button" onClick={() => {
                          navigator.clipboard.writeText(masterPrompt);
                          alert("Generated prompt copied!");
                        }} className="text-[10px] text-light-gray hover:text-white uppercase font-bold px-2 py-1 bg-white/5 hover:bg-white/10 rounded flex items-center gap-1 border border-white/5">
                          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
                          Copy
                        </button>
                        <button type="button" onClick={() => {
                          localStorage.setItem('vocabpod_master_prompt', masterPrompt);
                          alert("Prompt saved!");
                        }} className="text-[10px] text-terracotta hover:text-white uppercase font-bold px-2 py-1 bg-terracotta/10 rounded">Save</button>
                        <button type="button" onClick={() => {
                          localStorage.removeItem('vocabpod_master_prompt');
                          setMasterPrompt("");
                          alert("Prompt deleted!");
                        }} className="text-[10px] text-red-500 hover:text-white uppercase font-bold px-2 py-1 bg-red-500/10 rounded">Delete</button>
                        <button type="button" onClick={() => {
                          const usagesText = realLifeUsages.map(u => `${u.context} | ${u.example}`).join('\n');
                          let generated = masterPromptTemplate
                            .replace(/{WORD}/g, word || "")
                            .replace(/{PHONETIC}/g, phonetic || "")
                            .replace(/{DEFINITION}/g, definition || "")
                            .replace(/{NARRATIVE}/g, narrative || "")
                            .replace(/{STORY}/g, story || "")
                            .replace(/{USAGE}/g, usagesText || "")
                            .replace(/{SVG}/g, svgJson || "")
                            .replace(/{QUIZ_Q}/g, question || "")
                            .replace(/{QUIZ_A1}/g, opt1 + (correctOpt === 1 ? ' [CORRECT]' : ''))
                            .replace(/{QUIZ_A2}/g, opt2 + (correctOpt === 2 ? ' [CORRECT]' : ''))
                            .replace(/{QUIZ_A3}/g, opt3 + (correctOpt === 3 ? ' [CORRECT]' : ''))
                            .replace(/{QUIZ_A4}/g, opt4 + (correctOpt === 4 ? ' [CORRECT]' : ''))
                            .replace(/{QUIZ_EXP}/g, explanation || "");
                          setMasterPrompt(generated);
                        }} className="bg-terracotta/20 px-3 py-1 rounded text-[10px] hover:bg-terracotta transition-colors text-terracotta hover:text-white font-bold">Generate</button>
                      </div>
                    </div>
                    <textarea 
                      value={masterPrompt}
                      onChange={e => setMasterPrompt(e.target.value)}
                      placeholder="Your generated prompt will appear here..."
                      className="w-full bg-absolute-black border border-white/10 rounded-xl p-3 focus:outline-none focus:border-terracotta/50 min-h-[140px] text-[10px] font-mono text-white leading-relaxed shadow-inner custom-scrollbar"
                    />
                  </div>
                </div>


              </div>

            {/* Manual Entry Right Column */}
            <div className="lg:col-span-7">


              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                  <h1 className="text-3xl font-black tracking-tight uppercase text-light-gray">Content Entry System</h1>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-ash">Active Mode:</span>
                    {editorMode.type === "new" ? (
                      <span className="text-[10px] font-black bg-white/5 border border-white/5 text-light-gray px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                        Creating New Word
                      </span>
                    ) : editorMode.type === "draft" ? (
                      <span className="text-[10px] font-black bg-terracotta/10 border border-terracotta/20 text-terracotta px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                        Editing Draft: {editorMode.word}
                      </span>
                    ) : (
                      <span className="text-[10px] font-black bg-sky-500/10 border border-sky-500/20 text-sky-400 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                        Editing System Word: {editorMode.word}
                      </span>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={clearEditor}
                  className="bg-white/5 hover:bg-white/10 text-light-gray border border-terracotta/20 hover:border-terracotta/40 font-bold text-xs uppercase tracking-widest px-4 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-1.5 shrink-0 self-start sm:self-center"
                >
                  <svg className="w-3.5 h-3.5 text-terracotta" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
                  </svg>
                  <span>Add New Word</span>
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-10">
                
                <section className="bg-card-gray border border-white/5 p-8 rounded-3xl space-y-6 shadow-xl">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-muted-ash uppercase">Word</label>
                      <input required value={word} onChange={e => setWord(e.target.value)} className="w-full bg-deep-canvas border border-white/10 rounded-xl p-3 focus:outline-none focus:border-terracotta/50" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-muted-ash uppercase">Phonetic</label>
                      <input required value={phonetic} onChange={e => setPhonetic(e.target.value)} className="w-full bg-deep-canvas border border-white/10 rounded-xl p-3 focus:outline-none focus:border-terracotta/50" />
                    </div>
                  </div>



                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-ash uppercase">Definition</label>
                    <textarea required value={definition} onChange={e => setDefinition(e.target.value)} className="w-full bg-deep-canvas border border-white/10 rounded-xl p-3 focus:outline-none focus:border-terracotta/50 min-h-[80px]" />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-ash uppercase">Mnemonic Narrative</label>
                    <textarea required value={narrative} onChange={e => setNarrative(e.target.value)} className="w-full bg-deep-canvas border border-white/10 rounded-xl p-3 focus:outline-none focus:border-terracotta/50 min-h-[120px]" />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-ash uppercase">Story (optional)</label>
                    <p className="text-[10px] text-muted-ash/60">Write a short story using the word multiple times. The target word will be highlighted automatically.</p>
                    <textarea value={story} onChange={e => setStory(e.target.value)} placeholder="e.g. The tenacious climber..." className="w-full bg-deep-canvas border border-white/10 rounded-xl p-3 focus:outline-none focus:border-terracotta/50 min-h-[100px]" />
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-bold text-muted-ash uppercase">Real Life Usage (Optional)</label>
                      <p className="text-[10px] text-muted-ash/60">Provide real-world scenarios in a list format.</p>
                    </div>
                    {realLifeUsages.map((usage, idx) => (
                      <div key={idx} className="flex flex-col md:flex-row gap-3 items-start bg-deep-canvas border border-white/5 p-4 rounded-xl relative group">
                        <input 
                          value={usage.context} 
                          onChange={e => {
                            const newUsages = [...realLifeUsages];
                            newUsages[idx].context = e.target.value;
                            setRealLifeUsages(newUsages);
                          }} 
                          placeholder="Context (e.g. At work)" 
                          className="w-full md:w-1/3 bg-absolute-black border border-white/10 rounded-lg p-3 focus:outline-none focus:border-terracotta/50 text-sm" 
                        />
                        <textarea 
                          value={usage.example} 
                          onChange={e => {
                            const newUsages = [...realLifeUsages];
                            newUsages[idx].example = e.target.value;
                            setRealLifeUsages(newUsages);
                          }} 
                          placeholder="Example sentence using the word..." 
                          className="flex-1 w-full bg-absolute-black border border-white/10 rounded-lg p-3 focus:outline-none focus:border-terracotta/50 text-sm min-h-[46px] resize-none" 
                        />
                        {realLifeUsages.length > 1 && (
                          <button 
                            type="button"
                            onClick={() => setRealLifeUsages(realLifeUsages.filter((_, i) => i !== idx))}
                            className="absolute top-2 right-2 text-muted-ash hover:text-terracotta opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                          </button>
                        )}
                      </div>
                    ))}
                    <button 
                      type="button"
                      onClick={() => setRealLifeUsages([...realLifeUsages, {context: "", example: ""}])}
                      className="text-xs font-bold text-terracotta bg-dark-blush px-4 py-2 rounded-xl hover:bg-terracotta/20 transition-colors uppercase tracking-wider"
                    >
                      + Add Usage
                    </button>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-ash uppercase">Audio File (.mp3)</label>
                    <input 
                      required={!existingAudioUrl} 
                      type="file" 
                      accept="audio/*" 
                      onChange={e => {
                        const file = e.target.files?.[0] || null;
                        setAudioFile(file);
                        if (file) {
                          const match = file.name.match(/\[(.*?)\]/);
                          if (match && match[1]) {
                            setRecordingTimestamps(match[1].replace(/_/g, ':'));
                          }
                        }
                      }} 
                      className="w-full bg-deep-canvas border border-white/10 rounded-xl p-3 text-light-gray file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-terracotta file:text-light-gray hover:file:bg-terracotta/80 cursor-pointer focus:outline-none focus:border-terracotta/50" 
                    />
                    {existingAudioUrl && (
                      <p className="text-xs text-terracotta font-bold mt-1">
                        Existing Audio: {existingAudioUrl.split('/').pop()}
                      </p>
                    )}
                    {audioFile && !existingAudioUrl && (
                      <p className="text-xs text-green-400 font-bold mt-1">
                        Attached Audio: {audioFile.name}
                      </p>
                    )}
                  </div>
                </section>

                {/* Audio Post-Production Mixer */}
                {activeTab === "content" && (
                  <section className="bg-card-gray border border-white/5 p-8 rounded-3xl shadow-xl">
                    <AudioMixer
                      audioFile={audioFile}
                      existingAudioUrl={existingAudioUrl}
                      timestampString={recordingTimestamps}
                      onMixedAudio={(blob) => {
                        const file = new File([blob], `${word || "mixed"}_mixed.mp3`, { type: "audio/mp3" });
                        setAudioFile(file);
                        setExistingAudioUrl("");
                      }}
                    />
                  </section>
                )}

                <section className="bg-card-gray border border-white/5 p-8 rounded-3xl space-y-6 shadow-xl">
                  <h2 className="text-xs font-bold uppercase tracking-widest text-muted-ash border-b border-white/5 pb-2">Visual Mnemonic Anchor</h2>
                  
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-ash uppercase">Paste Custom SVG Code (Optional)</label>
                    <textarea 
                      value={customSvg} 
                      onChange={e => setCustomSvg(e.target.value)} 
                      placeholder="e.g. <svg>...</svg>" 
                      className="w-full bg-deep-canvas border border-white/10 rounded-xl p-3 focus:outline-none focus:border-terracotta/50 font-mono text-xs min-h-[100px]" 
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-ash uppercase">Upload Mnemonic Image File (Optional)</label>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={e => setImageFile(e.target.files?.[0] || null)} 
                      className="w-full bg-deep-canvas border border-white/10 rounded-xl p-3 text-light-gray file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-terracotta file:text-light-gray hover:file:bg-terracotta/80 cursor-pointer focus:outline-none focus:border-terracotta/50" 
                    />
                    {existingImageUrl && (
                      <p className="text-xs text-terracotta font-bold mt-1">
                        Existing Image Loaded: {existingImageUrl.split('/').pop()}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-ash uppercase">Or Structured SVG JSON (Advanced)</label>
                    <textarea required value={svgJson} onChange={e => setSvgJson(e.target.value)} className="w-full bg-deep-canvas border border-white/10 rounded-xl p-3 focus:outline-none focus:border-terracotta/50 font-mono text-xs text-terracotta min-h-[100px]" />
                  </div>

                  {/* Live SVG/Mnemonic Preview */}
                  {(customSvg || svgJson) && (
                    <div className="space-y-2 border-t border-white/5 pt-6">
                      <label className="text-xs font-bold text-muted-ash uppercase tracking-wider block">Live SVG Mnemonic Preview</label>
                      <div className="w-full h-64 bg-absolute-black/50 border border-white/10 rounded-2xl flex items-center justify-center relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-terracotta/5 to-transparent pointer-events-none"></div>
                        <div className="absolute top-2 right-2 text-[9px] font-bold uppercase tracking-widest text-muted-ash/50 bg-absolute-black/60 px-2 py-0.5 rounded-md border border-white/5">
                          Active Preview
                        </div>
                        
                        <div className="w-full h-full p-6 flex items-center justify-center text-light-gray svg-mnemonic-container [&>svg]:max-w-full [&>svg]:max-h-full [&>svg]:w-auto [&>svg]:h-auto">
                          {customSvg ? (
                            <div 
                              className="w-full h-full flex items-center justify-center [&>svg]:w-full [&>svg]:h-full"
                              dangerouslySetInnerHTML={{ __html: cleanSvgString(customSvg) }}
                            />
                          ) : (() => {
                            try {
                              if (!svgJson || svgJson.trim() === "" || svgJson.trim() === "[]" || svgJson.trim() === "[]\n") {
                                return <p className="text-xs text-muted-ash">Empty structured SVG JSON.</p>;
                              }
                              const parsed = JSON.parse(svgJson);
                              if (Array.isArray(parsed) && parsed.length > 0) {
                                return (
                                  <svg viewBox="0 0 400 300" className="w-full h-full p-4" xmlns="http://www.w3.org/2000/svg">
                                    {parsed.map((node: any, index: number) => (
                                      <DynamicSVGNode key={index} node={node} />
                                    ))}
                                  </svg>
                                );
                              }
                            } catch (e) {
                              return (
                                <div className="text-center p-4">
                                  <p className="text-[10px] text-amber-500 font-bold uppercase tracking-wider mb-1">Synthesizing JSON...</p>
                                  <p className="text-[9px] text-muted-ash/70 font-mono break-all max-w-xs">{(e as Error).message}</p>
                                </div>
                              );
                            }
                            return <p className="text-xs text-muted-ash">Empty or invalid structured SVG JSON.</p>;
                          })()}
                        </div>
                      </div>
                      <p className="text-[10px] text-muted-ash/60">
                        Renders custom SVG code or structured SVG JSON in real time. Standard inline stylesheet animations or SVG SMIL animations (like `animate` and `animateTransform`) are natively supported and executed.
                      </p>
                    </div>
                  )}
                </section>

                <section className="bg-card-gray border border-white/5 p-8 rounded-3xl space-y-6 shadow-xl">
                  <h2 className="text-xs font-bold uppercase tracking-widest text-muted-ash border-b border-white/5 pb-2">Active Recall Quiz</h2>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-ash uppercase">Question</label>
                    <input required value={question} onChange={e => setQuestion(e.target.value)} className="w-full bg-deep-canvas border border-white/10 rounded-xl p-3 focus:outline-none focus:border-terracotta/50" />
                  </div>

                  <div className="space-y-4">
                    <label className="text-xs font-bold text-muted-ash uppercase">Options</label>
                    {[
                      { val: opt1, set: setOpt1, idx: 1 },
                      { val: opt2, set: setOpt2, idx: 2 },
                      { val: opt3, set: setOpt3, idx: 3 },
                      { val: opt4, set: setOpt4, idx: 4 },
                    ].map((opt) => (
                      <div key={opt.idx} className="flex items-center space-x-4">
                        <input type="radio" checked={correctOpt === opt.idx} onChange={() => setCorrectOpt(opt.idx)} className="w-5 h-5 accent-terracotta cursor-pointer" />
                        <input required value={opt.val} onChange={e => opt.set(e.target.value)} className="flex-1 bg-deep-canvas border border-white/10 rounded-xl p-3 focus:outline-none focus:border-terracotta/50" placeholder={`Option ${opt.idx}`} />
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-ash uppercase">Explanation Text</label>
                    <textarea required value={explanation} onChange={e => setExplanation(e.target.value)} className="w-full bg-deep-canvas border border-white/10 rounded-xl p-3 focus:outline-none focus:border-terracotta/50 min-h-[80px]" />
                  </div>
                </section>

                <div className="flex flex-col md:flex-row gap-4">
                  <button
                    type="button"
                    onClick={saveToDrafts}
                    className="flex-1 bg-deep-canvas border border-white/20 text-light-gray font-bold py-5 rounded-full hover:border-terracotta/50 transition-all text-sm tracking-wider uppercase"
                  >
                    SAVE TO DRAFTS
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsRecordingMode(true)}
                    className="flex-1 bg-deep-canvas border border-white/20 text-terracotta font-bold py-5 rounded-full hover:border-terracotta/50 transition-all text-sm tracking-wider uppercase"
                  >
                    RECORDING MODE
                  </button>
                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="flex-[2] bg-terracotta text-light-gray font-bold py-5 rounded-full hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(224,75,53,0.4)] transition-all disabled:opacity-50 text-sm tracking-wider uppercase"
                  >
                    {isSubmitting ? "INJECTING LESSON..." : "SUBMIT TO DATABASE"}
                  </button>
                </div>
              </form>
            </div>
            </div>
          </div>
        )}
      </main>

      {/* Master Template Editor Modal */}
      {isTemplateModalOpen && (
        <div className="fixed inset-0 z-[150] bg-absolute-black/90 backdrop-blur-md flex items-center justify-center p-6 animate-fadeIn">
          <div className="bg-card-gray border border-terracotta/20 rounded-3xl p-8 max-w-4xl w-full h-[80vh] flex flex-col relative shadow-2xl space-y-6">
            <button 
              onClick={() => setIsTemplateModalOpen(false)}
              className="absolute top-4 right-4 text-muted-ash hover:text-light-gray font-bold text-lg p-2 rounded-full border border-white/5 bg-deep-canvas hover:bg-white/5 transition-all"
            >
              ✕
            </button>
            <div className="flex justify-between items-center pr-12">
              <h2 className="text-xl font-black text-light-gray uppercase tracking-tight flex items-center gap-2">
                <svg className="w-5 h-5 text-terracotta" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit Master Template
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    localStorage.setItem('vocabpod_master_prompt_template', masterPromptTemplate);
                    alert("Template saved!");
                  }}
                  className="text-xs bg-terracotta hover:bg-terracotta/80 text-light-gray px-3 py-1.5 rounded-lg font-bold uppercase transition-all"
                >
                  Save Template
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(masterPromptTemplate);
                    alert("Template copied!");
                  }}
                  className="text-xs bg-white/5 border border-white/10 text-light-gray px-3 py-1.5 rounded-lg hover:bg-white/10 font-bold uppercase flex items-center gap-1 transition-all"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
                  Copy
                </button>
              </div>
            </div>
            <div className="text-xs text-muted-ash">
              Template variables: <code className="text-terracotta">{`{WORD}`}</code>, <code className="text-terracotta">{`{PHONETIC}`}</code>, <code className="text-terracotta">{`{DEFINITION}`}</code>, <code className="text-terracotta">{`{NARRATIVE}`}</code>, <code className="text-terracotta">{`{STORY}`}</code>, <code className="text-terracotta">{`{USAGE}`}</code>, <code className="text-terracotta">{`{SVG}`}</code>, <code className="text-terracotta">{`{QUIZ_Q}`}</code>, <code className="text-terracotta">{`{QUIZ_A1}`}</code>, etc.
            </div>
            <textarea
              value={masterPromptTemplate}
              onChange={e => setMasterPromptTemplate(e.target.value)}
              className="flex-1 w-full bg-deep-canvas border border-white/10 rounded-2xl p-6 focus:outline-none focus:border-terracotta/50 font-mono text-xl text-white leading-relaxed resize-none custom-scrollbar"
            />
          </div>
        </div>
      )}

      {/* Generated Prompt Viewer Modal */}
      {isGeneratedModalOpen && (
        <div className="fixed inset-0 z-[150] bg-absolute-black/90 backdrop-blur-md flex items-center justify-center p-6 animate-fadeIn">
          <div className="bg-card-gray border border-terracotta/20 rounded-3xl p-8 max-w-4xl w-full h-[80vh] flex flex-col relative shadow-2xl space-y-6">
            <button 
              onClick={() => setIsGeneratedModalOpen(false)}
              className="absolute top-4 right-4 text-muted-ash hover:text-light-gray font-bold text-lg p-2 rounded-full border border-white/5 bg-deep-canvas hover:bg-white/5 transition-all"
            >
              ✕
            </button>
            <div className="flex justify-between items-center pr-12">
              <h2 className="text-xl font-black text-light-gray uppercase tracking-tight flex items-center gap-2">
                <svg className="w-5 h-5 text-terracotta" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Generated Master Prompt
              </h2>
              <div className="flex gap-2 flex-wrap justify-end">
                <button
                  onClick={() => {
                    localStorage.setItem('vocabpod_master_prompt', masterPrompt);
                    alert("Prompt saved!");
                  }}
                  className="text-xs bg-terracotta hover:bg-terracotta/80 text-light-gray px-3 py-1.5 rounded-lg font-bold uppercase transition-all"
                >
                  Save Prompt
                </button>
                <button
                  onClick={() => {
                    localStorage.removeItem('vocabpod_master_prompt');
                    setMasterPrompt("");
                    alert("Prompt deleted!");
                  }}
                  className="text-xs bg-red-500 hover:bg-red-500/80 text-white px-3 py-1.5 rounded-lg font-bold uppercase transition-all"
                >
                  Delete Prompt
                </button>
                <button
                  onClick={() => {
                    const usagesText = realLifeUsages.map(u => `${u.context} | ${u.example}`).join('\n');
                    let generated = masterPromptTemplate
                      .replace(/{WORD}/g, word || "")
                      .replace(/{PHONETIC}/g, phonetic || "")
                      .replace(/{DEFINITION}/g, definition || "")
                      .replace(/{NARRATIVE}/g, narrative || "")
                      .replace(/{STORY}/g, story || "")
                      .replace(/{USAGE}/g, usagesText || "")
                      .replace(/{SVG}/g, svgJson || "")
                      .replace(/{QUIZ_Q}/g, question || "")
                      .replace(/{QUIZ_A1}/g, opt1 + (correctOpt === 1 ? ' [CORRECT]' : ''))
                      .replace(/{QUIZ_A2}/g, opt2 + (correctOpt === 2 ? ' [CORRECT]' : ''))
                      .replace(/{QUIZ_A3}/g, opt3 + (correctOpt === 3 ? ' [CORRECT]' : ''))
                      .replace(/{QUIZ_A4}/g, opt4 + (correctOpt === 4 ? ' [CORRECT]' : ''))
                      .replace(/{QUIZ_EXP}/g, explanation || "");
                    setMasterPrompt(generated);
                    alert("Prompt re-generated!");
                  }}
                  className="text-xs bg-terracotta hover:bg-terracotta/80 text-light-gray px-3 py-1.5 rounded-lg font-bold uppercase transition-all"
                >
                  Regenerate
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(masterPrompt);
                    alert("Generated prompt copied!");
                  }}
                  className="text-xs bg-white/5 border border-white/10 text-light-gray px-3 py-1.5 rounded-lg hover:bg-white/10 font-bold uppercase flex items-center gap-1 transition-all"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
                  Copy
                </button>
              </div>
            </div>
            <textarea
              value={masterPrompt}
              onChange={e => setMasterPrompt(e.target.value)}
              className="flex-1 w-full bg-absolute-black border border-white/10 rounded-2xl p-6 focus:outline-none focus:border-terracotta/50 font-mono text-xl text-white leading-relaxed resize-none custom-scrollbar"
            />
          </div>
        </div>
      )}

      {/* Fullscreen Recording / Reading Mode Modal */}
      {isRecordingMode && (
        <div className="fixed inset-0 z-[100] bg-absolute-black flex flex-col p-8 md:p-16 overflow-y-auto custom-scrollbar animate-fadeIn">
          
          {/* Top Controls Bar */}
          <div className="fixed top-6 left-6 right-6 flex justify-between items-center z-50 pointer-events-none">
            {/* Draft Status Selector */}
            <div className="pointer-events-auto">
              {editorMode.type === "draft" && editorMode.id && (
                <div className="flex items-center gap-3 bg-deep-canvas border border-white/10 p-2.5 px-4 rounded-full shadow-xl">
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-ash">Kanban Stage</span>
                  <select 
                    value={drafts.find(d => d.id === editorMode.id)?.status || "idea"}
                    onChange={(e) => updateDraftStatus(editorMode.id!, e.target.value)}
                    className="bg-transparent text-sm font-bold text-terracotta outline-none cursor-pointer uppercase tracking-wider appearance-none pr-4"
                  >
                    <option value="idea" className="bg-card-gray text-white">Word Ideas</option>
                    <option value="processed" className="bg-card-gray text-white">Word Processed</option>
                    <option value="recorded" className="bg-card-gray text-white">Audio Recorded</option>
                    <option value="ready" className="bg-card-gray text-white">Audio Edited, Ready To Publish</option>
                  </select>
                </div>
              )}
            </div>

            {/* Close / Exit Button */}
            <button 
              onClick={() => setIsRecordingMode(false)}
              className="pointer-events-auto text-muted-ash hover:text-white bg-deep-canvas border border-white/10 p-3.5 rounded-full transition-all flex items-center gap-2 shadow-xl hover:border-terracotta/30"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              <span className="font-bold uppercase tracking-widest text-[10px]">Exit Recording Mode</span>
            </button>
          </div>

          {/* Edit Mode Toggle */}
          <button 
            onClick={() => {
              if (isRecordingEditMode) {
                // Save to drafts on exit edit mode
                if (editorMode.type === "draft" && editorMode.id) {
                  saveToDraftsRef.current();
                }
              }
              setIsRecordingEditMode(!isRecordingEditMode);
            }}
            className={`fixed bottom-6 left-6 p-4 rounded-full shadow-2xl z-50 transition-all ${isRecordingEditMode ? 'bg-terracotta text-white shadow-terracotta/50' : 'bg-deep-canvas text-muted-ash hover:text-white border border-white/10 hover:border-terracotta/30'}`}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
          </button>
          
          <div className="max-w-4xl mx-auto w-full space-y-20 pb-40 mt-12">
            <AudioRecorder 
              word={word} 
              wordNumber={allWords.length + 1} 
              onTimestamps={(ts) => {
                setRecordingTimestamps(ts);
                // Save to draft automatically
                if (editorMode.type === "draft" && editorMode.id) {
                  const newDrafts = drafts.map(d => d.id === editorMode.id ? { ...d, timestamps: ts } : d);
                  setDrafts(newDrafts);
                  localStorage.setItem('vocabpod_drafts', JSON.stringify(newDrafts));
                }
              }}
            />
            
            {/* Word Section */}
            <div className="text-center space-y-6">
              <span className="text-5xl md:text-6xl font-black uppercase tracking-widest text-terracotta block">Word Focus</span>
              {isRecordingEditMode ? (
                <input value={word} onChange={e => setWord(e.target.value)} className="bg-transparent text-7xl md:text-9xl font-black tracking-tight text-white text-center w-full outline-none border-b border-white/20 pb-2 focus:border-terracotta transition-colors" placeholder="Word" />
              ) : (
                <div className="text-7xl md:text-9xl font-black tracking-tight text-white">{word || "[No Word]"}</div>
              )}
              
              {isRecordingEditMode ? (
                <input value={phonetic} onChange={e => setPhonetic(e.target.value)} className="bg-transparent text-3xl text-muted-ash font-serif italic text-center w-full outline-none border-b border-white/20 pb-2 focus:border-terracotta transition-colors mt-4" placeholder="/phonetic/" />
              ) : (
                phonetic && <div className="text-3xl text-muted-ash font-serif italic">{phonetic}</div>
              )}
            </div>

            {/* Definition Section */}
            <div
              onClick={() => { const evt = new CustomEvent("vocabpod:stamp", { detail: { code: "CD" } }); window.dispatchEvent(evt); }}
              className={`group space-y-6 border-t border-white/5 pt-16 rounded-3xl transition-all cursor-pointer ${
                recordingTimestamps.includes("-CD")
                  ? "border border-green-500/20 bg-green-500/5 p-8 -mx-8"
                  : "hover:bg-terracotta/5 hover:p-8 hover:-mx-8"
              }`}
            >
              <span className="text-5xl md:text-6xl font-black uppercase tracking-widest text-terracotta block">
                Core Definition
                {recordingTimestamps.includes("-CD") && <span className="text-green-400 text-2xl ml-4">✓ Stamped</span>}
                {!recordingTimestamps.includes("-CD") && <span className="text-muted-ash/30 text-2xl ml-4 group-hover:text-terracotta/50 transition-colors">· tap to stamp</span>}
              </span>
              {isRecordingEditMode ? (
                <textarea onClick={e => e.stopPropagation()} value={definition} onChange={e => setDefinition(e.target.value)} className="bg-transparent text-4xl md:text-5xl leading-snug font-bold text-white/95 w-full outline-none border border-white/20 p-4 rounded-xl focus:border-terracotta transition-colors resize-none min-h-[150px]" placeholder="Definition..." />
              ) : (
                <div className="text-4xl md:text-5xl leading-snug font-bold text-white/95">{renderWithHighlights(definition) || "[No Definition Entered]"}</div>
              )}
            </div>

            {/* Story Section */}
            {(story || isRecordingEditMode) && (
              <div
                onClick={() => { const evt = new CustomEvent("vocabpod:stamp", { detail: { code: "CS" } }); window.dispatchEvent(evt); }}
                className={`group space-y-6 border-t border-white/5 pt-16 rounded-3xl transition-all cursor-pointer ${
                  recordingTimestamps.includes("-CS")
                    ? "border border-green-500/20 bg-green-500/5 p-8 -mx-8"
                    : "hover:bg-terracotta/5 hover:p-8 hover:-mx-8"
                }`}
              >
                <span className="text-5xl md:text-6xl font-black uppercase tracking-widest text-terracotta block">
                  Contextual Story
                  {recordingTimestamps.includes("-CS") && <span className="text-green-400 text-2xl ml-4">✓ Stamped</span>}
                  {!recordingTimestamps.includes("-CS") && <span className="text-muted-ash/30 text-2xl ml-4 group-hover:text-terracotta/50 transition-colors">· tap to stamp</span>}
                </span>
                {isRecordingEditMode ? (
                  <textarea onClick={e => e.stopPropagation()} value={story} onChange={e => setStory(e.target.value)} className="bg-transparent text-3xl md:text-4xl leading-relaxed text-light-gray/90 whitespace-pre-wrap w-full outline-none border border-white/20 p-4 rounded-xl focus:border-terracotta transition-colors resize-none min-h-[200px]" placeholder="Story..." />
                ) : (
                  <div className="text-3xl md:text-4xl leading-relaxed text-light-gray/90 whitespace-pre-wrap">{renderWithHighlights(story)}</div>
                )}
              </div>
            )}

            {/* Mnemonic Narrative Section */}
            <div
              onClick={() => { const evt = new CustomEvent("vocabpod:stamp", { detail: { code: "MN" } }); window.dispatchEvent(evt); }}
              className={`group space-y-6 border-t border-white/5 pt-16 rounded-3xl transition-all cursor-pointer ${
                recordingTimestamps.includes("-MN")
                  ? "border border-green-500/20 bg-green-500/5 p-8 -mx-8"
                  : "hover:bg-terracotta/5 hover:p-8 hover:-mx-8"
              }`}
            >
              <span className="text-5xl md:text-6xl font-black uppercase tracking-widest text-terracotta block">
                Mnemonic Narrative
                {recordingTimestamps.includes("-MN") && <span className="text-green-400 text-2xl ml-4">✓ Stamped</span>}
                {!recordingTimestamps.includes("-MN") && <span className="text-muted-ash/30 text-2xl ml-4 group-hover:text-terracotta/50 transition-colors">· tap to stamp</span>}
              </span>
              {isRecordingEditMode ? (
                <textarea onClick={e => e.stopPropagation()} value={narrative} onChange={e => setNarrative(e.target.value)} className="bg-transparent text-3xl md:text-4xl leading-relaxed text-light-gray whitespace-pre-wrap w-full outline-none border border-white/20 p-4 rounded-xl focus:border-terracotta transition-colors resize-none min-h-[200px]" placeholder="Narrative..." />
              ) : (
                <div className="text-3xl md:text-4xl leading-relaxed text-light-gray whitespace-pre-wrap">{renderWithHighlights(narrative) || "[No Narrative Entered]"}</div>
              )}
            </div>

            {/* Real Life Usage Section */}
            {(realLifeUsages.some(u => u.example) || isRecordingEditMode) && (
              <div
                onClick={() => { const evt = new CustomEvent("vocabpod:stamp", { detail: { code: "RLUS" } }); window.dispatchEvent(evt); }}
                className={`group space-y-8 border-t border-white/5 pt-16 rounded-3xl transition-all cursor-pointer ${
                  recordingTimestamps.includes("-RLUS")
                    ? "border border-green-500/20 bg-green-500/5 p-8 -mx-8"
                    : "hover:bg-terracotta/5 hover:p-8 hover:-mx-8"
                }`}
              >
                <span className="text-5xl md:text-6xl font-black uppercase tracking-widest text-terracotta block">
                  Real Life Usage Scenarios
                  {recordingTimestamps.includes("-RLUS") && <span className="text-green-400 text-2xl ml-4">✓ Stamped</span>}
                  {!recordingTimestamps.includes("-RLUS") && <span className="text-muted-ash/30 text-2xl ml-4 group-hover:text-terracotta/50 transition-colors">· tap to stamp</span>}
                </span>
                <div className="space-y-6" onClick={e => e.stopPropagation()}>
                  {isRecordingEditMode ? (
                    realLifeUsages.map((usage, idx) => (
                      <div key={idx} className="bg-card-gray border border-white/20 p-8 rounded-3xl space-y-4">
                        <input value={usage.context} onChange={e => {
                          const newUsages = [...realLifeUsages];
                          newUsages[idx].context = e.target.value;
                          setRealLifeUsages(newUsages);
                        }} className="bg-transparent text-2xl text-terracotta font-black tracking-wide uppercase w-full outline-none border-b border-white/20 pb-2 focus:border-terracotta" placeholder="Context..." />
                        <textarea value={usage.example} onChange={e => {
                          const newUsages = [...realLifeUsages];
                          newUsages[idx].example = e.target.value;
                          setRealLifeUsages(newUsages);
                        }} className="bg-transparent text-3xl leading-snug text-white/90 w-full outline-none border border-white/20 p-4 rounded-xl focus:border-terracotta resize-none min-h-[100px] mt-4" placeholder="Example..." />
                      </div>
                    ))
                  ) : (
                    realLifeUsages.map((usage, idx) => usage.example ? (
                      <div key={idx} className="bg-card-gray border border-white/5 p-8 rounded-3xl space-y-4">
                        {usage.context && <div className="text-2xl text-terracotta font-black tracking-wide uppercase">{usage.context}</div>}
                        <div className="text-3xl leading-snug text-white/90">{renderWithHighlights(usage.example)}</div>
                      </div>
                    ) : null)
                  )}
                  {isRecordingEditMode && (
                    <button onClick={() => setRealLifeUsages([...realLifeUsages, {context: "", example: ""}])} className="text-terracotta font-bold text-xl hover:underline">+ Add Usage</button>
                  )}
                </div>
              </div>
            )}

            {/* Active Recall Quiz Section */}
            {question && (
              <div
                onClick={() => { const evt = new CustomEvent("vocabpod:stamp", { detail: { code: "ARQ" } }); window.dispatchEvent(evt); }}
                className={`group space-y-8 border-t border-white/5 pt-16 rounded-3xl transition-all cursor-pointer ${
                  recordingTimestamps.includes("-ARQ")
                    ? "border border-green-500/20 bg-green-500/5 p-8 -mx-8"
                    : "hover:bg-terracotta/5 hover:p-8 hover:-mx-8"
                }`}
              >
                <span className="text-5xl md:text-6xl font-black uppercase tracking-widest text-terracotta block">
                  Active Recall Quiz
                  {recordingTimestamps.includes("-ARQ") && <span className="text-green-400 text-2xl ml-4">✓ Stamped</span>}
                  {!recordingTimestamps.includes("-ARQ") && <span className="text-muted-ash/30 text-2xl ml-4 group-hover:text-terracotta/50 transition-colors">· tap to stamp</span>}
                </span>
                <div onClick={e => e.stopPropagation()}>
                  <div className="text-4xl md:text-5xl leading-snug font-bold text-white">{renderWithHighlights(question)}</div>
                  <div className="mt-8 space-y-4">
                    {[opt1, opt2, opt3, opt4].map((opt, idx) => opt ? (
                      <div key={idx} className={`text-2xl md:text-3xl p-8 rounded-3xl border transition-all ${correctOpt === (idx + 1) ? "border-terracotta bg-terracotta/10 text-terracotta font-black shadow-lg shadow-terracotta/5" : "border-white/5 bg-card-gray/40 text-light-gray"}`}>
                        <span className="opacity-50 mr-3">{String.fromCharCode(65 + idx)}.</span> {opt}
                        {correctOpt === (idx + 1) && <span className="text-2xl font-black uppercase tracking-widest bg-terracotta text-white px-4 py-2 rounded-full ml-4 shadow-sm">Correct Answer</span>}
                      </div>
                    ) : null)}
                  </div>
                  {explanation && (
                    <div className="mt-8 space-y-6 bg-card-gray/30 p-8 rounded-3xl border border-white/5">
                      <span className="text-4xl md:text-5xl font-black uppercase tracking-widest text-muted-ash block">Explanation</span>
                      <div className="text-2xl leading-relaxed text-light-gray">{renderWithHighlights(explanation)}</div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Submission/Action Success & Error Popup Modal */}
      {popupMessage.text && (
        <div className="fixed inset-0 z-[200] bg-absolute-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card-gray border border-white/10 rounded-3xl p-8 max-w-sm w-full relative shadow-2xl flex flex-col items-center text-center space-y-6 animate-fadeIn">
            {popupMessage.type === "success" ? (
              <div className="w-16 h-16 bg-terracotta/10 border border-terracotta/30 text-terracotta rounded-full flex items-center justify-center shadow-lg relative group">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            ) : popupMessage.type === "error" ? (
              <div className="w-16 h-16 bg-red-500/10 border border-red-500/30 text-red-500 rounded-full flex items-center justify-center shadow-lg">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            ) : (
              <div className="w-16 h-16 bg-terracotta/10 border border-terracotta/30 text-terracotta rounded-full flex items-center justify-center shadow-lg">
                <div className="w-6 h-6 border-2 border-terracotta border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            <div className="space-y-2">
              <h3 className={`text-lg font-black uppercase tracking-wider ${popupMessage.type === "success" ? "text-terracotta" : popupMessage.type === "error" ? "text-red-500" : "text-light-gray"}`}>
                {popupMessage.type === "success" ? "Success" : popupMessage.type === "error" ? "Error" : "Processing"}
              </h3>
              <p className="text-sm text-light-gray leading-relaxed max-w-xs">{popupMessage.text}</p>
            </div>

            {popupMessage.type !== "info" && (
              <button
                type="button"
                onClick={() => setPopupMessage({ text: "", type: "" })}
                className="w-full bg-terracotta text-light-gray font-bold py-3 rounded-xl hover:-translate-y-0.5 hover:shadow-lg transition-all text-xs uppercase tracking-wider"
              >
                Dismiss
              </button>
            )}
          </div>
        </div>
      )}
      {/* Manage Words Modal */}
      {isManageWordsModalOpen && (
        <div className="fixed inset-0 z-[100] bg-absolute-black/90 backdrop-blur-md flex items-center justify-center p-4 md:p-8">
          <div className="bg-card-gray border border-terracotta/20 rounded-3xl p-6 md:p-8 max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl relative">
            <button 
              onClick={() => setIsManageWordsModalOpen(false)}
              className="absolute top-6 right-6 text-muted-ash hover:text-light-gray transition-colors z-10"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 pr-10 shrink-0">
              <div>
                <h2 className="text-xl md:text-2xl font-black tracking-tight uppercase text-light-gray">Manage Published Words</h2>
                <p className="text-xs text-muted-ash mt-1">Total {allWords.length} words available.</p>
              </div>
              
              <div className="flex flex-wrap items-center gap-4 bg-deep-canvas p-3 rounded-2xl border border-white/5">
                <label className="flex items-center space-x-2 text-xs font-bold text-muted-ash uppercase cursor-pointer select-none">
                  <input 
                    type="checkbox" 
                    checked={includeAudioDownload} 
                    onChange={e => setIncludeAudioDownload(e.target.checked)}
                    className="w-4 h-4 rounded border-white/10 accent-terracotta cursor-pointer" 
                  />
                  <span>Include Audio Files</span>
                </label>
                
                <button
                  onClick={handleDownloadAll}
                  disabled={isDownloading}
                  className="bg-terracotta hover:bg-terracotta/80 text-light-gray font-bold text-xs uppercase tracking-wider px-4 py-2 rounded-xl transition-all flex items-center gap-1.5"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                  {isDownloading ? "Downloading..." : "Download (ZIP)"}
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0 bg-deep-canvas rounded-2xl border border-white/5 relative">
              {isLoadingWords ? (
                <div className="p-8 text-muted-ash animate-pulse text-center">Loading words...</div>
              ) : (
                <table className="w-full text-left text-sm relative">
                  <thead className="bg-card-gray border-b border-white/5 text-muted-ash font-bold uppercase tracking-wider text-xs sticky top-0 z-10 shadow-sm">
                    <tr>
                      <th className="px-6 py-4">Word</th>
                      <th className="px-6 py-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {allWords.map((w: any) => (
                      <tr key={w.id} className="hover:bg-white/5 transition-colors group">
                        <td className="px-6 py-4 font-bold text-light-gray group-hover:text-terracotta transition-colors">{w.word}</td>
                        <td className="px-6 py-4 text-right space-x-4">
                          <Link
                            href={`/lesson/${encodeURIComponent(w.word.toLowerCase())}`}
                            target="_blank"
                            className="text-xs font-bold text-emerald-400 hover:text-emerald-300 uppercase hover:underline inline-flex items-center gap-1"
                          >
                            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                            View
                          </Link>
                          <button
                            onClick={() => {
                              setWord(w.word);
                              setPhonetic(w.phonetic || "");
                              setDefinition(w.definition || "");
                              setNarrative(w.narrative || "");
                              setStory(w.story || "");
                              setRealLifeUsages(w.real_life_usage && w.real_life_usage.length > 0 ? w.real_life_usage : [{context: "", example: ""}]);
                              setSvgJson(w.svg_elements ? JSON.stringify(w.svg_elements, null, 2) : "[]");
                              setExistingAudioUrl(w.audio_url || "");
                              setCustomSvg(w.custom_svg || "");
                              setExistingImageUrl(w.custom_image_url || "");
                              if (w.quiz_questions && w.quiz_questions.length > 0) {
                                const q = w.quiz_questions[0];
                                setQuestion(q.question);
                                setOpt1(q.options[0]?.text || "");
                                setOpt2(q.options[1]?.text || "");
                                setOpt3(q.options[2]?.text || "");
                                setOpt4(q.options[3]?.text || "");
                                const cIdx = q.options.findIndex((o: any) => o.isCorrect);
                                setCorrectOpt(cIdx !== -1 ? cIdx + 1 : 1);
                                setExplanation(q.explanation || "");
                              }
                              setEditorMode({ type: "existing", id: w.id, word: w.word });
                              setIsManageWordsModalOpen(false);
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className="text-xs font-bold text-terracotta uppercase hover:underline"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDownloadWord(w)}
                            className="text-xs font-bold text-sky-400 hover:text-sky-300 uppercase hover:underline inline-flex items-center gap-1"
                          >
                            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                            Backup
                          </button>
                          <button
                            onClick={async () => {
                              if (confirm(`Are you sure you want to delete "${w.word}"? This will permanently delete the word and its media from R2.`)) {
                                try {
                                  const res = await fetch(`/api/admin/words/${w.id}`, {
                                    method: "DELETE",
                                    headers: { Authorization: `Bearer ${userEmail}` }
                                  });
                                  const data = await res.json();
                                  if (!res.ok) throw new Error(data.error || "Failed to delete word");
                                  setMessage({ text: `Word "${w.word}" deleted successfully.`, type: "success" });
                                  fetchWordsList(userEmail);
                                  fetchStorageStats();
                                } catch (e: any) {
                                  alert(e.message);
                                }
                              }
                            }}
                            className="text-xs font-bold text-dark-blush hover:text-terracotta uppercase hover:underline transition-colors"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

        {/* ===================== SALES PAGE TAB ===================== */}
        {activeTab === "sales" && (
          <div className="space-y-12 animate-fadeIn">
            <div>
              <h1 className="text-3xl font-black tracking-tight text-light-gray uppercase">Sales Page Manager</h1>
              <p className="text-xs text-muted-ash mt-1">Control what visitors see on your public landing page.</p>
            </div>

            {isLoadingSales ? (
              <div className="flex items-center gap-3 text-muted-ash">
                <div className="w-5 h-5 border-2 border-terracotta/30 border-t-terracotta rounded-full animate-spin" />
                Loading sales config...
              </div>
            ) : (
              <div className="space-y-10">

                {/* Save message */}
                {salesSaveMsg.text && (
                  <div className={`p-4 rounded-xl border font-bold text-sm ${salesSaveMsg.type === "success" ? "bg-emerald-950/30 text-emerald-400 border-emerald-500/30" : "bg-dark-blush text-terracotta border-terracotta/30"}`}>
                    {salesSaveMsg.text}
                  </div>
                )}

                {/* ── 1. Preview Words ── */}
                <div className="bg-card-gray border border-white/5 rounded-3xl p-8">
                  <h2 className="text-xl font-black text-light-gray uppercase mb-2">Preview Words</h2>
                  <p className="text-xs text-muted-ash mb-6">Select up to 5 words to show in the &quot;Experience a word&quot; demo. Cloned words can be edited independently below.</p>
                  {isLoadingWords ? (
                    <div className="text-muted-ash text-sm">Loading words...</div>
                  ) : (
                    <div className="flex flex-wrap gap-2 max-h-60 overflow-y-auto hide-scrollbar">
                      {allWords.map((w: any) => {
                        const selected = salesWordsData.some(sw => sw.id === w.id);
                        return (
                          <button
                            key={w.id}
                            onClick={async () => {
                              if (selected) {
                                setSalesWordsData(prev => prev.filter(sw => sw.id !== w.id));
                                setSalesWordIds(prev => prev.filter(id => id !== w.id));
                              } else {
                                if (salesWordsData.length >= 5) {
                                  setSalesSaveMsg({ text: "You can only select up to 5 preview words.", type: "error" });
                                  return;
                                }
                                setSalesSaveMsg({ text: "Cloning word data...", type: "info" });
                                try {
                                  const res = await fetch(`/api/landing/words?ids=${w.id}`);
                                  const data = await res.json();
                                  if (data.words && data.words[0]) {
                                    setSalesWordsData(prev => [...prev, data.words[0]]);
                                    setSalesWordIds(prev => [...prev, w.id]);
                                    setSalesSaveMsg({ text: "Cloned successfully.", type: "success" });
                                  } else {
                                    setSalesSaveMsg({ text: "Failed to fetch word details.", type: "error" });
                                  }
                                } catch (e) {
                                  setSalesSaveMsg({ text: "Failed to clone word.", type: "error" });
                                }
                              }
                            }}
                            className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide border transition-all ${selected ? "bg-terracotta text-white border-terracotta" : "bg-absolute-black border-white/10 text-muted-ash hover:border-white/30 hover:text-light-gray"}`}
                          >
                            {selected && "✓ "}{w.word}
                          </button>
                        );
                      })}
                    </div>
                  )}
                  <div className="mt-4 text-xs text-muted-ash">{salesWordsData.length} / 5 selected</div>
                  
                  <div className="mt-8 space-y-6">
                    {salesWordsData.map((sw, idx) => (
                      <div key={sw.id} className="p-5 bg-absolute-black/40 rounded-2xl border border-white/5 space-y-3 relative">
                        <div className="absolute top-4 right-4 flex items-center gap-3">
                          {idx > 0 && (
                            <button
                              onClick={() => {
                                setSalesWordsData(prev => {
                                  const next = [...prev];
                                  const temp = next[idx];
                                  next[idx] = next[idx - 1];
                                  next[idx - 1] = temp;
                                  return next;
                                });
                                setSalesWordIds(prev => {
                                  const next = [...prev];
                                  const temp = next[idx];
                                  next[idx] = next[idx - 1];
                                  next[idx - 1] = temp;
                                  return next;
                                });
                              }}
                              className="text-xs text-muted-ash hover:text-light-gray uppercase font-bold transition-colors"
                            >
                              ↑ Move Up
                            </button>
                          )}
                          {idx < salesWordsData.length - 1 && (
                            <button
                              onClick={() => {
                                setSalesWordsData(prev => {
                                  const next = [...prev];
                                  const temp = next[idx];
                                  next[idx] = next[idx + 1];
                                  next[idx + 1] = temp;
                                  return next;
                                });
                                setSalesWordIds(prev => {
                                  const next = [...prev];
                                  const temp = next[idx];
                                  next[idx] = next[idx + 1];
                                  next[idx + 1] = temp;
                                  return next;
                                });
                              }}
                              className="text-xs text-muted-ash hover:text-light-gray uppercase font-bold transition-colors"
                            >
                              ↓ Move Down
                            </button>
                          )}
                          <button onClick={() => {
                            setSalesWordsData(prev => prev.filter(x => x.id !== sw.id));
                            setSalesWordIds(prev => prev.filter(x => x !== sw.id));
                          }} className="text-xs text-dark-blush hover:text-terracotta uppercase font-bold transition-colors">Remove</button>
                        </div>
                        <h3 className="text-lg font-bold text-terracotta mb-2">#{idx + 1} {sw.word}</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-muted-ash uppercase mb-1">Word</label>
                            <input
                              value={sw.word || ""}
                              onChange={e => setSalesWordsData(prev => prev.map(x => x.id === sw.id ? { ...x, word: e.target.value } : x))}
                              className="w-full bg-absolute-black border border-white/10 rounded-xl px-3 py-2 text-sm text-light-gray focus:border-terracotta/50"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-muted-ash uppercase mb-1">Phonetic</label>
                            <input
                              value={sw.phonetic || ""}
                              onChange={e => setSalesWordsData(prev => prev.map(x => x.id === sw.id ? { ...x, phonetic: e.target.value } : x))}
                              className="w-full bg-absolute-black border border-white/10 rounded-xl px-3 py-2 text-sm text-light-gray focus:border-terracotta/50"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-xs font-bold text-muted-ash uppercase mb-1">Definition</label>
                            <textarea
                              value={sw.definition || ""}
                              onChange={e => setSalesWordsData(prev => prev.map(x => x.id === sw.id ? { ...x, definition: e.target.value } : x))}
                              className="w-full bg-absolute-black border border-white/10 rounded-xl px-3 py-2 text-sm text-light-gray h-20 focus:border-terracotta/50"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-xs font-bold text-muted-ash uppercase mb-1">Story / Origin</label>
                            <textarea
                              value={sw.story || ""}
                              onChange={e => setSalesWordsData(prev => prev.map(x => x.id === sw.id ? { ...x, story: e.target.value } : x))}
                              className="w-full bg-absolute-black border border-white/10 rounded-xl px-3 py-2 text-sm text-light-gray h-20 focus:border-terracotta/50"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-xs font-bold text-muted-ash uppercase mb-1">Narrative</label>
                            <textarea
                              value={sw.narrative || ""}
                              onChange={e => setSalesWordsData(prev => prev.map(x => x.id === sw.id ? { ...x, narrative: e.target.value } : x))}
                              className="w-full bg-absolute-black border border-white/10 rounded-xl px-3 py-2 text-sm text-light-gray h-20 focus:border-terracotta/50"
                            />
                          </div>
                          <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-bold text-muted-ash uppercase mb-1">Custom Image URL</label>
                              <input
                                value={sw.custom_image_url || ""}
                                onChange={e => setSalesWordsData(prev => prev.map(x => x.id === sw.id ? { ...x, custom_image_url: e.target.value } : x))}
                                className="w-full bg-absolute-black border border-white/10 rounded-xl px-3 py-2 text-sm text-light-gray focus:border-terracotta/50"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-muted-ash uppercase mb-1">Audio URL</label>
                              <input
                                value={sw.audio_url || ""}
                                onChange={e => setSalesWordsData(prev => prev.map(x => x.id === sw.id ? { ...x, audio_url: e.target.value } : x))}
                                className="w-full bg-absolute-black border border-white/10 rounded-xl px-3 py-2 text-sm text-light-gray focus:border-terracotta/50"
                              />
                            </div>
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-xs font-bold text-muted-ash uppercase mb-1">Custom SVG (Raw Code)</label>
                            <textarea
                              value={sw.custom_svg || ""}
                              onChange={e => setSalesWordsData(prev => prev.map(x => x.id === sw.id ? { ...x, custom_svg: e.target.value } : x))}
                              className="w-full bg-absolute-black border border-white/10 rounded-xl px-3 py-2 text-sm text-light-gray h-20 focus:border-terracotta/50 font-mono text-[10px]"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ── 2. Screenshots ── */}
                <div className="bg-card-gray border border-white/5 rounded-3xl p-8">
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-xl font-black text-light-gray uppercase">Inside VocabPod Screenshots</h2>
                    <button
                      onClick={() => setSalesScreenshots(prev => [...prev, { url: "", title: "", subtitle: "" }])}
                      className="text-xs font-bold bg-white/5 border border-white/10 px-3 py-1.5 rounded-full hover:bg-white/10 transition-colors uppercase tracking-wide"
                    >
                      + Add Screenshot
                    </button>
                  </div>
                  <p className="text-xs text-muted-ash mb-6">Add the URL of a screenshot image, plus a title and subtitle for each card in the &quot;Inside VocabPod&quot; section.</p>
                  <div className="space-y-4">
                    {salesScreenshots.map((shot, idx) => (
                      <div key={idx} className="flex flex-col md:flex-row gap-3 p-4 bg-absolute-black/40 rounded-2xl border border-white/5">
                        <div className="flex-1 space-y-2">
                          <div className="flex flex-col md:flex-row gap-2">
                            <input
                              type="url"
                              placeholder="Image URL (or upload below)"
                              value={shot.url}
                              onChange={e => setSalesScreenshots(prev => prev.map((s, i) => i === idx ? { ...s, url: e.target.value } : s))}
                              className="flex-1 bg-absolute-black border border-white/10 rounded-xl px-3 py-2 text-sm text-light-gray focus:outline-none focus:border-terracotta/50"
                            />
                            <input
                              type="file"
                              accept="image/*"
                              onChange={e => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  setScreenshotFiles(prev => ({ ...prev, [idx]: file }));
                                }
                              }}
                              className="text-sm text-muted-ash file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-[10px] file:font-bold file:uppercase file:bg-white/5 file:text-light-gray hover:file:bg-white/10 cursor-pointer"
                            />
                          </div>
                          <input
                            type="text"
                            placeholder="Title (e.g. Daily Review Dashboard)"
                            value={shot.title}
                            onChange={e => setSalesScreenshots(prev => prev.map((s, i) => i === idx ? { ...s, title: e.target.value } : s))}
                            className="w-full bg-absolute-black border border-white/10 rounded-xl px-3 py-2 text-sm text-light-gray focus:outline-none focus:border-terracotta/50"
                          />
                          <textarea
                            placeholder="Subtitle description"
                            value={shot.subtitle}
                            rows={2}
                            onChange={e => setSalesScreenshots(prev => prev.map((s, i) => i === idx ? { ...s, subtitle: e.target.value } : s))}
                            className="w-full bg-absolute-black border border-white/10 rounded-xl px-3 py-2 text-sm text-light-gray focus:outline-none focus:border-terracotta/50 resize-none"
                          />
                        </div>
                        {(shot.url || screenshotFiles[idx]) && (
                          <div className="shrink-0 w-24 h-16 rounded-xl overflow-hidden border border-white/10">
                            <img src={screenshotFiles[idx] ? URL.createObjectURL(screenshotFiles[idx]) : shot.url} alt="" className="w-full h-full object-cover" />
                          </div>
                        )}
                        <button
                          onClick={() => {
                            setSalesScreenshots(prev => prev.filter((_, i) => i !== idx));
                            setScreenshotFiles(prev => { const n = { ...prev }; delete n[idx]; return n; });
                          }}
                          className="shrink-0 self-start text-xs text-dark-blush hover:text-terracotta uppercase font-bold transition-colors mt-2 md:mt-0"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                    {salesScreenshots.length === 0 && (
                      <p className="text-muted-ash text-sm">No screenshots added yet. Click &quot;+ Add Screenshot&quot; above.</p>
                    )}
                  </div>
                </div>

                {/* ── 3. Founder Photo ── */}
                <div className="bg-card-gray border border-white/5 rounded-3xl p-8">
                  <h2 className="text-xl font-black text-light-gray uppercase mb-2">Founder Photo</h2>
                  <p className="text-xs text-muted-ash mb-6">Upload your photo. It will replace the &quot;AG&quot; placeholder in the &quot;Why VocabPod Exists&quot; section.</p>
                  <div className="flex flex-col md:flex-row gap-6 items-start">
                    <div className="flex flex-col gap-3 flex-1">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={e => setFounderPhotoFile(e.target.files?.[0] || null)}
                        className="text-sm text-muted-ash file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:uppercase file:bg-white/5 file:text-light-gray hover:file:bg-white/10 cursor-pointer"
                      />
                      {founderPhotoFile && (
                        <p className="text-xs text-terracotta">Selected: {founderPhotoFile.name} — save to upload</p>
                      )}
                      {founderPhotoUrl && !founderPhotoFile && (
                        <p className="text-xs text-muted-ash break-all">Current: {founderPhotoUrl}</p>
                      )}
                    </div>
                    {founderPhotoUrl && (
                      <div className="w-24 h-24 rounded-full overflow-hidden border border-white/10 shrink-0">
                        <img src={founderPhotoUrl} alt="Founder" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                </div>

                {/* ── 4. Intro Video ── */}
                <div className="bg-card-gray border border-white/5 rounded-3xl p-8">
                  <h2 className="text-xl font-black text-light-gray uppercase mb-2">Intro Video</h2>
                  <p className="text-xs text-muted-ash mb-6">Paste a YouTube URL. Toggle &quot;Hidden&quot; to temporarily hide the video section from the landing page.</p>
                  <div className="space-y-4">
                    <input
                      type="url"
                      placeholder="https://youtu.be/... or https://www.youtube.com/watch?v=..."
                      value={introVideoUrl}
                      onChange={e => setIntroVideoUrl(e.target.value)}
                      className="w-full bg-absolute-black border border-white/10 rounded-xl px-4 py-3 text-sm text-light-gray focus:outline-none focus:border-terracotta/50"
                    />
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <div
                        onClick={() => setIntroVideoHidden(p => !p)}
                        className={`w-12 h-6 rounded-full relative transition-colors ${introVideoHidden ? "bg-terracotta" : "bg-white/10"}`}
                      >
                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${introVideoHidden ? "left-7" : "left-1"}`} />
                      </div>
                      <span className="text-sm text-muted-ash group-hover:text-light-gray transition-colors">
                        {introVideoHidden ? "Video section is HIDDEN on landing page" : "Video section is VISIBLE on landing page"}
                      </span>
                    </label>
                  </div>
                </div>

                {/* ── 5. FAQs ── */}
                <div className="bg-card-gray border border-white/5 rounded-3xl p-8">
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-xl font-black text-light-gray uppercase">FAQs</h2>
                    <button
                      onClick={() => setSalesFaqs(prev => [...prev, { q_en: "", a_en: "", q_hi: "", a_hi: "" }])}
                      className="text-xs font-bold bg-white/5 border border-white/10 px-3 py-1.5 rounded-full hover:bg-white/10 transition-colors uppercase tracking-wide"
                    >
                      + Add FAQ
                    </button>
                  </div>
                  <p className="text-xs text-muted-ash mb-6">Edit or add FAQ items. Hindi fields are optional.</p>
                  <div className="space-y-6">
                    {salesFaqs.map((faq, idx) => (
                      <div key={idx} className="p-5 bg-absolute-black/40 rounded-2xl border border-white/5 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-terracotta uppercase tracking-widest">FAQ #{idx + 1}</span>
                          <button onClick={() => setSalesFaqs(prev => prev.filter((_, i) => i !== idx))} className="text-xs text-dark-blush hover:text-terracotta uppercase font-bold transition-colors">Remove</button>
                        </div>
                        <textarea
                          placeholder="Question (English)"
                          value={faq.q_en}
                          onChange={e => setSalesFaqs(prev => prev.map((f, i) => i === idx ? { ...f, q_en: e.target.value } : f))}
                          rows={2}
                          className="w-full bg-absolute-black border border-white/10 rounded-xl px-3 py-2 text-sm text-light-gray focus:outline-none focus:border-terracotta/50 resize-none"
                        />
                        <textarea
                          placeholder="Answer (English)"
                          value={faq.a_en}
                          onChange={e => setSalesFaqs(prev => prev.map((f, i) => i === idx ? { ...f, a_en: e.target.value } : f))}
                          rows={3}
                          className="w-full bg-absolute-black border border-white/10 rounded-xl px-3 py-2 text-sm text-light-gray focus:outline-none focus:border-terracotta/50 resize-none"
                        />
                        <textarea
                          placeholder="Question (Hindi — optional)"
                          value={faq.q_hi}
                          onChange={e => setSalesFaqs(prev => prev.map((f, i) => i === idx ? { ...f, q_hi: e.target.value } : f))}
                          rows={2}
                          className="w-full bg-absolute-black border border-white/10 rounded-xl px-3 py-2 text-sm text-light-gray focus:outline-none focus:border-terracotta/50 resize-none opacity-70"
                        />
                        <textarea
                          placeholder="Answer (Hindi — optional)"
                          value={faq.a_hi}
                          onChange={e => setSalesFaqs(prev => prev.map((f, i) => i === idx ? { ...f, a_hi: e.target.value } : f))}
                          rows={3}
                          className="w-full bg-absolute-black border border-white/10 rounded-xl px-3 py-2 text-sm text-light-gray focus:outline-none focus:border-terracotta/50 resize-none opacity-70"
                        />
                      </div>
                    ))}
                    {salesFaqs.length === 0 && (
                      <p className="text-muted-ash text-sm">No custom FAQs yet. The default FAQs will show. Click &quot;+ Add FAQ&quot; to override them.</p>
                    )}
                  </div>
                </div>

                {/* ── 6. Testimonials ── */}
                <div className="bg-card-gray border border-white/5 rounded-3xl p-8">
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-xl font-black text-light-gray uppercase">Testimonials</h2>
                    <button
                      onClick={() => setSalesTestimonials(prev => [...prev, { name: "", initials: "", quote_en: "", quote_hi: "" }])}
                      className="text-xs font-bold bg-white/5 border border-white/10 px-3 py-1.5 rounded-full hover:bg-white/10 transition-colors uppercase tracking-wide"
                    >
                      + Add Testimonial
                    </button>
                  </div>
                  <p className="text-xs text-muted-ash mb-6">Manage testimonial cards shown in the &quot;What Learners Say&quot; section. Hindi quote is optional.</p>
                  <div className="space-y-6">
                    {salesTestimonials.map((t, idx) => (
                      <div key={idx} className="p-5 bg-absolute-black/40 rounded-2xl border border-white/5 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-terracotta uppercase tracking-widest">Testimonial #{idx + 1}</span>
                          <button onClick={() => setSalesTestimonials(prev => prev.filter((_, i) => i !== idx))} className="text-xs text-dark-blush hover:text-terracotta uppercase font-bold transition-colors">Remove</button>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <input
                            type="text"
                            placeholder="Name (e.g. Himanshu)"
                            value={t.name}
                            onChange={e => setSalesTestimonials(prev => prev.map((x, i) => i === idx ? { ...x, name: e.target.value } : x))}
                            className="bg-absolute-black border border-white/10 rounded-xl px-3 py-2 text-sm text-light-gray focus:outline-none focus:border-terracotta/50"
                          />
                          <input
                            type="text"
                            placeholder="Initials (e.g. H)"
                            value={t.initials}
                            onChange={e => setSalesTestimonials(prev => prev.map((x, i) => i === idx ? { ...x, initials: e.target.value.slice(0, 2) } : x))}
                            className="bg-absolute-black border border-white/10 rounded-xl px-3 py-2 text-sm text-light-gray focus:outline-none focus:border-terracotta/50"
                          />
                        </div>
                        <textarea
                          placeholder="Quote (English)"
                          value={t.quote_en}
                          onChange={e => setSalesTestimonials(prev => prev.map((x, i) => i === idx ? { ...x, quote_en: e.target.value } : x))}
                          rows={3}
                          className="w-full bg-absolute-black border border-white/10 rounded-xl px-3 py-2 text-sm text-light-gray focus:outline-none focus:border-terracotta/50 resize-none"
                        />
                        <textarea
                          placeholder="Quote (Hindi — optional)"
                          value={t.quote_hi}
                          onChange={e => setSalesTestimonials(prev => prev.map((x, i) => i === idx ? { ...x, quote_hi: e.target.value } : x))}
                          rows={3}
                          className="w-full bg-absolute-black border border-white/10 rounded-xl px-3 py-2 text-sm text-light-gray focus:outline-none focus:border-terracotta/50 resize-none opacity-70"
                        />
                      </div>
                    ))}
                    {salesTestimonials.length === 0 && (
                      <p className="text-muted-ash text-sm">No custom testimonials yet. Default testimonials will show. Click &quot;+ Add Testimonial&quot; to override.</p>
                    )}
                  </div>
                </div>

                {/* ── Save All ── */}
                <div className="flex justify-end">
                  <button
                    disabled={isSavingSales}
                    onClick={async () => {
                      setIsSavingSales(true);
                      setSalesSaveMsg({ text: "", type: "" });
                      try {
                        let finalFounderUrl = founderPhotoUrl;
                        let updatedScreenshots = [...salesScreenshots];

                        // Upload screenshots if files were selected
                        for (const idx of Object.keys(screenshotFiles)) {
                          const idxNum = parseInt(idx);
                          const file = screenshotFiles[idxNum];
                          if (file) {
                            setSalesSaveMsg({ text: `Uploading screenshot ${idxNum + 1}...`, type: "info" });
                            const ext = file.name.split(".").pop();
                            const filename = `images/screenshot-${Date.now()}-${idxNum}.${ext}`;
                            const presignRes = await fetch("/api/upload", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ filename, contentType: file.type })
                            });
                            if (!presignRes.ok) throw new Error(`Failed to get upload URL for screenshot ${idxNum + 1}`);
                            const { uploadUrl, finalUrl } = await presignRes.json();
                            
                            if (uploadUrl !== "fallback-mode") {
                              const uploadRes = await fetch(uploadUrl, {
                                method: "PUT",
                                headers: { "Content-Type": file.type },
                                body: file
                              });
                              if (!uploadRes.ok) throw new Error(`Failed to upload screenshot ${idxNum + 1}`);
                            }
                            updatedScreenshots[idxNum].url = finalUrl;
                          }
                        }

                        // Upload founder photo if a new file was selected
                        if (founderPhotoFile) {
                          setSalesSaveMsg({ text: "Uploading founder photo...", type: "info" });
                          const ext = founderPhotoFile.name.split(".").pop();
                          const filename = `images/founder-${Date.now()}.${ext}`;
                          const presignRes = await fetch("/api/upload", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ filename, contentType: founderPhotoFile.type })
                          });
                          if (!presignRes.ok) throw new Error("Failed to get upload URL for founder photo");
                          const { uploadUrl, finalUrl } = await presignRes.json();
                          finalFounderUrl = finalUrl;
                          if (uploadUrl !== "fallback-mode") {
                            const uploadRes = await fetch(uploadUrl, {
                              method: "PUT",
                              headers: { "Content-Type": founderPhotoFile.type },
                              body: founderPhotoFile
                            });
                            if (!uploadRes.ok) throw new Error("Failed to upload founder photo");
                          }
                          setFounderPhotoUrl(finalFounderUrl);
                          setFounderPhotoFile(null);
                        }

                        setSalesSaveMsg({ text: "Saving sales config...", type: "info" });
                        const res = await fetch("/api/admin/sales", {
                          method: "PATCH",
                          headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${userEmail}`
                          },
                          body: JSON.stringify({
                            preview_word_ids: salesWordIds,
                            preview_words_data: salesWordsData,
                            screenshots: updatedScreenshots,
                            founder_photo_url: finalFounderUrl || null,
                            intro_video_url: introVideoUrl || null,
                            intro_video_hidden: introVideoHidden,
                            faqs: salesFaqs,
                            testimonials: salesTestimonials,
                          })
                        });
                        const data = await res.json();
                        if (!res.ok) throw new Error(data.error || "Save failed");
                        if (data.config) {
                          setSalesConfig(data.config);
                          setSalesWordIds(data.config.preview_word_ids || []);
                          setSalesWordsData(data.config.preview_words_data || []);
                          
                          setSalesScreenshots(
                            data.config.screenshots && data.config.screenshots.length > 0 
                              ? data.config.screenshots 
                              : DEFAULT_SCREENSHOTS
                          );
                          
                          setFounderPhotoUrl(data.config.founder_photo_url || "");
                          setIntroVideoUrl(data.config.intro_video_url || "");
                          setIntroVideoHidden(data.config.intro_video_hidden || false);
                          setSalesFaqs(
                            (data.config.faqs && data.config.faqs.length > 0 
                              ? data.config.faqs 
                              : DEFAULT_FAQS
                            ).map((f: any) => ({
                              q_en: f.q_en || "",
                              a_en: f.a_en || "",
                              q_hi: f.q_hi || "",
                              a_hi: f.a_hi || ""
                            }))
                          );
                          
                          setSalesTestimonials(
                            data.config.testimonials && data.config.testimonials.length > 0
                              ? data.config.testimonials
                              : DEFAULT_TESTIMONIALS
                          );
                        }
                        setSalesSaveMsg({ text: "✓ Sales page config saved successfully!", type: "success" });
                        setSalesConfig(data.config);
                        setScreenshotFiles({});
                      } catch (e: any) {
                        setSalesSaveMsg({ text: e.message || "Save failed.", type: "error" });
                      } finally {
                        setIsSavingSales(false);
                      }
                    }}
                    className="bg-terracotta text-white font-bold px-8 py-4 rounded-full uppercase tracking-widest text-sm hover:shadow-[0_0_20px_rgba(224,75,53,0.4)] transition-all disabled:opacity-50 flex items-center gap-2"
                  >
                    {isSavingSales ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Saving...
                      </>
                    ) : "Save All Changes →"}
                  </button>
                </div>

              </div>
            )}
          </div>
        )}

    </div>
  );
}
