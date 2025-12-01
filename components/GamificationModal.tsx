import React from 'react';
import { X, Trophy, Leaf, Zap, Award } from 'lucide-react';
import { UserStats } from '../types';

interface GamificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: UserStats;
}

export const GamificationModal: React.FC<GamificationModalProps> = ({ isOpen, onClose, stats }) => {
  if (!isOpen) return null;

  const nextLevelPoints = Math.ceil(stats.points / 500) * 500;
  const progress = (stats.points % 500) / 5; // Percentage (500 pts per level)

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden relative">
        
        {/* Header Background */}
        <div className="bg-gradient-to-br from-green-500 to-emerald-700 p-6 text-white relative">
          <button 
            onClick={onClose} 
            className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 p-2 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/30">
               <Trophy className="w-8 h-8 text-yellow-300" />
            </div>
            <div>
              <p className="text-green-100 font-medium text-sm">Current Rank</p>
              <h2 className="text-2xl font-bold">{stats.level}</h2>
            </div>
          </div>

          <div className="mt-6">
            <div className="flex justify-between text-xs font-semibold uppercase tracking-wider opacity-80 mb-2">
               <span>{stats.points} pts</span>
               <span>{nextLevelPoints} pts</span>
            </div>
            <div className="w-full bg-black/20 rounded-full h-3 overflow-hidden">
               <div 
                 className="bg-yellow-400 h-full rounded-full transition-all duration-500 ease-out"
                 style={{ width: `${progress}%` }}
               ></div>
            </div>
            <p className="text-xs mt-2 text-center text-green-100">
               {500 - (stats.points % 500)} more points to reach next level!
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="p-6">
           <h3 className="text-slate-900 font-bold mb-4 flex items-center gap-2">
             <Zap className="w-5 h-5 text-amber-500" />
             Your Impact
           </h3>
           
           <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                 <div className="flex items-center gap-2 mb-2 text-slate-500">
                    <Leaf className="w-4 h-4" />
                    <span className="text-xs font-semibold uppercase">Total Scans</span>
                 </div>
                 <p className="text-2xl font-black text-slate-800">{stats.scans}</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                 <div className="flex items-center gap-2 mb-2 text-slate-500">
                    <Award className="w-4 h-4" />
                    <span className="text-xs font-semibold uppercase">CO₂ Saved</span>
                 </div>
                 <p className="text-2xl font-black text-green-600">{stats.co2Saved.toFixed(1)} <span className="text-sm text-slate-400">kg</span></p>
              </div>
           </div>

           <div className="bg-green-50 rounded-2xl p-4 border border-green-100 flex items-center justify-between">
              <div>
                 <p className="text-xs font-bold text-green-800 uppercase mb-1">Plastic Diverted</p>
                 <p className="text-xl font-black text-green-600">{stats.plasticSaved.toFixed(2)} kg</p>
              </div>
              <img 
                src="https://cdn-icons-png.flaticon.com/512/3299/3299954.png" 
                alt="Plastic bottle" 
                className="w-12 h-12 opacity-80"
              />
           </div>

           <button 
             onClick={onClose}
             className="w-full mt-6 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors"
           >
             Keep Recycling!
           </button>
        </div>
      </div>
    </div>
  );
};
