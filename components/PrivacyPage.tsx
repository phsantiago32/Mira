
import React, { useState } from 'react';
import {
  Shield, Scale, Bot, Lock, FileWarning, ChevronDown, ChevronUp,
  Database, Eraser, ExternalLink, Globe, Award, Flame, UserCheck,
  ShieldAlert, MessageCircle, FileText, MapPin, Book, Heart, Zap, AlertTriangle, AlertCircle,
  Copyright, ShieldCheck as ShieldCheckIcon, CalendarCheck
} from 'lucide-react';
import { t } from '../utils/translations';

export const PrivacyPage: React.FC<{ language: string }> = ({ language }) => {
  const [activeSection, setActiveSection] = useState<string | null>('legal');

  const toggleSection = (id: string) => {
    setActiveSection(activeSection === id ? null : id);
  };

  const Section = ({ id, title, icon: Icon, children, colorClass }: any) => (
    <div className={`bg-white rounded-3xl border transition-all duration-300 overflow-hidden ${activeSection === id ? 'border-mira-blue/20 shadow-lg shadow-mira-blue/5' : 'border-slate-100 shadow-sm hover:border-slate-200'}`}>
      <button
        onClick={() => toggleSection(id)}
        className="w-full flex items-center justify-between p-5 text-left bg-white transition-colors group"
      >
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-2xl transition-transform duration-300 ${activeSection === id ? 'scale-110' : 'group-hover:scale-105'} ${colorClass}`}>
            <Icon size={20} />
          </div>
          <h3 className="font-black text-slate-900 text-sm tracking-tight uppercase">{title}</h3>
        </div>
        <div className={`p-2 rounded-full transition-colors ${activeSection === id ? 'bg-slate-100' : 'bg-transparent'}`}>
          {activeSection === id ? <ChevronUp size={18} className="text-slate-600" /> : <ChevronDown size={18} className="text-slate-400" />}
        </div>
      </button>

      {activeSection === id && (
        <div className="px-6 pb-6 pt-2 animate-in slide-in-from-top-2 duration-300">
          <div className="text-[13px] text-slate-600 font-medium leading-[1.8] space-y-4">
            {children}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="p-4 sm:p-6 md:p-10 space-y-6 pb-32 max-w-2xl mx-auto min-h-screen font-['Plus_Jakarta_Sans'] bg-slate-50 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-mira-blue/10 to-transparent pointer-events-none"></div>

      {/* Header */}
      <div className="text-center py-6 relative z-10">
        <div className="w-20 h-20 bg-white rounded-[2.5rem] flex items-center justify-center mx-auto mb-5 text-mira-orange shadow-xl shadow-mira-orange/10 border border-white relative">
          <div className="absolute inset-0 rounded-[2.5rem] border-2 border-mira-orange/20 animate-pulse"></div>
          <ShieldCheckIcon size={36} />
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tighter uppercase">{t('privacy_title', language)}</h2>
        <p className="text-[10px] font-black text-mira-blue mt-2 uppercase tracking-[0.2em] bg-mira-blue/10 inline-block px-3 py-1 rounded-full">
          {t('privacy_subtitle', language)}
        </p>
      </div>

      {/* Sections */}
      <div className="space-y-4 relative z-10">

        <Section id="legal" title={t('legal_s_title', language)} icon={Scale} colorClass="bg-red-50 text-red-600 border border-red-100">
          <div className="space-y-4">
            <p className="font-bold text-slate-800 leading-relaxed">{t('legal_s_p1', language)}</p>
            <p className="leading-relaxed">
              {t('legal_s_p2', language)}
            </p>
            <div className="bg-red-50 p-5 rounded-2xl border border-red-200 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-red-500/10 rounded-full blur-xl -mr-8 -mt-8 pointer-events-none"></div>
              <p className="text-sm text-red-800 font-black leading-relaxed relative z-10 flex items-start gap-2">
                {t('legal_s_p3', language)}
              </p>
            </div>
          </div>
        </Section>

        <Section id="copyright" title={t('privacy_s1_title', language)} icon={Copyright} colorClass="bg-mira-orange/10 text-mira-orange border border-mira-orange/20">
          <div className="space-y-4">
            <p className="font-black text-slate-900 leading-tight">{t('privacy_s1_p1', language)}</p>
            <p className="leading-relaxed">
              {t('privacy_s1_p2', language)}
            </p>
            <div className="bg-slate-100 p-5 rounded-2xl border border-slate-200">
              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">{t('privacy_s1_box_title', language)}</h4>
              <p className="text-[13px] text-slate-700 font-bold leading-relaxed">
                {t('privacy_s1_box_p', language)}
              </p>
            </div>
          </div>
        </Section>

        <Section id="badges" title={t('privacy_s2_title', language)} icon={Award} colorClass="bg-mira-yellow/10 text-mira-yellow-dark border border-mira-yellow/20">
          <p className="mb-4">{t('privacy_s2_p1', language)}</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
            {[
              { icon: Flame, name: "badge1_name", desc: "privacy_s2_badge1_desc" },
              { icon: UserCheck, name: "badge2_name", desc: "badge2_name" },
              { icon: MessageCircle, name: "badge3_name", desc: "privacy_s2_badge3_desc" },
              { icon: FileText, name: "badge4_name", desc: "privacy_s2_badge4_desc" },
              { icon: MapPin, name: "badge5_name", desc: "privacy_s2_badge5_desc" },
              { icon: Award, name: "badge6_name", desc: "privacy_s2_badge6_desc" },
              { icon: ShieldAlert, name: "badge7_name", desc: "privacy_s2_badge7_desc" },
              { icon: Book, name: "badge8_name", desc: "privacy_s2_badge8_desc" },
              { icon: CalendarCheck, name: "badge9_name", desc: "privacy_s2_badge9_desc" },
              { icon: Heart, name: "badge10_name", desc: "privacy_s2_badge10_desc" },
            ].map((badge, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-10 h-10 bg-gradient-to-br from-mira-yellow to-yellow-500 text-white rounded-xl flex items-center justify-center shrink-0 shadow-sm">
                  <badge.icon size={18} />
                </div>
                <div>
                  <h4 className="font-black text-slate-900 text-[10px] uppercase tracking-widest leading-tight">{t(badge.name, language)}</h4>
                  <p className="text-[10px] text-slate-500 font-medium leading-snug line-clamp-2">{t(badge.desc, language)}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-red-50 p-5 rounded-2xl border border-red-100">
            <h4 className="font-black text-red-600 uppercase text-[10px] tracking-widest mb-3 flex items-center gap-2">
              <AlertTriangle size={14} /> {t('privacy_s2_box_title', language)}
            </h4>
            <p className="text-xs text-red-800 font-bold leading-relaxed mb-4">
              {t('privacy_s2_box_p', language)}
            </p>
            <ul className="space-y-3 text-xs text-red-700">
              <li className="flex gap-2 items-start">
                <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1 shrink-0"></div>
                <span><strong>{t('privacy_s2_rule1_title', language)}</strong> {t('privacy_s2_rule1_desc', language)}</span>
              </li>
              <li className="flex gap-2 items-start">
                <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1 shrink-0"></div>
                <span><strong>{t('privacy_s2_rule2_title', language)}</strong> {t('privacy_s2_rule2_desc', language)}</span>
              </li>
              <li className="flex gap-2 items-start">
                <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1 shrink-0"></div>
                <span><strong>{t('privacy_s2_rule3_title', language)}</strong> {t('privacy_s2_rule3_desc', language)}</span>
              </li>
            </ul>
          </div>
        </Section>

        <Section id="disclaimer" title={t('privacy_s3_title', language)} icon={AlertCircle} colorClass="bg-mira-orange/10 text-mira-orange border border-mira-orange/20">
          <div className="bg-red-50 p-4 rounded-xl border border-red-200 mb-4 shadow-sm">
            <p className="font-black text-red-600 uppercase text-[10px] tracking-widest mb-1 flex items-center gap-2">
              <Shield size={14} /> {t('privacy_s3_box_title', language)}
            </p>
            <p className="text-xs text-red-800 font-bold leading-normal">
              {t('privacy_s3_box_p', language)}
            </p>
          </div>
          <div className="space-y-3 text-[13px] leading-relaxed text-slate-600">
            <p>{t('privacy_s3_p1', language)}</p>
            <p>{t('privacy_s3_p2', language)}</p>
            <p className="font-black text-slate-800 bg-slate-100 p-3 rounded-xl border border-slate-200">🔒 {t('privacy_s3_p3', language)}</p>
            <p>{t('privacy_s3_p4', language)}</p>
            <p>{t('privacy_s3_p5', language)}</p>
            <p>{t('privacy_s3_p6', language)}</p>
            <p>{t('privacy_s3_p7', language)}</p>
            <p>{t('privacy_s3_p8', language)}</p>
            <p className="text-slate-800 font-bold">{t('privacy_s3_p9', language)}</p>
          </div>
        </Section>

        <Section id="privacy" title={t('privacy_s4_title', language)} icon={Lock} colorClass="bg-mira-green/10 text-mira-green-dark border border-mira-green/20">
          <p>
            {t('privacy_s4_p1', language)}
          </p>
          <ul className="space-y-3 my-4">
            <li className="flex gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
              <div className="w-6 h-6 rounded-full bg-mira-green/10 text-mira-green flex items-center justify-center shrink-0">
                <CheckIcon size={12} />
              </div>
              <span className="text-xs"><strong>{t('privacy_s4_rule1_title', language)}</strong><br />{t('privacy_s4_rule1_desc', language)}</span>
            </li>
            <li className="flex gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
              <div className="w-6 h-6 rounded-full bg-mira-green/10 text-mira-green flex items-center justify-center shrink-0">
                <CheckIcon size={12} />
              </div>
              <span className="text-xs"><strong>{t('privacy_s4_rule2_title', language)}</strong><br />{t('privacy_s4_rule2_desc', language)}</span>
            </li>
            <li className="flex gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
              <div className="w-6 h-6 rounded-full bg-mira-green/10 text-mira-green flex items-center justify-center shrink-0">
                <CheckIcon size={12} />
              </div>
              <span className="text-xs"><strong>{t('privacy_s4_rule3_title', language)}</strong><br />{t('privacy_s4_rule3_desc', language)}</span>
            </li>
          </ul>
        </Section>

        <Section id="ai" title={t('privacy_s5_title', language)} icon={Bot} colorClass="bg-mira-blue/10 text-mira-blue border border-mira-blue/20">
          <p>
            {t('privacy_s5_p1', language)}
          </p>
          <div className="space-y-3 mt-4">
            <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-mira-blue"></div>
              <p className="text-[11px] font-black text-slate-800 mb-1 uppercase tracking-widest">{t('privacy_s5_box1_title', language)}</p>
              <p className="text-xs text-slate-500">{t('privacy_s5_box1_desc', language)} </p>
            </div>
            <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-mira-orange"></div>
              <p className="text-[11px] font-black text-slate-800 mb-1 uppercase tracking-widest">{t('privacy_s5_box2_title', language)}</p>
              <p className="text-xs text-slate-500">{t('privacy_s5_box2_desc', language)}</p>
            </div>
          </div>
        </Section>



        <Section id="terms" title={t('privacy_s7_title', language)} icon={FileText} colorClass="bg-slate-900 text-white border border-slate-800">
          <div className="space-y-4">
            <p>{t('privacy_s7_p1', language)}</p>
            <ul className="space-y-3 py-2">
              <li className="flex items-start gap-2 text-xs"><div className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-1.5 shrink-0"></div> {t('privacy_s7_li1', language)}</li>
              <li className="flex items-start gap-2 text-xs"><div className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-1.5 shrink-0"></div> {t('privacy_s7_li2', language)}</li>
              <li className="flex items-start gap-2 text-xs"><div className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-1.5 shrink-0"></div> {t('privacy_s7_li3', language)}</li>
              <li className="flex items-start gap-2 text-xs"><div className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-1.5 shrink-0"></div> {t('privacy_s7_li4', language)}</li>
            </ul>
          </div>
        </Section>

      </div>

      {/* Footer Actions */}
      <div className="pt-10 pb-4 relative z-10 flex flex-col items-center">
        <div className="flex items-center gap-2 mb-2 text-slate-300">
          <ShieldCheckIcon size={16} />
        </div>
        <p className="text-[9px] font-black text-slate-400 text-center uppercase tracking-[0.3em]">
          © 2026 MIRA - Amanda Silva Abreu
        </p>
        <p className="text-[9px] text-slate-400 text-center mt-1">
          contacto: mira.app@hotmail.com
        </p>
      </div>
    </div>
  );
};

// Simple Check icon for inside lists
const CheckIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
);
