import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

const TrendIcon = ({ trend }) => {
    if (trend === 'rising') {
        return (
            <span className="inline-flex items-center text-xs font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full">
                <svg className="w-3 h-3 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="18 15 12 9 6 15"></polyline></svg>
                Rising
            </span>
        );
    }
    if (trend === 'falling') {
        return (
            <span className="inline-flex items-center text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                <svg className="w-3 h-3 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"></polyline></svg>
                Falling
            </span>
        );
    }
    return (
        <span className="inline-flex items-center text-xs font-bold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full">
            <svg className="w-3 h-3 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            Stable
        </span>
    );
};

const InsightCard = ({ insight }) => {
    if (!insight) return null;

    let timeAgo = 'Baru saja';
    try {
        if (insight.created_at) {
            timeAgo = formatDistanceToNow(new Date(insight.created_at), { addSuffix: true });
        }
    } catch (e) {
        timeAgo = 'Baru saja';
    }

    const sentimentPercent = typeof insight.sentiment_score === 'number'
        ? Math.round(insight.sentiment_score * 100)
        : null;

    return (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 transition-all hover:shadow-md space-y-3">
            {/* Header Card */}
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                        insight.batch_type === '5m' ? 'bg-teal-50 text-teal-600 border border-teal-200' :
                        insight.batch_type === '20m' ? 'bg-sky-50 text-sky-600 border border-sky-200' :
                        'bg-indigo-50 text-indigo-600 border border-indigo-200'
                    }`}>
                        Jendela {insight.batch_type}
                    </span>
                    {insight.sentiment_trend && <TrendIcon trend={insight.sentiment_trend} />}
                </div>
                <span className="text-[11px] text-gray-400 font-medium">{timeAgo}</span>
            </div>

            {/* Actionable Insight Box */}
            <div className="bg-amber-50/70 border border-amber-200/70 rounded-xl p-3">
                <div className="flex items-start gap-2">
                    <span className="text-amber-500 text-sm mt-0.5">💡</span>
                    <div>
                        <p className="text-xs font-bold text-amber-900 mb-0.5">Rekomendasi Tindakan:</p>
                        <p className="text-xs text-amber-800 leading-relaxed font-medium">
                            {insight.actionable_insight || 'Belum ada rekomendasi spesifik.'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Summary */}
            <p className="text-xs text-gray-600 leading-relaxed">
                {insight.summary}
            </p>

            {/* Topics & Sentiment Footer */}
            <div className="pt-2 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap gap-1">
                    {insight.emerging_topics && insight.emerging_topics.slice(0, 3).map((topic, i) => (
                        <span key={i} className="text-[10px] font-semibold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md">
                            #{topic}
                        </span>
                    ))}
                </div>

                {sentimentPercent !== null && (
                    <span className="text-xs font-bold text-gray-700">
                        Sentimen: <span className="text-teal-600">{sentimentPercent}%</span>
                    </span>
                )}
            </div>
        </div>
    );
};

const InsightsPage = () => {
    const context = useOutletContext() || {};
    const isDemoMode = context.isDemoMode;
    const API_URL = context.API_URL || import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
    const USERNAME = context.username || localStorage.getItem("streamly_username") || 'streamly_creator';
    const MOCK_DATA = context.MOCK_DATA;

    const [insights, setInsights] = useState([]);
    const [filterType, setFilterType] = useState('all');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    const loadInsights = async () => {
        setIsLoading(true);
        setError('');

        if (isDemoMode && MOCK_DATA) {
            await new Promise(r => setTimeout(r, 200));
            const mockList = Object.values(MOCK_DATA);
            setInsights(mockList);
            setIsLoading(false);
            return;
        }

        try {
            const response = await fetch(`${API_URL}/insights?username=${USERNAME}`);
            if (!response.ok) {
                throw new Error(`Gagal memuat insight (${response.status})`);
            }
            const result = await response.json();
            
            const rawData = result.data || {};
            const insightsArray = Object.values(rawData)
                .filter(item => item !== null && typeof item === 'object')
                .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

            if (insightsArray.length === 0 && MOCK_DATA) {
                // Jika live belum ada data, tampilkan mock data dengan keterangan
                setInsights(Object.values(MOCK_DATA));
            } else {
                setInsights(insightsArray);
            }
        } catch (err) {
            console.warn("[InsightsPage]", err);
            // Fallback ke mock data jika API offline
            if (MOCK_DATA) {
                setInsights(Object.values(MOCK_DATA));
            } else {
                setError(err.message || 'Tidak dapat memuat insight.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadInsights();
    }, [isDemoMode, USERNAME]);

    const filteredInsights = insights.filter(item => {
        if (filterType === 'all') return true;
        return item.batch_type === filterType;
    });

    return (
        <div className="p-4 space-y-4">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800" style={{ fontFamily: 'Plus Jakarta Sans' }}>
                        Histori Insights
                    </h1>
                    <p className="text-xs text-gray-500">
                        Kompilasi ringkasan cerdas Gemini AI
                    </p>
                </div>
                <button
                    onClick={loadInsights}
                    disabled={isLoading}
                    className="p-2 rounded-xl bg-white border border-gray-200 text-gray-500 hover:text-teal-600 shadow-sm transition"
                    title="Segarkan data"
                >
                    <svg className={`w-4 h-4 ${isLoading ? 'animate-spin text-teal-500' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
                    </svg>
                </button>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 pb-1 overflow-x-auto">
                {['all', '5m', '20m', '45m'].map((type) => (
                    <button
                        key={type}
                        onClick={() => setFilterType(type)}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                            filterType === type
                                ? 'bg-teal-500 text-white shadow-sm'
                                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                    >
                        {type === 'all' ? 'Semua Jendela' : `Batch ${type}`}
                    </button>
                ))}
            </div>

            {/* Content List */}
            {isLoading ? (
                <div className="space-y-3">
                    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm animate-pulse h-36"></div>
                    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm animate-pulse h-36"></div>
                </div>
            ) : error ? (
                <div className="p-4 rounded-xl bg-red-50 text-red-600 text-xs text-center border border-red-200">
                    {error}
                </div>
            ) : filteredInsights.length > 0 ? (
                <div className="space-y-3">
                    {filteredInsights.map((insight, idx) => (
                        <InsightCard key={insight.id || `${insight.batch_type}-${idx}`} insight={insight} />
                    ))}
                </div>
            ) : (
                <div className="bg-white rounded-2xl p-8 text-center border border-gray-200 shadow-sm">
                    <p className="text-gray-400 text-sm">Belum ada laporan untuk filter ini.</p>
                </div>
            )}
        </div>
    );
};

export default InsightsPage;
