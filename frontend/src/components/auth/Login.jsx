import React, { useState, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { loginUser } from '../../services/authService';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, User, Loader2 } from 'lucide-react';

const Login = () => {
    const { login } = useContext(AuthContext);
    const [credentials, setCredentials] = useState({ username: '', password: '' });
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setCredentials({ ...credentials, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            const data = await loginUser(credentials.username, credentials.password);
            login(data.token, data.username);
        } catch (err) {
            setError(err.response?.data || 'Invalid credentials. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative flex min-h-screen bg-[#FFF7FB] text-slate-800 overflow-hidden fintech-canvas select-none">
            {/* Left Side: Animated illustration (hidden on mobile) */}
            <div className="hidden lg:flex lg:w-1/2 relative flex-col items-center justify-center p-12 bg-gradient-to-tr from-[#FFF0F7] via-[#FFF7FB] to-[#F5F0FF] overflow-hidden border-r border-[#FF5FA2]/10">
                {/* Floating soft colored bubbles */}
                <motion.div 
                    animate={{ y: [0, -15, 0], x: [0, 10, 0] }}
                    transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
                    className="absolute top-1/4 left-1/4 w-32 h-32 bg-[#FF5FA2]/10 rounded-full blur-2xl"
                />
                <motion.div 
                    animate={{ y: [0, 20, 0], x: [0, -10, 0] }}
                    transition={{ repeat: Infinity, duration: 8, ease: "easeInOut", delay: 1 }}
                    className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-[#A855F7]/10 rounded-full blur-3xl"
                />
                <motion.div 
                    animate={{ y: [0, -10, 0], x: [0, -5, 0] }}
                    transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 2 }}
                    className="absolute top-1/3 right-1/4 w-24 h-24 bg-[#FFB86B]/15 rounded-full blur-xl"
                />

                {/* 3D Asset */}
                <div className="relative z-10 flex flex-col items-center text-center max-w-md">
                    <motion.div
                        animate={{ y: [0, -12, 0] }}
                        transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                        className="w-72 h-72 mb-8 drop-shadow-[0_25px_35px_rgba(255,95,162,0.18)]"
                    >
                        <img 
                            src="/assets/lock_3d.png" 
                            alt="Security Lock" 
                            className="w-full h-full object-contain"
                            onError={(e) => {
                                e.target.style.display = 'none';
                            }}
                        />
                    </motion.div>
                    
                    <h1 className="text-3xl font-extrabold tracking-tight text-slate-800 mb-4">
                        Secure & Seamless
                    </h1>
                    <p className="text-slate-500 text-base leading-relaxed">
                        Track every expense, set smart category budgets, and watch your financial habits transform daily.
                    </p>
                </div>
            </div>

            {/* Right Side: Login Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative">
                {/* Mobile decorative bubbles */}
                <div className="absolute lg:hidden top-10 left-10 w-24 h-24 bg-[#FF5FA2]/10 rounded-full blur-xl pointer-events-none" />
                <div className="absolute lg:hidden bottom-10 right-10 w-32 h-32 bg-[#A855F7]/10 rounded-full blur-2xl pointer-events-none" />

                <motion.div 
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    className="w-full max-w-md"
                >
                    {/* Header */}
                    <div className="flex flex-col items-center lg:items-start mb-8 text-center lg:text-left">
                        <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-[#FFF0F7] border border-[#FF5FA2]/20 mb-4">
                            <span className="text-[#FF5FA2] font-bold text-xl">L</span>
                        </div>
                        <h2 className="text-3xl font-bold tracking-tight text-slate-800">
                            Welcome Back
                        </h2>
                        <p className="text-slate-500 text-sm mt-2">
                            Enter your credentials to access your workspace
                        </p>
                    </div>

                    {/* Form Card */}
                    <div className="glass-card p-8 border border-[#FF5FA2]/5">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {error && (
                                <motion.div 
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="p-3.5 text-sm text-[#FF5FA2] bg-[#FFF0F7] border border-[#FF5FA2]/20 rounded-2xl flex items-center gap-2"
                                >
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#FF5FA2] shrink-0" />
                                    <span>{error}</span>
                                </motion.div>
                            )}

                            <div className="space-y-2">
                                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider" htmlFor="username">
                                    Username
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                                        <User className="w-4 h-4" />
                                    </div>
                                    <input 
                                        type="text" 
                                        placeholder="yourusername" 
                                        name="username"
                                        id="username"
                                        className="w-full pl-10 pr-4 py-3 bg-white border border-[#FF5FA2]/15 rounded-2xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#FF5FA2]/30 focus:border-[#FF5FA2] transition-all text-sm font-medium shadow-sm"
                                        value={credentials.username} 
                                        onChange={handleChange} 
                                        required 
                                        disabled={loading}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider" htmlFor="password">
                                        Password
                                    </label>
                                </div>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                                        <Lock className="w-4 h-4" />
                                    </div>
                                    <input 
                                        type="password" 
                                        placeholder="••••••••" 
                                        name="password"
                                        id="password"
                                        className="w-full pl-10 pr-4 py-3 bg-white border border-[#FF5FA2]/15 rounded-2xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#FF5FA2]/30 focus:border-[#FF5FA2] transition-all text-sm font-medium shadow-sm"
                                        value={credentials.password} 
                                        onChange={handleChange} 
                                        required 
                                        disabled={loading}
                                    />
                                </div>
                            </div>

                            <button 
                                type="submit" 
                                className="relative w-full py-3.5 px-4 flex items-center justify-center rounded-2xl bg-gradient-to-r from-[#FF5FA2] to-[#A855F7] hover:opacity-95 text-white font-semibold text-sm shadow-md shadow-[#FF5FA2]/20 active:scale-[0.98] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#FF5FA2]"
                                disabled={loading}
                            >
                                {loading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    'Sign In'
                                )}
                            </button>
                        </form>

                        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
                            <p className="text-sm text-slate-500">
                                New here?{' '}
                                <Link to="/signup" className="font-semibold text-[#FF5FA2] hover:text-[#A855F7] transition-colors hover:underline">
                                    Create an account
                                </Link>
                            </p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default Login;
