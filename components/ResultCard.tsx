import React from 'react';
import { CheckCircle, XCircle, AlertTriangle, HelpCircle, ArrowRight, RefreshCcw, Lightbulb, Sparkles, MapPin, ExternalLink } from 'lucide-react';
import { WasteAnalysis, RecycleStatus, RecyclingPlace } from '../types';

interface ResultCardProps {
  result: WasteAnalysis;
  imagePreview: string;
  onReset: () => void;
  generatedIdeaImage: string | null;
  isGeneratingImage: boolean;
  onFindCenters: () => void;
  recyclingCenters: RecyclingPlace[];
  isLoadingCenters: boolean;
}

export const ResultCard: React.FC<ResultCardProps> = ({ 
  result, 
  imagePreview, 
  onReset, 
  generatedIdeaImage, 
  isGeneratingImage,
  onFindCenters,
  recyclingCenters,
  isLoadingCenters
}) => {
  
  const getStatusColor = (status: RecycleStatus) => {
    switch (status) {
      case RecycleStatus.YES: return 'text-green-600 bg-green-50 border-green-200';
      case RecycleStatus.NO: return 'text-red-600 bg-red-50 border-red-200';
      case RecycleStatus.MAYBE: return 'text-amber-600 bg-amber-50 border-amber-200';
      default: return 'text-slate-600 bg-slate-50 border-slate-200';
    }
  };

  const getStatusIcon = (status: RecycleStatus) => {
    switch (status) {
      case RecycleStatus.YES: return <CheckCircle className="w-8 h-8" />;
      case RecycleStatus.NO: return <XCircle className="w-8 h-8" />;
      case RecycleStatus.MAYBE: return <AlertTriangle className="w-8 h-8" />;
      default: return <HelpCircle className="w-8 h-8" />;
    }
  };

  const statusColorClass = getStatusColor(result.status);

  return (
    <div className="w-full bg-white rounded-2xl shadow-xl overflow-hidden animate-fade-in border border-slate-100">
      
      {/* Top Section: Image & Main Status */}
      <div className="flex flex-col md:flex-row">
        {/* Image Display */}
        <div className="w-full md:w-1/3 h-64 md:h-auto relative bg-slate-100">
          <img 
            src={imagePreview} 
            alt="Uploaded waste item" 
            className="w-full h-full object-cover"
          />
          <div className="absolute top-4 left-4">
             <span className="px-3 py-1 bg-black/60 backdrop-blur-md text-white text-xs font-semibold rounded-full uppercase tracking-wider">
               Confidence: {result.confidenceScore}%
             </span>
          </div>
        </div>

        {/* Primary Content */}
        <div className="flex-1 p-6 md:p-8">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-1">{result.itemName}</h2>
              <p className="text-slate-500 font-medium">{result.category}</p>
            </div>
            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border ${statusColorClass}`}>
              {getStatusIcon(result.status)}
              <span className="font-bold text-lg">{result.status === 'YES' ? 'Recyclable' : result.status === 'NO' ? 'Not Recyclable' : 'Check Local Rules'}</span>
            </div>
          </div>

          <p className="text-slate-700 leading-relaxed mb-6">
            {result.explanation}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Instructions */}
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-3 flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                Disposal Instructions
              </h3>
              <ul className="space-y-2">
                {result.instructions.map((instruction, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-slate-600">
                    <ArrowRight className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>{instruction}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Alternatives or Centers */}
            <div>
                {result.alternatives && result.alternatives.length > 0 && (
                <div className="mb-6">
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    Eco Alternatives
                    </h3>
                    <ul className="space-y-2">
                    {result.alternatives.map((alt, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-slate-600">
                        <RefreshCcw className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                        <span>{alt}</span>
                        </li>
                    ))}
                    </ul>
                </div>
                )}
            </div>
          </div>

           {/* Nearby Centers Feature (Only for Recyclable or Maybe) */}
           {(result.status === 'YES' || result.status === 'MAYBE') && (
            <div className="mt-6 pt-6 border-t border-slate-100">
              <div className="flex items-center justify-between mb-4">
                 <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                   <MapPin className="w-4 h-4 text-red-500" />
                   Nearby Recycling Centers
                 </h3>
                 {!isLoadingCenters && recyclingCenters.length === 0 && (
                   <button 
                     onClick={onFindCenters}
                     className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1 rounded-full hover:bg-blue-100 transition-colors"
                   >
                     Find Near Me
                   </button>
                 )}
              </div>

              {isLoadingCenters && (
                <div className="flex items-center gap-2 text-sm text-slate-500 animate-pulse">
                   <div className="w-4 h-4 rounded-full border-2 border-slate-300 border-t-blue-500 animate-spin"></div>
                   Locating centers via Google Maps...
                </div>
              )}

              {recyclingCenters.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                   {recyclingCenters.slice(0, 4).map((place, idx) => (
                     <a 
                       key={idx} 
                       href={place.uri} 
                       target="_blank" 
                       rel="noopener noreferrer"
                       className="block p-3 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-all group"
                     >
                        <div className="flex items-start justify-between">
                          <span className="font-medium text-slate-800 text-sm truncate pr-2">{place.name}</span>
                          <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-500" />
                        </div>
                        <span className="text-xs text-blue-600 mt-1 block">View on Maps</span>
                     </a>
                   ))}
                </div>
              )}
            </div>
           )}

        </div>
      </div>

      {/* New Section: Creative Reuse Ideas with Visualization */}
      {result.creativeIdeas && result.creativeIdeas.length > 0 && (
        <div className="border-t border-slate-100 bg-purple-50/50 p-6 md:p-8">
           <h3 className="text-lg font-bold text-purple-900 mb-6 flex items-center gap-2">
             <Lightbulb className="w-6 h-6 text-purple-600" />
             Creative Reuse & Upcycling Ideas
           </h3>
           
           <div className="flex flex-col md:flex-row gap-6">
             {/* List of Ideas */}
             <div className="flex-1 space-y-4">
                {result.creativeIdeas.map((idea, idx) => (
                  <div key={idx} className="bg-white border border-purple-100 p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                    <h4 className="font-bold text-purple-800 text-sm mb-1 flex items-center gap-2">
                      <span className="bg-purple-100 text-purple-700 w-5 h-5 rounded-full flex items-center justify-center text-xs">{idx + 1}</span>
                      {idea.title}
                    </h4>
                    <p className="text-slate-600 text-sm pl-7">{idea.description}</p>
                  </div>
                ))}
             </div>

             {/* Generated Visualization */}
             <div className="w-full md:w-80 flex-shrink-0">
               <div className="bg-white p-3 rounded-xl border border-purple-100 shadow-sm h-full flex flex-col">
                  <div className="relative aspect-square bg-slate-100 rounded-lg overflow-hidden flex items-center justify-center">
                    {generatedIdeaImage ? (
                      <img 
                        src={generatedIdeaImage} 
                        alt="AI Generated DIY Idea" 
                        className="w-full h-full object-cover animate-fade-in"
                      />
                    ) : isGeneratingImage ? (
                      <div className="text-center p-4">
                         <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-3"></div>
                         <p className="text-xs text-purple-600 font-medium animate-pulse">Visualizing your idea...</p>
                      </div>
                    ) : (
                      <div className="text-center text-slate-400 p-4">
                        <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-xs">Visualization unavailable</p>
                      </div>
                    )}
                    
                    {generatedIdeaImage && (
                       <div className="absolute bottom-2 right-2 px-2 py-1 bg-purple-600/80 backdrop-blur-sm rounded text-[10px] text-white font-medium flex items-center gap-1">
                         <Sparkles className="w-3 h-3" /> AI Generated
                       </div>
                    )}
                  </div>
                  <div className="mt-3 text-center">
                     <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                        {isGeneratingImage ? "Designing..." : "AI Visualization"}
                     </p>
                     {!isGeneratingImage && generatedIdeaImage && result.creativeIdeas[0] && (
                       <p className="text-xs text-purple-700 font-semibold mt-1">
                         {result.creativeIdeas[0].title}
                       </p>
                     )}
                  </div>
               </div>
             </div>
           </div>
        </div>
      )}

      {/* Footer Actions */}
      <div className="bg-slate-50 p-4 border-t border-slate-100 flex justify-end">
        <button 
          onClick={onReset}
          className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-medium hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200 flex items-center gap-2"
        >
          <RefreshCcw className="w-4 h-4" />
          Scan Another Item
        </button>
      </div>
    </div>
  );
};
