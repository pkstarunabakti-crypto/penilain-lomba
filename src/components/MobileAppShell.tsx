import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Trophy, 
  Search, 
  FileSignature, 
  Sparkles, 
  Settings,
  Wifi,
  Battery,
  Phone,
  ArrowLeft,
  Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface MobileAppShellProps {
  children: React.ReactNode;
}

export default function MobileAppShell({ children }: MobileAppShellProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [batteryLevel, setBatteryLevel] = useState(98);
  const [currentTime, setCurrentTime] = useState('12:00');

  // Real-time local Clock setup
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      setCurrentTime(`${hours}:${minutes}`);
    };
    
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  // Soft battery draining simulation for premium feel
  useEffect(() => {
    const interval = setInterval(() => {
      setBatteryLevel(prev => {
        if (prev <= 15) return 100;
        return prev - 1;
      });
    }, 600000); // 10 minutes per 1%
    return () => clearInterval(interval);
  }, []);

  // Determine current active navigation route
  const currentPath = location.pathname;

  // Tab configurations
  const navigationTabs = [
    {
      id: 'rekap',
      label: 'Rekap',
      path: '/results',
      icon: Trophy,
      color: 'text-amber-500',
      activeColor: 'bg-amber-50 text-amber-600 border-amber-200'
    },
    {
      id: 'cek-nilai',
      label: 'Cari',
      path: '/cek-nilai',
      icon: Search,
      color: 'text-indigo-500',
      activeColor: 'bg-indigo-50 text-indigo-600 border-indigo-200'
    },
    {
      id: 'juri',
      label: 'Juri PBB',
      path: '/juri',
      icon: FileSignature,
      color: 'text-emerald-500',
      activeColor: 'bg-emerald-50 text-emerald-600 border-emerald-200'
    },
    {
      id: 'juri-formasi',
      label: 'Juri FV',
      path: '/juri-formasi',
      icon: Sparkles,
      color: 'text-sky-500',
      activeColor: 'bg-sky-50 text-sky-600 border-sky-200'
    },
    {
      id: 'admin',
      label: 'Panitia',
      path: '/',
      icon: Settings,
      color: 'text-slate-500',
      activeColor: 'bg-slate-100 text-slate-800 border-slate-300'
    }
  ];

  // Auto-detect current active tab
  const activeTab = navigationTabs.find(tab => {
    if (tab.path === '/') {
      return currentPath === '/' || currentPath === '';
    }
    return currentPath.startsWith(tab.path);
  })?.id || 'admin';

  // Smart feature: hide botom navigation bar when inside deep scoring input
  // To verify if inside a scoring sheet, we'll listen to URL path and document elements
  const [shouldHideNav, setShouldHideNav] = useState(false);

  useEffect(() => {
    // Hide navigation bar when we are on active form view in PBB/Formasi pages
    // Juri pages show LKBBForm which has input selections. 
    // If the window is highly zoomed or showing custom assessment tables, we can auto-hide.
    const checkScoringState = () => {
      const activeInput = document.querySelector('select[value=""]') === null && document.querySelector('input[type="number"]') !== null;
      const isScoringActive = (currentPath === '/juri' || currentPath === '/juri-formasi') && activeInput;
      setShouldHideNav(isScoringActive);
    };

    const interval = setInterval(checkScoringState, 1000);
    checkScoringState();
    return () => clearInterval(interval);
  }, [currentPath]);

  return (
    <div className="min-h-screen w-full bg-slate-950 flex flex-col md:flex-row items-center justify-center p-0 md:p-6 lg:p-8 relative overflow-hidden select-none" id="app-mobile-shell">
      {/* Dynamic Cosmic Background Ornaments (Anti-AI-Slop compliant: no texts, pure blur visuals) */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[150px] pointer-events-none" />
      
      {/* Decorative desktop-only information card */}
      <div className="hidden lg:flex flex-col text-left max-w-sm mr-12 text-slate-400 p-6 z-10 space-y-4">
        <div className="inline-flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-full self-start">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Mobile Live Mode</span>
        </div>
        <h2 className="text-3xl font-black text-white tracking-tight uppercase leading-tight">LKBB DIGITAL APP</h2>
        <p className="text-xs text-slate-400 leading-relaxed">
          Selamat datang di aplikasi rekapitulasi nilai perlombaan LKBB. Tampilan ini didesain sebagai aplikasi mobile hybrid yang responsif dan sangat fleksibel.
        </p>
        <div className="border-t border-slate-900 pt-4 space-y-2 text-xs text-slate-500">
          <p className="font-semibold text-slate-400">🔥 Fitur Unggulan Mobile App:</p>
          <ul className="list-disc pl-4 space-y-1">
            <li>Interfase interaktif berorientasi sentuhan</li>
            <li>Bottom navigation dock untuk akses instan</li>
            <li>Simulasi status bar dengan penunjuk waktu rill</li>
            <li>Keamanan ganda untuk akses Juri & Admin</li>
          </ul>
        </div>
      </div>

      {/* Renders dynamic realistic Smartphone body mockup on Desktop view */}
      <div className="relative w-full h-screen md:h-[844px] md:w-[390px] md:max-w-[390px] md:rounded-[44px] md:border-[12px] md:border-slate-800 md:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] md:bg-slate-950 flex flex-col overflow-hidden z-20 transition-all duration-300">
        
        {/* Modern Smartphone Dynamic Notch Cutout */}
        <div className="hidden md:flex absolute top-3 left-1/2 -translate-x-1/2 h-5 w-28 bg-black rounded-full z-50 items-center justify-center border border-slate-900 shadow-inner">
          <div className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-800 ml-auto mr-3 flex-shrink-0" />
        </div>

        {/* Dynamic App Status Bar */}
        <div className="h-11 bg-slate-900 text-slate-100 flex items-center justify-between px-6 select-none flex-shrink-0 text-xs font-bold relative z-40 border-b border-slate-800/40">
          {/* Time display */}
          <div className="font-semibold text-[11px] tracking-tight">{currentTime}</div>
          
          {/* Top Logo / Status badge */}
          <div className="absolute left-1/2 -translate-x-1/2 text-[9px] text-indigo-400 uppercase tracking-widest font-black hidden sm:block">
            LKBB APP
          </div>

          {/* Indicators */}
          <div className="flex items-center gap-1.5 text-slate-300">
            <div className="flex gap-[2px] items-end h-2.5">
              <span className="w-[2px] h-[3px] bg-white rounded-xs" />
              <span className="w-[2px] h-[5px] bg-white rounded-xs" />
              <span className="w-[2px] h-[7px] bg-white rounded-xs" />
              <span className="w-[2px] h-[9px] bg-white rounded-xs" />
            </div>
            <Wifi className="w-3.5 h-3.5" />
            <div className="flex items-center gap-0.5">
              <span className="text-[10px] font-semibold text-slate-400">{batteryLevel}%</span>
              <Battery className="w-4 h-4 text-emerald-500" />
            </div>
          </div>
        </div>

        {/* Viewport content of the Phone */}
        <div className="flex-1 bg-slate-50 overflow-hidden relative flex flex-col">
          {children}
        </div>

        {/* Immersive bottom navigation controller */}
        <AnimatePresence>
          {!shouldHideNav && (
            <motion.div 
              initial={{ y: 80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 80, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="absolute bottom-0 left-0 right-0 h-20 bg-white/95 backdrop-blur-md border-t border-slate-150 flex items-center justify-around px-2 pb-safe-bottom z-40 shadow-[0_-8px_30px_rgba(0,0,0,0.06)]"
            >
              {navigationTabs.map(tab => {
                const Icon = tab.icon;
                const isTabActive = activeTab === tab.id;
                
                return (
                  <button
                    key={tab.id}
                    id={`nav-tab-${tab.id}`}
                    onClick={() => navigate(tab.path)}
                    className="flex flex-col items-center justify-center w-14 h-14 relative rounded-xl hover:bg-slate-50 transition-all duration-200 cursor-pointer"
                  >
                    <div className="relative">
                      {isTabActive && (
                        <motion.span 
                          layoutId="activeTabGlow"
                          className="absolute -inset-2 rounded-full bg-indigo-50/70 border border-indigo-100 z-0"
                          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                        />
                      )}
                      
                      <div className="relative z-10 flex flex-col items-center">
                        <Icon 
                          className={`w-5 / h-5 transition-transform duration-200 ${
                            isTabActive ? 'scale-110 text-indigo-600 font-bold' : 'text-slate-400'
                          }`} 
                        />
                        <span className={`text-[9px] font-bold mt-1.5 tracking-tighter ${
                          isTabActive ? 'text-indigo-600 font-black' : 'text-slate-400'
                        }`}>
                          {tab.label}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* iOS style home indicator bar (Decorative, visible on desktop view only) */}
        <div className="hidden md:block absolute bottom-1 left-1/2 -translate-x-1/2 w-32 h-1 bg-slate-800 rounded-full z-50 pointer-events-none" />
      </div>

      {/* Right side instruction panel for administrative reference */}
      <div className="hidden lg:flex flex-col text-left max-w-sm ml-12 text-slate-400 p-6 z-10 space-y-4">
        <div className="bg-slate-900/60 p-4 rounded-3xl border border-slate-900 space-y-3 font-semibold text-xs leading-relaxed text-slate-400">
          <p className="text-white text-[13px] font-bold mb-2">🔑 Kode Akses Sistem:</p>
          <div className="flex justify-between items-center bg-slate-950 px-3.5 py-2.5 rounded-xl border border-slate-800 shadow-inner">
            <span className="text-amber-500 font-mono text-[11px]">ADMIN PASS:</span>
            <span className="text-white font-mono font-bold bg-slate-900 px-2 py-0.5 rounded text-[11px] select-all">adminlomba</span>
          </div>
          <div className="flex justify-between items-center bg-slate-950 px-3.5 py-2.5 rounded-xl border border-slate-800 shadow-inner">
            <span className="text-emerald-500 font-mono text-[11px]">JURI PASS:</span>
            <span className="text-white font-mono font-bold bg-slate-900 px-2 py-0.5 rounded text-[11px] select-all">jurilomba</span>
          </div>
        </div>
      </div>
    </div>
  );
}
