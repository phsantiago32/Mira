
import React, { memo } from 'react';
import { Home, HeartHandshake, FileText, Building2, Briefcase, GraduationCap, MapPin } from 'lucide-react';
import { ViewType } from '../types';
import { t } from '../utils/translations';

interface NavigationProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  language: string;
}

const Navigation: React.FC<NavigationProps> = ({ currentView, onViewChange, language }) => {
  const navItems = [
    { id: ViewType.HOME, label: t('nav_home', language), icon: Home },
    { id: ViewType.COMMUNITY, label: t('nav_community', language), icon: HeartHandshake },
    { id: ViewType.JOBS, label: t('nav_vagas', language), icon: Briefcase },
    { id: ViewType.MAP, label: t('nav_map', language), icon: Building2 },
    { id: ViewType.DOCUMENTS, label: t('nav_docs', language), icon: FileText },
  ];

  return (
    <nav className="bg-white/95 backdrop-blur-xl border-t border-slate-100 px-2 pb-[max(env(safe-area-inset-bottom, 20px), 2rem)] pt-3 flex justify-around items-center md:flex-col md:w-24 md:h-full md:border-r md:border-t-0 md:px-0 md:py-10 transition-all duration-300 shadow-[0_-5px_20px_rgba(0,0,0,0.05)] z-50">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = currentView === item.id;

        return (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id)}
            className={`flex flex-col items-center justify-center gap-1 group transition-all duration-300 md:w-16 md:h-16 ${isActive ? 'text-mira-orange' : 'text-slate-400 hover:text-slate-600'
              }`}
          >
            <div className={`p-1 transition-all duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-105'}`}>
              <Icon
                size={24}
                strokeWidth={isActive ? 2.5 : 2}
                fill={isActive ? "currentColor" : "none"}
              />
            </div>
            <span className={`text-[8px] font-black tracking-widest uppercase md:hidden ${isActive ? 'opacity-100' : 'opacity-40'}`}>
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};

export default memo(Navigation);
