import React, { createContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { isTokenExpired } from '../utils';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const navigate = useNavigate();

    // Helper to get persistent state synchronously on app launch
    const getInitialState = () => {
        const storedToken = localStorage.getItem('token');
        if (!storedToken || isTokenExpired(storedToken)) {
            // Clean up to prevent stale data
            localStorage.removeItem('token');
            localStorage.removeItem('username');
            localStorage.removeItem('email');
            localStorage.removeItem('avatar');
            return { token: null, user: null };
        }
        
        const username = localStorage.getItem('username');
        const email = localStorage.getItem('email') || `${username}@example.com`;
        const avatar = localStorage.getItem('avatar') || `https://api.dicebear.com/7.x/initials/svg?seed=${username}`;
        
        const theme = localStorage.getItem('theme') || 'dark';
        const budget = parseFloat(localStorage.getItem('monthlyBudget')) || 25000;
        const savingsGoal = parseFloat(localStorage.getItem('savingsGoal')) || 10000;
        
        return {
            token: storedToken,
            user: {
                username,
                email,
                avatar,
                preferences: {
                    theme,
                    budget,
                    savingsGoal
                }
            }
        };
    };

    const initialState = getInitialState();
    const [token, setToken] = useState(initialState.token);
    const [user, setUser] = useState(initialState.user);

    // Auto-logout period monitor if token expires mid-session
    useEffect(() => {
        if (token) {
            // Run immediate check
            if (isTokenExpired(token)) {
                logout();
                return;
            }
            
            const interval = setInterval(() => {
                if (isTokenExpired(token)) {
                    logout();
                }
            }, 5000); // Check every 5 seconds
            
            return () => clearInterval(interval);
        }
    }, [token]);

    const login = (newToken, username, email) => {
        localStorage.setItem('token', newToken);
        localStorage.setItem('username', username);
        
        const userEmail = email || `${username}@example.com`;
        localStorage.setItem('email', userEmail);
        
        const userAvatar = `https://api.dicebear.com/7.x/initials/svg?seed=${username}`;
        localStorage.setItem('avatar', userAvatar);
        
        setToken(newToken);
        setUser({
            username,
            email: userEmail,
            avatar: userAvatar,
            preferences: {
                theme: localStorage.getItem('theme') || 'dark',
                budget: parseFloat(localStorage.getItem('monthlyBudget')) || 25000,
                savingsGoal: parseFloat(localStorage.getItem('savingsGoal')) || 10000
            }
        });
        
        navigate('/dashboard');
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        localStorage.removeItem('email');
        localStorage.removeItem('avatar');
        setToken(null);
        setUser(null);
        navigate('/login');
    };

    const updateProfile = (newUsername, newEmail) => {
        localStorage.setItem('username', newUsername);
        localStorage.setItem('email', newEmail);
        
        setUser(prev => {
            if (!prev) return null;
            return {
                ...prev,
                username: newUsername,
                email: newEmail,
                avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${newUsername}`
            };
        });
    };

    const isAuthenticated = !!user && !!token;

    return (
        <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated, updateProfile }}>
            {children}
        </AuthContext.Provider>
    );
};
