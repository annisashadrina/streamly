import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';

const AccountPage = () => {
    const { handleLogout, isDemoMode, setIsDemoMode, username, user, API_URL } = useOutletContext();
    const [backendStatus, setBackendStatus] = useState('checking'); // 'online' | 'offline' | 'checking'
    const [userCount, setUserCount] = useState(5);

    const currentUser = user || (() => {
        try {
            const raw = localStorage.getItem('streamly_user');
            return raw ? JSON.parse(raw) : null;
        } catch (e) {
            return null;
        }
    })() || {
        id: 1,
        username: username || 'streamer',
        fullName: username || 'Streamly Creator',
        email: `${username || 'streamer'}@streamly.id`,
        role: 'streamer'
    };

    const apiUrl = API_URL || import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

    useEffect(() => {
        let isMounted = true;
        const checkBackend = async () => {
            try {
                const res = await fetch(`${apiUrl}/auth/users`);
                if (res.ok) {
                    const json = await res.json();
                    if (isMounted) {
                        setBackendStatus('online');
                        if (json.data) setUserCount(json.data.length);
                    }
                } else {
                    if (isMounted) setBackendStatus('offline');
                }
            } catch (e) {
                if (isMounted) setBackendStatus('offline');
            }
        };

        checkBackend();
        return () => { isMounted = false; };
    }, [apiUrl]);

    const handleToggleMode = () => {
        const nextMode = !isDemoMode;
        setIsDemoMode(nextMode);
        localStorage.setItem("streamly_demo_mode", nextMode ? "true" : "false");
    };

    return (
        <div className="p-4 space-y-4">
            {/* Page Title */}
            <div>
                <h1 className="text-2xl font-bold text-gray-800" style={{ fontFamily: 'Plus Jakarta Sans' }}>
                    Profil & Sistem
                </h1>
                <p className="text-xs text-gray-500">
                    Detail autentikasi akun database MySQL dan arsitektur backend Streamly
                </p>
            </div>

            {/* Profile Card */}
            <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-tr from-teal-400 to-cyan-500 rounded-2xl flex items-center justify-center text-white text-xl font-extrabold shadow-md">
                    {(currentUser.fullName || currentUser.username).charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 overflow-hidden">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200/50">
                            {currentUser.role ? currentUser.role.replace('_', ' ') : 'Streamer'}
                        </span>
                        <span className="text-[10px] font-mono text-gray-400">UID #{currentUser.id}</span>
                    </div>
                    <h2 className="text-base font-bold text-gray-800 truncate mt-1" style={{ fontFamily: 'Plus Jakarta Sans' }}>
                        {currentUser.fullName}
                    </h2>
                    <p className="text-xs text-gray-500 truncate">@{currentUser.username} · {currentUser.email}</p>
                    <div className="flex items-center gap-1.5 mt-1.5">
                        <span className={`w-2 h-2 rounded-full ${isDemoMode ? 'bg-amber-400' : 'bg-emerald-500 animate-pulse'}`}></span>
                        <span className="text-[11px] font-semibold text-gray-600">
                            {isDemoMode ? 'Mode Simulasi (Demo)' : 'Database Auth & Live Sync Aktif'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Mode Switch Card */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-2">
                <div className="flex justify-between items-center">
                    <div>
                        <h3 className="text-sm font-bold text-gray-800">Mode Simulasi (Demo)</h3>
                        <p className="text-xs text-gray-500">Menampilkan visualisasi data insight jika live TikTok sedang offline</p>
                    </div>
                    <button
                        onClick={handleToggleMode}
                        className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
                            isDemoMode ? 'bg-teal-500 justify-end' : 'bg-gray-300 justify-start'
                        }`}
                    >
                        <div className="bg-white w-4 h-4 rounded-full shadow-md transform transition-transform"></div>
                    </button>
                </div>
            </div>

            {/* Connection & Technical Details */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Status Arsitektur Sistem</h3>

                <div className="space-y-2.5 text-xs">
                    <div className="flex justify-between items-center py-1 border-b border-gray-50">
                        <span className="text-gray-500">Backend API</span>
                        <div className="flex items-center gap-1.5">
                            <span className={`w-2 h-2 rounded-full ${
                                backendStatus === 'online' ? 'bg-emerald-500' :
                                backendStatus === 'offline' ? 'bg-red-400' : 'bg-amber-400 animate-pulse'
                            }`}></span>
                            <span className="font-semibold text-gray-700 font-mono text-[11px]">
                                {backendStatus === 'online' ? 'Terhubung (Express Port 3000)' :
                                 backendStatus === 'offline' ? 'Offline' : 'Memeriksa...'}
                            </span>
                        </div>
                    </div>

                    <div className="flex justify-between items-center py-1 border-b border-gray-50">
                        <span className="text-gray-500">Basis Data MySQL</span>
                        <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                            <span className="font-bold text-emerald-700">streamly_db ({userCount} Akun Terdaftar)</span>
                        </div>
                    </div>

                    <div className="flex justify-between items-center py-1 border-b border-gray-50">
                        <span className="text-gray-500">Cache & Message Broker</span>
                        <span className="font-bold text-gray-700">Redis (Port 6379)</span>
                    </div>

                    <div className="flex justify-between items-center py-1 border-b border-gray-50">
                        <span className="text-gray-500">Arsitektur Analisis</span>
                        <span className="font-bold text-gray-700">v3 Hierarchical (5m · 20m · 45m)</span>
                    </div>

                    <div className="flex justify-between items-center py-1">
                        <span className="text-gray-500">AI Synthesizer</span>
                        <span className="font-bold text-teal-600">Gemini 1.5 Flash</span>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="pt-2">
                <button
                    onClick={handleLogout}
                    className="w-full bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 font-bold py-3 px-4 rounded-xl text-xs transition flex items-center justify-center gap-2"
                >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                        <polyline points="16 17 21 12 16 7"></polyline>
                        <line x1="21" y1="12" x2="9" y2="12"></line>
                    </svg>
                    <span>Ganti Akun / Keluar (Logout)</span>
                </button>
            </div>
        </div>
    );
};

export default AccountPage;
