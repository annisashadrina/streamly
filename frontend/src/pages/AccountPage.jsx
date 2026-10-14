import React from 'react';
import { useOutletContext } from 'react-router-dom';

const AccountPage = () => {
    // The handleLogout function is passed down from AppLayout via Outlet's context
    const { handleLogout } = useOutletContext();
    const username = localStorage.getItem("streamly_username") || 'user';

    return (
        <div className="p-4 pt-8 text-center">
            <h1 className="text-2xl font-bold text-gray-800" style={{ fontFamily: 'Plus Jakarta Sans' }}>
                Account
            </h1>
            <p className="mt-2 text-gray-500">
                You are currently analyzing for:
            </p>
            <p className="mt-1 text-lg font-bold text-teal-600">
                @{username}
            </p>

            <div className="mt-12">
                <button
                    onClick={handleLogout}
                    className="w-full max-w-xs mx-auto bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-4 rounded-lg transition-transform transform hover:scale-102"
                >
                    Logout
                </button>
            </div>
        </div>
    );
};

export default AccountPage;
