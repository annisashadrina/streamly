import React, { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';

const API_URL = import.meta.env.VITE_API_URL;
const USERNAME = localStorage.getItem("streamly_username");

const InsightCard = ({ insight }) => {
    if (!insight) return null;

    const timeAgo = formatDistanceToNow(new Date(insight.created_at), { addSuffix: true });

    return (
        <div className="bg-white rounded-xl p-4 shadow-md transition-transform hover:-translate-y-0.5">
            <div className="flex justify-between items-center mb-2">
                <span className={`text-sm font-bold px-2 py-1 rounded-full ${
                    insight.batch_type === '5m' ? 'bg-teal-100 text-teal-600' :
                    insight.batch_type === '20m' ? 'bg-sky-100 text-sky-600' :
                    'bg-indigo-100 text-indigo-600'
                }`}>
                    {insight.batch_type} analysis
                </span>
                <span className="text-xs text-gray-500">{timeAgo}</span>
            </div>
            <p className="font-semibold text-gray-800 mb-1">{insight.actionable_insight}</p>
            <p className="text-sm text-gray-600">{insight.summary}</p>
        </div>
    );
};

const InsightsPage = () => {
    const [insights, setInsights] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchInsights = async () => {
            setIsLoading(true);
            try {
                const response = await fetch(`${API_URL}/insights?username=${USERNAME}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch insights.');
                }
                const result = await response.json();
                
                // The API returns an object with keys '5m', '20m', '45m'.
                // We convert this object into a sorted array.
                const insightsArray = Object.values(result.data)
                    .filter(insight => insight !== null) // Filter out null values
                    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at)); // Sort newest first

                setInsights(insightsArray);
                setError('');
            } catch (err) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchInsights();
    }, []);

    if (isLoading) {
        return (
            <div className="p-4">
                <h1 className="text-2xl font-bold text-gray-800 mb-4" style={{ fontFamily: 'Plus Jakarta Sans' }}>All Insights</h1>
                <div className="space-y-4">
                    <div className="bg-gray-200 h-24 rounded-lg animate-pulse w-full"></div>
                    <div className="bg-gray-200 h-24 rounded-lg animate-pulse w-full"></div>
                    <div className="bg-gray-200 h-24 rounded-lg animate-pulse w-full"></div>
                </div>
            </div>
        );
    }

    if (error) {
        return <div className="p-4 text-center text-red-500">{error}</div>;
    }

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold text-gray-800 mb-4" style={{ fontFamily: 'Plus Jakarta Sans' }}>All Insights</h1>
            {insights.length > 0 ? (
                <div className="space-y-4">
                    {insights.map(insight => <InsightCard key={insight.id} insight={insight} />)}
                </div>
            ) : (
                <p className="text-center text-gray-500 mt-8">No insights have been generated yet.</p>
            )}
        </div>
    );
};

export default InsightsPage;
