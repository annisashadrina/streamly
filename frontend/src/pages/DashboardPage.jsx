import React, { useState, useEffect, useRef } from 'react';

const TimeFilterBar = ({ activeTab, setActiveTab, onRefresh, isRefreshing, onTriggerInstant, isTriggering }) => {
    const tabs = ['5m', '20m', '45m'];
    const activeIndex = tabs.findIndex(t => t === activeTab);

    return (
      <div className="p-4 pb-2 flex items-center gap-2">
        <div className="bg-gray-100 rounded-full p-1 flex relative flex-1">
          {tabs.map((tab) => {
            const isActive = tab === activeTab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2 text-center text-xs font-bold z-10 transition-colors duration-200 ${
                  isActive ? 'text-white' : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                {tab}
              </button>
            );
          })}
          <div
            className="absolute top-1 bottom-1 w-1/3 bg-gradient-to-r from-purple-600 via-purple-500 to-pink-500 rounded-full shadow-sm transition-transform duration-300 ease-out"
            style={{ transform: `translateX(${activeIndex * 100}%)` }}
          />
        </div>

        {onTriggerInstant && (
          <button
            onClick={onTriggerInstant}
            disabled={isTriggering}
            title="Analisis Sekarang dengan Gemini AI (tanpa tunggu 5 menit)"
            className="px-3 py-2 rounded-full bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 text-white font-bold text-xs flex items-center gap-1 shadow-sm hover:from-blue-700 hover:via-purple-700 hover:to-pink-600 transition disabled:opacity-50"
          >
            <span className={isTriggering ? 'animate-spin' : ''}>⚡</span>
            <span className="hidden sm:inline">AI Run</span>
          </button>
        )}

        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            title="Refresh Data Insight"
            className="p-2.5 rounded-full bg-white border border-gray-200 text-gray-500 hover:text-purple-600 hover:border-purple-500 transition shadow-sm disabled:opacity-50"
          >
            <svg
              className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-purple-600' : ''}`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
            </svg>
          </button>
        )}
      </div>
    );
};

/**
 * Komponen Live Chat Feed
 * Menampilkan pesan chat live TikTok yang sedang diserap secara realtime dari Redis
 */
const LiveChatFeedWidget = ({ targetChannel, apiUrl, isDemoMode }) => {
    const [messages, setMessages] = useState([]);
    const [isLive, setIsLive] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isPaused, setIsPaused] = useState(false);
    const chatContainerRef = useRef(null);

    // Mock comments jika dalam demo mode
    const demoComments = [
        { user: 'anggasaibo', message: 'halo kak spill harga diskon live hari ini dong' },
        { user: 'zarkhoi', message: 'pengiriman ke surabaya berapa hari ya kak?' },
        { user: 'siti_rahma', message: 'kualitasnya bagus banget, udah order 2 pcs!' },
        { user: 'budi_gamer', message: 'mantap streamernya ramah banget 👍' },
        { user: 'anita_style', message: 'ada warna lilac atau sage green ngga min?' },
    ];

    const fetchLiveMessages = async () => {
        if (isDemoMode) {
            setMessages(demoComments);
            setIsLive(true);
            setIsLoading(false);
            return;
        }

        try {
            const res = await fetch(`${apiUrl}/live/messages?username=${targetChannel}`);
            if (res.ok) {
                const data = await res.json();
                if (data.data) {
                    setMessages(data.data);
                    setIsLive(data.isLive !== false);
                }
            }
        } catch (e) {
            console.warn('[LiveChatFeed] Error fetching messages:', e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchLiveMessages();
        const interval = setInterval(() => {
            if (!isPaused) {
                fetchLiveMessages();
            }
        }, 3000); // Poll setiap 3 detik

        return () => clearInterval(interval);
    }, [targetChannel, isDemoMode, isPaused]);

    // Avatar color generator based on username
    const getAvatarColor = (name) => {
        const colors = [
            'bg-blue-600', 'bg-purple-600', 'bg-pink-600', 'bg-indigo-600',
            'bg-violet-600', 'bg-rose-600', 'bg-fuchsia-600', 'bg-sky-600'
        ];
        let hash = 0;
        for (let i = 0; i < (name || '').length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        return colors[Math.abs(hash) % colors.length];
    };

    return (
        <div className="px-4 py-2">
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                        <span className="relative flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                        </span>
                        <div>
                            <h4 className="font-bold text-xs text-gray-800" style={{ fontFamily: 'Plus Jakarta Sans' }}>
                                Live Chat Feed
                            </h4>
                            <p className="text-[10px] text-gray-400">
                                Target: <strong className="text-gray-700">@{targetChannel}</strong>
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                            {messages.length} komentar
                        </span>
                        <button
                            onClick={() => setIsPaused(!isPaused)}
                            className={`text-[10px] px-2 py-0.5 rounded font-semibold transition ${
                                isPaused ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            {isPaused ? '▶ Lanjut' : '⏸ Jeda'}
                        </button>
                    </div>
                </div>

                {/* Messages Container */}
                <div
                    ref={chatContainerRef}
                    className="mt-3 space-y-2 max-h-48 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-200"
                >
                    {isLoading ? (
                        <div className="py-6 text-center text-xs text-gray-400 animate-pulse">
                            Menghubungkan ke live chat @{targetChannel}...
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="py-6 text-center text-xs text-gray-400 leading-relaxed">
                            <p className="font-semibold text-gray-500">Belum ada chat live yang masuk.</p>
                            <p className="text-[11px] mt-0.5">
                                Menunggu komentar baru dari pemirsa TikTok @{targetChannel}...
                            </p>
                        </div>
                    ) : (
                        messages.slice(0, 25).map((msg, idx) => (
                            <div
                                key={idx}
                                className="flex items-start gap-2.5 p-2 rounded-xl bg-gray-50/70 hover:bg-teal-50/50 transition-colors"
                            >
                                <div
                                    className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-white text-[10px] font-bold ${getAvatarColor(
                                        msg.user || msg.uniqueId || 'u'
                                    )}`}
                                >
                                    {(msg.user || msg.uniqueId || 'U').charAt(0).toUpperCase()}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-baseline justify-between gap-1">
                                        <span className="font-bold text-[11px] text-gray-800 truncate">
                                            {msg.user || msg.uniqueId || 'Audience'}
                                        </span>
                                        <span className="text-[9px] text-gray-400 flex-shrink-0">
                                            Live
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-600 leading-snug break-words">
                                        {msg.message || msg.content || msg.comment || ''}
                                    </p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

const DashboardPage = ({
    SentimentCard,
    StatsRow,
    InsightsSection,
    MOCK_DATA,
    API_URL,
    USERNAME,
    liveChannel,
    setLiveChannel,
    isDemoMode,
    setIsDemoMode,
    setError,
    insightData,
    setInsightData,
    isLoading,
    setIsLoading
}) => {
    const [activeTab, setActiveTab] = useState('5m');
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isTriggering, setIsTriggering] = useState(false);
    const [newChannelInput, setNewChannelInput] = useState('');
    const [isChangingChannel, setIsChangingChannel] = useState(false);

    // Target TikTok channel yang diserap
    const targetChannel = (liveChannel || 'metropolitan.id').replace(/^@/, '');
    const apiTab = activeTab;

    const fetchData = async (showRefreshSpinner = false) => {
        if (showRefreshSpinner) setIsRefreshing(true);
        try {
            if (isDemoMode) {
                await new Promise(res => setTimeout(res, 250));
                setInsightData(MOCK_DATA[apiTab]);
            } else {
                // Request insight menggunakan targetChannel (TikTok Live)
                const response = await fetch(`${API_URL}/insights?username=${targetChannel}&type=${apiTab}`);
                if (!response.ok) throw new Error(`Server Error (${response.status})`);
                
                const result = await response.json();
                setInsightData(result.data); // result.data can be null if batch analysis is pending
            }
            setError(null);
        } catch (err) {
            console.warn("[DashboardPage]", err);
            if (isDemoMode) {
                setInsightData(MOCK_DATA[apiTab]);
            } else {
                setError("Gagal memperbarui data dari backend. Mencoba lagi...");
            }
        } finally {
            setIsLoading(false);
            if (showRefreshSpinner) setIsRefreshing(false);
        }
    };

    // Memicu batch Gemini AI secara langsung tanpa menunggu 5 menit
    const handleTriggerInstant = async () => {
        setIsTriggering(true);
        try {
            const res = await fetch(`${API_URL}/insights/trigger`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: targetChannel }),
            });
            const data = await res.json();
            if (res.ok && data.data) {
                setInsightData(data.data);
                setError(null);
            } else {
                setError(data.message || 'Belum cukup pesan untuk dianalisis.');
            }
        } catch (err) {
            console.warn('[Trigger Instant]', err);
            setError('Gagal memicu analisis AI instan.');
        } finally {
            setIsTriggering(false);
        }
    };

    // Mengganti channel target TikTok live yang sedang dipantau
    const handleChangeChannel = async (e) => {
        e.preventDefault();
        const clean = newChannelInput.trim().replace(/^@/, '');
        if (!clean) return;

        try {
            setIsLoading(true);
            const res = await fetch(`${API_URL}/live/connect`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ channel: clean }),
            });
            const data = await res.json();
            if (res.ok) {
                setLiveChannel(clean);
                localStorage.setItem('streamly_live_channel', clean);
                setIsChangingChannel(false);
                setNewChannelInput('');
                setInsightData(null);
            } else {
                setError(data.message || 'Gagal terhubung ke channel baru.');
            }
        } catch (err) {
            setError('Gagal menghubungkan scraper ke channel baru.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (insightData === null) {
            setIsLoading(true);
        }

        const timer = setTimeout(() => fetchData(false), 500);
        const interval = setInterval(() => fetchData(false), 12000); // Polling per 12 detik

        return () => {
            clearTimeout(timer);
            clearInterval(interval);
        };
    }, [targetChannel, apiTab, isDemoMode]);

    const handleManualRefresh = () => {
        fetchData(true);
    };

    const renderContent = () => {
        if (insightData) {
            return (
                <div className="transition-opacity duration-300 animate-fadeIn">
                    <SentimentCard data={insightData} />
                    <StatsRow data={insightData} />
                    <InsightsSection data={insightData} />
                </div>
            );
        }
        
        // Sedang menunggu batch live atau load pertama
        if (!isLoading) {
            return (
                <div className="p-4 space-y-3">
                    <div className="bg-white rounded-2xl p-5 text-center border border-dashed border-teal-300 shadow-sm">
                        <div className="w-12 h-12 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
                            <svg className="w-6 h-6 animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" />
                                <polyline points="12 6 12 12 16 14" />
                            </svg>
                        </div>
                        <h3 className="font-bold text-gray-800 text-sm mb-1" style={{ fontFamily: 'Plus Jakarta Sans' }}>
                            Menunggu Analisis AI Pertama...
                        </h3>
                        <p className="text-xs text-gray-500 mb-3 leading-relaxed">
                            Scraper sedang mengumpulkan pesan chat live dari channel <strong>@{targetChannel}</strong>.
                            Batch 5 menit otomatis dianalisis oleh Gemini saat jendela waktu terpenuhi.
                        </p>

                        <div className="flex flex-col gap-2">
                            <button
                                onClick={handleTriggerInstant}
                                disabled={isTriggering}
                                className="w-full py-2.5 px-4 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white font-bold text-xs rounded-xl transition shadow flex items-center justify-center gap-1.5 disabled:opacity-50"
                            >
                                <span>{isTriggering ? '⏳ Sedang Menganalisis dengan Gemini...' : '⚡ Jalankan Analisis AI Sekarang (Instant Batch)'}</span>
                            </button>

                            <button
                                onClick={() => {
                                    setIsDemoMode(true);
                                    localStorage.setItem("streamly_demo_mode", "true");
                                    setInsightData(MOCK_DATA[apiTab]);
                                }}
                                className="w-full py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs rounded-xl transition"
                            >
                                Tampilkan Data Simulasi (Mode Demo)
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        const message = "Mengambil data insight...";
        return (
            <div className="animate-fadeIn">
                <SentimentCard isLoading={true} loadingMessage={message} />
                <StatsRow isLoading={true} loadingMessage="Menghitung volume percakapan..." />
                <InsightsSection isLoading={true} loadingMessage="Menyiapkan rekomendasi..." />
            </div>
        );
    };

    return (
        <>
            {/* Live Channel Info Banner & Change Target */}
            <div className="px-4 pt-2">
                <div className="bg-gradient-to-r from-purple-50 via-indigo-50 to-pink-50 border border-purple-100/80 rounded-xl px-3.5 py-2 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                        <span className="font-medium text-slate-500">Live Scraper:</span>
                        <span className="font-bold text-purple-900">@{targetChannel}</span>
                    </div>
                    <button
                        onClick={() => setIsChangingChannel(!isChangingChannel)}
                        className="text-[11px] font-bold text-purple-600 hover:text-purple-800 underline"
                    >
                        {isChangingChannel ? 'Batal' : 'Ganti Target'}
                    </button>
                </div>

                {isChangingChannel && (
                    <form onSubmit={handleChangeChannel} className="mt-2 flex gap-2">
                        <input
                            type="text"
                            value={newChannelInput}
                            onChange={(e) => setNewChannelInput(e.target.value)}
                            placeholder="Username TikTok Live baru..."
                            className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-purple-300 focus:outline-none focus:ring-1 focus:ring-purple-500"
                        />
                        <button
                            type="submit"
                            className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold text-xs rounded-xl hover:from-blue-700 hover:to-purple-700 transition"
                        >
                            Hubungkan
                        </button>
                    </form>
                )}
            </div>

            {/* Real-time Live Chat Feed Component */}
            <LiveChatFeedWidget
                targetChannel={targetChannel}
                apiUrl={API_URL}
                isDemoMode={isDemoMode}
            />

            <TimeFilterBar
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                onRefresh={handleManualRefresh}
                isRefreshing={isRefreshing}
                onTriggerInstant={handleTriggerInstant}
                isTriggering={isTriggering}
            />
            {renderContent()}
        </>
    );
};

export default DashboardPage;
