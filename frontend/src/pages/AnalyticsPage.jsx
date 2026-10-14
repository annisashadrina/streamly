import React from 'react';

// --- Mock Data for Analytics ---
const MOCK_ANALYTICS = {
  sentiment_over_time: [
    { time: '0m', score: 0.6 },
    { time: '5m', score: 0.85 },
    { time: '10m', score: 0.75 },
    { time: '15m', score: 0.70 },
    { time: '20m', score: 0.72 },
    { time: '25m', score: 0.65 },
    { time: '30m', score: 0.5 },
    { time: '35m', score: 0.61 },
    { time: '40m', score: 0.55 },
    { time: '45m', score: 0.61 },
  ],
  top_topics: [
    { topic: 'new feature', count: 125 },
    { topic: 'tutorial', count: 98 },
    { topic: 'price', count: 76 },
    { topic: 'so cool!', count: 65 },
    { topic: 'audio issue', count: 21 },
  ],
};

// --- Analytics Components ---

const SentimentChart = ({ data }) => {
  // Create an SVG path for the line chart
  const points = data.map((point, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = (1 - (point.score + 1) / 2) * 100; // Normalize score from [-1, 1] to [0, 1] then invert for SVG
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="w-full bg-white rounded-xl shadow-md p-4">
      <h3 className="font-bold text-gray-800 mb-4">Sentiment Over Time</h3>
      <div className="h-40">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
          <path d={`M ${points}`} fill="none" stroke="#00C9B1" strokeWidth="2" />
        </svg>
      </div>
       <div className="flex justify-between text-xs text-gray-400 mt-1">
        <span>Start</span>
        <span>End</span>
      </div>
    </div>
  );
};

const TopTopicsList = ({ data }) => (
  <div className="w-full bg-white rounded-xl shadow-md p-4">
    <h3 className="font-bold text-gray-800 mb-4">Most Discussed Topics</h3>
    <ul className="space-y-3">
      {data.map(({ topic, count }, index) => (
        <li key={topic} className="flex justify-between items-center text-sm">
          <span className="font-semibold text-gray-700">{index + 1}. {topic}</span>
          <span className="font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">{count}</span>
        </li>
      ))}
    </ul>
  </div>
);


const AnalyticsPage = () => {
  // In a real app, this data would be fetched from an API
  const { sentiment_over_time, top_topics } = MOCK_ANALYTICS;

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold text-gray-800" style={{ fontFamily: 'Plus Jakarta Sans' }}>
        Post-Stream Analytics
      </h1>
      <p className="text-sm text-gray-500 -mt-4">
        This is a demo of post-stream analytics. Currently using mock data.
      </p>
      
      <SentimentChart data={sentiment_over_time} />
      <TopTopicsList data={top_topics} />
    </div>
  );
};

export default AnalyticsPage;
