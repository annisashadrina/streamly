import React, { useState, useEffect } from 'react';

const TimeFilterBar = ({ activeTab, setActiveTab, onRefresh, isRefreshing }) => {
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
            className="absolute top-1 bottom-1 w-1/3 bg-teal-500 rounded-full shadow-sm transition-transform duration-300 ease-out"
            style={{ transform: `translateX(${activeIndex * 100}%)` }}
          />
        </div>

        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            title="Refresh Data"
            className="p-2.5 rounded-full bg-white border border-gray-200 text-gray-500 hover:text-teal-600 hover:border-teal-500 transition shadow-sm disabled:opacity-50"
          >
            <svg
              className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-teal-500' : ''}`}
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

const DashboardPage = ({
    SentimentCard,
    StatsRow,
    InsightsSection,
    MOCK_DATA,
    API_URL,
    USERNAME,
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

    const apiTab = activeTab;

    const fetchData = async (showRefreshSpinner = false) => {
        if (showRefreshSpinner) setIsRefreshing(true);
        try {
            if (isDemoMode) {
                await new Promise(res => setTimeout(res, 250));
                setInsightData(MOCK_DATA[apiTab]);
            } else {
                const response = await fetch(`${API_URL}/insights?username=${USERNAME}&type=${apiTab}`);
                if (!response.ok) throw new Error(`Server Error (${response.status})`);
                
                const result = await response.json();
                setInsightData(result.data); // result.data can be null if analysis is pending
            }
            setError(null);
        } catch (err) {
            console.warn("[DashboardPage]", err);
            // In demo mode or if failed, provide fallback gracefully
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

    useEffect(() => {
        if (insightData === null) {
            setIsLoading(true);
        }

        const timer = setTimeout(() => fetchData(false), 500);
        const interval = setInterval(() => fetchData(false), 15000); // Polling per 15 detik

        return () => {
            clearTimeout(timer);
            clearInterval(interval);
        };
    }, [USERNAME, apiTab, isDemoMode]);

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
                <div className="p-4 space-y-4">
                    <div className="bg-white rounded-2xl p-6 text-center border border-dashed border-teal-300 shadow-sm">
                        <div className="w-12 h-12 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
                            <svg className="w-6 h-6 animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" />
                                <polyline points="12 6 12 12 16 14" />
                            </svg>
                        </div>
                        <h3 className="font-bold text-gray-800 text-sm mb-1" style={{ fontFamily: 'Plus Jakarta Sans' }}>
                            Menunggu Analisis Pertama...
                        </h3>
                        <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                            Scraper sedang mengumpulkan pesan chat live dari <strong>@{USERNAME}</strong>. Batch 5 menit akan diproses oleh Gemini saat jendela waktu terpenuhi.
                        </p>
                        <button
                            onClick={() => {
                                setIsDemoMode(true);
                                localStorage.setItem("streamly_demo_mode", "true");
                                setInsightData(MOCK_DATA[apiTab]);
                            }}
                            className="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white font-bold text-xs rounded-xl transition shadow"
                        >
                            Tampilkan Data Contoh Simulasi (Demo)
                        </button>
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
            <TimeFilterBar
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                onRefresh={handleManualRefresh}
                isRefreshing={isRefreshing}
            />
            {renderContent()}
        </>
    );
};

export default DashboardPage;
