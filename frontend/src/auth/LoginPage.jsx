import React, { useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL;

const LoginPage = ({ onLoginSuccess }) => {
    const [username, setUsername] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!username) {
            setError('TikTok username cannot be empty.');
            return;
        }
        setIsLoading(true);
        setError('');

        try {
            const response = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username }),
            });

            if (!response.ok) {
                // Try to get a meaningful error from the backend response
                const errorData = await response.json().catch(() => ({ message: 'An unknown error occurred.' }));
                throw new Error(errorData.message || `Server responded with status: ${response.status}`);
            }
            
            // On successful API call, we call the parent function
            onLoginSuccess(username);

        } catch (err) {
            setError(err.message || 'Failed to connect to the server. Please try again.');
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
            <div className="w-full max-w-sm">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-extrabold text-gray-800" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                        Streamly
                    </h1>
                    <p className="text-gray-500 mt-2">Real-time insights for your live stream.</p>
                </div>

                <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-lg" style={{ boxShadow: 'var(--shadow-card)' }}>
                    <div className="mb-4">
                        <label htmlFor="username" className="block text-sm font-bold text-gray-700 mb-2">
                            TikTok Username
                        </label>
                        <input
                            id="username"
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="@khabylame"
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-500 transition"
                            disabled={isLoading}
                        />
                    </div>

                    {error && (
                        <p className="text-red-500 text-sm text-center mb-4">{error}</p>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-teal-500 hover:bg-teal-600 text-white font-bold py-3 px-4 rounded-lg transition-transform transform hover:scale-102 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        {isLoading ? 'Analyzing...' : 'Start Analysis'}
                    </button>
                </form>

                <p className="text-center text-gray-400 text-xs mt-6">
                    Enter your TikTok username to begin real-time comment analysis.
                </p>
            </div>
        </div>
    );
};

export default LoginPage;
