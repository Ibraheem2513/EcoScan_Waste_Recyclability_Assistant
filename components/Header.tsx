import React from 'react';
import { Leaf, Recycle, Trophy } from 'lucide-react';
import { UserStats } from '../types';

interface HeaderProps {
  stats: UserStats;
  onOpenProfile: () => void;
}

export const Header: React.FC<HeaderProps> = ({ stats, onOpenProfile }) => {
  return (
    <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-green-100">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-green-100 p-2 rounded-lg">
            <Recycle className="w-6 h-6 text-green-600" />
          </div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-green-700 to-emerald-500 bg-clip-text text-transparent hidden sm:block">
            EcoScan
          </h1>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={onOpenProfile}
            className="group flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-full hover:border-green-300 hover:bg-green-50 transition-all cursor-pointer"
          >
            <div className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center text-yellow-600 group-hover:scale-110 transition-transform">
              <Trophy className="w-3.5 h-3.5" />
            </div>
            <div className="flex flex-col items-start leading-none mr-1">
               <span className="text-[10px] text-slate-500 font-semibold uppercase">{stats.level}</span>
               <span className="text-sm font-bold text-slate-800">{stats.points} pts</span>
            </div>
          </button>
        </div>
      </div>
    </header>
  );
};
