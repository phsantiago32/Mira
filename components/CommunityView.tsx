
import React, { useState, useMemo, useEffect } from 'react';
import {
  Heart, MessageCircle, MoreHorizontal,
  CheckCircle2, Search, Plus, X,
  ImageIcon, Bookmark, ThumbsUp, ThumbsDown,
  ChevronDown, Send, AlertTriangle, Trash2, Filter, Loader2,
  Share2, Flag, UserPlus, Info, Reply, CheckCircle, ShieldX, ShieldAlert, Star, Users, Zap, Shield, Volume2
} from 'lucide-react';
import { Post, UNIFIED_CATEGORIES, User, UnifiedCategory, Comment, ViewType } from '../types';
import { autoTranslateText, generateSpeech } from '../services/geminiService';
import { t } from '../utils/translations';
import { analytics } from '../services/analyticsService';
import { communityService } from '../services/communityService';
import { useToast } from './Toast';

// Audio & Translation Helpers
const translationCache: Record<string, string> = {};

function decodeBase64(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(data: Uint8Array, ctx: AudioContext, numChannels: number): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  // Use the context's current sample rate if possible, or try to detect from metadata if we had any
  // Gemini usually returns 24000
  const buffer = ctx.createBuffer(numChannels, frameCount, ctx.sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

const TranslatedText: React.FC<{ text: string, language: string, className?: string }> = ({ text, language, className }) => {
  const [translated, setTranslated] = useState(text);
  const [isTranslating, setIsTranslating] = useState(false);

  useEffect(() => {
    const cacheKey = `${text}_${language}`;
    if (translationCache[cacheKey]) {
      setTranslated(translationCache[cacheKey]);
      return;
    }

    let isMounted = true;
    setIsTranslating(true);
    autoTranslateText(text, language).then(res => {
      if (!isMounted) return;
      translationCache[cacheKey] = res;
      setTranslated(res);
      setIsTranslating(false);
    });
    return () => { isMounted = false; };
  }, [text, language]);

  return <span className={className}>{translated} {isTranslating && <Loader2 size={12} className="inline animate-spin ml-1 opacity-50" />}</span>;
}

let activeSource: AudioBufferSourceNode | null = null;
let currentAudioContext: AudioContext | null = null;

const VoicePlayButton: React.FC<{ text: string, language: string }> = ({ text, language }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const stopAudio = () => {
    if (activeSource) {
      try { activeSource.stop(); } catch (e) { }
      activeSource = null;
    }
    setIsPlaying(false);
  };

  const handlePlay = async () => {
    if (isPlaying) { stopAudio(); return; }

    stopAudio(); // Parar qualquer outro áudio na app
    setIsLoading(true);

    try {
      const cacheKey = `${text}_${language}`;
      let textToRead = translationCache[cacheKey] || text;

      const audioData = await generateSpeech(textToRead, language);
      setIsLoading(false);

      if (!audioData) return;

      if (!currentAudioContext) {
        currentAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      if (currentAudioContext.state === 'suspended') await currentAudioContext.resume();

      setIsPlaying(true);
      const decodedData = decodeBase64(audioData);
      const buffer = await decodeAudioData(decodedData, currentAudioContext, 1);
      const source = currentAudioContext.createBufferSource();
      source.buffer = buffer;
      source.connect(currentAudioContext.destination);
      source.onended = () => { setIsPlaying(false); activeSource = null; };
      activeSource = source;
      source.start(0);
    } catch (err) {
      console.error(err);
      setIsLoading(false);
      setIsPlaying(false);
      activeSource = null;
    }
  };

  return (
    <button onClick={handlePlay} className={`p-4 rounded-2xl transition-all flex items-center justify-center relative ${isPlaying ? 'bg-mira-orange text-white shadow-lg shadow-orange-200 scale-105' : 'bg-slate-50 text-slate-300 hover:bg-mira-orange-pastel hover:text-mira-orange active:scale-90'}`} title="Ouvir na minha língua">
      {isLoading ? <Loader2 size={22} className="animate-spin" /> : isPlaying ? <div className="w-4 h-4 rounded-sm bg-white animate-pulse"></div> : <Volume2 size={22} />}
    </button>
  );
}

const getCategoryKey = (cat: string) => {
  switch (cat) {
    case 'Documentos & Regularização': return 'cat_doc';
    case 'Emprego & Oportunidades': return 'cat_job';
    case 'Finanças & Apoios': return 'cat_fin';
    case 'Habitação & Vida Local': return 'cat_hou';
    case 'Saúde & Bem-Estar': return 'cat_hea';
    case 'Educação & Formação': return 'cat_edu';
    case 'Comunidade & Solidariedade': return 'cat_com';
    case 'Direitos & Segurança': return 'cat_rig';
    case 'Tecnologia & Ética Digital': return 'cat_tec';
    case 'Histórias & Vozes Migrantes': return 'cat_sto';
    default: return cat;
  }
};

interface CommunityViewProps {
  language: string;
  user: User;
  onViewChange: (view: ViewType) => void;
  onEarnPoints: (points: number) => void;
  masterPosts: Post[];
  setMasterPosts: React.Dispatch<React.SetStateAction<Post[]>>;
  savedPostsIds: Set<string>;
  onToggleSavePost: (postId: string) => void;
}

const THEMED_IMAGES = [
  'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=800&q=80', // Friends integration
  'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&q=80', // Diverse community
  'https://images.unsplash.com/photo-1521737852567-6949f3f9f2b5?w=800&q=80', // Support/union
  'https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?w=800&q=80', // Happy diverse group
  'https://images.unsplash.com/photo-1476900543704-4312b78632f8?w=800&q=80', // Journey/Adventure
  'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=800&q=80', // Handshake/Support
  'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&q=80', // Integration/Education
  'https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=800&q=80',  // Networking/Team
  'https://images.unsplash.com/photo-1543269865-cbf427effbad?w=800&q=80', // Meeting/Greeting warmly
  'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=800&q=80', // Stack of hands / Unity
  'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=800&q=80', // Eating together / Fellowship
  'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=800&q=80', // Airplane/Luggage/Journey
  'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&q=80', // Group studying / Language barrier
  'https://images.unsplash.com/photo-1491438590914-bc09fcaaf77a?w=800&q=80', // Looking at map/city / Discovering
  'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&q=80', // Coworking / Professional Integration
  'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&q=80'  // Diverse people cheering/happy
];


const CommunityView: React.FC<CommunityViewProps> = ({
  language, user, onViewChange, onEarnPoints, masterPosts, setMasterPosts, savedPostsIds, onToggleSavePost
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('Todos');
  const [searchFilter, setSearchFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<UnifiedCategory | ''>('');
  const [selectedImage, setSelectedImage] = useState(THEMED_IMAGES[0]);
  const [commentingOn, setCommentingOn] = useState<{ postId: string, replyToName?: string } | null>(null);
  const [newComment, setNewComment] = useState('');
  const [userVotes, setUserVotes] = useState<Record<string, 'true' | 'false'>>({});
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [likedComments, setLikedComments] = useState<Set<string>>(new Set());
  const [selectedMember, setSelectedMember] = useState<User | null>(null);
  const [reportingItem, setReportingItem] = useState<{ postId: string, commentId?: string } | null>(null);
  const [reportForm, setReportForm] = useState({ name: user.name || '', email: user.email || '', reason: '' });
  const { showToast } = useToast();

  const [activeStory, setActiveStory] = useState<Post | null>(null);
  const [openPostMenu, setOpenPostMenu] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const topStories = useMemo(() => {
    return [...masterPosts].sort((a, b) => {
      const scoreA = a.likes + a.comments.length + a.usefulVotes + a.fakeVotes;
      const scoreB = b.likes + b.comments.length + b.usefulVotes + b.fakeVotes;
      return scoreB - scoreA;
    }).slice(0, 10);
  }, [masterPosts]);

  // Story Auto-Advance (Instagram style)
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (activeStory) {
      timer = setTimeout(() => {
        const currentIndex = topStories.findIndex(s => s.id === activeStory.id);
        if (currentIndex !== -1 && currentIndex < topStories.length - 1) {
          setActiveStory(topStories[currentIndex + 1]);
        } else {
          setActiveStory(null);
        }
      }, 5000); // 5 seconds per story
    }
    return () => clearTimeout(timer);
  }, [activeStory, topStories]);

  const filteredPosts = useMemo(() => {
    let result = activeCategory === 'Todos' ? masterPosts : masterPosts.filter(p => p.category === activeCategory);
    if (searchFilter.trim()) {
      const term = searchFilter.toLowerCase();
      result = result.filter(p => p.content.toLowerCase().includes(term) || p.authorName.toLowerCase().includes(term));
    }
    return result;
  }, [activeCategory, masterPosts, searchFilter]);

  const handleCreatePost = async () => {
    if (!newPostContent.trim() || !selectedCategory) return;

    const tempId = Date.now().toString();
    const newPost: Post = {
      id: tempId,
      authorId: user.id,
      authorName: user.name,
      authorAvatar: user.avatar || '',
      title: 'Post Comunitário',
      content: newPostContent,
      category: selectedCategory,
      tags: [],
      likes: 0,
      comments: [],
      isVerified: false,
      isFraudWarning: false,
      timestamp: 'Agora mesmo',
      reports: 0,
      urgency: 0,
      validationStatus: 'pending',
      usefulVotes: 0,
      fakeVotes: 0,
      reviewVotes: 0,
      backgroundImage: selectedImage
    };

    // Optimistic UI updates
    setMasterPosts([newPost, ...masterPosts]);
    setShowCreateModal(false);
    setNewPostContent('');
    setSelectedCategory('');
    onEarnPoints(10);
    analytics.track('post_created', user.id, selectedCategory);

    try {
      // Real DB logic
      const savedDbPost = await communityService.createPost({
        authorId: user.id,
        title: newPost.title,
        content: newPost.content,
        category: newPost.category,
        backgroundImage: newPost.backgroundImage
      });

      // Update the temporary ID with real DB ID
      if (savedDbPost) {
        setMasterPosts(prev => prev.map(p => p.id === tempId ? { ...p, id: savedDbPost.id } : p));
      }
    } catch (e) {
      console.error('Failed to save real post:', e);
    }
  };

  const handleLike = async (postId: string, commentId?: string) => {
    const isLiked = commentId ? likedComments.has(commentId) : likedPosts.has(postId);

    setMasterPosts(prev => prev.map(p => {
      if (p.id !== postId) return p;
      if (!commentId) return { ...p, likes: isLiked ? Math.max(0, p.likes - 1) : p.likes + 1 };
      return { ...p, comments: p.comments.map(c => c.id === commentId ? { ...c, likes: isLiked ? Math.max(0, c.likes - 1) : c.likes + 1 } : c) };
    }));

    if (commentId) {
      const isActuallyLiked = likedComments.has(commentId);
      setLikedComments(prev => {
        const next = new Set(prev);
        if (isActuallyLiked) next.delete(commentId); else next.add(commentId);
        return next;
      });
      // background Sync
      try {
        await communityService.toggleCommentLike(commentId, user.id);
      } catch (e) { }
    } else {
      setLikedPosts(prev => {
        const next = new Set(prev);
        if (isLiked) next.delete(postId); else next.add(postId);
        return next;
      });
      // background Sync
      try {
        await communityService.voteOrLike(postId, user.id, 'like');
      } catch (e) { }
    }
  };

  const handleDeletePost = async (postId: string) => {
    setMasterPosts(prev => prev.filter(p => p.id !== postId));
    try {
      await communityService.deletePost(postId, user.id);
    } catch (e) { console.error(e); }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !commentingOn) return;

    const finalContent = commentingOn.replyToName ? `@${commentingOn.replyToName} ${newComment}` : newComment;

    const comment: Comment = {
      id: Date.now().toString(),
      authorId: user.id,
      authorName: user.name,
      authorAvatar: user.avatar,
      content: finalContent,
      timestamp: 'Agora mesmo',
      likes: 0
    };

    const backupPostId = commentingOn.postId;
    setMasterPosts(prev => prev.map(p => {
      if (p.id !== backupPostId) return p;
      return { ...p, comments: [...p.comments, comment] };
    }));

    setCommentingOn(null);
    setNewComment('');
    onEarnPoints(2);
    analytics.track('comment_created', user.id);

    try {
      const dbComment = await communityService.createComment(backupPostId, user.id, finalContent);
      if (dbComment) {
        // Update temp comment with real DB data
        setMasterPosts(prev => prev.map(p => {
          if (p.id !== backupPostId) return p;
          return {
            ...p,
            comments: p.comments.map(c => c.id === comment.id ? { ...c, id: dbComment.id } : c)
          };
        }));
      }
    } catch (error) { }
  };

  const handleFactVote = async (postId: string, isTrue: boolean) => {
    const currentVote = userVotes[postId];
    const newVote = isTrue ? 'true' : 'false';
    const isRemoving = currentVote === newVote;

    setMasterPosts(prev => prev.map(p => {
      if (p.id !== postId) return p;
      let useful = p.usefulVotes;
      let fake = p.fakeVotes;

      if (currentVote === 'true') useful = Math.max(0, useful - 1);
      if (currentVote === 'false') fake = Math.max(0, fake - 1);

      if (!isRemoving) {
        if (newVote === 'true') useful++;
        if (newVote === 'false') fake++;
      }
      return { ...p, usefulVotes: useful, fakeVotes: fake };
    }));

    setUserVotes(prev => {
      const next = { ...prev };
      if (isRemoving) delete next[postId];
      else next[postId] = newVote;
      return next;
    });

    if (!isRemoving) onEarnPoints(5);

    try {
      await communityService.voteOrLike(postId, user.id, isTrue ? 'useful' : 'fake');
    } catch (e) { }
  };

  const handleReportSubmit = async () => {
    if (!reportForm.reason.trim() || !reportForm.name || !reportForm.email) {
      showToast("Preencha todos os campos da denúncia.", "warning");
      return;
    }

    try {
      await communityService.reportContent({
        postId: reportingItem?.postId,
        commentId: reportingItem?.commentId,
        userId: user.id,
        reason: reportForm.reason,
        email: reportForm.email
      });

      if (reportingItem) {
        setMasterPosts(prev => prev.map(p => {
          if (p.id !== reportingItem.postId) return p;
          if (!reportingItem.commentId) return { ...p, reports: (p.reports || 0) + 1 };
          return p;
        }));
      }
      setReportingItem(null);
      setReportForm({ name: user.name || '', email: user.email || '', reason: '' });
      showToast("Denúncia enviada com sucesso para análise.", "success");
    } catch (e) {
      showToast("Erro ao enviar denúncia. Tenta novamente.", "error");
    }
  };

  const openMemberProfile = (authorId: string, authorName: string, authorAvatar: string) => {
    setSelectedMember({
      id: authorId,
      name: authorName,
      avatar: authorAvatar,
      reputation: Math.floor(Math.random() * 800) + 150,
      trustLevel: authorId === 'a1' ? 'Curador Comunitário' : 'Colaborador',
      bio: 'Membro ativo da rede MIRA focado em integração e solidariedade em Portugal.',
      isVerified: authorId === 'a1'
    });
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-hidden relative font-['Plus_Jakarta_Sans']">

      {/* STORY MODAL */}
      {activeStory && (
        <div className="fixed inset-0 z-[700] bg-black/95 backdrop-blur-xl flex flex-col pt-12 animate-in zoom-in-95 duration-300">
          <div className="px-6 flex justify-between items-center mb-6">
            <div className="flex items-center gap-3 cursor-pointer group" onClick={() => { setActiveStory(null); openMemberProfile(activeStory.authorId, activeStory.authorName, activeStory.authorAvatar); }}>
              <img src={activeStory.authorAvatar} className="w-12 h-12 rounded-[1.2rem] border-2 border-white/20 group-hover:border-mira-orange transition-colors" />
              <div>
                <p className="text-white font-black text-sm uppercase tracking-tight">{activeStory.authorName}</p>
                <p className="text-mira-orange text-[9px] font-black uppercase tracking-widest">{t(getCategoryKey(activeStory.category), language)}</p>
              </div>
            </div>
            <button onClick={() => setActiveStory(null)} className="p-3 bg-white/10 rounded-full hover:bg-white/20 transition-all text-white"><X size={20} /></button>
          </div>

          <div className="flex-1 flex flex-col justify-center items-center p-6 relative group">

            {/* Story Navigation areas */}
            {topStories.findIndex(s => s.id === activeStory.id) > 0 && (
              <div
                className="absolute left-0 top-0 bottom-0 w-1/4 z-20 cursor-w-resize"
                onClick={() => setActiveStory(topStories[topStories.findIndex(s => s.id === activeStory.id) - 1])}
                title="História Anterior"
              />
            )}
            {topStories.findIndex(s => s.id === activeStory.id) < topStories.length - 1 && (
              <div
                className="absolute right-0 top-0 bottom-0 w-1/4 z-20 cursor-e-resize"
                onClick={() => setActiveStory(topStories[topStories.findIndex(s => s.id === activeStory.id) + 1])}
                title="Próxima História"
              />
            )}

            <div className="absolute inset-0 z-0 opacity-40 blur-3xl scale-110">
              <img src={activeStory.backgroundImage} className="w-full h-full object-cover transition-opacity duration-300" />
            </div>
            <div className="relative z-10 bg-black/60 backdrop-blur-2xl p-10 rounded-[3rem] border border-white/20 shadow-[0_0_50px_rgba(0,0,0,1)] max-w-sm w-full text-center max-h-[60vh] flex flex-col justify-center">
              <div className="overflow-y-auto no-scrollbar">
                <p className="font-black text-white leading-tight tracking-tight uppercase drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)] text-2xl">
                  <TranslatedText text={activeStory.content} language={language} />
                </p>
              </div>
            </div>
          </div>

          <div className="p-8 pb-12 flex justify-center gap-6 z-10 bg-gradient-to-t from-black to-transparent">
            <div className="flex flex-col items-center gap-2">
              <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-[1.2rem] flex items-center justify-center text-white"><Heart size={24} className="fill-red-500 text-red-500" /></div>
              <span className="text-white text-[10px] font-black uppercase tracking-widest">{activeStory.likes} Likes</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-[1.2rem] flex items-center justify-center text-white"><MessageCircle size={24} className="text-indigo-400" /></div>
              <span className="text-white text-[10px] font-black uppercase tracking-widest">{activeStory.comments.length} Coment.</span>
            </div>
            <div className="flex flex-col items-center gap-2" onClick={() => {
              const thePost = activeStory.id;
              setActiveStory(null);
              setSearchFilter("");
              setActiveCategory("Todos");
              setTimeout(() => {
                const el = document.getElementById(`post-${thePost}`);
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }, 100);
            }}>
              <div className="w-14 h-14 bg-mira-orange rounded-[1.2rem] flex items-center justify-center text-white cursor-pointer shadow-[0_0_20px_#f97316] hover:scale-105 active:scale-95 transition-all"><Plus size={24} strokeWidth={3} /></div>
              <span className="text-mira-orange text-[10px] font-black uppercase tracking-widest">Abrir Post</span>
            </div>
          </div>
        </div>
      )}

      {/* Perfil Popup Modal */}
      {selectedMember && (
        <div className="fixed inset-0 z-[600] bg-black/80 backdrop-blur-md flex items-center justify-center p-6 animate-in zoom-in-95 duration-300">
          <div className="bg-white w-full max-w-sm rounded-[3.5rem] p-10 shadow-2xl relative overflow-hidden flex flex-col items-center text-center">
            <button onClick={() => setSelectedMember(null)} className="absolute top-8 right-8 p-3 bg-slate-50 rounded-full hover:bg-slate-100 transition-all"><X size={20} /></button>

            <div className="relative mb-6">
              <div className="w-28 h-28 rounded-[2.8rem] p-1 bg-gradient-to-tr from-mira-orange via-mira-yellow to-mira-blue shadow-2xl">
                <img src={selectedMember.avatar} className="w-full h-full rounded-[2.5rem] object-cover border-4 border-white" alt="" referrerPolicy="no-referrer" />
              </div>
              {selectedMember.isVerified && (
                <div className="absolute -bottom-1 -right-1 bg-white p-1.5 rounded-full shadow-lg">
                  <CheckCircle2 size={24} className="text-mira-blue fill-mira-blue" />
                </div>
              )}
            </div>

            <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase leading-none mb-2">{selectedMember.name}</h3>
            <p className="text-[10px] font-black text-mira-orange uppercase tracking-[0.2em] mb-6">{selectedMember.trustLevel}</p>

            <div className="grid grid-cols-3 gap-3 w-full mb-8">
              <div className="bg-slate-50 p-4 rounded-3xl flex flex-col items-center shadow-inner">
                <Zap size={18} className="text-mira-orange mb-1" />
                <span className="text-sm font-black">{selectedMember.reputation}</span>
                <span className="text-[7px] font-black text-slate-400 uppercase">Impacto</span>
              </div>
              <div className="bg-slate-50 p-4 rounded-3xl flex flex-col items-center shadow-inner">
                <Heart size={18} className="text-red-500 mb-1" />
                <span className="text-sm font-black">42</span>
                <span className="text-[7px] font-black text-slate-400 uppercase">Ajudas</span>
              </div>
              <div className="bg-slate-50 p-4 rounded-3xl flex flex-col items-center shadow-inner">
                <Shield size={18} className="text-mira-blue mb-1" />
                <span className="text-sm font-black">100%</span>
                <span className="text-[7px] font-black text-slate-400 uppercase">Trust</span>
              </div>
            </div>

            <p className="text-xs text-slate-500 font-bold leading-relaxed mb-10 italic">"{selectedMember.bio}"</p>

            <div className="flex gap-4 w-full">
              <button onClick={() => setSelectedMember(null)} className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl active:scale-95 transition-all">Seguir Membro</button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white px-6 pt-8 pb-4 space-y-4 border-b border-slate-100 z-30 shadow-sm">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button onClick={() => onViewChange(ViewType.PROFILE)} className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-mira-orange-pastel shadow-sm active:scale-90 transition-transform">
              <img src={user.avatar} className="w-full h-full object-cover" alt="Perfil" referrerPolicy="no-referrer" />
            </button>
            <div><h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase leading-none">COMUNIDADE MIRA</h2></div>
          </div>
          <button onClick={() => setShowCreateModal(true)} className="w-12 h-12 bg-gradient-to-br from-mira-orange to-red-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-orange-100 active:scale-90 transition-all">
            <Plus size={24} strokeWidth={3} />
          </button>
        </div>
        <div className="space-y-3">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-mira-orange transition-colors" size={18} />
            <input type="text" placeholder={t('comm_search', language) || "Pesquisar..."} value={searchFilter} onChange={(e) => setSearchFilter(e.target.value)} className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border-2 border-transparent rounded-2xl text-xs font-bold text-slate-800 focus:bg-white focus:border-mira-orange outline-none transition-all shadow-inner" />
          </div>
          <div className="relative group">
            <select value={activeCategory} onChange={(e) => setActiveCategory(e.target.value)} className="w-full pl-6 pr-10 py-3.5 bg-white border-2 border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest appearance-none outline-none focus:border-mira-orange shadow-sm transition-all">
              <option value="Todos">{t('comm_all_cats', language) || "Todas as Categorias"}</option>
              {UNIFIED_CATEGORIES.map(cat => <option key={cat} value={cat}>{t(getCategoryKey(cat), language)}</option>)}
            </select>
            <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-focus-within:rotate-180 transition-transform" size={16} />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar pt-6 space-y-10 pb-48">
        {/* STORIES SECTION */}
        {topStories.length > 0 && (
          <div className="mb-2 border-b border-slate-100 pb-6 bg-white/50 -mt-6">
            <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-8 pt-4 mb-3 flex items-center gap-2"><Star size={12} className="text-mira-yellow fill-mira-yellow" /> Em Destaque na Comunidade</h3>
            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 px-8 snap-x">
              {topStories.map((story, i) => (
                <div key={story.id} className="flex flex-col items-center gap-2.5 cursor-pointer group shrink-0 snap-start active:scale-90 transition-transform" onClick={() => setActiveStory(story)}>
                  <div className="w-[4.5rem] h-[4.5rem] rounded-[1.8rem] p-1 bg-gradient-to-tr from-mira-orange via-mira-yellow to-mira-blue shadow-lg group-hover:shadow-xl transition-all relative">
                    {i === 0 && <div className="absolute -top-1 -right-1 bg-red-500 w-4 h-4 rounded-full border-2 border-white z-10 animate-pulse" />}
                    <img src={story.authorAvatar || `https://ui-avatars.com/api/?name=${story.authorName}`} className="w-full h-full rounded-[1.5rem] object-cover border-2 border-white" alt="" referrerPolicy="no-referrer" />
                  </div>
                  <span className="text-[9px] font-black text-slate-700 uppercase tracking-widest truncate w-[4.5rem] text-center opacity-80 group-hover:opacity-100">{story.authorName.split(' ')[0]}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="px-5 space-y-10">
          {filteredPosts.length > 0 ? filteredPosts.map(post => {
            const isPostLiked = likedPosts.has(post.id);
            const isPostSaved = savedPostsIds.has(post.id);
            const isAuthor = post.authorId === user.id || post.authorName === user.name;
            const fontSizeClass = post.content.length < 80 ? 'text-2xl' : post.content.length < 160 ? 'text-lg' : 'text-sm';
            return (
              <div key={post.id} id={`post-${post.id}`} className="bg-white rounded-[3.5rem] overflow-hidden shadow-sm border border-slate-100 group transition-all hover:shadow-2xl">
                <div className="h-[480px] relative overflow-hidden">
                  <img src={post.backgroundImage} className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" alt="Post Visual" referrerPolicy="no-referrer" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-black/60"></div>

                  {/* Header: autor + menu 3 pontos IG style */}
                  <div className="absolute top-6 left-6 right-6 flex justify-between items-center z-20">
                    <div onClick={() => openMemberProfile(post.authorId, post.authorName, post.authorAvatar)} className="flex items-center gap-2.5 bg-white/10 backdrop-blur-2xl p-1.5 pr-4 rounded-full border border-white/20 cursor-pointer active:scale-95 shadow-2xl group/author">
                      <img src={post.authorAvatar} className="w-8 h-8 rounded-full border border-white/40 shadow-sm" alt="" referrerPolicy="no-referrer" />
                      <p className="text-[8px] font-black text-white uppercase tracking-widest leading-none opacity-90">{post.authorName}</p>
                    </div>

                    <div className="relative">
                      <button onClick={(e) => { e.stopPropagation(); setOpenPostMenu(openPostMenu === post.id ? null : post.id); }} className="w-9 h-9 bg-white/15 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20 hover:bg-white/30 active:scale-90 transition-all shadow-lg">
                        <span style={{ color: 'white', fontSize: '18px', fontWeight: 900, letterSpacing: '1px', lineHeight: '1' }}>&#xB7;&#xB7;&#xB7;</span>
                      </button>
                      {openPostMenu === post.id && (
                        <div className="absolute right-0 top-11 bg-white rounded-2xl shadow-2xl overflow-hidden z-50 min-w-[190px] border border-slate-100" onClick={(e) => e.stopPropagation()}>
                          <div className="px-5 pt-4 pb-2"><span className="text-[8px] font-black text-mira-orange uppercase tracking-widest">{t(getCategoryKey(post.category), language)}</span></div>
                          <div className="h-px bg-slate-50 mx-4 mb-1" />
                          {isAuthor ? (
                            <button onClick={() => { setOpenPostMenu(null); setConfirmDeleteId(post.id); }} className="w-full flex items-center gap-3 px-5 py-4 text-red-500 font-black text-xs uppercase tracking-wider hover:bg-red-50 transition-all text-left">
                              <Trash2 size={16} /> Excluir post
                            </button>
                          ) : (
                            <button onClick={() => { setOpenPostMenu(null); setReportingItem({ postId: post.id }); }} className="w-full flex items-center gap-3 px-5 py-4 text-slate-700 font-black text-xs uppercase tracking-wider hover:bg-slate-50 transition-all text-left">
                              <ShieldAlert size={16} className="text-orange-500" /> Denunciar post
                            </button>
                          )}
                          <div className="h-px bg-slate-50 mx-4" />
                          <button onClick={() => setOpenPostMenu(null)} className="w-full text-center px-5 py-3 text-slate-400 font-bold text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all">Cancelar</button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Post Content */}
                  <div className="absolute inset-0 z-10 flex items-center justify-center px-8">
                    <div className="bg-black/40 backdrop-blur-xl p-10 rounded-[3.5rem] border border-white/10 shadow-2xl max-w-[340px] w-full text-center max-h-[340px] flex flex-col justify-center transform transition-transform group-hover:-translate-y-1">
                      <div className="overflow-y-auto no-scrollbar">
                        <p className={`font-black text-white leading-tight tracking-tight uppercase break-words drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)] ${fontSizeClass}`}>
                          <TranslatedText text={post.content} language={language} />
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Interaction Area - Diagramação Reformulada */}
                <div className="p-8 space-y-8">
                  <div className="flex gap-3">
                    <button onClick={() => handleFactVote(post.id, true)} className={`flex-1 py-4.5 rounded-[1.5rem] flex items-center justify-center gap-2 text-[9px] font-black uppercase tracking-widest transition-all border-2 min-h-[56px] ${userVotes[post.id] === 'true' ? 'bg-emerald-500 text-white border-emerald-500 shadow-xl shadow-emerald-100' : 'bg-white text-emerald-500 border-emerald-50 hover:bg-emerald-50'}`}>
                      <CheckCircle size={16} /> <span className="truncate">VERDADE ({post.usefulVotes})</span>
                    </button>
                    <button onClick={() => handleFactVote(post.id, false)} className={`flex-1 py-4.5 rounded-[1.5rem] flex items-center justify-center gap-2 text-[9px] font-black uppercase tracking-widest transition-all border-2 min-h-[56px] ${userVotes[post.id] === 'false' ? 'bg-red-500 text-white border-red-500 shadow-xl shadow-red-100' : 'bg-white text-red-500 border-red-50 hover:bg-red-50'}`}>
                      <ShieldX size={16} /> <span className="truncate">FALSO ({post.fakeVotes})</span>
                    </button>
                  </div>

                  <div className="flex items-center justify-between px-2 pt-2 gap-2">
                    <div className="flex items-center justify-between flex-1">
                      <button onClick={() => handleLike(post.id)} className={`flex flex-col items-center gap-1.5 group transition-all ${isPostLiked ? 'cursor-default' : 'active:scale-90'}`}>
                        <div className={`p-4 rounded-2xl transition-all ${isPostLiked ? 'bg-mira-orange text-white shadow-lg shadow-orange-200' : 'bg-slate-50 text-slate-300 group-hover:bg-red-50'}`}>
                          <Heart size={22} className={isPostLiked ? 'fill-white text-white' : ''} />
                        </div>
                        <span className="text-[9px] font-black text-slate-800 tracking-tighter">{post.likes}</span>
                      </button>

                      <button onClick={() => setCommentingOn({ postId: post.id })} className="flex flex-col items-center gap-1.5 group active:scale-90 transition-all">
                        <div className="p-4 bg-slate-50 rounded-2xl text-slate-300 group-hover:bg-indigo-50 group-hover:text-indigo-500 transition-all">
                          <MessageCircle size={22} />
                        </div>
                        <span className="text-[9px] font-black text-slate-800 tracking-tighter">{post.comments.length}</span>
                      </button>

                      <div className="flex flex-col items-center gap-1.5 group transition-all">
                        <VoicePlayButton text={post.content} language={language} />
                        <span className="text-[9px] font-black text-slate-800 tracking-tighter">Ouvir</span>
                      </div>

                      <button
                        onClick={() => onToggleSavePost(post.id)}
                        className="flex flex-col items-center gap-1.5 group active:scale-90 transition-all"
                        title="Salvar Post"
                      >
                        <div className={`p-4 rounded-2xl transition-all ${isPostSaved ? 'bg-mira-blue text-white shadow-lg shadow-blue-200' : 'bg-slate-50 text-slate-300'}`}>
                          <Bookmark size={22} className={isPostSaved ? 'fill-white' : ''} />
                        </div>
                        <span className="text-[9px] font-black text-slate-800 tracking-tighter opacity-0">.</span>
                      </button>


                    </div>
                  </div>

                  {post.comments.length > 0 && (
                    <div className="mt-4 space-y-5 border-t border-slate-50 pt-8">
                      {post.comments.map(comment => (
                        <div key={comment.id} className="flex gap-4 items-start group/comment">
                          <img src={comment.authorAvatar} className="w-11 h-11 rounded-2xl border-2 border-white shadow-sm cursor-pointer hover:scale-105 transition-all shrink-0" onClick={() => openMemberProfile(comment.authorId, comment.authorName || 'Membro', comment.authorAvatar || '')} alt="" referrerPolicy="no-referrer" />
                          <div className="flex-1 bg-slate-50/70 p-5 rounded-[1.8rem] rounded-tl-none border border-slate-100 relative max-w-full overflow-hidden shadow-sm hover:bg-white hover:shadow-md transition-all">
                            <div className="flex justify-between items-center mb-1.5">
                              <p className="text-xs font-black text-slate-900 uppercase tracking-tight truncate">{comment.authorName}</p>
                              <button
                                onClick={() => setReportingItem({ postId: post.id, commentId: comment.id })}
                                className="p-1.5 text-slate-300 hover:text-red-500 transition-colors"
                                title="Denunciar Comentário"
                              >
                                <ShieldAlert size={14} />
                              </button>
                            </div>
                            <p className="text-sm text-slate-700 font-medium leading-relaxed break-words whitespace-pre-line">
                              <TranslatedText text={comment.content} language={language} />
                            </p>
                            <div className="flex items-center gap-6 mt-4 pt-3 border-t border-slate-200/40">
                              <button onClick={() => handleLike(post.id, comment.id)} className={`flex items-center gap-1.5 text-[9px] font-black uppercase text-slate-400 hover:text-red-500 transition-colors ${likedComments.has(comment.id) ? 'text-red-500 cursor-default' : ''}`}><Heart size={12} className={comment.likes > 0 ? 'fill-red-500 text-red-500' : ''} /> {comment.likes}</button>
                              <button onClick={() => setCommentingOn({ postId: post.id, replyToName: comment.authorName })} className="flex items-center gap-1.5 text-[9px] font-black uppercase text-slate-400 hover:text-indigo-500 transition-colors"><Reply size={12} /> RESPONDER</button>
                              <span className="text-[8px] text-slate-300 ml-auto font-bold uppercase tracking-tighter">{comment.timestamp}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          }) : <div className="flex flex-col items-center justify-center py-40 opacity-20"><Search size={64} className="mb-4" /><p className="text-xs font-black uppercase tracking-[0.3em]">Nenhum post encontrado</p></div>}
        </div>
      </div>

      {/* REPORT MODAL */}
      {reportingItem && (
        <div className="fixed inset-0 z-[600] bg-black/60 backdrop-blur-md flex items-center justify-center p-6 animate-in zoom-in-95 duration-300">
          <div className="bg-white w-full max-w-sm rounded-[3rem] p-10 shadow-2xl relative overflow-y-auto max-h-[90vh] no-scrollbar">
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-red-50 text-red-500 rounded-2xl">
                  <ShieldAlert size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Denunciar</h3>
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{reportingItem.commentId ? 'Comentário sob suspeita' : 'Post sob suspeita'}</p>
                </div>
              </div>
              <button onClick={() => setReportingItem(null)} className="p-2 bg-slate-50 rounded-full hover:bg-slate-100 transition-colors"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 mb-2">
                <p className="text-[9px] text-amber-800 font-bold uppercase leading-relaxed">A equipa de moderação do MIRA analisará este conteúdo para garantir a segurança da rede.</p>
              </div>
              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Seu Nome</label>
                <input type="text" value={reportForm.name} onChange={e => setReportForm({ ...reportForm, name: e.target.value })} className="w-full p-4 bg-slate-50 border-none rounded-2xl text-xs font-bold focus:ring-2 focus:ring-red-100 outline-none" />
              </div>
              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Seu E-mail</label>
                <input type="email" value={reportForm.email} onChange={e => setReportForm({ ...reportForm, email: e.target.value })} className="w-full p-4 bg-slate-50 border-none rounded-2xl text-xs font-bold focus:ring-2 focus:ring-red-100 outline-none" />
              </div>
              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Motivo da Denúncia</label>
                <textarea placeholder="Explique o problema (Fraude, Ódio, Spam...)" value={reportForm.reason} onChange={e => setReportForm({ ...reportForm, reason: e.target.value })} className="w-full h-32 p-5 bg-slate-50 border-none rounded-2xl text-xs font-bold focus:ring-2 focus:ring-red-100 outline-none resize-none shadow-inner" />
              </div>
              <button onClick={async () => {
                try {
                  await communityService.reportContent({
                    postId: reportingItem.postId,
                    commentId: reportingItem.commentId,
                    userId: user.id,
                    reason: reportForm.reason,
                    email: reportForm.email
                  });

                  // Trigger mailto as requested
                  const subject = encodeURIComponent(`DENÚNCIA MIRA: ${reportingItem.commentId ? 'Comentário' : 'Post'}`);
                  const body = encodeURIComponent(`Denunciante: ${reportForm.name} (${reportForm.email})\nMotivo: ${reportForm.reason}\nID Conteúdo: ${reportingItem.commentId || reportingItem.postId}`);
                  window.location.href = `mailto:mira.app@hotmail.com?subject=${subject}&body=${body}`;

                  setReportingItem(null);
                  alert("Denúncia enviada com sucesso!");
                } catch (err) {
                  alert("Erro ao enviar denúncia.");
                }
              }} className="w-full bg-red-600 text-white py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl active:scale-95 transition-all mt-4 hover:bg-red-700">
                Confirmar Denúncia
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NEW POST MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[400] bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-6 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl sm:rounded-[2.5rem] rounded-t-[2.5rem] shadow-2xl relative flex flex-col max-h-[90vh] sm:h-auto animate-in slide-in-from-bottom-8">

            {/* HEADER */}
            <div className="flex justify-between items-center p-6 sm:p-8 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-mira-blue/10 text-mira-blue rounded-2xl flex items-center justify-center">
                  <Plus size={24} strokeWidth={3} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">CRIAR PUBLICAÇÃO</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Partilha a tua ajuda com todos</p>
                </div>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="p-3 bg-slate-50 rounded-full hover:bg-slate-200 transition-colors text-slate-500">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar p-6 sm:p-8 space-y-8">

              {/* Post Message */}
              <div className="space-y-3">
                <div className="relative">
                  <textarea
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    className="w-full h-40 sm:h-48 p-6 bg-slate-50/50 border-2 border-slate-100 rounded-[2rem] text-base sm:text-lg font-bold focus:bg-white focus:border-mira-blue transition-all outline-none resize-none leading-relaxed text-slate-800 placeholder:text-slate-300"
                    placeholder="Em que estás a pensar? Como podes ajudar a comunidade hoje?"
                  />
                  <div className={`absolute bottom-6 right-6 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full ${newPostContent.length > 480 ? 'bg-red-50 text-red-500' : 'bg-slate-100 text-slate-400'}`}>
                    {newPostContent.length} / 500
                  </div>
                </div>
              </div>

              {/* Categorias & Fundo */}
              <div className="grid grid-cols-1 gap-8">

                {/* Category Selection */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Categoria do Post</label>
                  <div className="relative">
                    <select
                      required
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value as UnifiedCategory)}
                      className="w-full pl-6 pr-12 py-5 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-black text-slate-700 uppercase tracking-widest appearance-none outline-none focus:bg-white focus:border-mira-blue transition-all cursor-pointer"
                    >
                      <option value="" disabled className="text-slate-300">Selecione o tema...</option>
                      {UNIFIED_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                    <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={20} />
                  </div>
                </div>

                {/* Image Selection Grid */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center ml-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fundo da Publicação</label>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {THEMED_IMAGES.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedImage(img)}
                        className={`w-full aspect-square rounded-2xl overflow-hidden border-[3px] transition-all relative ${selectedImage === img ? 'border-mira-blue scale-100 shadow-xl shadow-mira-blue/20 opacity-100 z-10' : 'border-transparent opacity-60 hover:opacity-100'}`}
                      >
                        <img src={img} className="w-full h-full object-cover" alt={`Fundo ${idx + 1}`} referrerPolicy="no-referrer" />
                        {selectedImage === img && (
                          <div className="absolute inset-0 bg-mira-blue/20 flex items-center justify-center backdrop-blur-[1px]">
                            <CheckCircle2 size={24} className="text-white fill-mira-blue drop-shadow-md" />
                          </div>
                        )}
                        {selectedImage !== img && (
                          <div className="absolute inset-0 bg-black/10 transition-colors"></div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

              </div>

            </div>

            {/* FOOTER ACTIONS */}
            <div className="p-6 sm:p-8 border-t border-slate-100 shrink-0 bg-white sm:rounded-b-[2.5rem]">
              <button
                onClick={handleCreatePost}
                disabled={!newPostContent.trim() || !selectedCategory}
                className="w-full bg-slate-900 hover:bg-black text-white py-5 rounded-2xl font-black uppercase text-xs tracking-[0.2em] flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all disabled:opacity-30 disabled:active:scale-100"
              >
                <Send size={18} /> Publicar na Rede
              </button>
            </div>
          </div>
        </div>
      )}

      {/* COMMENTING MODAL with Reply Mention logic */}
      {commentingOn && (
        <div className="fixed inset-0 z-[400] bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-t-[2.5rem] sm:rounded-[2.5rem] p-10 shadow-2xl animate-in slide-in-from-bottom-10 border-t-4 border-mira-orange">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">
                {commentingOn.replyToName ? `Responder a @${commentingOn.replyToName}` : 'Novo Comentário'}
              </h3>
              <button onClick={() => setCommentingOn(null)} className="p-3 bg-slate-50 rounded-full"><X size={24} /></button>
            </div>
            <div className="space-y-6">
              <textarea autoFocus value={newComment} onChange={(e) => setNewComment(e.target.value)} className="w-full h-40 p-6 bg-slate-50 border-2 border-transparent rounded-[2rem] text-sm font-bold focus:bg-white focus:border-mira-orange outline-none shadow-inner resize-none" placeholder={commentingOn.replyToName ? "Escreva a sua resposta..." : "Partilhe a sua ajuda..."} />
              <button onClick={handleAddComment} disabled={!newComment.trim()} className="w-full bg-slate-900 text-white py-6 rounded-[2rem] font-black uppercase text-[11px] tracking-widest flex items-center justify-center gap-3 active:scale-95 transition-all disabled:opacity-30">
                <Send size={20} /> Publicar {commentingOn.replyToName ? 'Resposta' : 'Comentário'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* CONFIRM DELETE MODAL */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-[800] bg-black/60 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-sm rounded-[3rem] p-10 shadow-2xl relative flex flex-col items-center text-center space-y-6">
            <div className="w-20 h-20 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center">
              <Trash2 size={40} />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Eliminar Publicação?</h3>
              <p className="text-xs text-slate-500 font-bold leading-relaxed">Esta ação é permanente e não poderá ser desfeita. Todos os comentários e votos serão perdidos.</p>
            </div>
            <div className="grid grid-cols-2 gap-4 w-full pt-4">
              <button onClick={() => setConfirmDeleteId(null)} className="py-4 bg-slate-50 text-slate-400 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-100 transition-all">Cancelar</button>
              <button onClick={() => { handleDeletePost(confirmDeleteId); setConfirmDeleteId(null); }} className="py-4 bg-red-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-red-700 shadow-xl shadow-red-100 active:scale-95 transition-all">Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommunityView;
