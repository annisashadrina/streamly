import React, { useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const LoginPage = ({ onLoginSuccess }) => {
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [tiktokTarget, setTiktokTarget] = useState('metropolitan.id');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const cleanUsername = (name) => (name || '').trim().replace(/^@/, '');

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        const targetId = cleanUsername(identifier);

        if (!targetId) {
            setError('Silakan masukkan Username atau Email Anda.');
            return;
        }

        if (!password) {
            setError('Silakan masukkan Kata Sandi Anda.');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    usernameOrEmail: targetId,
                    password: password,
                    tiktokUsername: cleanUsername(tiktokTarget) || targetId
                }),
            });

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(data.message || `Gagal login (Status: ${response.status})`);
            }

            // Simpan profil pengguna dan token
            const userProfile = data.user || {
                id: 1,
                username: targetId,
                email: `${targetId}@streamly.id`,
                fullName: targetId,
                role: 'streamer'
            };

            const liveTarget = data.tiktokUsername || cleanUsername(tiktokTarget) || targetId;

            if (data.token) {
                localStorage.setItem('streamly_token', data.token);
            }
            localStorage.setItem('streamly_user', JSON.stringify(userProfile));
            localStorage.setItem('streamly_live_channel', liveTarget);

            // Callback sukses login
            onLoginSuccess(userProfile.username, false, userProfile, liveTarget);

        } catch (err) {
            console.warn('[Login Error]', err);
            const isNetworkError = err.message === 'Failed to fetch' || err.name === 'TypeError';
            if (isNetworkError) {
                setError('Tidak dapat terhubung ke server backend (port 3000). Silakan pastikan server backend aktif atau gunakan Mode Demo.');
            } else {
                setError(err.message || 'Kredensial tidak valid. Silakan periksa kembali username dan kata sandi Anda.');
            }
            setIsLoading(false);
        }
    };

    const handleDemoLogin = () => {
        const demoUser = cleanUsername(identifier) || 'streamly_creator';
        const demoProfile = {
            id: 99,
            username: demoUser,
            email: `${demoUser}@demo.streamly.id`,
            fullName: 'Demo Creator',
            role: 'streamer'
        };
        const liveTarget = cleanUsername(tiktokTarget) || 'metropolitan.id';
        localStorage.setItem('streamly_user', JSON.stringify(demoProfile));
        localStorage.setItem('streamly_live_channel', liveTarget);
        onLoginSuccess(demoUser, true, demoProfile, liveTarget);
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-100 via-slate-50 to-indigo-50/30 flex flex-col justify-center items-center p-4 selection:bg-purple-600 selection:text-white">
            <div className="w-full max-w-sm sm:max-w-md">
                
                {/* Brand Logo & Header */}
                <div className="text-center mb-6">
                    <div className="inline-block mb-1 group">
                        <img 
                            src="/streamly-icon.png" 
                            alt="Streamly" 
                            className="w-20 h-20 sm:w-24 sm:h-24 object-contain mx-auto filter drop-shadow-[0_8px_16px_rgba(99,102,241,0.25)] transform transition-transform duration-300 group-hover:scale-105"
                        />
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                        Streamly
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                        Live Stream Analytics & Audience Intelligence
                    </p>
                </div>

                {/* Login Card */}
                <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/70 border border-slate-200/80">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        
                        {/* Username or Email Input */}
                        <div>
                            <label htmlFor="identifier" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                Username / Email
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                        <circle cx="12" cy="7" r="4"></circle>
                                    </svg>
                                </div>
                                <input
                                    id="identifier"
                                    type="text"
                                    value={identifier}
                                    onChange={(e) => {
                                        setIdentifier(e.target.value);
                                        setError('');
                                    }}
                                    placeholder="Contoh: aryo_streamer"
                                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50/60 text-slate-900 text-sm font-medium rounded-xl border border-slate-200 focus:bg-white focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/15 transition duration-150 placeholder:text-slate-400"
                                    disabled={isLoading}
                                    autoComplete="username"
                                />
                            </div>
                        </div>

                        {/* Password Input */}
                        <div>
                            <label htmlFor="password" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                Kata Sandi
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                                    </svg>
                                </div>
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => {
                                        setPassword(e.target.value);
                                        setError('');
                                    }}
                                    placeholder="Masukkan kata sandi"
                                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50/60 text-slate-900 text-sm font-medium rounded-xl border border-slate-200 focus:bg-white focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/15 transition duration-150 placeholder:text-slate-400"
                                    disabled={isLoading}
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition"
                                    tabIndex={-1}
                                    aria-label="Toggle password visibility"
                                >
                                    {showPassword ? (
                                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                                            <line x1="1" y1="1" x2="23" y2="23"></line>
                                        </svg>
                                    ) : (
                                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                            <circle cx="12" cy="12" r="3"></circle>
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Target TikTok Live Channel */}
                        <div className="pt-0.5">
                            <div className="flex items-center justify-between mb-1.5">
                                <label htmlFor="tiktokTarget" className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                                    Target Akun TikTok Live
                                </label>
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-pink-600 bg-pink-50 border border-pink-200/70 px-2 py-0.5 rounded-full">
                                    <span className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-pulse"></span>
                                    Live Stream
                                </span>
                            </div>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-purple-600 font-bold text-sm">
                                    @
                                </div>
                                <input
                                    id="tiktokTarget"
                                    type="text"
                                    value={tiktokTarget}
                                    onChange={(e) => setTiktokTarget(e.target.value)}
                                    placeholder="metropolitan.id"
                                    className="w-full pl-8 pr-3.5 py-2.5 bg-slate-50/60 text-slate-900 text-sm font-semibold rounded-xl border border-slate-200 focus:bg-white focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/15 transition duration-150 placeholder:text-slate-400"
                                    disabled={isLoading}
                                />
                            </div>
                            <p className="text-[11px] text-slate-400 mt-1.5 font-medium leading-relaxed">
                                Komentar live dari akun ini akan diserap secara otomatis ke dashboard.
                            </p>
                        </div>

                        {/* Error Alert Banner */}
                        {error && (
                            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200/80 text-rose-900 text-xs leading-relaxed space-y-2">
                                <div className="flex items-start gap-2">
                                    <svg className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="12" cy="12" r="10"></circle>
                                        <line x1="12" y1="8" x2="12" y2="12"></line>
                                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                                    </svg>
                                    <span className="font-medium">{error}</span>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleDemoLogin}
                                    className="w-full py-1.5 px-3 bg-white border border-rose-200 hover:bg-rose-100/60 text-rose-800 font-bold rounded-lg text-[11px] transition text-center shadow-xs"
                                >
                                    Masuk Melalui Mode Demo (Simulasi Offline) →
                                </button>
                            </div>
                        )}

                        {/* Submit Button */}
                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 hover:from-blue-700 hover:via-purple-700 hover:to-pink-600 active:from-blue-800 active:via-purple-800 active:to-pink-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-purple-500/25 transition-all transform active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
                            >
                                {isLoading ? (
                                    <>
                                        <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        <span>Memverifikasi...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Masuk ke Dashboard</span>
                                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <line x1="5" y1="12" x2="19" y2="12"></line>
                                            <polyline points="12 5 19 12 12 19"></polyline>
                                        </svg>
                                    </>
                                )}
                            </button>
                        </div>
                    </form>

                    {/* Clean Minimal Demo Option */}
                    <div className="mt-5 pt-4 border-t border-slate-100 text-center">
                        <button
                            type="button"
                            onClick={handleDemoLogin}
                            disabled={isLoading}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-purple-700 transition"
                        >
                            <span>Ingin mencoba tanpa akun?</span>
                            <span className="text-purple-600 hover:text-pink-600 font-bold hover:underline">Masuk Mode Demo</span>
                        </button>
                    </div>
                </div>

                {/* Clean Professional Footer */}
                <div className="text-center mt-6 text-xs text-slate-400 font-medium">
                    <p>© 2026 Streamly. All rights reserved.</p>
                </div>

            </div>
        </div>
    );
};

export default LoginPage;
