"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { insertWordLesson, getUser, clearLessonsCache } from "@/lib/supabase";
import Stickman, { STICKMAN_POSES, StickmanPose } from "@/components/Stickman";

export default function AdminPortal() {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [activeTab, setActiveTab] = useState<"content" | "users" | "inactive" | "storage" | "bugs">("content");
  
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

  const [word, setWord] = useState("");
  const [phonetic, setPhonetic] = useState("");
  const [type, setType] = useState("adjective");
  const [definition, setDefinition] = useState("");
  const [narrative, setNarrative] = useState("");
  const [story, setStory] = useState("");
  const [realLifeUsages, setRealLifeUsages] = useState<{context: string, example: string}[]>([{context: "", example: ""}]);
  const [wordLevel, setWordLevel] = useState(1);
  const [wordCategory, setWordCategory] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [isFreePreview, setIsFreePreview] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [existingAudioUrl, setExistingAudioUrl] = useState("");
  const [stickmanId, setStickmanId] = useState<StickmanPose | "">("");
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
  const [isLoadingWords, setIsLoadingWords] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ type: 'delete' | 'toggle', userId: string, payload: any } | null>(null);
  const [isActionProcessing, setIsActionProcessing] = useState(false);
  const [inactiveUsers, setInactiveUsers] = useState<any[]>([]);
  const [isLoadingInactive, setIsLoadingInactive] = useState(false);

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
        fetchCategories(currentUser.email);
        fetchWordsList(currentUser.email);
        fetchCustomStickmans();
      }
    }
    checkAuth();
  }, []);

  const fetchCustomStickmans = async () => {
    try {
      const res = await fetch("/api/stickmans");
      const data = await res.json();
      setCustomStickmans(data.stickmans || []);
    } catch (e) {}
  };

  const fetchCategories = async (email: string) => {
    try {
      const res = await fetch("/api/admin/categories", { headers: { Authorization: `Bearer ${email}` } });
      const data = await res.json();
      setCategories(data.categories ? data.categories.map((c: any) => c.name) : []);
    } catch (e) {
      console.error(e);
    }
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
        const regex = new RegExp(`\\[${tag}\\]([\\s\\S]*?)(?=\\[[A-Z_]+\\]|$)`);
        const match = text.match(regex);
        return match ? match[1].trim() : "";
      };

      setWord(getField("WORD"));
      setPhonetic(getField("PHONETIC"));
      const t = getField("TYPE").toLowerCase();
      if (t) setType(t);
      setDefinition(getField("DEFINITION"));
      setNarrative(getField("NARRATIVE"));
      setStory(getField("STORY"));
      const usage = getField("USAGE");
      if (usage) {
        if (usage.trim().startsWith("[")) {
          try { setRealLifeUsages(JSON.parse(usage)); } catch (e) {}
        } else {
          const lines = usage.split("\n").map(l => l.trim()).filter(Boolean);
          const parsed = lines.map(l => {
            const [ctx, ...ex] = l.split("|");
            return { context: ctx.trim(), example: ex.join("|").trim() };
          });
          if (parsed.length > 0) setRealLifeUsages(parsed);
        }
      }
      const lvl = parseInt(getField("LEVEL"));
      if (lvl >= 1 && lvl <= 3) setWordLevel(lvl);
      const cat = getField("CATEGORY");
      if (cat) setWordCategory(cat);
      const svg = getField("SVG");
      if (svg) setSvgJson(svg);
      
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
    setMessage({ text: "", type: "" });

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
        setMessage({ text: "Uploading Audio...", type: "info" });
        
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
        setMessage({ text: "Uploading Mnemonic Image...", type: "info" });
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

      setMessage({ text: "Audio Uploaded. Saving to Database...", type: "info" });

      // Handle new category creation
      let finalCategory = wordCategory;
      if (newCategory.trim()) {
        try {
          const catRes = await fetch("/api/admin/categories", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: newCategory.trim() })
          });
          const catData = await catRes.json();
          if (catData.category) {
            finalCategory = catData.category.name;
            setCategories(prev => [...prev, finalCategory].sort());
            setWordCategory(finalCategory);
            setNewCategory("");
          }
        } catch (e) {
          console.warn("Could not create category", e);
        }
      }

      const payload = {
        word,
        phonetic,
        type,
        definition,
        narrative,
        story,
        real_life_usage: realLifeUsages.filter(u => u.context.trim() || u.example.trim()),
        level: wordLevel,
        category: finalCategory || null,
        is_free_preview: isFreePreview,
        stickman_id: stickmanId || null,
        custom_image_url: finalImageUrl || null,
        custom_svg: customSvg || null,
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
      clearLessonsCache();
      fetchStorageStats();
      
      setMessage({ text: "Success! Word lesson inserted.", type: "success" });
      
      // Reset
      setWord(""); setPhonetic(""); setDefinition(""); setNarrative(""); setStory(""); setRealLifeUsages([{context: "", example: ""}]); setWordCategory(""); setNewCategory(""); setIsFreePreview(false); setAudioFile(null); setStickmanId(""); setSvgJson('[\n  {"tag": "circle", "props": {"cx": "200", "cy": "150", "r": "20", "fill": "#E04B35"}}\n]');
      setQuestion(""); setOpt1(""); setOpt2(""); setOpt3(""); setOpt4(""); setCorrectOpt(1); setExplanation("");
      setExistingAudioUrl("");
      setCustomSvg("");
      setImageFile(null);
      setExistingImageUrl("");
      fetchCategories(userEmail);
      
    } catch (err: any) {
      setMessage({ text: err.message || "Failed to submit.", type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthorized) return null;

  return (
    <div className="min-h-screen bg-absolute-black text-light-gray font-sans selection:bg-terracotta/20 selection:text-terracotta pb-20">
      
      {/* Admin Header */}
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
            Inactive Premium
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
        </div>

        {message.text && (
          <div className={`p-4 rounded-xl mb-8 border font-bold text-sm max-w-3xl ${
            message.type === 'success' 
              ? 'bg-emerald-950/30 text-emerald-400 border-emerald-500/30' 
              : 'bg-dark-blush text-terracotta border-terracotta/30'
          }`}>
            {message.text}
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
                <table className="w-full text-left text-sm">
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
                              ? "bg-emerald-950/30 text-emerald-400 border-emerald-500/30" 
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
                            className="bg-emerald-950/20 hover:bg-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg border border-emerald-500/20 transition-colors"
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
              <h1 className="text-3xl font-bold tracking-tight">Inactive Premium Users</h1>
              <p className="text-sm text-muted-ash mt-1">Premium users who have not opened the site in the last 2 days.</p>
            </div>

            {isLoadingInactive ? (
              <div className="text-muted-ash animate-pulse">Fetching inactive users...</div>
            ) : inactiveUsers.length === 0 ? (
              <div className="bg-card-gray border border-white/5 rounded-2xl p-8 text-center text-muted-ash">
                All premium users are active. Great retention!
              </div>
            ) : (
              <div className="space-y-3">
                {inactiveUsers.map(u => (
                  <div key={u.id} className="bg-card-gray border border-white/5 rounded-2xl p-5 flex items-center justify-between">
                    <div className="space-y-0.5">
                      <p className="font-bold text-light-gray">{u.email}</p>
                      <p className="text-xs text-muted-ash">
                        Last active: {u.last_active_date ? new Date(u.last_active_date).toLocaleDateString() : "Never"}
                      </p>
                    </div>
                    {u.phone ? (
                      <a
                        href={`https://wa.me/${u.phone.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-2 bg-emerald-900/30 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full hover:bg-emerald-500/20 transition-colors"
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
                          <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border ${bug.status === "open" ? "text-amber-400 border-amber-500/20 bg-amber-950/20" : "text-emerald-400 border-emerald-500/20 bg-emerald-950/20"}`}>
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
                            ? "border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10" 
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
            
            {/* Existing Words List */}
            <div className="bg-card-gray border border-white/5 rounded-3xl p-8 shadow-xl">
              <h2 className="text-xl font-bold tracking-tight mb-4">Manage Existing Words</h2>
              {isLoadingWords ? (
                <div className="text-muted-ash animate-pulse">Loading words...</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-white/5 text-muted-ash font-bold uppercase tracking-wider text-xs">
                      <tr>
                        <th className="px-4 py-3">Word</th>
                        <th className="px-4 py-3">Level</th>
                        <th className="px-4 py-3">Category</th>
                        <th className="px-4 py-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {allWords.map((w: any) => (
                        <tr key={w.id} className="hover:bg-white/5 transition-colors">
                          <td className="px-4 py-3 font-bold text-light-gray">{w.word}</td>
                          <td className="px-4 py-3 text-muted-ash">L{w.level}</td>
                          <td className="px-4 py-3 text-muted-ash">{w.category || "-"}</td>
                          <td className="px-4 py-3 text-right space-x-4">
                            <button
                              onClick={() => {
                                setWord(w.word);
                                setPhonetic(w.phonetic || "");
                                setType(w.type || "adjective");
                                setDefinition(w.definition || "");
                                setNarrative(w.narrative || "");
                                setStory(w.story || "");
                                setRealLifeUsages(w.real_life_usage && w.real_life_usage.length > 0 ? w.real_life_usage : [{context: "", example: ""}]);
                                setWordLevel(w.level || 1);
                                setWordCategory(w.category || "");
                                setIsFreePreview(w.is_free_preview || false);
                                setStickmanId(w.stickman_id || "");
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
                                window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
                              }}
                              className="text-xs font-bold text-terracotta uppercase hover:underline"
                            >
                              Edit
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
                </div>
              )}
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

                <div className="mt-8 border-t border-white/5 pt-6">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-muted-ash mb-3">Syntax Guide Template</h3>
                  <div className="relative group">
                    <pre className="bg-deep-canvas border border-white/10 rounded-xl p-4 text-[10px] font-mono text-muted-ash overflow-x-auto whitespace-pre-wrap leading-relaxed select-all">
{`[WORD] ExampleWord
[PHONETIC] /ɪgˈzæm.pəl/
[TYPE] noun
[DEFINITION] A representative form.
[NARRATIVE] Here is a narrative to help.
[STORY] The ExampleWord is highlighted.
[USAGE] Everyday use | This is an ExampleWord.
[LEVEL] 1
[CATEGORY] Basic Words
[SVG] [{"tag": "circle", "props": {"cx": "50", "cy": "50", "r": "40"}}]
[QUIZ_Q] What is this?
[QUIZ_A1] Answer 1 [CORRECT]
[QUIZ_A2] Answer 2
[QUIZ_A3] Answer 3
[QUIZ_A4] Answer 4
[QUIZ_EXP] Explanation of the answer.`}
                    </pre>
                    <button
                      onClick={() => navigator.clipboard.writeText("[WORD] \n[PHONETIC] \n[TYPE] \n[DEFINITION] \n[NARRATIVE] \n[STORY] \n[USAGE] \n[LEVEL] \n[CATEGORY] \n[SVG] \n[QUIZ_Q] \n[QUIZ_A1]  [CORRECT]\n[QUIZ_A2] \n[QUIZ_A3] \n[QUIZ_A4] \n[QUIZ_EXP] ")}
                      className="absolute top-2 right-2 p-2 bg-white/10 rounded-lg text-light-gray opacity-0 group-hover:opacity-100 transition-opacity hover:bg-terracotta/50"
                      title="Copy empty template"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                    </button>
                  </div>
                  <p className="text-[10px] text-muted-ash mt-3 leading-relaxed">
                    Click the copy icon to copy an empty template. <strong>[LEVEL]</strong> must be 1, 2, or 3. <strong>[TYPE]</strong> must be adjective, noun, or verb. <strong>[STORY]</strong>, <strong>[USAGE]</strong>, <strong>[CATEGORY]</strong>, and <strong>[SVG]</strong> are optional but must be included in syntax to parse correctly.
                  </p>
                </div>
              </div>

            {/* Manual Entry Right Column */}
            <div className="lg:col-span-7">
              <h1 className="text-3xl font-bold tracking-tight mb-8">Content Entry System</h1>
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
                    <label className="text-xs font-bold text-muted-ash uppercase">Part of Speech</label>
                    <select value={type} onChange={e => setType(e.target.value)} className="w-full bg-deep-canvas border border-white/10 rounded-xl p-3 focus:outline-none focus:border-terracotta/50 appearance-none">
                      <option value="adjective">Adjective</option>
                      <option value="noun">Noun</option>
                      <option value="verb">Verb</option>
                    </select>
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

                  <div className="space-y-3 border-t border-white/5 pt-6">
                    <label className="text-xs font-bold text-muted-ash uppercase">Visual Anchor (Stickman)</label>
                    <p className="text-[10px] text-muted-ash/60">Select a stickman pose to illustrate the mnemonic. If selected, this overrides custom SVG JSON.</p>
                    <div className="grid grid-cols-5 md:grid-cols-8 gap-3">
                      {[...STICKMAN_POSES, ...customStickmans.map(s => s.name)].map(pose => (
                        <button
                          key={pose}
                          type="button"
                          onClick={() => setStickmanId(pose === stickmanId ? "" : pose)}
                          className={`flex flex-col items-center p-3 rounded-xl border transition-all ${
                            stickmanId === pose 
                              ? "bg-dark-blush border-terracotta/50 text-terracotta" 
                              : "bg-deep-canvas border-white/5 text-muted-ash hover:border-white/20"
                          }`}
                        >
                          <Stickman pose={pose} className="w-8 h-8 mb-2" headColor={stickmanId === pose ? "var(--color-terracotta)" : "currentColor"} />
                          <span className="text-[9px] uppercase tracking-widest font-bold truncate w-full text-center">{pose}</span>
                        </button>
                      ))}
                    </div>

                    <div className="mt-4 bg-absolute-black border border-white/10 p-4 rounded-xl space-y-3">
                      <p className="text-xs font-bold text-light-gray uppercase">Add New Custom Stickman</p>
                      <div className="flex gap-2">
                        <input value={newStickmanName} onChange={e => setNewStickmanName(e.target.value)} placeholder="Name (e.g. superhero)" className="w-1/3 bg-deep-canvas border border-white/10 rounded-lg p-2 text-xs focus:border-terracotta/50" />
                        <input value={newStickmanSvg} onChange={e => setNewStickmanSvg(e.target.value)} placeholder="<path d='...' />" className="flex-1 bg-deep-canvas border border-white/10 rounded-lg p-2 text-xs font-mono focus:border-terracotta/50" />
                        <button type="button" onClick={async () => {
                          if (!newStickmanName || !newStickmanSvg) return;
                          await fetch("/api/admin/stickmans", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ name: newStickmanName, svg_code: newStickmanSvg })
                          });
                          setNewStickmanName(""); setNewStickmanSvg(""); fetchCustomStickmans();
                        }} className="bg-terracotta px-4 text-xs font-bold rounded-lg hover:bg-terracotta/80">Add</button>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-muted-ash uppercase">Level</label>
                      <select value={wordLevel} onChange={e => setWordLevel(Number(e.target.value))} className="w-full bg-deep-canvas border border-white/10 rounded-xl p-3 focus:outline-none focus:border-terracotta/50 appearance-none">
                        <option value={1}>1 - Foundation</option>
                        <option value={2}>2 - Nuance</option>
                        <option value={3}>3 - Mastery</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-muted-ash uppercase">Category</label>
                        {wordCategory && wordCategory !== "__new__" && (
                          <button type="button" onClick={async () => {
                            if (confirm(`Are you sure you want to delete the category '${wordCategory}' from all words?`)) {
                              await fetch(`/api/admin/categories?category=${encodeURIComponent(wordCategory)}`, { method: "DELETE" });
                              setWordCategory(""); fetchCategories(userEmail);
                            }
                          }} className="text-[10px] text-red-500 hover:text-red-400 font-bold tracking-wider uppercase">Delete Selected Category</button>
                        )}
                      </div>
                      {categories.length > 0 ? (
                        <select value={wordCategory} onChange={e => setWordCategory(e.target.value)} className="w-full bg-deep-canvas border border-white/10 rounded-xl p-3 focus:outline-none focus:border-terracotta/50 appearance-none">
                          <option value="">None</option>
                          {categories.map(c => <option key={c} value={c}>{c}</option>)}
                          <option value="__new__">+ Create new...</option>
                        </select>
                      ) : (
                        <input value={newCategory} onChange={e => setNewCategory(e.target.value)} placeholder="New category name" className="w-full bg-deep-canvas border border-white/10 rounded-xl p-3 focus:outline-none focus:border-terracotta/50" />
                      )}
                      {wordCategory === "__new__" && (
                        <input value={newCategory} onChange={e => setNewCategory(e.target.value)} placeholder="New category name" className="w-full bg-deep-canvas border border-white/10 rounded-xl p-3 mt-2 focus:outline-none focus:border-terracotta/50" />
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-deep-canvas border border-white/10 rounded-xl">
                    <div>
                      <p className="text-xs font-bold text-light-gray uppercase tracking-wider">Free Preview</p>
                      <p className="text-[10px] text-muted-ash">Make this word accessible to free users</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsFreePreview(p => !p)}
                      className={`w-12 h-6 rounded-full transition-colors relative ${isFreePreview ? "bg-terracotta" : "bg-white/10"}`}
                    >
                      <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isFreePreview ? "right-1" : "left-1"}`} />
                    </button>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-ash uppercase">Audio File (.mp3)</label>
                    <input 
                      required={!existingAudioUrl} 
                      type="file" 
                      accept="audio/*" 
                      onChange={e => setAudioFile(e.target.files?.[0] || null)} 
                      className="w-full bg-deep-canvas border border-white/10 rounded-xl p-3 text-light-gray file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-terracotta file:text-light-gray hover:file:bg-terracotta/80 cursor-pointer focus:outline-none focus:border-terracotta/50" 
                    />
                    {existingAudioUrl && (
                      <p className="text-xs text-emerald-400 font-bold mt-1">
                        Existing Audio: {existingAudioUrl.split('/').pop()}
                      </p>
                    )}
                  </div>
                </section>

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
                      <p className="text-xs text-emerald-400 font-bold mt-1">
                        Existing Image Loaded: {existingImageUrl.split('/').pop()}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-ash uppercase">Or Structured SVG JSON (Advanced)</label>
                    <textarea required value={svgJson} onChange={e => setSvgJson(e.target.value)} className="w-full bg-deep-canvas border border-white/10 rounded-xl p-3 focus:outline-none focus:border-terracotta/50 font-mono text-xs text-terracotta min-h-[100px]" />
                  </div>
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

                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full bg-terracotta text-light-gray font-bold py-5 rounded-full hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(224,75,53,0.4)] transition-all disabled:opacity-50 text-sm tracking-wider uppercase"
                >
                  {isSubmitting ? "INJECTING LESSON..." : "SUBMIT TO DATABASE"}
                </button>
              </form>
            </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
