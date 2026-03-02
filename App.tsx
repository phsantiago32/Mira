import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import Navigation from './components/Navigation';
import CommunityView from './components/CommunityView';
import AssistantView from './components/AssistantView';
import DashboardView from './components/DashboardView';
import { HomeView } from './components/HomeView';
import { DocumentAssistant } from './components/DocumentAssistant';
import { GamificationProfile } from './components/GamificationProfile';
import { JobBoard } from './components/JobBoard';
import { LearningHub } from './components/LearningHub';
import { LocalServicesList } from './components/LocalServicesList';
import { PrivacyPage } from './components/PrivacyPage';
import { ConsentModal } from './components/ConsentModal';
import { AuthScreen } from './components/AuthScreen';
import { ViewType, DocumentTask, ChatSession, GeneratedDocument, User, NotificationPreferences, Course, CATEGORIES, Post } from './types';
import { analytics } from './services/analyticsService';
import { communityService } from './services/communityService';
import { AdminHub } from './components/AdminHub';
import { authService } from './services/authService';
import { MIRA_LOGO } from './constants';
import { Bell, X, Info, Bot, Globe, ChevronDown, LayoutDashboard, LogOut, Sparkles, MessageCircle, ArrowLeft, Users, Volume2 } from 'lucide-react';
import { t } from './utils/translations';
import { ToastProvider } from './components/Toast';

const INITIAL_NOTIFS: NotificationPreferences = {
  OFFICIAL_AIMA: true,
  LEGAL_CHANGES: true,
  DOC_EXPIRATION: true,
  JOB_MATCHES: true,
  COMMUNITY_REPUTATION: true,
  MAP_URGENCY: true,
  MIRA_INSIGHTS: true,
  SOCIAL_CONNECT: true,
  MIRA_ARTICLE: true,
  COMMUNITY_REPLY: true,
  COMMUNITY_FOLLOW_UP: true
};



const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('mira_user');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return null; }
    }
    return null;
  });
  const [currentView, setCurrentView] = useState<ViewType>(ViewType.HOME);
  const [showConsent, setShowConsent] = useState(false);
  const [points, setPoints] = useState(0);

  const [language, setLanguage] = useState(() => {
    const navLang = navigator.language?.split('-')[0]?.toUpperCase();
    return ['PT', 'EN', 'ES', 'FR'].includes(navLang) ? navLang : 'EN';
  });
  const [showLangMenu, setShowLangMenu] = useState(false);

  const [tasks, setTasks] = useState<DocumentTask[]>([]);
  const [chatSessions] = useState<ChatSession[]>([]);
  const [docDrafts, setDocDrafts] = useState<any[]>([]);
  const [docHistory, setDocHistory] = useState<GeneratedDocument[]>([]);
  const [savedPostsIds, setSavedPostsIds] = useState<Set<string>>(new Set());
  const [courses, setCourses] = useState<Course[]>([]);
  const [masterPosts, setMasterPosts] = useState<Post[]>(() => {
    const saved = localStorage.getItem('mira_community_posts');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { }
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('mira_community_posts', JSON.stringify(masterPosts));
  }, [masterPosts]);

  // DB Sync for Posts
  useEffect(() => {
    if (user && user.id) {
      communityService.fetchPosts(user.id).then(dbPosts => {
        if (dbPosts && dbPosts.length > 0) {
          setMasterPosts(dbPosts);
        }
      });
    }
  }, [user?.id]);

  useEffect(() => {
    supabase.from('courses').select('*').then(({ data }) => {
      if (data && data.length > 0) {
        setCourses(data.map(item => ({
          id: item.id,
          title: item.title,
          description: item.description,
          category: item.category as any,
          type: item.type,
          duration: item.duration,
          image: item.image_url || 'https://images.unsplash.com/photo-1544652478-6653e09f18a2?w=800&q=80',
          link: item.link || undefined
        })));
      }
    });
  }, []);

  useEffect(() => {
    // Rehydrate user from localStorage FIRST to avoid flicker
    const storedUser = localStorage.getItem('mira_user');
    if (storedUser) {
      try {
        const u = JSON.parse(storedUser);
        setUser(u);
        console.log("MIRA: Rehydrated from localStorage", u.id);
      } catch (e) { }
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("MIRA: Auth State Changed:", event);
      if (session) {
        const profile = await authService.fetchProfileWithRetry(session.user.id);
        let u: User;
        if (profile) {
          u = authService.mapProfileToUser(profile, session.user);
          // Auto-sync email if missing
          if (!profile.email && session.user.email) {
            supabase.from('profiles').update({ email: session.user.email }).eq('id', profile.id).then();
          }
        } else {
          u = await authService.createFallbackProfile(session.user.id, session.user.email || '', session.user.user_metadata?.name);
        }

        setUser(u);
        localStorage.setItem('mira_user', JSON.stringify(u));

        if (u.role === 'admin') setCurrentView(ViewType.ADMIN_HUB);
        else {
          const consentGiven = localStorage.getItem('mira_consent_given');
          if (consentGiven !== 'true') setShowConsent(true);
        }

        // Parallel Data Fetch (Community, Saved, etc.)
        supabase.from('saved_posts').select('post_id').eq('user_id', session.user.id).then(({ data }) => {
          if (data) setSavedPostsIds(new Set(data.map(d => d.post_id)));
        });

      } else {
        if (event === 'SIGNED_OUT') {
          console.log("MIRA: User signed out, flushing local cache.");
          localStorage.clear();
          setUser(null);
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    }
  }, []);

  useEffect(() => {
    const handleForceLogout = () => handleLogoutAction();
    window.addEventListener('mira_force_logout', handleForceLogout);
    return () => window.removeEventListener('mira_force_logout', handleForceLogout);
  }, []);

  const handleLogin = (newUser: User) => {
    // Opcional: Ainda usado se AuthScreen quiser forçar o set de usuário antes do onAuthStateChange
    setUser(newUser);
    if (newUser.role === 'admin') setCurrentView(ViewType.ADMIN_HUB);
    else {
      const consentGiven = localStorage.getItem('mira_consent_given');
      if (consentGiven !== 'true') setShowConsent(true);
    }
  };

  const handleLogoutAction = async () => {
    // NUCLEAR LOGOUT: Clear storage FIRST so even if signout fails, the state is gone on reload
    console.log("MIRA: Force clearing storage...");
    localStorage.clear();
    sessionStorage.clear();

    try {
      // Try to sign out gracefully, but don't let it block us
      supabase.auth.signOut().catch(e => console.error("SignOut fail:", e));

      setUser(null);
      setMasterPosts([]);
      setPoints(0);
      setTasks([]);
      setDocHistory([]);

      // Redirect to top level to force a fresh start
      window.location.href = window.location.origin + window.location.pathname;
    } catch (error) {
      console.error('MIRA Logout Error:', error);
      window.location.reload();
    }
  };

  const handleToggleSavePost = async (postId: string) => {
    if (!user) return;
    const newSet = new Set(savedPostsIds);
    const isAdding = !newSet.has(postId);

    if (isAdding) {
      newSet.add(postId);
      analytics.track('vote_cast', user.id, 'SavePost', { postId });
    } else {
      newSet.delete(postId);
    }
    setSavedPostsIds(newSet);
    localStorage.setItem('mira_saved_posts', JSON.stringify(Array.from(newSet)));

    try {
      await communityService.toggleSavedPost(postId, user.id);
    } catch (e) {
      console.error('Error toggling saved post in DB:', e);
    }
  };

  const handleAddCourse = (course: Course) => {
    const updated = [course, ...courses];
    setCourses(updated);
    localStorage.setItem('mira_courses', JSON.stringify(updated));
  };

  const handleAddMultipleCourses = (newCourses: Course[]) => {
    const updated = [...newCourses, ...courses];
    setCourses(updated);
    localStorage.setItem('mira_courses', JSON.stringify(updated));
  };

  const handleAcceptConsent = () => {
    localStorage.setItem('mira_consent_given', 'true');
    setShowConsent(false);
  };

  const renderView = () => {
    if (!user) return null;
    const lowerLang = language.toLowerCase().substring(0, 2);
    switch (currentView) {
      case ViewType.HOME: return <HomeView user={user} onViewChange={setCurrentView} language={language} onLogout={handleLogoutAction} />;
      case ViewType.COMMUNITY: return <CommunityView language={language} user={user} onViewChange={setCurrentView} onEarnPoints={setPoints} masterPosts={masterPosts} setMasterPosts={setMasterPosts} savedPostsIds={savedPostsIds} onToggleSavePost={handleToggleSavePost} />;
      case ViewType.ASSISTANT: return <AssistantView language={language} />;
      case ViewType.JOBS: return <JobBoard language={language} isAdmin={user.role === 'admin'} />;
      case ViewType.MAP: return <LocalServicesList language={language} />;
      case ViewType.LEARNING: return <LearningHub courses={courses} onNavigateToChat={() => setCurrentView(ViewType.ASSISTANT)} onEarnPoints={() => { }} onNavigateToContact={() => { }} language={language} />;
      case ViewType.DOCUMENTS: return <DocumentAssistant tasks={tasks} chatSessions={chatSessions} drafts={docDrafts} setDrafts={setDocDrafts} history={docHistory} addToHistory={(doc) => setDocHistory([doc, ...docHistory])} onOpenSession={() => { }} language={language} onEarnPoints={() => { }} onToggleTask={() => { }} onViewChange={setCurrentView} />;
      case ViewType.PROFILE: return <GamificationProfile user={user} onUpdateUser={setUser} helps={14} impact={342 + points} badges={['Resiliente']} activitiesCount={142} savedCount={savedPostsIds.size} followingCount={56} language={lowerLang} onNavigateToPost={() => setCurrentView(ViewType.COMMUNITY)} onViewChange={setCurrentView} createdPosts={masterPosts.filter(p => p.authorId === user.id)} onDeletePost={async (id) => { if (!window.confirm("Certeza que queres eliminar este post?")) return; setMasterPosts(prev => prev.filter(p => p.id !== id)); try { const { communityService } = await import('./services/communityService'); await communityService.deletePost(id, user.id); } catch (e) { } }} savedPosts={masterPosts.filter(p => savedPostsIds.has(p.id))} onLogout={handleLogoutAction} />;
      case ViewType.DASHBOARD: return <DashboardView masterPosts={masterPosts} onUpdatePosts={setMasterPosts} totalOfficialDocs={6} onAddCourse={handleAddCourse} onAddMultipleCourses={handleAddMultipleCourses} onLogout={handleLogoutAction} onDeleteAllUsers={() => {
        // In a real app, this would call an API. Here we simulate by clearing local storage and resetting state
        localStorage.removeItem('mira_user');
        localStorage.removeItem('mira_consent_given');
        alert("Base de dados de utilizadores limpa com sucesso (Simulação).");
      }} />;
      case ViewType.ADMIN_HUB: return <AdminHub onBack={() => setCurrentView(ViewType.DASHBOARD)} />;
      case ViewType.PRIVACY: return <PrivacyPage />;
      default: return <HomeView user={user} onViewChange={setCurrentView} language={language} />;
    }
  };

  if (!user) return <AuthScreen onLogin={handleLogin} language={language} setLanguage={setLanguage} />;

  const isAdmin = user.role === 'admin';

  return (
    <ToastProvider>
      <div className={`min-h-screen ${isAdmin ? 'bg-slate-950' : 'bg-slate-50'} flex flex-col font-['Plus_Jakarta_Sans'] overflow-hidden`}>
        {showConsent && <ConsentModal onAccept={handleAcceptConsent} onDecline={() => setShowConsent(false)} />}

        {/* TOP HEADER - Always at the top */}
        <header className={`${isAdmin ? 'bg-slate-900 border-white/5 shadow-2xl' : 'bg-white/95 border-b shadow-sm'} backdrop-blur-md sticky top-0 z-[150] px-6 py-4 flex items-center justify-between transition-all duration-300 w-full`}>
          <div className="flex items-center gap-3 group cursor-pointer" onClick={() => setCurrentView(isAdmin ? ViewType.ADMIN_HUB : ViewType.HOME)}>
            <div className="w-10 h-10 shadow-glow transition-transform group-hover:scale-110">{MIRA_LOGO}</div>
            <span className={`${isAdmin ? 'text-white' : 'text-slate-900'} font-black tracking-tighter text-2xl`}>MIRA</span>
          </div>

          <div className="flex items-center gap-4">

            <div className="relative">
              <button
                onClick={() => setShowLangMenu(true)}
                className={`p-2.5 rounded-2xl flex items-center gap-3 transition-all shadow-lg ${isAdmin ? 'bg-slate-800 text-white shadow-xl' : 'bg-mira-orange text-white shadow-orange-500/30 hover:scale-110 active:scale-95'}`}
              >
                <div className="p-1.5 bg-white/20 rounded-lg">
                  <Globe size={18} className="animate-pulse-slow" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">{language}</span>
              </button>
            </div>
          </div>
        </header>

        {/* Netflix-Style Language Modal */}
        {showLangMenu && (
          <div className="fixed inset-0 z-[1000] bg-slate-950/90 backdrop-blur-2xl flex items-center justify-center p-6 animate-in fade-in zoom-in duration-300">
            <div className="w-full max-w-lg bg-white/5 border border-white/10 rounded-[3rem] p-10 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-mira-orange/20 rounded-full blur-[80px] -mr-32 -mt-32"></div>
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-mira-blue/20 rounded-full blur-[80px] -ml-32 -mb-32"></div>

              <div className="relative z-10 space-y-8 text-center text-white">
                <div className="space-y-2">
                  <h2 className="text-3xl font-black uppercase tracking-tighter">Escolha o seu Idioma</h2>
                  <p className="text-[11px] font-black text-white/40 uppercase tracking-[0.3em]">Written & Audio Experience</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {[
                    { code: 'PT', label: 'Português', sub: 'Nativo', flag: '🇵🇹' },
                    { code: 'EN', label: 'English', sub: 'Standard', flag: '🇬🇧' },
                    { code: 'ES', label: 'Español', sub: 'Latino', flag: '🇪🇸' },
                    { code: 'FR', label: 'Français', sub: 'Européen', flag: '🇫🇷' }
                  ].map((l) => (
                    <button
                      key={l.code}
                      onClick={() => { setLanguage(l.code); setShowLangMenu(false); }}
                      className={`group p-6 rounded-[2rem] border transition-all flex flex-col items-center gap-2 ${language === l.code ? 'bg-mira-orange border-mira-orange shadow-2xl scale-105' : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'}`}
                    >
                      <span className="text-3xl mb-1">{l.flag}</span>
                      <span className="font-black text-xs uppercase tracking-widest">{l.label}</span>
                      <div className="flex items-center gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
                        <Volume2 size={10} />
                        <span className="text-[8px] font-black uppercase tracking-widest">Audio ON</span>
                      </div>
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setShowLangMenu(false)}
                  className="mt-6 p-4 text-white/40 hover:text-white transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Area with Bottom/Side Navigation */}
        <div className="flex flex-1 overflow-hidden relative">
          {/* Navigation - Fixed on bottom for mobile, sidebar-like for desktop */}
          <div className="fixed bottom-0 left-0 right-0 z-[200] md:relative md:w-24 md:h-full transition-transform duration-300">
            <Navigation currentView={currentView} onViewChange={setCurrentView} language={language} />
          </div>

          {/* View Render Area */}
          <main className="flex-1 overflow-hidden flex flex-col h-[calc(100vh-64px)] md:h-full">
            <div className="flex-1 overflow-y-auto no-scrollbar">
              <div className="max-w-5xl mx-auto h-full relative">
                {renderView()}
              </div>
            </div>
          </main>

          {/* Floating Chat Mira Button */}
          <button
            onClick={() => setCurrentView(ViewType.ASSISTANT)}
            className="fixed bottom-24 right-6 md:bottom-10 md:right-10 z-[300] w-16 h-16 bg-gradient-to-br from-mira-orange via-orange-500 to-red-600 text-white rounded-full flex items-center justify-center shadow-[0_10px_40px_rgba(249,115,22,0.6)] active:scale-90 transition-all hover:scale-110 group animate-pulse"
          >
            <Bot size={32} className="text-white group-hover:rotate-12 transition-transform drop-shadow-md" />
            <div className="absolute top-0 right-0 w-4 h-4 bg-mira-green rounded-full border-2 border-white"></div>
          </button>
        </div>

        <style>{`
          @keyframes bounce-slow { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
          .animate-bounce-slow { animation: bounce-slow 4s infinite ease-in-out; }
        `}</style>
      </div>
    </ToastProvider>
  );
};

export default App;
