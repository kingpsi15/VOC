import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showChange, setShowChange] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();

  useEffect(() => {
    // Redirect to main page if already authenticated
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const success = await login(email, password);
      if (success) {
        navigate('/');
      } else {
        setError('Invalid credentials. Please try again.');
      }
    } catch (err) {
      setError('An error occurred during login. Please try again.');
    }
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setError('Password change functionality is not implemented in this demo version.');
    setTimeout(() => {
      setError('');
      setShowChange(false);
    }, 3000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 to-indigo-200 dark:from-gray-900 dark:to-indigo-950">
      <div className="flex w-full max-w-4xl bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        {/* Left Section */}
        <div className="w-1/2 p-10 flex flex-col justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-800 dark:to-indigo-900">
          <h1 className="text-4xl font-extrabold text-blue-900 dark:text-blue-100 mb-4">Issue Detection & Endorsement</h1>
          <h2 className="text-3xl font-bold text-blue-800 dark:text-blue-200 mb-4">Login to review, approve, or reject detected customer issues securely.</h2>
          <ul className="space-y-4">
            <li className="flex items-center text-lg text-gray-800 dark:text-gray-200">
              <span className="text-green-600 dark:text-green-400 mr-3 text-2xl">✔️</span>
              Approve or reject issues
            </li>
            <li className="flex items-center text-lg text-gray-800 dark:text-gray-200">
              <span className="text-blue-600 dark:text-blue-400 mr-3 text-2xl">📊</span>
              Track issue status
            </li>
            <li className="flex items-center text-lg text-gray-800 dark:text-gray-200">
              <span className="text-purple-600 dark:text-purple-400 mr-3 text-2xl">👤</span>
              Supervisor & admin access
            </li>
            <li className="flex items-center text-lg text-gray-800 dark:text-gray-200">
              <span className="text-yellow-500 dark:text-yellow-400 mr-3 text-2xl">⚠️</span>
              Add resolution notes
            </li>
          </ul>
        </div>
        {/* Right Section */}
        <div className="w-1/2 p-10 flex flex-col justify-center bg-white dark:bg-gray-800">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md w-full">
            <h2 className="text-2xl font-bold mb-6 text-center text-gray-900 dark:text-gray-100">Issue Detection Access</h2>
            <p className="mb-4 text-center text-gray-500 dark:text-gray-400">Please login to access Issue Detection & Endorsement features</p>
            {error && <div className="mb-4 text-red-500 dark:text-red-400 text-center">{error}</div>}
            {!showChange ? (
              <form onSubmit={handleLogin}>
                <div className="mb-4">
                  <label className="block mb-1 font-medium text-gray-700 dark:text-gray-200">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full border dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    required
                    placeholder="Enter your email"
                  />
                </div>
                <div className="mb-4">
                  <label className="block mb-1 font-medium text-gray-700 dark:text-gray-200">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full border dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    required
                    placeholder="Enter your password"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition mb-2"
                >
                  Login
                </button>
                <button
                  type="button"
                  className="w-full bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 py-2 rounded hover:bg-gray-300 dark:hover:bg-gray-500 transition"
                  onClick={() => setShowChange(true)}
                >
                  Change Password
                </button>
              </form>
            ) : (
              <form onSubmit={handleChangePassword}>
                <div className="mb-4">
                  <label className="block mb-1 font-medium text-gray-700 dark:text-gray-200">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full border dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block mb-1 font-medium text-gray-700 dark:text-gray-200">Old Password</label>
                  <input
                    type="password"
                    value={oldPassword}
                    onChange={e => setOldPassword(e.target.value)}
                    className="w-full border dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block mb-1 font-medium text-gray-700 dark:text-gray-200">New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    className="w-full border dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block mb-1 font-medium text-gray-700 dark:text-gray-200">Confirm New Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    className="w-full border dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 transition mb-2"
                >
                  Change Password
                </button>
                <button
                  type="button"
                  className="w-full bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 py-2 rounded hover:bg-gray-300 dark:hover:bg-gray-500 transition"
                  onClick={() => setShowChange(false)}
                >
                  Back to Login
                </button>
              </form>
            )}
            <div className="mt-6 text-center text-gray-500 dark:text-gray-400">
              <span className="font-semibold text-gray-700 dark:text-gray-200">Demo Accounts:</span>
              <div className="mt-1 text-sm">
                admin@maubank.my / admin123<br />
                employee1@maubank.my / employee1
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login; 