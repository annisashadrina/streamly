import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';

const TIMELINE_DATA = {
  '45m': [
    { time: '0m', score: 0.60, count: 1200 },
    { time: '5m', score: 0.85, count: 4800 },
    { time: '10m', score: 0.78, count: 6200 },
    { time: '15m', score: 0.72, count: 5400 },
    { time: '20m', score: 0.75, count: 4100 },
    { time: '25m', score: 0.68, count: 3900 },
    { time: '30m', score: 0.58, count: 2800 },
    { time: '35m', score: 0.64, count: 3100 },
    { time: '40m', score: 0.69, count: 3400 },
    { time: '45m', score: 0.74, count: 4200 },
  ],
  '20m': [
    { time: '0m', score: 0.65, count: 1800 },
    { time: '5m', score: 0.72, count: 2400 },
    { time: '10m', score: 0.70, count: 2600 },
    { time: '15m', score: 0.75, count: 3100 },
    { time: '20m', score: 0.78, count: 3500 },
  ],
  '5m': [
    { time: '1m', score: 0.80, count: 850 },
    { time: '2m', score: 0.82, count: 920 },
    { time: '3m', score: 0.86, count: 1100 },
    { time: '4m', score: 0.84, count: 1050 },
    { time: '5m', score: 0.88, count: 1280 },
  ]
};

const TOP_TOPICS_BY_RANGE = {
  '45m': [
    { topic: 'harga & diskon promo', count: 480, sentiment: 'positive', percentage: 88 },
    { topic: 'cara checkout keranjang', count: 340, sentiment: 'neutral', percentage: 70 },
    { topic: 'kualitas bahan produk', count: 290, sentiment: 'positive', percentage: 60 },
    { topic: 'ongkir & estimasi tiba', count: 175, sentiment: 'neutral', percentage: 42 },
    { topic: 'gangguan audio/delay', count: 65, sentiment: 'negative', percentage: 18 },
  ],
  '20m': [
    { topic: 'diskon flash sale', count: 260, sentiment: 'positive', percentage: 85 },
    { topic: 'stok ukuran L', count: 190, sentiment: 'positive', percentage: 72 },
    { topic: 'spill produk varian merah', count: 145, sentiment: 'neutral', percentage: 55 },
  ],
  '5m': [
    { topic: 'spill keranjang kuning', count: 180, sentiment: 'positive', percentage: 92 },
    { topic: 'tanya voucher live', count: 120, sentiment: 'positive', percentage: 78 },
  ]
};

const SentimentTimeline = ({ data }) => {
  if (!data || data.length === 0) return null;

  const points = data.map((point, i) => {
    const x = (i / (data.length - 1)) * 100;
    // Normalisasi score [-1, 1] ke tinggi SVG [10, 80]
    const normalized = (point.score + 1) / 2; // [0, 1]
    const y = 85 - normalized * 70;
    return `${x},${y}`;
  }).join(' ');

  const areaPoints = `0,95 ${points} 100,95`;

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <div className="flex justify-between items-center mb-3">
        <div>
          <h3 className="font-bold text-sm text-gray-800" style={{ fontFamily: 'Plus Jakarta Sans' }}>
            Tren Sentimen Audiens
          </h3>
          <p className="text-[11px] text-gray-400">Fluktuasi reaksi positif/negatif per menit</p>
        </div>
        <span className="text-xs font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full">
          +14% vs Rata-rata
        </span>
      </div>

      <div className="h-36 w-full relative pt-2">
        <svg viewBox="0 0 100 95" preserveAspectRatio="none" className="w-full h-full overflow-visible">
          <defs>
            <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#00C9B1" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#00C9B1" stopOpacity="0.0" />
            </linearGradient>
          </defs>
          <polygon points={areaPoints} fill="url(#areaGrad)" />
          <polyline points={points} fill="none" stroke="#00C9B1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      <div className="flex justify-between text-[11px] text-gray-400 font-medium pt-2 border-t border-gray-50 mt-1">
        <span>{data[0]?.time || 'Start'}</span>
        <span>Tengah Sesi</span>
        <span>{data[data.length - 1]?.time || 'End'}</span>
      </div>
    </div>
  );
};

const AnalyticsPage = () => {
  const context = useOutletContext() || {};
  const username = context.username || localStorage.getItem("streamly_username") || 'streamer';
  const [activeWindow, setActiveWindow] = useState('45m');

  const currentTimeline = TIMELINE_DATA[activeWindow] || TIMELINE_DATA['45m'];
  const currentTopics = TOP_TOPICS_BY_RANGE[activeWindow] || TOP_TOPICS_BY_RANGE['45m'];

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800" style={{ fontFamily: 'Plus Jakarta Sans' }}>
          Analitik Sesi Live
        </h1>
        <p className="text-xs text-gray-500">
          Laporan performa & keterlibatan penonton @{username}
        </p>
      </div>

      {/* Window Filter Tabs */}
      <div className="bg-gray-100 p-1 rounded-xl flex gap-1">
        {[
          { key: '5m', label: 'Jendela 5m' },
          { key: '20m', label: 'Jendela 20m' },
          { key: '45m', label: 'Full 45m Sesi' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveWindow(tab.key)}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeWindow === tab.key
                ? 'bg-white text-gray-800 shadow-sm'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Skor Kepuasan</p>
          <div className="flex items-baseline gap-1 my-1">
            <span className="text-2xl font-extrabold text-teal-600" style={{ fontFamily: 'Plus Jakarta Sans' }}>
              78%
            </span>
            <span className="text-xs text-teal-600 font-bold">Positif</span>
          </div>
          <p className="text-[10px] text-gray-400">Tinggi saat demo voucher</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Total Chat Masuk</p>
          <div className="flex items-baseline gap-1 my-1">
            <span className="text-2xl font-extrabold text-gray-800" style={{ fontFamily: 'Plus Jakarta Sans' }}>
              39.2k
            </span>
          </div>
          <p className="text-[10px] text-gray-400">~870 komentar/menit</p>
        </div>
      </div>

      {/* Sentiment Distribution Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-2">
        <div className="flex justify-between items-center text-xs font-bold">
          <span className="text-gray-700">Proporsi Vibe Audiens</span>
          <span className="text-teal-600">76% Senang</span>
        </div>
        <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden flex">
          <div style={{ width: '76%' }} className="bg-teal-500" title="Positif: 76%"></div>
          <div style={{ width: '16%' }} className="bg-amber-400" title="Netral: 16%"></div>
          <div style={{ width: '8%' }} className="bg-red-400" title="Negatif: 8%"></div>
        </div>
        <div className="flex justify-between text-[10px] font-medium text-gray-500 pt-1">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-teal-500 inline-block"></span> Positif (76%)</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block"></span> Tanya/Netral (16%)</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400 inline-block"></span> Keluhan (8%)</span>
        </div>
      </div>

      {/* Line Chart */}
      <SentimentTimeline data={currentTimeline} />

      {/* Top Discussed Topics */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-3">
        <h3 className="font-bold text-sm text-gray-800" style={{ fontFamily: 'Plus Jakarta Sans' }}>
          Topik Paling Banyak Ditanyakan
        </h3>
        <div className="space-y-3">
          {currentTopics.map((item, idx) => (
            <div key={idx} className="space-y-1">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-gray-700">
                  {idx + 1}. {item.topic}
                </span>
                <span className="font-semibold text-gray-500 text-[11px]">
                  {item.count} chat
                </span>
              </div>
              <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    item.sentiment === 'positive' ? 'bg-teal-500' :
                    item.sentiment === 'negative' ? 'bg-red-400' : 'bg-sky-400'
                  }`}
                  style={{ width: `${item.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Audit & Health Report Takeaway */}
      <div className="bg-gradient-to-br from-teal-500 to-cyan-600 rounded-2xl p-5 text-white shadow-md space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">📊</span>
          <h4 className="font-bold text-sm" style={{ fontFamily: 'Plus Jakarta Sans' }}>
            Rekomendasi Strategis Streamly
          </h4>
        </div>
        <p className="text-xs text-teal-50 leading-relaxed">
          Audiens menunjukkan minat beli tertinggi saat demonstrasi kode promo di menit ke-15 hingga 25. Pertahankan retensi dengan mengumumkan kuota voucher secara berkala setiap 10 menit.
        </p>
      </div>
    </div>
  );
};

export default AnalyticsPage;
