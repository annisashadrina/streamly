import React, { useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const LoginPage = ({ onLoginSuccess }) => {
    const [username, setUsername] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [streamOffline, setStreamOffline] = useState(false);

    const cleanUsername = (name) => name.trim().replace(/^@/, '');

    const handleSubmit = async (e) => {
        e.preventDefault();
        const targetUser = cleanUsername(username);

        if (!targetUser) {
            setError('TikTok username tidak boleh kosong.');
            return;
        }

        setIsLoading(true);
        setError('');
        setStreamOffline(false);

        try {
            const response = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: targetUser }),
            });

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                if (response.status === 500 && (data.message?.toLowerCase().includes('offline') || data.message?.toLowerCase().includes('connect'))) {
                    setStreamOffline(true);
                    throw new Error(`@${targetUser} sedang tidak live atau tidak dapat diakses.`);
                }
                throw new Error(data.message || `Server merespons dengan status: ${response.status}`);
            }

            // Sukses terhubung ke live stream nyata
            onLoginSuccess(targetUser, false);

        } catch (err) {
            console.warn("[Login]", err);
            const isNetworkError = err.message === 'Failed to fetch' || err.name === 'TypeError';
            if (isNetworkError) {
                setError('Backend server (http://localhost:3000) belum berjalan atau tidak terjangkau. Jalankan backend atau masuk via Mode Demo.');
            } else {
                setError(err.message || 'Gagal terhubung ke backend server. Pastikan backend aktif.');
            }
            setIsLoading(false);
        }
    };

    const handleDemoLogin = (customName) => {
        const demoUser = cleanUsername(customName || username) || 'streamly_creator';
        onLoginSuccess(demoUser, true);
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-[#F7F9FB] p-4 text-[#1A1D2E]">
            <div className="w-full max-w-sm">
                {/* Logo & Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-teal-500 to-cyan-400 text-white shadow-lg mb-3">
                        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polygon points="5 3 19 12 5 21 5 3"></polygon>
                        </svg>
                    </div>
                    <h1 className="text-3xl font-extrabold tracking-tight" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                        Streamly <span className="text-teal-500 text-sm align-super font-bold">v3</span>
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">Intelligent Live Streaming Co-Pilot</p>
                </div>

                {/* Form Card */}
                <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-xl border border-gray-100" style={{ boxShadow: 'var(--shadow-card)' }}>
                    <form onSubmit={handleSubmit}>
                        <div className="mb-4">
                            <label htmlFor="username" className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                                Akun TikTok Streamer
                            </label>
                            <div className="relative">
                                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-bold">@</span>
                                <input
                                    id="username"
                                    type="text"
                                    value={username}
                                    onChange={(e) => {
                                        setUsername(e.target.value);
                                        setError('');
                                        setStreamOffline(false);
                                    }}
                                    placeholder="khabylame atau akun live"
                                    className="w-full pl-8 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition text-sm font-medium"
                                    disabled={isLoading}
                                    autoFocus
                                />
                            </div>
                        </div>

                        {/* Error Notification */}
                        {error && (
                            <div className="p-3 mb-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-600 leading-relaxed space-y-2">
                                <div>
                                    <p className="font-semibold">⚠️ Terjadi Kendala:</p>
                                    <p>{error}</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => handleDemoLogin(username)}
                                    className="w-full py-2 px-3 bg-red-100 hover:bg-red-200 text-red-800 font-bold rounded-lg text-xs transition flex items-center justify-center gap-1.5"
                                >
                                    <span>Lanjut Masuk via Mode Demo untuk @{cleanUsername(username) || 'detik.com'}</span>
                                    <span>→</span>
                                </button>
                            </div>
                        )}

                        {/* Tombol Start Analysis Nyata */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white font-bold py-3 px-4 rounded-xl shadow-md transition-all transform active:scale-98 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <span>Menghubungkan ke TikTok Live...</span>
                                </>
                            ) : (
                                <span>Mulai Analisis Live</span>
                            )}
                        </button>
                    </form>

                    <div className="relative my-5">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-200"></div>
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-white px-2 text-gray-400 font-semibold">atau simulasi</span>
                        </div>
                    </div>

                    {/* Tombol Demo Mode */}
                    <button
                        type="button"
                        onClick={() => handleDemoLogin(username)}
                        disabled={isLoading}
                        className="w-full bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 font-bold py-2.5 px-4 rounded-xl text-xs transition flex items-center justify-center gap-2"
                    >
                        <span>✨ Masuk Mode Demo (Data Simulasi)</span>
                    </button>
                </div>

                {/* Footer Info */}
                <div className="text-center mt-6 text-xs text-gray-400 space-y-1">
                    <p>API Endpoint: <span className="font-mono text-gray-500">{API_URL}</span></p>
                    <p>Mendukung analisis multi-jendela: 5m · 20m · 45m</p>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
