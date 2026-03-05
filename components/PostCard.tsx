
import React, { memo, useState } from 'react';
import {
    Heart, MessageCircle, MoreHorizontal, Bookmark,
    Trash2, ShieldAlert, Sparkles, CheckCircle, ShieldX, Reply,
    Share2, AlertCircle
} from 'lucide-react';
import { Post, User } from '../types';
import { t } from '../utils/translations';
import { TranslatedText } from './TranslatedText';

interface PostCardProps {
    post: Post;
    user: User;
    language: string;
    isPostLiked: boolean;
    isPostSaved: boolean;
    userVote?: 'true' | 'false';
    translatedPosts: Set<string>;
    onLike: (postId: string) => void;
    onComment: (postId: string) => void;
    onToggleSave: (postId: string) => void;
    onFactVote: (postId: string, isTrue: boolean) => void;
    onReport: (postId: string) => void;
    onDelete: (postId: string) => void;
    onOpenProfile: (id: string, name: string, avatar: string) => void;
    onToggleTranslate: (postId: string) => void;
    onReplyComment: (postId: string, replyToName: string) => void;
    onLikeComment: (postId: string, commentId: string) => void;
    onReportComment: (postId: string, commentId: string) => void;
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

const PostCardComponent: React.FC<PostCardProps> = ({
    post, user, language, isPostLiked, isPostSaved, userVote, translatedPosts,
    onLike, onComment, onToggleSave, onFactVote, onReport, onDelete,
    onOpenProfile, onToggleTranslate, onReplyComment, onLikeComment, onReportComment
}) => {
    const [openMenu, setOpenMenu] = useState(false);
    const isAuthor = post.authorId === user.id || post.authorName === user.name;
    const fontSizeClass = post.content.length < 80 ? 'text-2xl' : post.content.length < 160 ? 'text-lg' : 'text-sm';

    return (
        <div id={`post-${post.id}`} className="bg-white rounded-[3.5rem] overflow-hidden shadow-sm border border-slate-100 group transition-all hover:shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="h-[480px] relative overflow-hidden">
                <img src={post.backgroundImage} className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" alt="Post Visual" referrerPolicy="no-referrer" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-black/60"></div>

                {/* Header */}
                <div className="absolute top-6 left-6 right-6 flex justify-between items-center z-20">
                    <div className="flex flex-col gap-2 items-start">
                        <div onClick={() => onOpenProfile(post.authorId, post.authorName, post.authorAvatar)} className="flex items-center gap-2.5 bg-white/10 backdrop-blur-2xl p-1.5 pr-4 rounded-full border border-white/20 cursor-pointer active:scale-95 shadow-2xl group/author">
                            <img src={post.authorAvatar} className="w-8 h-8 rounded-full border border-white/40 shadow-sm" alt="" referrerPolicy="no-referrer" loading="lazy" />
                            <p className="text-[8px] font-black text-white uppercase tracking-widest leading-none opacity-90">{post.authorName}</p>
                        </div>

                        {post.aiStatus && (
                            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border backdrop-blur-md animate-in fade-in slide-in-from-left-2 duration-700 ${post.aiStatus === 'validated' ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' :
                                post.aiStatus === 'suspect' ? 'bg-amber-500/20 border-amber-500/30 text-amber-400' :
                                    'bg-red-500/20 border-red-500/30 text-red-400'
                                }`}>
                                {post.aiStatus === 'validated' ? <CheckCircle size={10} /> : post.aiStatus === 'suspect' ? <AlertCircle size={10} /> : <ShieldX size={10} />}
                                <span className="text-[7px] font-black uppercase tracking-widest">
                                    {post.aiStatus === 'validated' ? 'Verificado IA' : post.aiStatus === 'suspect' ? 'Sob Análise IA' : 'Risco de Fraude IA'}
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="relative">
                        <button onClick={() => setOpenMenu(!openMenu)} className="w-9 h-9 bg-white/15 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20 hover:bg-white/30 active:scale-90 transition-all shadow-lg">
                            <MoreHorizontal size={18} color="white" />
                        </button>
                        {openMenu && (
                            <div className="absolute right-0 top-11 bg-white rounded-2xl shadow-2xl overflow-hidden z-50 min-w-[190px] border border-slate-100 animate-in zoom-in-95 duration-200">
                                <div className="px-5 pt-4 pb-2"><span className="text-[8px] font-black text-mira-orange uppercase tracking-widest">{t(getCategoryKey(post.category), language)}</span></div>
                                <div className="h-px bg-slate-50 mx-4 mb-1" />
                                {isAuthor ? (
                                    <button onClick={() => { setOpenMenu(false); onDelete(post.id); }} className="w-full flex items-center gap-3 px-5 py-4 text-red-500 font-black text-xs uppercase tracking-wider hover:bg-red-50 transition-all text-left">
                                        <Trash2 size={16} /> Excluir post
                                    </button>
                                ) : (
                                    <button onClick={() => { setOpenMenu(false); onReport(post.id); }} className="w-full flex items-center gap-3 px-5 py-4 text-slate-700 font-black text-xs uppercase tracking-wider hover:bg-slate-50 transition-all text-left">
                                        <ShieldAlert size={16} className="text-orange-500" /> Denunciar post
                                    </button>
                                )}
                                <div className="h-px bg-slate-50 mx-4" />
                                <button onClick={() => setOpenMenu(false)} className="w-full text-center px-5 py-3 text-slate-400 font-bold text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all">Cancelar</button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Post Content */}
                <div className="absolute inset-0 z-10 flex items-center justify-center px-8">
                    <div className="bg-black/40 backdrop-blur-xl p-10 rounded-[3.5rem] border border-white/10 shadow-2xl max-w-[340px] w-full text-center max-h-[340px] flex flex-col justify-center transform transition-transform group-hover:-translate-y-1">
                        <div className="overflow-y-auto no-scrollbar">
                            <p className={`font-black text-white leading-tight tracking-tight uppercase break-words drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)] ${fontSizeClass}`}>
                                <TranslatedText
                                    text={post.content}
                                    language={language}
                                    shouldTranslate={translatedPosts.has(post.id)}
                                />
                            </p>
                        </div>
                    </div>
                </div>

                {/* Translation toggle */}
                <div className="absolute bottom-5 left-0 right-0 z-20 flex justify-center">
                    <button
                        onClick={() => onToggleTranslate(post.id)}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all shadow-xl border border-white/20 backdrop-blur-md active:scale-95 ${translatedPosts.has(post.id)
                            ? 'bg-mira-yellow text-slate-900 shadow-yellow-200'
                            : 'bg-white/90 text-slate-700 shadow-slate-200'
                            }`}
                    >
                        <Sparkles size={12} className={translatedPosts.has(post.id) ? 'fill-slate-900 text-slate-900' : 'text-mira-orange'} />
                        {translatedPosts.has(post.id) ? (
                            language === 'PT' ? 'Ver Original' : language === 'EN' ? 'View Original' : language === 'ES' ? 'Ver Original' : 'Voir Original'
                        ) : (
                            language === 'PT' ? 'Traduzir 🌐' : language === 'EN' ? 'Translate 🌐' : language === 'ES' ? 'Traducir 🌐' : 'Traduire 🌐'
                        )}
                    </button>
                </div>
            </div>

            {/* Interaction Area */}
            <div className="p-8 space-y-8">
                <div className="flex gap-3">
                    <button onClick={() => onFactVote(post.id, true)} className={`flex-1 py-4.5 rounded-[1.5rem] flex items-center justify-center gap-2 text-[9px] font-black uppercase tracking-widest transition-all border-2 min-h-[56px] ${userVote === 'true' ? 'bg-emerald-500 text-white border-emerald-500 shadow-xl shadow-emerald-100' : 'bg-white text-emerald-500 border-emerald-50 hover:bg-emerald-50'}`}>
                        <CheckCircle size={16} /> <span className="truncate">VERDADE ({post.usefulVotes})</span>
                    </button>
                    <button onClick={() => onFactVote(post.id, false)} className={`flex-1 py-4.5 rounded-[1.5rem] flex items-center justify-center gap-2 text-[9px] font-black uppercase tracking-widest transition-all border-2 min-h-[56px] ${userVote === 'false' ? 'bg-red-500 text-white border-red-500 shadow-xl shadow-red-100' : 'bg-white text-red-500 border-red-50 hover:bg-red-50'}`}>
                        <ShieldX size={16} /> <span className="truncate">FALSO ({post.fakeVotes})</span>
                    </button>
                </div>

                <div className="flex items-center justify-between px-2 pt-2 gap-2">
                    <div className="flex items-center justify-between flex-1">
                        <button onClick={() => onLike(post.id)} className={`flex flex-col items-center gap-1.5 group transition-all ${isPostLiked ? 'cursor-default' : 'active:scale-90'}`}>
                            <div className={`p-4 rounded-2xl transition-all ${isPostLiked ? 'bg-mira-orange text-white shadow-lg shadow-orange-200' : 'bg-slate-50 text-slate-300 group-hover:bg-red-50'}`}>
                                <Heart size={22} className={isPostLiked ? 'fill-white text-white' : ''} />
                            </div>
                            <span className="text-[9px] font-black text-slate-800 tracking-tighter">{post.likes}</span>
                        </button>

                        <button onClick={() => onComment(post.id)} className="flex flex-col items-center gap-1.5 group active:scale-90 transition-all">
                            <div className="p-4 bg-slate-50 rounded-2xl text-slate-300 group-hover:bg-indigo-50 group-hover:text-indigo-500 transition-all">
                                <MessageCircle size={22} />
                            </div>
                            <span className="text-[9px] font-black text-slate-800 tracking-tighter">{post.comments.length}</span>
                        </button>

                        <button onClick={() => onToggleSave(post.id)} className="flex flex-col items-center gap-1.5 group active:scale-90 transition-all">
                            <div className={`p-4 rounded-2xl transition-all ${isPostSaved ? 'bg-mira-blue text-white shadow-lg shadow-blue-200' : 'bg-slate-50 text-slate-300'}`}>
                                <Bookmark size={22} className={isPostSaved ? 'fill-white' : ''} />
                            </div>
                            <span className="text-[9px] font-black text-slate-800 tracking-tighter opacity-100">Salvar</span>
                        </button>
                    </div>
                </div>

                {post.comments.length > 0 && (
                    <div className="mt-4 space-y-5 border-t border-slate-50 pt-8">
                        {post.comments.map(comment => (
                            <div key={comment.id} className="flex gap-4 items-start group/comment">
                                <img src={comment.authorAvatar} className="w-11 h-11 rounded-2xl border-2 border-white shadow-sm cursor-pointer hover:scale-105 transition-all shrink-0" onClick={() => onOpenProfile(comment.authorId, comment.authorName || 'Membro', comment.authorAvatar || '')} alt="" referrerPolicy="no-referrer" loading="lazy" />
                                <div className="flex-1 bg-slate-50/70 p-5 rounded-[1.8rem] rounded-tl-none border border-slate-100 relative max-w-full overflow-hidden shadow-sm hover:bg-white hover:shadow-md transition-all">
                                    <div className="flex justify-between items-center mb-1.5">
                                        <p className="text-xs font-black text-slate-900 uppercase tracking-tight truncate">{comment.authorName}</p>
                                        <button onClick={() => onReportComment(post.id, comment.id)} className="p-1.5 text-slate-300 hover:text-red-500 transition-colors">
                                            <ShieldAlert size={14} />
                                        </button>
                                    </div>
                                    <p className="text-sm text-slate-700 font-medium leading-relaxed break-words whitespace-pre-line">
                                        <TranslatedText text={comment.content} language={language} shouldTranslate={translatedPosts.has(post.id)} />
                                    </p>
                                    <div className="flex items-center gap-6 mt-4 pt-3 border-t border-slate-200/40">
                                        <button onClick={() => onLikeComment(post.id, comment.id)} className={`flex items-center gap-1.5 text-[9px] font-black uppercase text-slate-400 hover:text-red-500 transition-colors ${comment.isLikedByUser ? 'text-red-500 cursor-default' : ''}`}>
                                            <Heart size={12} className={comment.likes > 0 ? 'fill-red-500 text-red-500' : ''} /> {comment.likes}
                                        </button>
                                        <button onClick={() => onReplyComment(post.id, comment.authorName)} className="flex items-center gap-1.5 text-[9px] font-black uppercase text-slate-400 hover:text-indigo-500 transition-colors"><Reply size={12} /> RESPONDER</button>
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
};

export const PostCard = memo(PostCardComponent);
