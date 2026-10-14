import React, { useState, useEffect, useMemo } from 'react';

// NOTE: Most of these components are defined within StreamlyApp.jsx in the original single-file structure.
// For a multi-page app, these should be extracted into their own files (e.g., in a 'components' directory).
// To keep this step simple, we're assuming they are passed as props or we're redefining them here.

// --- UI COMPONENTS (redefined for DashboardPage) ---

const TimeFilterBar = ({ activeTab, setActiveTab }) => {
    const tabs = ['5m', '20m', '45m'];
    const activeIndex = tabs.findIndex(t => t === activeTab);

    return (
      <div className="p-4">
        <div className="bg-gray-100 rounded-full p-1 flex relative">
          {tabs.map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} className="flex-1 py-2 text-center text-sm font-bold z-10 transition-colors duration-300">
              {tab}
            </button>
          ))}
          <div
            className="absolute top-1 bottom-1 w-1/3 bg-teal-500 rounded-full shadow-md transition-transform duration-300 ease-out"
            style={{ transform: `translateX(${activeIndex * 100}%)` }}
          />
        </div>
      </div>
    );
};

// --- Main Dashboard Page Component ---

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

    // activeTab now directly corresponds to the API 'type' parameter
    const apiTab = activeTab;

    useEffect(() => {
        // Set loading to true only for the very first fetch
        if (insightData === null) {
            setIsLoading(true);
        }

        const fetchData = async () => {
            try {
                if (isDemoMode) {
                    await new Promise(res => setTimeout(res, 400));
                    setInsightData(MOCK_DATA[apiTab]);
                } else {
                    const response = await fetch(`${API_URL}/insights?username=${USERNAME}&type=${apiTab}`);
                    if (!response.ok) throw new Error(`Server Error (${response.status})`);
                    
                    const result = await response.json();
                    setInsightData(result.data); // result.data can be null if analysis is pending
                }
                setError(null);
            } catch (err) {
                setError("Failed to fetch data. Retrying...");
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };

        const timer = setTimeout(fetchData, 1000); // Initial delay to allow user to see the skeleton
        const interval = setInterval(fetchData, 15000); // Poll every 15 seconds

        return () => {
            clearTimeout(timer);
            clearInterval(interval);
        }
    }, [USERNAME, apiTab, isDemoMode]);

    // Conditional rendering logic
    const renderContent = () => {
        // Data is available, show the real dashboard
        if (insightData) {
            return (
                <div className="transition-opacity duration-300 animate-fadeIn">
                    <SentimentCard data={insightData} />
                    <StatsRow data={insightData} />
                    <InsightsSection data={insightData} />
                </div>
            );
        }
        
        // Initial load or analysis pending, show skeletons with messages
        const message = isLoading ? "Fetching initial data..." : "Awaiting first analysis...";
        return (
            <div className="animate-fadeIn">
                <SentimentCard isLoading={true} loadingMessage={message} />
                <StatsRow isLoading={true} loadingMessage="Processing volume..." />
                <InsightsSection isLoading={true} loadingMessage="Generating insights..." />
            </div>
        );
    };

    return (
        <>
            <TimeFilterBar activeTab={activeTab} setActiveTab={setActiveTab} />
            {renderContent()}
        </>
    );
};

export default DashboardPage;
