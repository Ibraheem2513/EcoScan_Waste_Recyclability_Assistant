import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { ImageUploader } from './components/ImageUploader';
import { ResultCard } from './components/ResultCard';
import { GamificationModal } from './components/GamificationModal';
import { analyzeWasteImage, generateIdeaImage, findNearbyRecyclingCenters } from './services/geminiService';
import { AnalysisState, UserStats } from './types';
import { AlertCircle, Leaf } from 'lucide-react';

// Default user stats
const INITIAL_STATS: UserStats = {
  points: 0,
  level: "Eco Novice",
  scans: 0,
  plasticSaved: 0,
  co2Saved: 0,
  badges: []
};

const App: React.FC = () => {
  // State for App Logic
  const [state, setState] = useState<AnalysisState>({
    isLoading: false,
    isGeneratingImage: false,
    isLoadingCenters: false,
    error: null,
    result: null,
    imagePreview: null,
    generatedIdeaImage: null,
    recyclingCenters: []
  });

  // State for Gamification
  const [userStats, setUserStats] = useState<UserStats>(INITIAL_STATS);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Load stats from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem('ecoScanStats');
    if (saved) {
      setUserStats(JSON.parse(saved));
    }
  }, []);

  // Save stats whenever they change
  useEffect(() => {
    localStorage.setItem('ecoScanStats', JSON.stringify(userStats));
  }, [userStats]);

  const updateStats = () => {
    setUserStats(prev => {
      const newPoints = prev.points + 20;
      const newScans = prev.scans + 1;
      
      // Simple logic: 100 points per level up (for demo)
      // Real app would have complex tiers
      let newLevel = prev.level;
      if (newPoints > 500) newLevel = "Recycling Ranger";
      if (newPoints > 1000) newLevel = "Planet Protector";
      if (newPoints > 2000) newLevel = "Eco Legend";

      return {
        ...prev,
        points: newPoints,
        scans: newScans,
        level: newLevel,
        plasticSaved: prev.plasticSaved + 0.05, // Assume 50g per item
        co2Saved: prev.co2Saved + 0.15 // Assume 150g CO2 per item
      };
    });
  };

  const handleImageSelected = async (base64: string, mimeType: string, previewUrl: string) => {
    // Reset state for new scan
    setState(prev => ({ 
      ...prev, 
      isLoading: true, 
      isGeneratingImage: false,
      isLoadingCenters: false,
      error: null, 
      imagePreview: previewUrl,
      result: null,
      generatedIdeaImage: null,
      recyclingCenters: []
    }));

    try {
      // 1. Analyze the waste image (Text)
      const analysisResult = await analyzeWasteImage(base64, mimeType);
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        result: analysisResult,
        isGeneratingImage: true, // Start loading state for image gen
      }));
      
      // Update gamification stats
      updateStats();

      // 2. Generate an image for the best creative idea (if available)
      if (analysisResult.creativeIdeas && analysisResult.creativeIdeas.length > 0) {
        const bestIdea = analysisResult.creativeIdeas[0];
        const generatedImage = await generateIdeaImage(
          analysisResult.itemName, 
          bestIdea.title, 
          bestIdea.description
        );
        
        setState(prev => ({
          ...prev,
          generatedIdeaImage: generatedImage,
          isGeneratingImage: false
        }));
      } else {
        setState(prev => ({ ...prev, isGeneratingImage: false }));
      }

    } catch (error: any) {
      // Safely extract error message
      let errorMessage = "Something went wrong. Please try again.";
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        isGeneratingImage: false,
        error: errorMessage,
      }));
    }
  };

  const handleFindCenters = () => {
    if (!state.result) return;
    
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    setState(prev => ({ ...prev, isLoadingCenters: true }));

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const query = `${state.result?.itemName} recycling center`;
        const places = await findNearbyRecyclingCenters(latitude, longitude, query);
        
        setState(prev => ({
          ...prev,
          isLoadingCenters: false,
          recyclingCenters: places
        }));
      },
      (error) => {
        console.error(error);
        alert("Unable to retrieve your location to find centers.");
        setState(prev => ({ ...prev, isLoadingCenters: false }));
      }
    );
  };

  const handleReset = () => {
    setState({
      isLoading: false,
      isGeneratingImage: false,
      isLoadingCenters: false,
      error: null,
      result: null,
      imagePreview: null,
      generatedIdeaImage: null,
      recyclingCenters: []
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-green-50/50 via-slate-50 to-blue-50/50">
      <Header stats={userStats} onOpenProfile={() => setIsProfileOpen(true)} />
      
      <GamificationModal 
        isOpen={isProfileOpen} 
        onClose={() => setIsProfileOpen(false)} 
        stats={userStats} 
      />

      <main className="flex-grow flex flex-col items-center justify-start p-4 sm:p-6 lg:p-10 max-w-5xl mx-auto w-full">
        
        {/* Hero Section */}
        {!state.result && !state.imagePreview && (
          <div className="text-center mb-10 mt-8 max-w-2xl animate-fade-in-up">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm font-medium mb-4">
              <Leaf className="w-4 h-4" />
              <span>AI-Powered Waste Sorting</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">
              Is it <span className="text-green-600">Recyclable?</span>
            </h2>
            <p className="text-lg text-slate-600 leading-relaxed">
              Upload a photo of any item, and our AI will instantly tell you if it can be recycled and how to dispose of it responsibly.
            </p>
          </div>
        )}

        {/* Content Area */}
        <div className="w-full max-w-3xl">
          
          {/* Error Message */}
          {state.error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-red-700 animate-shake">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Analysis Failed</p>
                <p className="text-sm opacity-90">{state.error}</p>
                <button 
                  onClick={handleReset}
                  className="mt-2 text-xs font-bold underline hover:text-red-900"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}

          {/* Main Views */}
          {!state.result ? (
            <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 p-2 border border-white">
               {/* Show uploader even if preview exists (loading state) but hide when result is ready */}
               {state.imagePreview && state.isLoading && (
                  <div className="p-8 text-center flex flex-col items-center justify-center min-h-[300px]">
                      <div className="relative w-32 h-32 mb-6">
                        <img 
                          src={state.imagePreview} 
                          alt="Analyzing" 
                          className="w-full h-full object-cover rounded-2xl opacity-50 blur-sm"
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600"></div>
                        </div>
                      </div>
                      <h3 className="text-xl font-bold text-slate-800 mb-2">Analyzing Image...</h3>
                      <p className="text-slate-500">Identifying material and checking recycling rules.</p>
                  </div>
               )}

               {(!state.imagePreview || !state.isLoading) && (
                 <ImageUploader 
                   onImageSelected={handleImageSelected} 
                   isLoading={state.isLoading} 
                 />
               )}
            </div>
          ) : (
            <ResultCard 
              result={state.result} 
              imagePreview={state.imagePreview!} 
              onReset={handleReset} 
              generatedIdeaImage={state.generatedIdeaImage}
              isGeneratingImage={state.isGeneratingImage}
              onFindCenters={handleFindCenters}
              recyclingCenters={state.recyclingCenters}
              isLoadingCenters={state.isLoadingCenters}
            />
          )}

        </div>

        {/* Quick Tips (Only show on start screen) */}
        {!state.result && !state.isLoading && !state.imagePreview && (
          <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center w-full max-w-4xl">
             <div className="p-6 bg-white/60 rounded-2xl border border-slate-100 hover:bg-white hover:shadow-md transition-all">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600 font-bold text-xl">1</div>
                <h4 className="font-bold text-slate-900 mb-2">Snap a Photo</h4>
                <p className="text-sm text-slate-500">Take a clear picture of the item you want to discard.</p>
             </div>
             <div className="p-6 bg-white/60 rounded-2xl border border-slate-100 hover:bg-white hover:shadow-md transition-all">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600 font-bold text-xl">2</div>
                <h4 className="font-bold text-slate-900 mb-2">AI Analysis</h4>
                <p className="text-sm text-slate-500">Our smart model identifies the material and condition.</p>
             </div>
             <div className="p-6 bg-white/60 rounded-2xl border border-slate-100 hover:bg-white hover:shadow-md transition-all">
                <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4 text-amber-600 font-bold text-xl">3</div>
                <h4 className="font-bold text-slate-900 mb-2">Recycle Right</h4>
                <p className="text-sm text-slate-500">Get instant advice on whether to bin it or recycle it.</p>
             </div>
          </div>
        )}

      </main>

      <footer className="py-6 text-center text-slate-400 text-sm">
        <p>© {new Date().getFullYear()} EcoScan. Powered by Gemini.</p>
      </footer>
    </div>
  );
};

export default App;