import React, { useState, useEffect, useMemo } from 'react';
import { Routes, Route, Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { createGlobalStyle } from 'styled-components';

import DashboardPage from './pages/DashboardPage';
import LiveOverviewPage from './pages/LiveOverviewPage';
import AnalyticsPage from './pages/AnalyticsPage';
import InsightsPage from './pages/InsightsPage';
import AccountPage from './pages/AccountPage';
import LoginPage from './auth/LoginPage';
import ProtectedRoute from './auth/ProtectedRoute';

// Helper to construct Tailwind classes
const cl = (classes) => classes.filter(Boolean).join(' ');

// --- ICONS (using lucide-react, inlined as SVG for simplicity) ---
const HomeIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
);
const BarChartIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="20" y2="10" /><line x1="18" x2="18" y1="20" y2="4" /><line x1="6" x2="6" y1="20" y2="16" /></svg>
);
const LightbulbIcon = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>
);
const UserIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
);
const ChevronRightIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
);
const ArrowUpRightIcon = () => <path d="M7 7h10v10" />;
const ArrowDownRightIcon = () => <path d="M7 17 17 7" />;
const ArrowRightIcon = () => <path d="M5 12h14" />;

// --- GLOBAL STYLES & FONTS ---
const GlobalStyles = createGlobalStyle`
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@700;800&family=DM+Sans:wght@400;500;700&display=swap');

  :root {
    --bg: #F8FAFC;
    --surface: #FFFFFF;
    --primary: #7C3AED;
    --primary-soft: #F5F3FF;
    --accent-blue: #3B82F6;
    --accent-purple: #8B5CF6;
    --accent-pink: #EC4899;
    --danger: #EF4444;
    --danger-soft: #FEF2F2;
    --warning: #F59E0B;
    --warning-soft: #FFFBEB;
    --text-main: #0F172A;
    --text-sub: #64748B;
    --border: #E2E8F0;
    --shadow-card: 0 4px 20px rgba(124, 58, 237, 0.06);
    --shadow-hover: 0 8px 32px rgba(124, 58, 237, 0.12);
  }

  body {
    background-color: var(--bg);
    font-family: 'DM Sans', sans-serif;
    color: var(--text-main);
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
`;

// --- MOCK DATA ---
const MOCK_DATA = {
  "5m": { id: "mock-5m", batch_type: "5m", sentiment_score: 0.85, sentiment_trend: "rising", emerging_topics: ["fitur baru", "tutorial", "antusiasme penonton"], summary: "Audiens sangat antusias terhadap fitur yang baru diperlihatkan, dan banyak yang meminta tutorial.", actionable_insight: "Sematkan komentar berisi tautan dokumentasi fitur atau video tutorial.", message_count: 14200, created_at: new Date(Date.now() - 2 * 60 * 1000).toISOString() },
  "20m": { id: "mock-20m", batch_type: "20m", sentiment_score: 0.72, sentiment_trend: "stable", emerging_topics: ["kualitas produk", "pengiriman", "diskon"], summary: "Penonton ingin mengetahui detail dan harga produk. Beberapa meminta kode diskon.", actionable_insight: "Umumkan kode promo dengan waktu terbatas untuk menarik calon pembeli.", message_count: 9800, created_at: new Date(Date.now() - 15 * 60 * 1000).toISOString() },
  "45m": { id: "mock-45m", batch_type: "45m", sentiment_score: 0.61, sentiment_trend: "falling", emerging_topics: ["respons lambat", "gangguan audio", "penonton meninggalkan siaran"], summary: "Gangguan teknis menyebabkan penonton meninggalkan siaran. Sentimen menurun selama sesi berlangsung.", actionable_insight: "Sampaikan penanganan gangguan audio dan pertimbangkan memulai ulang siaran jika masalah berlanjut.", message_count: 31400, created_at: new Date(Date.now() - 40 * 60 * 1000).toISOString() }
};
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// --- SHARED HELPER & UI COMPONENTS ---
const SkeletonPlaceholder = ({ className, children }) => (
    <div className={`relative bg-gray-200 animate-pulse rounded-2xl ${className}`}>
        {children && (
            <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-gray-500 font-semibold text-center px-4">{children}</p>
            </div>
        )}
    </div>
);

const AnimatedCounter = ({ value }) => {
    const [displayValue, setDisplayValue] = React.useState(0);
    const valueRef = React.useRef(0);
  
    useEffect(() => {
      const start = valueRef.current;
      const end = value;
      const duration = 1200;
      let startTime = null;
  
      const animate = (timestamp) => {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / duration, 1);
        const easedProgress = 1 - Math.pow(1 - progress, 3);
        const currentValue = start + (end - start) * easedProgress;
        setDisplayValue(Math.round(currentValue));
  
        if (progress < 1) requestAnimationFrame(animate);
        else valueRef.current = end;
      };
  
      requestAnimationFrame(animate);
    }, [value]);
  
    return <span>{displayValue}</span>;
};

const Header = ({ username, user, liveChannel }) => (
    <header className="app-header">
        <div className="flex items-center gap-2.5">
            <img 
                src="/streamly-icon.png" 
                alt="Streamly" 
                className="w-9 h-9 object-contain flex-shrink-0 drop-shadow-xs hover:scale-105 transition-transform" 
            />
            <div>
                <div className="flex items-center">
                    <h1 className="font-extrabold text-xl text-slate-900" style={{ fontFamily: 'Plus Jakarta Sans' }}>Streamly</h1>
                </div>
                {liveChannel && (
                    <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        <span className="text-[10px] font-semibold text-slate-500">
                            Target: @{liveChannel}
                        </span>
                    </div>
                )}
            </div>
        </div>
        <div className="flex items-center gap-2.5">
            <div className="text-right">
                <p className="text-xs font-bold text-slate-800 leading-tight">{user?.fullName || username}</p>
                <p className="text-[10px] text-slate-500 font-bold capitalize">{user?.role ? user.role.replace('_', ' ') : 'Streamer'}</p>
            </div>
            <div className="w-9 h-9 bg-neutral-900 rounded-full flex items-center justify-center text-white font-extrabold">
                {(user?.fullName || username || 'S').charAt(0).toUpperCase()}
            </div>
        </div>
    </header>
);

const TrendBadge = ({ trend, score }) => {
    const trendInfo = {
        rising: { icon: ArrowUpRightIcon, color: 'primary', text: 'Naik' },
        falling: { icon: ArrowDownRightIcon, color: 'danger', text: 'Turun' },
        stable: { icon: ArrowRightIcon, color: 'sub', text: 'Stabil' },
    };
    const { icon: Icon, color, text } = trendInfo[trend] || trendInfo.stable;

    return (
        <div className={`flex items-center text-xs font-bold rounded-full px-2 py-1 bg-opacity-10 ${
            color === 'primary' ? 'bg-primary text-primary' : color === 'danger' ? 'bg-danger text-danger' : 'bg-gray-400 text-gray-600'
        }`}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><Icon /></svg>
            <span className="ml-1">{Math.abs(score * 10).toFixed(0)}% {text}</span>
        </div>
    );
};

const SentimentCard = ({ data, isLoading, loadingMessage }) => {
    if (isLoading) return (
        <div className="px-4 pb-2">
            <SkeletonPlaceholder className="h-48 w-full">{loadingMessage}</SkeletonPlaceholder>
        </div>
    );
    if (!data) return null;

    return (
        <div className="px-4 pb-2">
            <div className="bg-white rounded-2xl p-5 shadow-lg relative overflow-hidden" style={{ boxShadow: 'var(--shadow-card)'}}>
                <div className="flex justify-between items-start">
                    <h2 className="font-bold text-sm" style={{fontFamily: 'Plus Jakarta Sans'}}>Sentimen Keseluruhan</h2>
                    {data.sentiment_trend && <TrendBadge trend={data.sentiment_trend} score={data.sentiment_score} />}
                </div>
                <div className="my-2">
                    <span className="text-5xl font-extrabold" style={{fontFamily: 'Plus Jakarta Sans'}}><AnimatedCounter value={data.sentiment_score * 100} /></span>
                    <span className="text-3xl font-bold text-gray-400 ml-1">%</span>
                </div>
                <p className="text-sm text-gray-500 leading-relaxed break-words relative z-10 pb-4">{data.summary}</p>
                <svg viewBox="0 0 200 50" className="absolute bottom-0 right-0 w-2/3 h-1/2 z-0 opacity-20" preserveAspectRatio="none">
                    <path d="M0,50 C40,10 60,10 100,30 S160,50 200,40" stroke="#8B5CF6" fill="url(#sparkline-gradient)" strokeWidth="2.5"></path>
                    <defs><linearGradient id="sparkline-gradient" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.4"/><stop offset="100%" stopColor="#EC4899" stopOpacity="0"/></linearGradient></defs>
                </svg>
            </div>
        </div>
    );
};

const StatsRow = ({ data, isLoading, loadingMessage }) => {
    const formatCount = (num) => num >= 1000 ? `${(num / 1000).toFixed(1)}k` : num;
    const anomalyCount = useMemo(() => {
        if (!data?.emerging_topics) return 0;
        const negativeKeywords = ["issue", "problem", "slow", "error", "bad", "outage", "left", "boring", "masalah", "gangguan", "lambat", "buruk", "kecewa", "bosan"];
        return data.emerging_topics.filter(topic => negativeKeywords.some(kw => topic.toLowerCase().includes(kw))).length || 0;
    }, [data]);

    if (isLoading) return (
        <div className="px-4 grid grid-cols-2 gap-3">
            <SkeletonPlaceholder className="h-28 w-full">{loadingMessage}</SkeletonPlaceholder>
            <SkeletonPlaceholder className="h-28 w-full" />
        </div>
    );
    if (!data) return null;

    return (
        <div className="px-4 grid grid-cols-2 gap-3">
            <div className="bg-white rounded-2xl p-4 flex flex-col justify-between" style={{ boxShadow: 'var(--shadow-card)'}}>
                <label className="text-xs font-semibold uppercase tracking-wider text-gray-400">Jumlah Komentar</label>
                <div className="text-3xl font-bold my-2 text-slate-900" style={{fontFamily: 'Plus Jakarta Sans'}}>{formatCount(data.message_count)}</div>
                <svg viewBox="0 0 100 30" className="w-full h-8"><path d="M0,30 C20,10 40,10 60,20 S80,30 100,25" stroke="#8B5CF6" fill="none" strokeWidth="2.5"/></svg>
            </div>
            <div className="bg-white rounded-2xl p-4 flex flex-col justify-between" style={{ boxShadow: 'var(--shadow-card)'}}>
                <label className="text-xs font-semibold uppercase tracking-wider text-gray-400">Anomali Terdeteksi</label>
                <div className="text-3xl font-bold my-2 text-red-500" style={{fontFamily: 'Plus Jakarta Sans'}}>{anomalyCount}</div>
                {anomalyCount > 0 && <div className="text-xs font-bold text-red-500 bg-red-100 rounded-full px-2 py-1 self-start">⚠ Perlu ditinjau</div>}
            </div>
        </div>
    );
};

const InsightsSection = ({ data, isLoading, loadingMessage }) => {
    if (isLoading) return (
        <div className="p-4 space-y-3">
            <h2 className="text-lg font-bold mb-3" style={{fontFamily: 'Plus Jakarta Sans'}}>Rekomendasi Tindakan</h2>
            <SkeletonPlaceholder className="h-20 w-full">{loadingMessage}</SkeletonPlaceholder>
            <SkeletonPlaceholder className="h-20 w-full" />
        </div>
    );
    if (!data) return null;

    const insights = data.recommendations?.length
        ? data.recommendations
        : data.actionable_insight ? [{ topic: data.emerging_topics?.[0] || 'Rekomendasi', action: data.actionable_insight }] : [];
    
    return (
        <div className="p-4">
            <h2 className="text-lg font-bold mb-3" style={{fontFamily: 'Plus Jakarta Sans'}}>Rekomendasi Tindakan</h2>
            <div className="space-y-3">
                {insights.map((item, index) => (
                    <div key={index} className="bg-white rounded-xl p-4 flex items-start gap-4 shadow-md hover:-translate-y-0.5 transition-transform" style={{animationDelay: `${index * 80}ms`, boxShadow: 'var(--shadow-card)'}}>
                        
                        {/* 2. Tambahkan shrink-0 dan mt-1 agar ikon lampu tidak gepeng dan posisinya di atas */}
                        <div className="w-9 h-9 rounded-full flex items-center justify-center bg-teal-100 text-teal-500 shrink-0 mt-1">
                            <LightbulbIcon className="w-5 h-5" />
                        </div>
                        
                        <div className="flex-1 overflow-hidden">
                            {/* Tambahkan mb-1 untuk spasi antar judul dan teks saran */}
                            <div className="text-sm font-bold mb-1">
                                <span className="text-teal-500">{item.topic}</span>
                            </div>
                            
                            {/* 3. Hapus 'truncate', ganti dengan 'line-clamp-2' (atau line-clamp-3) dan 'leading-relaxed' */}
                            <p className="text-xs text-gray-600 leading-relaxed">
                                {item.action}
                            </p>
                            {item.evidence && <p className="mt-2 text-xs text-gray-500 leading-relaxed"><strong>Bukti percakapan:</strong> {item.evidence}</p>}
                        </div>
                        
                        {/* 4. Tambahkan shrink-0 dan mt-2 agar panah chevron posisinya pas */}
                        <ChevronRightIcon className="w-5 h-5 text-gray-400 shrink-0 mt-2" />
                    </div>
                ))}
            </div>
        </div>
    );
};

const BottomNav = () => {
    const navItems = [
        { to: "/", icon: HomeIcon, label: "Beranda" },
        { to: "/analisis", icon: BarChartIcon, label: "Analisis" },
        { to: "/analytics", icon: BarChartIcon, label: "Statistik" },
        { to: "/insights", icon: LightbulbIcon, label: "Riwayat" },
        { to: "/account", icon: UserIcon, label: "Akun" },
    ];
    const activeClass = "active";
    const inactiveClass = "";

    return (
        <nav className="app-nav" aria-label="Navigasi utama">
            {navItems.map(({ to, icon: Icon, label }) => (
                <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => cl(['app-nav-link', isActive ? activeClass : inactiveClass])}>
                    <Icon className="app-nav-icon" />
                    <span>{label}</span>
                </NavLink>
            ))}
        </nav>
    );
};

const Toast = ({ message, show }) => (
    <div className={cl(['fixed top-5 left-1/2 -translate-x-1/2 bg-gray-800 text-white px-4 py-2 rounded-md shadow-lg transition-all duration-300 z-50', show ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-5'])}>
        {message}
    </div>
);

// --- APP LAYOUT & ROUTING ---
const AppLayout = ({ username, user, liveChannel, setLiveChannel, error, isDemoMode, setIsDemoMode, handleLogout, insightData, setInsightData }) => {
    const { pathname } = useLocation();
    return (
    <div className="app-shell min-h-screen pb-24 md:pb-0">
        <Toast message={error} show={!!error} />
        {isDemoMode && (
            <div className="bg-amber-50 border-b border-amber-200 text-amber-900 text-xs py-1.5 px-3 sticky top-0 z-30 font-medium flex items-center justify-between shadow-sm">
                <span className="flex items-center gap-1.5">
                    <span className="inline-block w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
                    ⚡ Mode Demo (Data Simulasi)
                </span>
                <button
                    onClick={() => {
                        const next = !isDemoMode;
                        setIsDemoMode(next);
                        localStorage.setItem("streamly_demo_mode", next ? "true" : "false");
                    }}
                    className="text-[10px] bg-amber-200 hover:bg-amber-300 text-amber-900 font-bold px-2 py-0.5 rounded transition"
                >
                    Live Mode
                </button>
            </div>
        )}
        <div className="app-topbar">
            {username && <Header username={username} user={user} liveChannel={pathname === '/' ? null : liveChannel} />}
            <BottomNav />
        </div>
        <main className="app-main">
            <Outlet context={{ handleLogout, isDemoMode, setIsDemoMode, username, user, liveChannel, setLiveChannel, API_URL, MOCK_DATA, insightData, setInsightData }} />
        </main>
    </div>
    );
};

const StreamlyApp = () => {
    const [username, setUsername] = useState(localStorage.getItem("streamly_username"));
    const [liveChannel, setLiveChannel] = useState(() => {
        return localStorage.getItem("streamly_live_channel") || "metropolitan.id";
    });
    const [user, setUser] = useState(() => {
        try {
            const raw = localStorage.getItem("streamly_user");
            return raw ? JSON.parse(raw) : null;
        } catch (e) {
            return null;
        }
    });
    const [error, setError] = useState(null);
    const [isDemoMode, setIsDemoMode] = useState(() => {
        const saved = localStorage.getItem("streamly_demo_mode");
        if (saved !== null) return saved === "true";
        return false;
    });
    const [insightData, setInsightData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();

    const handleLoginSuccess = (loggedInUsername, demo = false, userProfile = null, targetLiveChannel = null) => {
        localStorage.setItem("streamly_username", loggedInUsername);
        localStorage.setItem("streamly_demo_mode", demo ? "true" : "false");
        const channel = targetLiveChannel || localStorage.getItem("streamly_live_channel") || "metropolitan.id";
        localStorage.setItem("streamly_live_channel", channel);
        if (userProfile) {
            localStorage.setItem("streamly_user", JSON.stringify(userProfile));
            setUser(userProfile);
        }
        setUsername(loggedInUsername);
        setLiveChannel(channel);
        setIsDemoMode(demo);
        setInsightData(null);
        navigate('/'); // Redirect to dashboard after login
    };

    const handleLogout = () => {
        localStorage.removeItem("streamly_username");
        localStorage.removeItem("streamly_demo_mode");
        localStorage.removeItem("streamly_user");
        localStorage.removeItem("streamly_token");
        localStorage.removeItem("streamly_live_channel");
        setUsername(null);
        setUser(null);
        setLiveChannel('metropolitan.id');
        setInsightData(null);
    };
    
    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => setError(null), 4000);
            return () => clearTimeout(timer);
        }
    }, [error]);

    const dashboardProps = {
        SentimentCard, StatsRow, InsightsSection, MOCK_DATA, API_URL, 
        USERNAME: username,
        liveChannel,
        setLiveChannel,
        isDemoMode, setIsDemoMode, setError, insightData, setInsightData, isLoading, setIsLoading
    };

    return (
        <>
            <GlobalStyles />
            <Routes>
                <Route path="/login" element={<LoginPage onLoginSuccess={handleLoginSuccess} />} />
                
                <Route element={<ProtectedRoute user={username} />}>
                    <Route path="/" element={<AppLayout username={username} user={user} liveChannel={liveChannel} setLiveChannel={setLiveChannel} error={error} isDemoMode={isDemoMode} setIsDemoMode={setIsDemoMode} handleLogout={handleLogout} insightData={insightData} setInsightData={setInsightData} />}>
                        <Route index element={<LiveOverviewPage />} />
                        <Route path="analisis" element={<DashboardPage {...dashboardProps} />} />
                        <Route path="analytics" element={<AnalyticsPage />} />
                        <Route path="insights" element={<InsightsPage />} />
                        <Route path="account" element={<AccountPage />} />
                    </Route>
                </Route>
            </Routes>
        </>
    );
};

export default StreamlyApp;
