import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { getExpenses, getMonthlySummary, addExpense, updateExpense, deleteExpense } from '../../services/expenseService';
import ExpenseForm from './ExpenseForm';
import Toast from '../common/Toast';
import { formatCurrency, formatDate, exportToCSV, CATEGORIES } from '../../utils';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { motion, AnimatePresence } from 'framer-motion';
import {
    AreaChart, Area, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar
} from 'recharts';
import {
    LayoutDashboard, Receipt, LogOut, Sun, Moon, Plus,
    Search, Filter, Download, Edit2, Trash2, TrendingUp,
    TrendingDown, PiggyBank, AlertTriangle, ChevronLeft,
    ChevronRight, User, Wallet, ChevronDown, Check, Percent,
    Sparkles, Calendar, Activity, Utensils, Car, Zap, Tv, Coins,
    AlertCircle, FileText, Menu, Eye, EyeOff, Bell, ArrowRight, Loader2, X
} from 'lucide-react';

const CATEGORY_COLORS = {
    'Food': '#FF5FA2',        // Pink
    'Transport': '#A855F7',   // Purple
    'Entertainment': '#FFB86B', // Peach
    'Utilities': '#10B981',   // Emerald
    'Other': '#6B7280'        // Gray
};

const CATEGORY_ICONS = {
    'Food': Utensils,
    'Transport': Car,
    'Utilities': Zap,
    'Entertainment': Tv,
    'Other': Coins
};

const Dashboard = () => {
    const { user, logout, updateProfile } = useContext(AuthContext);
    const [expenses, setExpenses] = useState([]);
    const [summary, setSummary] = useState([]);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingExpense, setEditingExpense] = useState(null);

    // States
    const [isLoading, setIsLoading] = useState(true);
    const [toast, setToast] = useState(null);
    const [currentTab, setCurrentTab] = useState('dashboard'); // 'dashboard', 'expenses', 'budget', 'goals', 'analytics', 'calendar', 'account'
    const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
    
    // Interactive Profile Fields
    const [editUsername, setEditUsername] = useState(user?.username || '');
    const [editEmail, setEditEmail] = useState(user?.email || '');
    
    // Benefits & Insights Modals
    const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false);
    const [isInsightsModalOpen, setIsInsightsModalOpen] = useState(false);
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [isBalanceVisible, setIsBalanceVisible] = useState(true);

    // Dynamic Budget Filter: Week vs Month
    const [budgetPeriod, setBudgetPeriod] = useState('month'); // 'month' or 'week'

    // Budgets
    const [monthlyBudget, setMonthlyBudget] = useState(
        parseFloat(localStorage.getItem('monthlyBudget')) || 25000
    );
    const [isEditingBudget, setIsEditingBudget] = useState(false);
    const [newBudgetVal, setNewBudgetVal] = useState(monthlyBudget.toString());

    // Category Budget Allocations (stored in localStorage or defaulted)
    const [categoryAllocations, setCategoryAllocations] = useState(() => {
        const saved = localStorage.getItem('categoryAllocations');
        return saved ? JSON.parse(saved) : {
            'Food': 40,
            'Transport': 20,
            'Utilities': 20,
            'Entertainment': 15,
            'Other': 5
        };
    });
    const [isEditingAllocations, setIsEditingAllocations] = useState(false);
    const [editAllocations, setEditAllocations] = useState({ ...categoryAllocations });

    // Multi Savings Goals System (stored in localStorage)
    const [savingsGoals, setSavingsGoals] = useState(() => {
        const saved = localStorage.getItem('savingsGoals');
        return saved ? JSON.parse(saved) : [
            { id: 1, name: 'Goa Trip', target: 20000, saved: 12000, icon: '✈️', completed: false }
        ];
    });
    const [isEditingGoalModal, setIsEditingGoalModal] = useState(false);
    const [currentEditingGoal, setCurrentEditingGoal] = useState(null);
    const [goalForm, setGoalForm] = useState({ name: '', target: '', saved: '', icon: '✈️' });

    // Notifications State
    const [notifications, setNotifications] = useState(() => {
        const saved = localStorage.getItem('notifications');
        return saved ? JSON.parse(saved) : [
            { id: 1, type: 'budget', text: "You have spent 5% of your daily budget today.", read: false, time: 'Today' },
            { id: 2, type: 'due', text: "AWS Cloud Infrastructure (₹2,450.00) is due in 3 days.", read: false, time: 'Today' },
            { id: 3, type: 'goal', text: "Your savings goal 'Goa Trip' is 60% completed!", read: false, time: 'Yesterday' }
        ];
    });
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

    // Calendar selected date for previewing details
    const [selectedCalendarDate, setSelectedCalendarDate] = useState(new Date().toISOString().split('T')[0]);

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [timelinePage, setTimelinePage] = useState(1);
    const itemsPerPage = 5;

    const loadData = async () => {
        try {
            const expData = await getExpenses();
            setExpenses(expData);
            const sumData = await getMonthlySummary();
            setSummary(sumData);
        } catch (err) {
            console.error("Failed to load dashboard data", err);
        }
    };

    useEffect(() => {
        setIsLoading(true);
        loadData().then(() => {
            setTimeout(() => setIsLoading(false), 600);
        });
    }, []);

    // Sync profile input states when user shifts
    useEffect(() => {
        if (user) {
            setEditUsername(user.username || '');
            setEditEmail(user.email || '');
        }
    }, [user]);

    // Sync state to localStorage on updates
    useEffect(() => {
        localStorage.setItem('savingsGoals', JSON.stringify(savingsGoals));
    }, [savingsGoals]);

    useEffect(() => {
        localStorage.setItem('notifications', JSON.stringify(notifications));
    }, [notifications]);

    useEffect(() => {
        localStorage.setItem('categoryAllocations', JSON.stringify(categoryAllocations));
    }, [categoryAllocations]);

    const handleOpenAdd = () => {
        setEditingExpense(null);
        setIsFormOpen(true);
    };

    const handleOpenEdit = (expense) => {
        setEditingExpense(expense);
        setIsFormOpen(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to remove this entry?")) {
            try {
                await deleteExpense(id);
                setToast({ message: 'Entry removed successfully', type: 'success' });
                loadData();
            } catch (err) {
                setToast({ message: 'Failed to delete transaction details', type: 'warning' });
            }
        }
    };

    const handleFormSubmit = async (formData) => {
        try {
            if (editingExpense) {
                await updateExpense(editingExpense.id, formData);
                setToast({ message: 'Transaction modified successfully', type: 'success' });
            } else {
                await addExpense(formData);
                setToast({ message: 'Transaction logged successfully', type: 'success' });
            }
            setIsFormOpen(false);
            loadData();
        } catch (err) {
            setToast({ message: 'Unable to save transaction details', type: 'warning' });
            throw err;
        }
    };

    const saveBudget = () => {
        const val = parseFloat(newBudgetVal);
        if (!isNaN(val) && val > 0) {
            setMonthlyBudget(val);
            localStorage.setItem('monthlyBudget', val.toString());
            setIsEditingBudget(false);
            setToast({ message: 'Budget limit adjusted', type: 'success' });
        }
    };

    const handleSaveAllocations = () => {
        const total = Object.values(editAllocations).reduce((a, b) => a + parseFloat(b || 0), 0);
        if (total !== 100) {
            setToast({ message: `Allocations must sum to 100%. Currently: ${total}%`, type: 'warning' });
            return;
        }
        setCategoryAllocations({ ...editAllocations });
        setIsEditingAllocations(false);
        setToast({ message: 'Category budget parameters updated', type: 'success' });
    };

    // Goals Handling
    const handleOpenEditGoal = (goal) => {
        setCurrentEditingGoal(goal);
        setGoalForm({
            name: goal.name,
            target: goal.target.toString(),
            saved: goal.saved.toString(),
            icon: goal.icon
        });
        setIsEditingGoalModal(true);
    };

    const handleOpenCreateGoal = () => {
        setCurrentEditingGoal(null);
        setGoalForm({ name: '', target: '', saved: '0', icon: '✈️' });
        setIsEditingGoalModal(true);
    };

    const handleSaveGoal = () => {
        if (!goalForm.name || !goalForm.target) {
            setToast({ message: 'Please enter a goal name and target amount', type: 'warning' });
            return;
        }

        const targetVal = parseFloat(goalForm.target);
        const savedVal = parseFloat(goalForm.saved) || 0;

        if (currentEditingGoal) {
            // Edit existing
            setSavingsGoals(prev => prev.map(g => g.id === currentEditingGoal.id ? {
                ...g,
                name: goalForm.name,
                target: targetVal,
                saved: savedVal,
                icon: goalForm.icon,
                completed: savedVal >= targetVal
            } : g));
            setToast({ message: 'Savings goal updated successfully', type: 'success' });
        } else {
            // Create new
            const newGoal = {
                id: Date.now(),
                name: goalForm.name,
                target: targetVal,
                saved: savedVal,
                icon: goalForm.icon,
                completed: savedVal >= targetVal
            };
            setSavingsGoals(prev => [...prev, newGoal]);
            setToast({ message: 'New savings goal created!', type: 'success' });
        }
        setIsEditingGoalModal(false);
    };

    const handleDeleteGoal = (id) => {
        if (window.confirm("Remove this savings goal?")) {
            setSavingsGoals(prev => prev.filter(g => g.id !== id));
            setToast({ message: 'Goal removed successfully', type: 'success' });
        }
    };

    // Notifications Handling
    const unreadNotificationsCount = notifications.filter(n => !n.read).length;
    
    const markAllNotificationsAsRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setToast({ message: 'All notifications marked as read', type: 'success' });
    };

    const clearNotification = (id) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    const getGreeting = () => {
        const hr = new Date().getHours();
        if (hr < 12) return 'Good Morning';
        if (hr < 17) return 'Good Afternoon';
        return 'Good Evening';
    };

    const handleUpdateProfile = () => {
        if (!editUsername.trim() || !editEmail.trim()) {
            setToast({ message: 'Username and Email cannot be empty', type: 'warning' });
            return;
        }
        try {
            updateProfile(editUsername.trim(), editEmail.trim());
            setToast({ message: 'Profile credentials updated', type: 'success' });
        } catch (err) {
            setToast({ message: 'Failed to adjust workspace profile details', type: 'warning' });
        }
    };

    // --- Calculations ---
    const totalSpent = expenses.reduce((acc, curr) => acc + parseFloat(curr.amount), 0);
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const thisMonthExpenses = expenses.filter(exp => {
        const expDate = new Date(exp.date);
        return expDate.getMonth() === currentMonth && expDate.getFullYear() === currentYear;
    });
    const thisMonthSpent = thisMonthExpenses.reduce((acc, curr) => acc + parseFloat(curr.amount), 0);

    const todayStr = new Date().toISOString().split('T')[0];
    const todaySpent = expenses
        .filter(exp => exp.date === todayStr)
        .reduce((acc, curr) => acc + parseFloat(curr.amount), 0);

    const todayCount = expenses.filter(exp => exp.date === todayStr).length;

    // Budget Calculations: Week vs Month filter
    const getBudgetPeriodData = () => {
        if (budgetPeriod === 'week') {
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            const weekExpenses = expenses.filter(exp => new Date(exp.date) >= sevenDaysAgo);
            const spent = weekExpenses.reduce((acc, curr) => acc + parseFloat(curr.amount), 0);
            const budget = monthlyBudget / 4;
            const usagePercent = Math.min(100, (spent / budget) * 100);
            return { expenses: weekExpenses, spent, budget, usagePercent };
        }
        
        const spent = thisMonthSpent;
        const budget = monthlyBudget;
        const usagePercent = Math.min(100, (spent / budget) * 100);
        return { expenses: thisMonthExpenses, spent, budget, usagePercent };
    };

    const periodData = getBudgetPeriodData();

    // Group current period expenses by category for summary
    const getPeriodSummary = () => {
        const catMap = {};
        CATEGORIES.forEach(cat => { catMap[cat.name] = 0; });
        periodData.expenses.forEach(exp => {
            if (catMap[exp.category] !== undefined) {
                catMap[exp.category] += parseFloat(exp.amount);
            } else {
                catMap['Other'] = (catMap['Other'] || 0) + parseFloat(exp.amount);
            }
        });
        return Object.keys(catMap).map(catName => ({
            category: catName,
            totalAmount: catMap[catName]
        }));
    };

    const periodSummary = getPeriodSummary();

    // Health score out of 100
    const getHealthScore = () => {
        if (monthlyBudget <= 0) return 100;
        const ratio = thisMonthSpent / monthlyBudget;
        let score = 100 - (ratio * 65);
        return Math.max(15, Math.min(100, Math.round(score)));
    };

    const healthScore = getHealthScore();
    const remainingBudget = Math.max(0, monthlyBudget - thisMonthSpent);

    // Primary Savings Goal progress out of first goal
    const primaryGoal = savingsGoals[0] || { name: 'None', target: 10000, saved: 0, icon: '💼' };
    const savingsGoalProgress = Math.min(100, (primaryGoal.saved / primaryGoal.target) * 100);

    const currentDayOfMonth = Math.max(1, new Date().getDate());
    
    // Group expenses by Date
    const groupExpensesByDate = (expList) => {
        const groups = {};
        expList.forEach(exp => {
            const dateStr = exp.date;
            if (!groups[dateStr]) groups[dateStr] = [];
            groups[dateStr].push(exp);
        });
        return groups;
    };

    const filteredExpenses = expenses.filter(exp => {
        const descMatch = exp.description.toLowerCase().includes(searchQuery.toLowerCase());
        const catMatch = categoryFilter === '' || exp.category === categoryFilter;
        return descMatch && catMatch;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const groupedExpenses = groupExpensesByDate(filteredExpenses);
    const sortedGroupDates = Object.keys(groupedExpenses).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    const paginatedDates = sortedGroupDates.slice(
        (timelinePage - 1) * itemsPerPage,
        timelinePage * itemsPerPage
    );
    const totalTimelinePages = Math.ceil(sortedGroupDates.length / itemsPerPage);

    const getChartData = () => {
        const chartMap = {};
        for (let i = 1; i <= currentDayOfMonth; i++) {
            chartMap[i] = 0;
        }
        thisMonthExpenses.forEach(exp => {
            const expDate = new Date(exp.date);
            const day = expDate.getDate();
            if (chartMap[day] !== undefined) {
                chartMap[day] += parseFloat(exp.amount);
            }
        });

        return Object.keys(chartMap).map(day => ({
            day: `${day}`,
            amount: parseFloat(chartMap[day].toFixed(2))
        }));
    };

    // Donut chart data formatted for Recharts
    const getPieData = () => {
        if (periodSummary.every(cat => cat.totalAmount === 0)) {
            return [{ name: 'Empty', value: 1, color: '#E5E7EB' }];
        }
        return periodSummary.map(cat => ({
            name: cat.category,
            value: parseFloat(cat.totalAmount),
            color: CATEGORY_COLORS[cat.category] || '#6B7280'
        })).filter(c => c.value > 0);
    };

    // Calendar Days Generator
    const getCalendarDays = () => {
        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth();
        const firstDayIndex = new Date(year, month, 1).getDay();
        const lastDay = new Date(year, month + 1, 0).getDate();
        
        const days = [];
        // Fill empty spaces for offset
        for (let i = 0; i < firstDayIndex; i++) {
            days.push({ day: null, dateStr: null });
        }
        // Fill actual days
        for (let i = 1; i <= lastDay; i++) {
            const dayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
            days.push({ day: i, dateStr: dayStr });
        }
        return days;
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#FFF7FB] text-slate-800 flex flex-col fintech-canvas items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 text-[#FF5FA2] animate-spin" />
                    <span className="font-semibold text-slate-500 text-sm">Synchronizing your workspace...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen text-slate-800 flex flex-col md:flex-row bg-[#FFF7FB] fintech-canvas select-none">
            
            {/* COLLAPSED / EXPANDED SIDEBAR (DESKTOP) */}
            <aside className={`hidden md:flex flex-col justify-between border-r border-[#FF5FA2]/10 bg-white p-5 h-screen sticky top-0 transition-all duration-350 ease-in-out z-40 ${isSidebarExpanded ? 'w-64' : 'w-20'}`}>
                <div className="flex flex-col gap-6">
                    {/* LOGO AREA */}
                    <div className="flex items-center justify-between h-10">
                        <div className="flex items-center gap-3 overflow-hidden">
                            <div className="w-10 h-10 shrink-0 rounded-2xl bg-gradient-to-tr from-[#FF5FA2] to-[#A855F7] flex items-center justify-center shadow-md shadow-[#FF5FA2]/20">
                                <svg className="w-5.5 h-5.5 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M3 12H7L10 4L14 20L17 12H21" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            </div>
                            {isSidebarExpanded && (
                                <span className="font-extrabold tracking-tight text-slate-800 text-base animate-fade-in">
                                    LedgerSaaS
                                </span>
                            )}
                        </div>
                        
                        {isSidebarExpanded && (
                            <button 
                                onClick={() => setIsSidebarExpanded(false)}
                                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-[#FFF0F7] transition-all active:scale-95"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                        )}
                        {!isSidebarExpanded && (
                            <button 
                                onClick={() => setIsSidebarExpanded(true)}
                                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-[#FFF0F7] transition-all active:scale-95"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    {/* NAVIGATION LINKS */}
                    <nav className="flex flex-col gap-1.5 mt-4">
                        <button 
                            onClick={() => { setCurrentTab('dashboard'); }}
                            className={`flex items-center gap-3 p-3 rounded-2xl text-xs font-semibold tracking-wide transition-all ${
                                currentTab === 'dashboard' 
                                ? 'bg-[#FFF0F7] text-[#FF5FA2] font-bold shadow-sm' 
                                : 'text-slate-500 hover:bg-[#FFF0F7]/40 hover:text-[#FF5FA2]'
                            } ${!isSidebarExpanded ? 'justify-center' : ''}`}
                            title="Overview"
                        >
                            <LayoutDashboard className="w-4 h-4" />
                            {isSidebarExpanded && <span className="animate-fade-in text-[13px]">Overview</span>}
                        </button>
                        <button 
                            onClick={() => { setCurrentTab('expenses'); }}
                            className={`flex items-center gap-3 p-3 rounded-2xl text-xs font-semibold tracking-wide transition-all ${
                                currentTab === 'expenses' 
                                ? 'bg-[#FFF0F7] text-[#FF5FA2] font-bold shadow-sm' 
                                : 'text-slate-500 hover:bg-[#FFF0F7]/40 hover:text-[#FF5FA2]'
                            } ${!isSidebarExpanded ? 'justify-center' : ''}`}
                            title="Transactions"
                        >
                            <Receipt className="w-4 h-4" />
                            {isSidebarExpanded && <span className="animate-fade-in text-[13px]">Transactions</span>}
                        </button>
                        <button 
                            onClick={() => { setCurrentTab('budget'); }}
                            className={`flex items-center gap-3 p-3 rounded-2xl text-xs font-semibold tracking-wide transition-all ${
                                currentTab === 'budget' 
                                ? 'bg-[#FFF0F7] text-[#FF5FA2] font-bold shadow-sm' 
                                : 'text-slate-500 hover:bg-[#FFF0F7]/40 hover:text-[#FF5FA2]'
                            } ${!isSidebarExpanded ? 'justify-center' : ''}`}
                            title="Budget"
                        >
                            <Wallet className="w-4 h-4" />
                            {isSidebarExpanded && <span className="animate-fade-in text-[13px]">Budget</span>}
                        </button>
                        <button 
                            onClick={() => { setCurrentTab('goals'); }}
                            className={`flex items-center gap-3 p-3 rounded-2xl text-xs font-semibold tracking-wide transition-all ${
                                currentTab === 'goals' 
                                ? 'bg-[#FFF0F7] text-[#FF5FA2] font-bold shadow-sm' 
                                : 'text-slate-500 hover:bg-[#FFF0F7]/40 hover:text-[#FF5FA2]'
                            } ${!isSidebarExpanded ? 'justify-center' : ''}`}
                            title="Goals"
                        >
                            <PiggyBank className="w-4 h-4" />
                            {isSidebarExpanded && <span className="animate-fade-in text-[13px]">Goals</span>}
                        </button>
                        <button 
                            onClick={() => { setCurrentTab('analytics'); }}
                            className={`flex items-center gap-3 p-3 rounded-2xl text-xs font-semibold tracking-wide transition-all ${
                                currentTab === 'analytics' 
                                ? 'bg-[#FFF0F7] text-[#FF5FA2] font-bold shadow-sm' 
                                : 'text-slate-500 hover:bg-[#FFF0F7]/40 hover:text-[#FF5FA2]'
                            } ${!isSidebarExpanded ? 'justify-center' : ''}`}
                            title="Analytics"
                        >
                            <Activity className="w-4 h-4" />
                            {isSidebarExpanded && <span className="animate-fade-in text-[13px]">Analytics</span>}
                        </button>
                        <button 
                            onClick={() => { setCurrentTab('calendar'); }}
                            className={`flex items-center gap-3 p-3 rounded-2xl text-xs font-semibold tracking-wide transition-all ${
                                currentTab === 'calendar' 
                                ? 'bg-[#FFF0F7] text-[#FF5FA2] font-bold shadow-sm' 
                                : 'text-slate-500 hover:bg-[#FFF0F7]/40 hover:text-[#FF5FA2]'
                            } ${!isSidebarExpanded ? 'justify-center' : ''}`}
                            title="Calendar"
                        >
                            <Calendar className="w-4 h-4" />
                            {isSidebarExpanded && <span className="animate-fade-in text-[13px]">Calendar</span>}
                        </button>
                    </nav>

                    {/* Premium Active Card */}
                    {isSidebarExpanded && (
                        <div className="relative mt-8 p-5 rounded-[24px] bg-gradient-to-br from-[#A855F7] to-[#FF5FA2] text-white overflow-hidden shadow-lg shadow-[#FF5FA2]/15 select-none">
                            <div className="absolute -right-4 -top-4 w-20 h-20 bg-white/10 rounded-full blur-xl pointer-events-none" />
                            <motion.div
                                animate={{ y: [0, -6, 0] }}
                                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                                className="absolute top-2 right-2 w-16 h-16 drop-shadow-md pointer-events-none"
                            >
                                <img src="/assets/rocket_3d.png" alt="Rocket 3D" className="w-full h-full object-contain" />
                            </motion.div>
                            
                            <h4 className="text-sm font-bold mt-6 mb-1">Premium Active</h4>
                            <p className="text-[10px] text-white/85 leading-normal mb-4 max-w-[130px]">
                                Lifetime access to all advanced features is enabled.
                            </p>
                            <button 
                                onClick={() => setIsPremiumModalOpen(true)}
                                className="w-full py-2 bg-white text-[#FF5FA2] font-semibold text-xs rounded-xl hover:bg-opacity-95 active:scale-[0.97] transition-all"
                            >
                                View Benefits
                            </button>
                        </div>
                    )}
                </div>

                {/* SIDEBAR FOOTER */}
                <div className="flex flex-col gap-3 pt-4 border-t border-slate-100">
                    {/* User Card */}
                    <button 
                        onClick={() => setCurrentTab('account')}
                        className={`flex items-center w-full text-left ${isSidebarExpanded ? 'gap-3' : 'justify-center'} p-2 rounded-2xl transition-all cursor-pointer ${
                            currentTab === 'account' 
                            ? 'bg-[#FFF0F7] border border-[#FF5FA2] shadow-md shadow-[#FF5FA2]/10 ring-2 ring-[#FF5FA2]/10' 
                            : 'bg-[#FFF0F7]/60 border border-[#FF5FA2]/5 hover:bg-[#FFF0F7]'
                        }`}
                    >
                        <div className="w-9 h-9 shrink-0 rounded-xl bg-gradient-to-tr from-[#FF5FA2] to-[#A855F7] flex items-center justify-center font-bold text-white text-xs shadow-sm">
                            {user?.username?.substring(0, 2).toUpperCase() || 'AN'}
                        </div>
                        {isSidebarExpanded && (
                            <div className="min-w-0 flex-1 overflow-hidden animate-fade-in">
                                <p className="text-xs font-bold text-slate-800 truncate">{user?.username?.toUpperCase() || 'ANISH12'}</p>
                                <p className="text-[9px] text-slate-400 truncate">Premium Member</p>
                            </div>
                        )}
                    </button>

                    {/* Logout button */}
                    <button 
                        onClick={logout}
                        className={`flex items-center gap-3 p-3 rounded-2xl text-xs font-semibold text-rose-500 hover:bg-rose-50 hover:text-rose-600 active:scale-95 transition-all ${!isSidebarExpanded ? 'justify-center' : ''}`}
                        title="Sign Out"
                    >
                        <LogOut className="w-4 h-4" />
                        {isSidebarExpanded && <span className="animate-fade-in text-[13px]">Log Out</span>}
                    </button>
                </div>
            </aside>

            {/* MOBILE SIDEBAR DRAWER OVERLAY */}
            <AnimatePresence>
                {isMobileSidebarOpen && (
                    <>
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsMobileSidebarOpen(false)}
                            className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-xs md:hidden"
                        />
                        <motion.aside 
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-[#FF5FA2]/10 p-5 flex flex-col justify-between md:hidden"
                        >
                            <div className="flex flex-col gap-6">
                                <div className="flex items-center justify-between h-10">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#FF5FA2] to-[#A855F7] flex items-center justify-center">
                                            <svg className="w-5 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M3 12H7L10 4L14 20L17 12H21" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                                            </svg>
                                        </div>
                                        <span className="font-extrabold tracking-tight text-slate-800 text-sm">LedgerSaaS</span>
                                    </div>
                                    <button 
                                        onClick={() => setIsMobileSidebarOpen(false)}
                                        className="p-1 rounded-lg text-slate-400 hover:text-slate-655"
                                    >
                                        <ChevronLeft className="w-5 h-5" />
                                    </button>
                                </div>

                                <nav className="flex flex-col gap-1.5 mt-4">
                                    {['dashboard', 'expenses', 'budget', 'goals', 'analytics', 'calendar'].map((tab) => (
                                        <button 
                                            key={tab}
                                            onClick={() => { setCurrentTab(tab); setIsMobileSidebarOpen(false); }}
                                            className={`flex items-center gap-3 p-3 rounded-2xl text-sm font-semibold capitalize transition-all ${
                                                currentTab === tab 
                                                ? 'bg-[#FFF0F7] text-[#FF5FA2] font-bold' 
                                                : 'text-slate-500 hover:bg-[#FFF0F7]/40 hover:text-[#FF5FA2]'
                                            }`}
                                        >
                                            {tab === 'dashboard' ? <LayoutDashboard className="w-4 h-4" /> :
                                             tab === 'expenses' ? <Receipt className="w-4 h-4" /> :
                                             tab === 'budget' ? <Wallet className="w-4 h-4" /> :
                                             tab === 'goals' ? <PiggyBank className="w-4 h-4" /> :
                                             tab === 'analytics' ? <Activity className="w-4 h-4" /> :
                                             <Calendar className="w-4 h-4" />}
                                            {tab === 'expenses' ? 'transactions' : tab}
                                        </button>
                                    ))}
                                </nav>
                            </div>

                            <div className="flex flex-col gap-3 pt-4 border-t border-slate-100">
                                <button 
                                    onClick={() => { setCurrentTab('account'); setIsMobileSidebarOpen(false); }}
                                    className="flex items-center gap-3 p-2 rounded-2xl bg-[#FFF0F7]/60 w-full text-left hover:bg-[#FFF0F7] transition-all cursor-pointer"
                                >
                                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#FF5FA2] to-[#A855F7] flex items-center justify-center font-bold text-white text-xs">
                                        {user?.username?.substring(0, 2).toUpperCase() || 'AN'}
                                    </div>
                                    <div className="min-w-0 flex-1 overflow-hidden">
                                        <p className="text-xs font-bold text-slate-800 truncate">{user?.username?.toUpperCase() || 'ANISH12'}</p>
                                        <p className="text-[9px] text-slate-400 truncate">Premium Member</p>
                                    </div>
                                </button>

                                <button 
                                    onClick={() => { logout(); setIsMobileSidebarOpen(false); }}
                                    className="flex items-center gap-3 p-3 rounded-2xl text-sm font-semibold text-rose-500 hover:bg-rose-50 hover:text-rose-600 transition-all"
                                >
                                    <LogOut className="w-4 h-4" />
                                    Log Out
                                </button>
                            </div>
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>

            {/* MOBILE HEADER */}
            <div className="flex md:hidden items-center justify-between h-14 px-6 border-b border-[#FF5FA2]/10 bg-white sticky top-0 z-30">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#FF5FA2] to-[#A855F7] flex items-center justify-center">
                        <svg className="w-5.5 h-5.5 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M3 12H7L10 4L14 20L17 12H21" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    </div>
                    <span className="font-extrabold text-sm tracking-tight text-slate-800">LedgerSaaS</span>
                </div>
                <button 
                    onClick={() => setIsMobileSidebarOpen(true)}
                    className="p-1.5 rounded-lg bg-[#FFF0F7] border border-[#FF5FA2]/10 text-[#FF5FA2]"
                >
                    <Menu className="w-5 h-5" />
                </button>
            </div>

            {/* MAIN APP CONTAINER */}
            <div className="flex-1 flex flex-col min-w-0 overflow-y-auto h-screen p-6 md:p-10 relative">
                
                {/* TOP HEADER SECTION */}
                <section className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 select-none relative z-[100]">
                    <div className="space-y-1">
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                            {getGreeting()}, <span className="w-1.5 h-1.5 rounded-full bg-[#FFB86B]" />
                        </span>
                        <h2 className="text-4xl font-extrabold tracking-tight text-slate-800 font-sans leading-none">
                            {user?.username?.toUpperCase() || 'ANISH12'}
                        </h2>
                        <p className="text-[#FFB86B] font-bold text-[13px] tracking-wide mt-1 select-none">
                            Let's make today financially amazing ✨
                        </p>
                    </div>
                    
                    <div className="flex items-center gap-3 relative z-[100]">
                        {/* Search Bar pill */}
                        <div className="relative hidden sm:block">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                                <Search className="w-4 h-4" />
                            </div>
                            <input 
                                type="text" 
                                placeholder="Search anything..." 
                                className="w-56 pl-10 pr-10 py-2.5 bg-white border border-[#FF5FA2]/10 rounded-full text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#FF5FA2]/20 focus:border-[#FF5FA2] transition-all shadow-sm"
                            />
                            <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none">
                                <span className="text-[10px] text-slate-400 bg-[#FFF0F7] px-1.5 py-0.5 rounded border border-[#FF5FA2]/5 font-mono">⌘/</span>
                            </div>
                        </div>

                        {/* Interactive Notification Indicator Bell */}
                        <div className="relative z-[100]">
                            <button 
                                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                                className={`relative w-10 h-10 rounded-full bg-white border flex items-center justify-center active:scale-95 transition-all shadow-sm z-[100] ${isNotificationsOpen ? 'border-[#FF5FA2] text-[#FF5FA2]' : 'border-[#FF5FA2]/10 text-slate-500 hover:text-[#FF5FA2]'}`}
                            >
                                <Bell className="w-4 h-4" />
                                {unreadNotificationsCount > 0 && (
                                    <span className="absolute top-1 right-1.5 w-4 h-4 bg-[#FF5FA2] border-2 border-white rounded-full flex items-center justify-center text-[8px] font-bold text-white z-[100]">
                                        {unreadNotificationsCount}
                                    </span>
                                )}
                            </button>

                            {/* Notifications Popover Dropdown */}
                            <AnimatePresence>
                                {isNotificationsOpen && (
                                    <>
                                        {/* Click outside to close helper overlay */}
                                        <div className="fixed inset-0 z-[100] bg-transparent" onClick={() => setIsNotificationsOpen(false)} />
                                        
                                        <motion.div
                                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                            transition={{ duration: 0.15 }}
                                            className="absolute right-0 mt-2 w-80 bg-white border border-[#FF5FA2]/15 rounded-[24px] shadow-lg z-[200] p-4 select-none overflow-hidden"
                                        >
                                            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-3">
                                                <span className="text-xs font-bold text-slate-800">Notifications</span>
                                                {unreadNotificationsCount > 0 && (
                                                    <button 
                                                        onClick={markAllNotificationsAsRead}
                                                        className="text-[10px] text-[#FF5FA2] font-semibold hover:underline"
                                                    >
                                                        Mark all as read
                                                    </button>
                                                )}
                                            </div>

                                            {notifications.length === 0 ? (
                                                <div className="py-8 text-center text-[11px] text-slate-400 font-medium">
                                                    No new notifications
                                                </div>
                                            ) : (
                                                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                                                    {notifications.map((n) => (
                                                        <div 
                                                            key={n.id} 
                                                            className={`p-2.5 rounded-xl border flex items-start gap-2.5 transition-all relative ${n.read ? 'bg-slate-50/50 border-slate-100' : 'bg-[#FFF0F7]/30 border-[#FF5FA2]/10'}`}
                                                        >
                                                            {/* Custom Bullet Indicator */}
                                                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 mt-1.5 ${n.type === 'budget' ? 'bg-[#FF5FA2]' : n.type === 'due' ? 'bg-[#FFB86B]' : 'bg-[#A855F7]'}`} />
                                                            
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-[11px] text-slate-700 leading-normal font-medium">{n.text}</p>
                                                                <span className="text-[8px] text-slate-400 block mt-1 font-bold">{n.time}</span>
                                                            </div>

                                                            <button 
                                                                onClick={() => clearNotification(n.id)}
                                                                className="text-slate-350 hover:text-rose-500 text-[10px] font-bold p-0.5 shrink-0"
                                                                title="Clear"
                                                            >
                                                                ×
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </motion.div>
                                    </>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Quick plus trigger */}
                        <button 
                            onClick={handleOpenAdd}
                            className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#FF5FA2] to-[#A855F7] flex items-center justify-center text-white hover:opacity-95 active:scale-95 transition-all shadow-md shadow-[#FF5FA2]/20"
                        >
                            <Plus className="w-5 h-5" />
                        </button>
                    </div>
                </section>

                {/* DYNAMIC TAB OUTLET ROUTER PANEL */}
                <AnimatePresence mode="wait">
                    
                    {/* tab 1: OVERVIEW/DASHBOARD CANVAS */}
                    {currentTab === 'dashboard' && (
                        <motion.main 
                            key="dashboard-tab"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.35, cubicBezier: [0.16, 1, 0.3, 1] }}
                            className="space-y-8 relative z-10"
                        >
                            {/* MAIN GRID: Hero cards row */}
                            <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                                
                                {/* 1. LEDGER CARD BLOCK (Left/Spans 5 cols) */}
                                <div className="lg:col-span-5 relative overflow-hidden rounded-[32px] bg-gradient-to-tr from-[#A855F7] via-[#A855F7] to-[#FF5FA2] p-7 flex flex-col justify-between shadow-lg shadow-[#A855F7]/15 text-white select-none">
                                    <div className="absolute -right-16 -top-16 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
                                    
                                    {/* 3D Floating Wallet Render */}
                                    <motion.div
                                        animate={{ y: [0, -8, 0] }}
                                        transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                                        className="absolute right-6 top-1/2 -translate-y-1/2 w-44 h-44 drop-shadow-[0_20px_30px_rgba(0,0,0,0.15)] z-10 pointer-events-none"
                                    >
                                        <img src="/assets/wallet_3d.png" alt="Wallet 3D" className="w-full h-full object-contain" />
                                    </motion.div>

                                    <div className="flex justify-between items-start z-20">
                                        <div className="space-y-0.5">
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-[#F5F0FF]/80">Total Balance</span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] text-[#F5F0FF]/85 font-medium">Available to spend</span>
                                                <button onClick={() => setIsBalanceVisible(!isBalanceVisible)} className="p-0.5 hover:text-white transition-colors">
                                                    {isBalanceVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="my-8 z-20">
                                        <h3 className="text-4xl font-extrabold tracking-tight font-sans">
                                            {isBalanceVisible ? formatCurrency(remainingBudget) : '••••••••'}
                                        </h3>
                                        <span className="inline-flex items-center gap-1 mt-2.5 px-2.5 py-1 bg-white/10 rounded-full text-[10px] font-bold">
                                            +12% vs last month
                                        </span>
                                    </div>

                                    <div className="flex justify-between items-end border-t border-white/10 pt-4 z-20">
                                        <div>
                                            <span className="text-[8px] font-bold uppercase tracking-wider text-[#F5F0FF]/70 block">Workspace Member</span>
                                            <span className="text-xs font-bold uppercase tracking-wider mt-0.5 block">{user?.username || 'Anish'}</span>
                                        </div>
                                        <button 
                                            onClick={() => setCurrentTab('expenses')}
                                            className="w-8 h-8 rounded-full bg-white text-[#FF5FA2] flex items-center justify-center shadow-md active:scale-90 transition-all hover:bg-opacity-95"
                                        >
                                            <ArrowRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* 2. TODAY'S SUMMARY CARD BLOCK (Middle/Spans 4 cols) */}
                                <div className="lg:col-span-4 bg-white rounded-[32px] border border-[#FF5FA2]/10 p-6 flex flex-col justify-between shadow-sm">
                                    <div className="flex justify-between items-center mb-4">
                                        <h4 className="text-sm font-bold text-slate-800">Today's Summary</h4>
                                        <button className="text-slate-400 hover:text-slate-600 text-xs">•••</button>
                                    </div>

                                    <div className="space-y-4 flex-1 flex flex-col justify-center">
                                        {/* Spent Today */}
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center">
                                                    <TrendingDown className="w-4.5 h-4.5" />
                                                </div>
                                                <span className="text-xs text-slate-500 font-medium">Spent Today</span>
                                            </div>
                                            <span className="text-xs font-bold text-slate-800">{formatCurrency(todaySpent)}</span>
                                        </div>

                                        {/* Daily Budget indicator */}
                                        <div className="space-y-1">
                                            <div className="flex items-center justify-between text-xs">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-xl bg-[#FFF0F7] text-[#FF5FA2] flex items-center justify-center">
                                                        <Wallet className="w-4.5 h-4.5" />
                                                    </div>
                                                    <span className="text-slate-500 font-medium">Daily Budget</span>
                                                </div>
                                                <span className="font-bold text-slate-800">{formatCurrency(monthlyBudget / 30)}</span>
                                            </div>
                                            {/* Minimalist Progress Track */}
                                            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden mt-1.5">
                                                <div 
                                                    className="h-full bg-gradient-to-r from-[#FF5FA2] to-[#A855F7] rounded-full" 
                                                    style={{ width: `${Math.min(100, (todaySpent / (monthlyBudget / 30)) * 100)}%` }}
                                                />
                                            </div>
                                            <span className="text-[9px] text-slate-400 font-semibold mt-1 block text-right">
                                                {Math.min(100, (todaySpent / (monthlyBudget / 30)) * 100).toFixed(0)}% spent
                                            </span>
                                        </div>

                                        {/* Transactions Count */}
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center">
                                                    <Receipt className="w-4.5 h-4.5" />
                                                </div>
                                                <span className="text-xs text-slate-500 font-medium">Transactions</span>
                                            </div>
                                            <span className="text-xs font-bold text-slate-800">{todayCount} Today</span>
                                        </div>
                                    </div>
                                </div>

                                {/* 3. 3D DECORATIVE CHARACTER PANEL (Right/Spans 3 cols) */}
                                <div className="lg:col-span-3 bg-white rounded-[32px] border border-[#FF5FA2]/10 p-6 flex flex-col justify-center items-center shadow-sm relative overflow-hidden select-none">
                                    <div className="absolute -left-12 -bottom-12 w-28 h-28 bg-[#FFF0F7] rounded-full blur-xl pointer-events-none" />
                                    
                                    {/* Floating cute boy character asset */}
                                    <motion.div
                                        animate={{ y: [0, -6, 0] }}
                                        transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
                                        className="w-40 h-40 drop-shadow-md z-10"
                                    >
                                        <img src="/assets/character_3d.png" alt="Character 3D" className="w-full h-full object-contain" />
                                    </motion.div>
                                    
                                    {/* Speech Bubble Icon floating */}
                                    <motion.div 
                                        animate={{ scale: [1, 1.1, 1], y: [0, -3, 0] }}
                                        transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                                        className="absolute top-4 right-10 w-8 h-8 bg-white border border-[#FF5FA2]/10 rounded-full flex items-center justify-center shadow-sm text-red-400 text-xs"
                                    >
                                        ❤️
                                    </motion.div>
                                </div>

                            </section>

                            {/* GRID ROW 2: Transaction timeline feed & Budget pie summary */}
                            <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                                
                                {/* 1. RECENT TRANSACTIONS FEED (Left/Spans 5 cols) */}
                                <div className="lg:col-span-5 bg-white rounded-[32px] border border-[#FF5FA2]/10 p-6 shadow-sm flex flex-col justify-between">
                                    <div>
                                        <div className="flex justify-between items-center mb-6">
                                            <h4 className="text-sm font-bold text-slate-800">Recent Transactions</h4>
                                            <button 
                                                onClick={() => setCurrentTab('expenses')}
                                                className="text-xs font-bold text-[#FF5FA2] hover:text-[#A855F7] transition-all hover:underline"
                                            >
                                                View All
                                            </button>
                                        </div>

                                        {filteredExpenses.length === 0 ? (
                                            <div className="py-14 text-center flex flex-col items-center justify-center">
                                                <div className="w-10 h-10 rounded-2xl bg-[#FFF0F7] flex items-center justify-center text-[#FF5FA2] mb-3">
                                                    <FileText className="w-4.5 h-4.5" />
                                                </div>
                                                <p className="text-xs font-bold text-slate-500">Awaiting transactions</p>
                                                <p className="text-[10px] text-slate-400 mt-1">Log expenses to populate this ledger feed.</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                {filteredExpenses.slice(0, 4).map((exp) => {
                                                    const CategoryIcon = CATEGORY_ICONS[exp.category] || Coins;
                                                    return (
                                                        <motion.div 
                                                            key={exp.id}
                                                            whileHover={{ x: 2 }}
                                                            className="flex items-center justify-between gap-3 p-1 rounded-xl transition-all"
                                                        >
                                                            <div className="flex items-center gap-3.5 min-w-0">
                                                                <div 
                                                                    className="w-9 h-9 rounded-xl flex items-center justify-center border border-white shrink-0 shadow-sm" 
                                                                    style={{ 
                                                                        backgroundColor: `${CATEGORY_COLORS[exp.category]}15`, 
                                                                        color: CATEGORY_COLORS[exp.category],
                                                                        borderColor: `${CATEGORY_COLORS[exp.category]}20`
                                                                    }}
                                                                >
                                                                    <CategoryIcon className="w-4 h-4" />
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <p className="text-[13px] font-bold text-slate-800 truncate">
                                                                        {exp.description || 'N/A'}
                                                                    </p>
                                                                    <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider block mt-0.5">
                                                                        {exp.category} · {formatDate(exp.date)}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-1.5 shrink-0">
                                                                <span className="text-xs font-bold text-[#FF5FA2]">-{formatCurrency(exp.amount)}</span>
                                                                <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                                                            </div>
                                                        </motion.div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                    
                                    <button 
                                        onClick={handleOpenAdd}
                                        className="w-full mt-6 py-2.5 bg-[#FFF0F7] hover:bg-[#FFF0F7]/80 text-[#FF5FA2] font-semibold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Log New Expense
                                    </button>
                                </div>

                                {/* 2. BUDGET OVERVIEW CHART (Right/Spans 7 cols) */}
                                <div className="lg:col-span-7 bg-white rounded-[32px] border border-[#FF5FA2]/10 p-6 shadow-sm flex flex-col justify-between">
                                    <div>
                                        <div className="flex justify-between items-center mb-4">
                                            <h4 className="text-sm font-bold text-slate-800">Budget Overview</h4>
                                            
                                            {/* WEEK vs MONTH Filter Toggle Dropdown */}
                                            <select 
                                                value={budgetPeriod}
                                                onChange={(e) => setBudgetPeriod(e.target.value)}
                                                className="text-xs bg-[#FFF0F7] border border-[#FF5FA2]/10 text-[#FF5FA2] font-bold px-2 py-1 rounded-lg focus:outline-none cursor-pointer"
                                            >
                                                <option value="month">This Month</option>
                                                <option value="week">This Week</option>
                                            </select>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                                            {/* Categories list progress (7 cols) */}
                                            <div className="md:col-span-7 space-y-4">
                                                {periodSummary.every(cat => cat.totalAmount === 0) ? (
                                                    <p className="text-xs text-slate-400 leading-normal py-6">No expenses logged for this period.</p>
                                                ) : (
                                                    periodSummary.filter(cat => cat.totalAmount > 0).map((cat, idx) => {
                                                        // Allocation limit calculated dynamically
                                                        const allocPercent = categoryAllocations[cat.category] || 20;
                                                        const allocatedCategoryBudget = periodData.budget * (allocPercent / 100);
                                                        const amt = parseFloat(cat.totalAmount);
                                                        const pct = Math.min(100, (amt / allocatedCategoryBudget) * 100);
                                                        return (
                                                            <div key={idx} className="space-y-1.5">
                                                                <div className="flex justify-between text-xs font-semibold text-slate-500">
                                                                    <span className="flex items-center gap-1.5 font-medium">
                                                                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[cat.category] }} />
                                                                        {cat.category}
                                                                    </span>
                                                                    <span className="font-bold text-slate-700">{formatCurrency(amt)} <span className="text-[10px] text-slate-400">/ {formatCurrency(allocatedCategoryBudget)}</span></span>
                                                                </div>
                                                                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                                                    <div 
                                                                        className="h-full rounded-full transition-all duration-300" 
                                                                        style={{ 
                                                                            backgroundColor: CATEGORY_COLORS[cat.category],
                                                                            width: `${pct}%`
                                                                        }}
                                                                    />
                                                                </div>
                                                            </div>
                                                        );
                                                    })
                                                )}
                                            </div>

                                            {/* Donut Chart visual display (5 cols) */}
                                            <div className="md:col-span-5 flex flex-col items-center justify-center relative select-none">
                                                <div className="h-40 w-40 flex items-center justify-center relative">
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <PieChart>
                                                            <Pie
                                                                data={getPieData()}
                                                                innerRadius={50}
                                                                outerRadius={68}
                                                                paddingAngle={4}
                                                                dataKey="value"
                                                            >
                                                                {getPieData().map((entry, idx) => (
                                                                    <Cell key={`cell-${idx}`} fill={entry.color} />
                                                                ))}
                                                            </Pie>
                                                        </PieChart>
                                                    </ResponsiveContainer>
                                                    
                                                    {/* Central label inside donut */}
                                                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-2">
                                                        <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Spent {budgetPeriod === 'week' ? 'Week' : 'Month'}</span>
                                                        <span className="text-[13px] font-black text-slate-800 mt-0.5 truncate max-w-full">{formatCurrency(periodData.spent)}</span>
                                                        <span className="text-[9px] text-[#FF5FA2] font-bold mt-0.5">
                                                            {periodData.usagePercent.toFixed(0)}% used
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="border-t border-slate-100 pt-4 mt-4 flex justify-between items-center">
                                        {!isEditingBudget ? (
                                            <>
                                                <span className="text-xs text-slate-500 font-medium">Monthly budget limit: <strong className="text-slate-800 font-bold">{formatCurrency(monthlyBudget)}</strong></span>
                                                <button onClick={() => { setNewBudgetVal(monthlyBudget.toString()); setIsEditingBudget(true); }} className="text-xs font-bold text-[#FF5FA2] hover:text-[#A855F7] tracking-wide">Configure</button>
                                            </>
                                        ) : (
                                            <div className="flex items-center gap-3 w-full">
                                                <input 
                                                    type="number"
                                                    value={newBudgetVal}
                                                    onChange={(e) => setNewBudgetVal(e.target.value)}
                                                    className="flex-1 bg-white border border-[#FF5FA2]/20 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#FF5FA2]/30"
                                                />
                                                <button onClick={saveBudget} className="text-emerald-600 hover:text-emerald-500 font-bold text-xs">SAVE</button>
                                                <span className="text-slate-300">|</span>
                                                <button onClick={() => setIsEditingBudget(false)} className="text-slate-400 hover:text-slate-650 text-xs">CANCEL</button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                            </section>

                            {/* GRID ROW 3: Savings Goals & Smart Insights */}
                            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                
                                {/* 1. SAVINGS GOAL CARD (Fully Changeable) */}
                                <div className="bg-white rounded-[32px] border border-[#FF5FA2]/10 p-6 shadow-sm flex flex-col justify-between relative overflow-hidden select-none">
                                    <div className="absolute -right-6 -bottom-6 w-20 h-20 bg-[#FFF0F7] rounded-full blur-lg pointer-events-none" />
                                    
                                    <div className="flex justify-between items-center mb-4">
                                        <h4 className="text-sm font-bold text-slate-800">Savings Goal</h4>
                                        <button 
                                            onClick={() => {
                                                if (primaryGoal.name !== 'None') {
                                                    handleOpenEditGoal(primaryGoal);
                                                } else {
                                                    handleOpenCreateGoal();
                                                }
                                            }} 
                                            className="text-xs font-bold text-[#FF5FA2] hover:text-[#A855F7] tracking-wide"
                                        >
                                            Edit Goal
                                        </button>
                                    </div>

                                    {primaryGoal.name === 'None' ? (
                                        <div className="py-6 text-center">
                                            <p className="text-xs text-slate-400 font-medium mb-3">No savings goal set.</p>
                                            <button 
                                                onClick={handleOpenCreateGoal}
                                                className="px-3.5 py-2 bg-[#FFF0F7] text-[#FF5FA2] text-xs font-bold rounded-xl active:scale-95 transition-all"
                                            >
                                                Create Goal
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-5 p-2.5 bg-[#FFF0F7]/20 border border-[#FF5FA2]/5 rounded-3xl relative">
                                            {/* Dynamic Icon Illustration */}
                                            <div className="w-16 h-16 rounded-2xl bg-white border border-[#FF5FA2]/10 p-1 flex items-center justify-center shrink-0 shadow-sm relative z-10">
                                                {/* If icon is '✈️' show the island rendering, otherwise a text emoji */}
                                                {primaryGoal.icon === '✈️' ? (
                                                    <img src="/assets/island_3d.png" alt="Island" className="w-full h-full object-contain" />
                                                ) : (
                                                    <span className="text-3xl">{primaryGoal.icon}</span>
                                                )}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-baseline mb-1">
                                                    <span className="text-xs font-bold text-slate-800 truncate">{primaryGoal.name} {primaryGoal.icon !== '✈️' && primaryGoal.icon}</span>
                                                    <span className="text-[10px] font-bold text-slate-400 shrink-0">{formatCurrency(primaryGoal.saved)} / {formatCurrency(primaryGoal.target)}</span>
                                                </div>
                                                
                                                {/* Goal Progress bar */}
                                                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden mt-1.5">
                                                    <div 
                                                        className="h-full bg-gradient-to-r from-[#FF5FA2] to-[#A855F7] rounded-full transition-all duration-300" 
                                                        style={{ width: `${savingsGoalProgress}%` }}
                                                    />
                                                </div>

                                                <span className="text-[10px] font-bold text-slate-450 mt-1.5 block">
                                                    {savingsGoalProgress.toFixed(0)}% Completed {primaryGoal.completed && '🎉'}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* 2. SMART INSIGHTS CARD */}
                                <div className="bg-white rounded-[32px] border border-[#FF5FA2]/10 p-6 shadow-sm flex flex-col justify-between select-none">
                                    <div className="flex justify-between items-center mb-4">
                                        <h4 className="text-sm font-bold text-slate-800">Smart Insights</h4>
                                        <button 
                                            onClick={() => setIsInsightsModalOpen(true)}
                                            className="text-xs font-bold text-[#FF5FA2] hover:text-[#A855F7] hover:underline transition-all"
                                        >
                                            View All
                                        </button>
                                    </div>

                                    <div className="flex items-start gap-4 p-4 bg-[#FFF0F7]/30 border border-[#FF5FA2]/5 rounded-3xl">
                                        <div className="w-10 h-10 rounded-2xl bg-white border border-[#FF5FA2]/10 flex items-center justify-center text-[#FF5FA2] shrink-0 shadow-sm">
                                            <Sparkles className="w-5 h-5" />
                                        </div>
                                        <div className="space-y-1">
                                            <h5 className="text-xs font-bold text-slate-800">You are doing great!</h5>
                                            <p className="text-[11px] text-slate-550 leading-relaxed">
                                                You've spent <strong className="text-[#FF5FA2] font-semibold">12% less</strong> this week compared to your average weekly spending. Food remains your highest budget segment.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                            </section>
                        </motion.main>
                    )}

                    {/* tab 2: TIMELINE ACTIVITY TRANSACTIONS */}
                    {currentTab === 'expenses' && (
                        <motion.main 
                            key="expenses-tab"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.35, cubicBezier: [0.16, 1, 0.3, 1] }}
                            className="max-w-4xl w-full mx-auto space-y-6 relative z-10"
                        >
                            <div className="bg-white rounded-[32px] border border-[#FF5FA2]/10 p-6 shadow-sm">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 border-b border-slate-100 pb-6">
                                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1 max-w-xl">
                                        <div className="relative flex-1">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                                <Search className="w-4 h-4" />
                                            </div>
                                            <input 
                                                type="text" 
                                                placeholder="Search workspace transaction feed..."
                                                value={searchQuery}
                                                onChange={(e) => { setSearchQuery(e.target.value); setTimelinePage(1); }}
                                                className="w-full pl-9 pr-4 py-2 bg-white border border-[#FF5FA2]/10 rounded-xl text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#FF5FA2]/20 focus:border-[#FF5FA2] text-sm shadow-sm"
                                            />
                                        </div>

                                        <div className="relative min-w-[150px]">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                                <Filter className="w-4 h-4" />
                                            </div>
                                            <select 
                                                value={categoryFilter}
                                                onChange={(e) => { setCategoryFilter(e.target.value); setTimelinePage(1); }}
                                                className="w-full pl-9 pr-8 py-2 bg-white border border-[#FF5FA2]/10 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#FF5FA2]/20 focus:border-[#FF5FA2] text-sm appearance-none shadow-sm cursor-pointer"
                                            >
                                                <option value="">All Categories</option>
                                                {CATEGORIES.map(cat => (
                                                    <option key={cat.name} value={cat.name}>{cat.name}</option>
                                                ))}
                                            </select>
                                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                                                <ChevronDown className="w-3.5 h-3.5" />
                                            </div>
                                        </div>
                                    </div>

                                    <button 
                                        onClick={() => exportToCSV(filteredExpenses)}
                                        className="px-4 py-2 bg-white hover:bg-slate-50 active:scale-95 text-slate-500 hover:text-slate-700 font-semibold text-sm rounded-xl border border-[#FF5FA2]/10 flex items-center gap-1.5 transition-all shadow-sm"
                                    >
                                        <Download className="w-4 h-4 text-[#FF5FA2]" />
                                        Export CSV
                                    </button>
                                </div>

                                {paginatedDates.length === 0 ? (
                                    <div className="py-20 text-center text-slate-400 flex flex-col items-center justify-center space-y-3">
                                        <div className="w-12 h-12 rounded-2xl bg-[#FFF0F7] flex items-center justify-center text-[#FF5FA2]">
                                            <FileText className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-slate-655">No Ledger Activities Found</p>
                                            <p className="text-[10px] text-slate-400 mt-0.5">
                                                A feed of grouped daily transactions will render here once logged.
                                            </p>
                                        </div>
                                        <button 
                                            onClick={handleOpenAdd}
                                            className="mt-4 px-4 py-2.5 bg-gradient-to-tr from-[#FF5FA2] to-[#A855F7] text-white text-xs font-semibold rounded-xl shadow-md shadow-[#FF5FA2]/15 active:scale-95 transition-all"
                                        >
                                            Create Transaction Entry
                                        </button>
                                    </div>
                                ) : (
                                    <div className="relative border-l border-slate-100 pl-6 ml-4 space-y-8">
                                        {paginatedDates.map((dateStr) => {
                                            const dayExpenses = groupedExpenses[dateStr];
                                            const formattedDayTitle = dateStr === todayStr ? 'Today' : formatDate(dateStr);
                                            
                                            return (
                                                <div key={dateStr} className="relative">
                                                    <span className="absolute -left-[29px] top-1.5 w-2 h-2 rounded-full bg-[#FF5FA2] ring-4 ring-[#FFF7FB]" />

                                                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#FF5FA2] mb-4">
                                                        {formattedDayTitle}
                                                    </h4>

                                                    <div className="space-y-3">
                                                        {dayExpenses.map((exp) => {
                                                            const CategoryIcon = CATEGORY_ICONS[exp.category] || Coins;
                                                            return (
                                                                <motion.div 
                                                                    key={exp.id}
                                                                    whileHover={{ x: 2 }}
                                                                    className="p-4 bg-white border border-[#FF5FA2]/5 rounded-2xl flex items-center justify-between gap-4 transition-all shadow-sm"
                                                                >
                                                                    <div className="flex items-center gap-3.5 min-w-0">
                                                                        <div 
                                                                            className="w-9 h-9 rounded-xl flex items-center justify-center border border-white shrink-0 shadow-sm" 
                                                                            style={{ 
                                                                                backgroundColor: `${CATEGORY_COLORS[exp.category]}15`, 
                                                                                color: CATEGORY_COLORS[exp.category],
                                                                                borderColor: `${CATEGORY_COLORS[exp.category]}20`
                                                                            }}
                                                                        >
                                                                            <CategoryIcon className="w-4 h-4" />
                                                                        </div>
                                                                        <div className="min-w-0">
                                                                            <p className="text-sm font-bold text-slate-800 truncate">
                                                                                {exp.description || 'N/A'}
                                                                            </p>
                                                                            <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider block mt-0.5">
                                                                                {exp.category}
                                                                            </span>
                                                                        </div>
                                                                    </div>

                                                                    <div className="flex items-center gap-4">
                                                                        <p className="text-sm font-bold text-slate-800">
                                                                            -{formatCurrency(exp.amount)}
                                                                        </p>
                                                                        <div className="flex items-center gap-1 border-l border-slate-100 pl-3">
                                                                            <button 
                                                                                onClick={() => handleOpenEdit(exp)}
                                                                                className="p-1 rounded text-slate-400 hover:text-[#FF5FA2] transition-colors"
                                                                            >
                                                                                <Edit2 className="w-3.5 h-3.5" />
                                                                            </button>
                                                                            <button 
                                                                                onClick={() => handleDelete(exp.id)}
                                                                                className="p-1 rounded text-slate-400 hover:text-rose-500 transition-colors"
                                                                            >
                                                                                <Trash2 className="w-3.5 h-3.5" />
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                </motion.div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                                
                                {/* Timeline Pagination */}
                                {totalTimelinePages > 1 && (
                                    <div className="flex items-center justify-between border-t border-slate-100 pt-6 mt-6">
                                        <span className="text-xs text-slate-400 font-medium">
                                            Page {timelinePage} of {totalTimelinePages} ({sortedGroupDates.length} days total)
                                        </span>
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={() => setTimelinePage(prev => Math.max(1, prev - 1))}
                                                disabled={timelinePage === 1}
                                                className="p-2 rounded-xl border border-[#FF5FA2]/10 bg-white text-slate-400 hover:text-[#FF5FA2] hover:bg-[#FFF0F7]/40 disabled:opacity-40 disabled:pointer-events-none transition-all shadow-sm"
                                            >
                                                <ChevronLeft className="w-4 h-4" />
                                            </button>
                                            <button 
                                                onClick={() => setTimelinePage(prev => Math.min(totalTimelinePages, prev + 1))}
                                                disabled={timelinePage === totalTimelinePages}
                                                className="p-2 rounded-xl border border-[#FF5FA2]/10 bg-white text-slate-400 hover:text-[#FF5FA2] hover:bg-[#FFF0F7]/40 disabled:opacity-40 disabled:pointer-events-none transition-all shadow-sm"
                                            >
                                                <ChevronRight className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.main>
                    )}

                    {/* tab 3: BUDGET WORKSPACE SCREEN */}
                    {currentTab === 'budget' && (
                        <motion.main 
                            key="budget-tab"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.35 }}
                            className="space-y-6 max-w-4xl w-full mx-auto relative z-10"
                        >
                            <div className="bg-white rounded-[32px] border border-[#FF5FA2]/10 p-6 shadow-sm">
                                <h3 className="text-lg font-bold text-slate-800 mb-6">Budget Manager</h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                                    {/* Edit Base Budget Card */}
                                    <div className="p-6 bg-[#FFF0F7]/25 border border-[#FF5FA2]/10 rounded-3xl space-y-4">
                                        <h4 className="text-sm font-bold text-slate-700">Total Monthly Budget</h4>
                                        <div className="text-3xl font-black text-[#FF5FA2]">{formatCurrency(monthlyBudget)}</div>
                                        <p className="text-xs text-slate-500">This budget limit configures daily spent limits and alerts.</p>
                                        
                                        <div className="pt-2">
                                            {!isEditingBudget ? (
                                                <button 
                                                    onClick={() => { setNewBudgetVal(monthlyBudget.toString()); setIsEditingBudget(true); }}
                                                    className="px-4 py-2 bg-white border border-[#FF5FA2]/15 text-[#FF5FA2] text-xs font-bold rounded-xl hover:bg-[#FFF0F7]/45 transition-all shadow-sm"
                                                >
                                                    Change Limit
                                                </button>
                                            ) : (
                                                <div className="flex gap-2">
                                                    <input 
                                                        type="number"
                                                        value={newBudgetVal}
                                                        onChange={(e) => setNewBudgetVal(e.target.value)}
                                                        className="w-32 bg-white border border-[#FF5FA2]/20 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none"
                                                    />
                                                    <button onClick={saveBudget} className="px-3 bg-emerald-650 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all">Save</button>
                                                    <button onClick={() => setIsEditingBudget(false)} className="px-3 text-slate-400 hover:text-slate-600 text-xs transition-all">Cancel</button>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Category Budget Share Allocations */}
                                    <div className="p-6 bg-white border border-[#FF5FA2]/10 rounded-3xl space-y-4">
                                        <div className="flex justify-between items-center mb-2">
                                            <h4 className="text-sm font-bold text-slate-700">Category Budgets Allocation</h4>
                                            {!isEditingAllocations ? (
                                                <button 
                                                    onClick={() => { setEditAllocations({ ...categoryAllocations }); setIsEditingAllocations(true); }}
                                                    className="text-xs font-bold text-[#FF5FA2] hover:underline"
                                                >
                                                    Edit Shares
                                                </button>
                                            ) : (
                                                <div className="flex items-center gap-2 text-xs">
                                                    <button onClick={handleSaveAllocations} className="text-emerald-650 hover:underline font-bold">SAVE</button>
                                                    <span className="text-slate-350">|</span>
                                                    <button onClick={() => setIsEditingAllocations(false)} className="text-slate-400 hover:underline">CANCEL</button>
                                                </div>
                                            )}
                                        </div>

                                        <div className="space-y-3">
                                            {Object.keys(categoryAllocations).map((catName) => {
                                                const currentSpent = periodSummary.find(c => c.category === catName)?.totalAmount || 0;
                                                const allocLimit = monthlyBudget * ((isEditingAllocations ? editAllocations[catName] : categoryAllocations[catName]) / 100);
                                                
                                                return (
                                                    <div key={catName} className="space-y-1.5">
                                                        <div className="flex justify-between items-center text-xs font-semibold text-slate-500">
                                                            <span className="flex items-center gap-1.5">
                                                                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[catName] }} />
                                                                {catName}
                                                            </span>
                                                            <span className="font-bold text-slate-755">
                                                                {isEditingAllocations ? (
                                                                    <div className="flex items-center gap-1">
                                                                        <input 
                                                                            type="number"
                                                                            value={editAllocations[catName] || ''}
                                                                            onChange={(e) => setEditAllocations({ ...editAllocations, [catName]: parseFloat(e.target.value) || 0 })}
                                                                            className="w-12 text-center bg-slate-50 border border-slate-200 rounded p-0.5 text-xs text-slate-700"
                                                                        />
                                                                        <span>%</span>
                                                                    </div>
                                                                ) : (
                                                                    `${categoryAllocations[catName]}% (${formatCurrency(allocLimit)})`
                                                                )}
                                                            </span>
                                                        </div>
                                                        {!isEditingAllocations && (
                                                            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                                                <div 
                                                                    className="h-full rounded-full transition-all duration-300"
                                                                    style={{ 
                                                                        backgroundColor: CATEGORY_COLORS[catName], 
                                                                        width: `${Math.min(100, (currentSpent / allocLimit) * 100)}%` 
                                                                    }}
                                                                />
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.main>
                    )}

                    {/* tab 4: SAVINGS GOALS WORKSPACE */}
                    {currentTab === 'goals' && (
                        <motion.main 
                            key="goals-tab"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.35 }}
                            className="space-y-6 max-w-4xl w-full mx-auto relative z-10"
                        >
                            <div className="bg-white rounded-[32px] border border-[#FF5FA2]/10 p-6 shadow-sm">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-lg font-bold text-slate-800">Savings Goals Workspace</h3>
                                    <button 
                                        onClick={handleOpenCreateGoal}
                                        className="px-4 py-2 bg-gradient-to-tr from-[#FF5FA2] to-[#A855F7] text-white text-xs font-bold rounded-xl active:scale-95 transition-all flex items-center gap-1.5 shadow-sm"
                                    >
                                        <Plus className="w-4 h-4" /> Add Goal
                                    </button>
                                </div>

                                {savingsGoals.length === 0 ? (
                                    <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center">
                                        <PiggyBank className="w-12 h-12 text-[#FF5FA2] mb-3" />
                                        <p className="text-xs font-bold text-slate-550">No Active Savings Goals</p>
                                        <p className="text-[10px] text-slate-400 mt-1">Set a savings goal to keep your progress on track.</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {savingsGoals.map((g) => {
                                            const progress = Math.min(100, (g.saved / g.target) * 100);
                                            return (
                                                <div 
                                                    key={g.id} 
                                                    className="p-5 bg-white border border-[#FF5FA2]/10 rounded-3xl relative flex flex-col justify-between shadow-sm select-none"
                                                >
                                                    <div className="flex justify-between items-start gap-2 mb-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-12 h-12 rounded-2xl bg-[#FFF0F7] border border-[#FF5FA2]/10 flex items-center justify-center text-2xl shadow-sm shrink-0">
                                                                {g.icon}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <h4 className="text-sm font-bold text-slate-800 truncate">{g.name}</h4>
                                                                <span className="text-[10px] text-slate-400 font-bold">Target: {formatCurrency(g.target)}</span>
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-1.5 shrink-0">
                                                            <button 
                                                                onClick={() => handleOpenEditGoal(g)}
                                                                className="p-1 rounded bg-[#FFF0F7] text-[#FF5FA2] hover:text-[#A855F7] transition-all"
                                                                title="Edit"
                                                            >
                                                                <Edit2 className="w-3.5 h-3.5" />
                                                            </button>
                                                            <button 
                                                                onClick={() => handleDeleteGoal(g.id)}
                                                                className="p-1 rounded bg-rose-50 text-rose-500 hover:text-rose-600 transition-all"
                                                                title="Remove"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-1 mt-2">
                                                        <div className="flex justify-between text-[11px] font-bold text-slate-450">
                                                            <span>Goal Progress</span>
                                                            <span>{formatCurrency(g.saved)} ({progress.toFixed(0)}%)</span>
                                                        </div>
                                                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden mt-1">
                                                            <div 
                                                                className="h-full bg-gradient-to-r from-[#FF5FA2] to-[#A855F7] rounded-full transition-all duration-300"
                                                                style={{ width: `${progress}%` }}
                                                            />
                                                        </div>
                                                        {g.completed && (
                                                            <span className="text-[9px] text-[#10B981] font-bold mt-1.5 block">Goal Completed! 🎉</span>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </motion.main>
                    )}

                    {/* tab 5: ANALYTICS & INSIGHTS CURVES */}
                    {currentTab === 'analytics' && (
                        <motion.main 
                            key="analytics-tab"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.35 }}
                            className="space-y-6 max-w-4xl w-full mx-auto relative z-10"
                        >
                            <div className="bg-white rounded-[32px] border border-[#FF5FA2]/10 p-6 shadow-sm space-y-8">
                                <h3 className="text-lg font-bold text-slate-800">Financial Analytics</h3>

                                {/* Chart Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="p-4 bg-white border border-[#FF5FA2]/5 rounded-3xl shadow-sm">
                                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-550 mb-4">Spending curve (This Month)</h4>
                                        <div className="h-56 w-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart data={getChartData()} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                                                    <defs>
                                                        <linearGradient id="curveColor" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#FF5FA2" stopOpacity={0.12}/>
                                                            <stop offset="95%" stopColor="#FF5FA2" stopOpacity={0}/>
                                                        </linearGradient>
                                                    </defs>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                                    <XAxis dataKey="day" stroke="#94a3b8" fontSize={9} tickLine={false} axisLine={false} />
                                                    <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} axisLine={false} />
                                                    <Tooltip formatter={(v) => [`₹${v}`, 'Spent']} />
                                                    <Area type="monotone" dataKey="amount" stroke="#FF5FA2" strokeWidth={2} fillOpacity={1} fill="url(#curveColor)" />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>

                                    <div className="p-4 bg-white border border-[#FF5FA2]/5 rounded-3xl shadow-sm flex flex-col justify-between">
                                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-550 mb-2">Category Spread</h4>
                                        <div className="h-44 w-full flex items-center justify-center relative">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie
                                                        data={getPieData()}
                                                        innerRadius={45}
                                                        outerRadius={65}
                                                        paddingAngle={4}
                                                        dataKey="value"
                                                    >
                                                        {getPieData().map((entry, idx) => (
                                                            <Cell key={`cell-${idx}`} fill={entry.color} />
                                                        ))}
                                                    </Pie>
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </div>
                                        
                                        <div className="flex flex-wrap gap-x-4 gap-y-2 justify-center pb-2">
                                            {periodSummary.filter(cat => cat.totalAmount > 0).map((cat) => (
                                                <div key={cat.category} className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-550">
                                                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[cat.category] }} />
                                                    {cat.category} ({formatCurrency(cat.totalAmount)})
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.main>
                    )}

                    {/* tab 6: MONTHLY CALENDAR SCREEN */}
                    {currentTab === 'calendar' && (
                        <motion.main 
                            key="calendar-tab"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.35 }}
                            className="space-y-6 max-w-4xl w-full mx-auto relative z-10"
                        >
                            <div className="bg-white rounded-[32px] border border-[#FF5FA2]/10 p-6 shadow-sm">
                                <h3 className="text-lg font-bold text-slate-800 mb-6">Activity Calendar</h3>

                                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
                                    {/* Monthly Calendar Grid (7 cols) */}
                                    <div className="md:col-span-8 p-4 bg-white border border-slate-100 rounded-[24px]">
                                        <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
                                            <span>Sun</span>
                                            <span>Mon</span>
                                            <span>Tue</span>
                                            <span>Wed</span>
                                            <span>Thu</span>
                                            <span>Fri</span>
                                            <span>Sat</span>
                                        </div>

                                        <div className="grid grid-cols-7 gap-2">
                                            {getCalendarDays().map((cell, idx) => {
                                                const hasTransactions = cell.dateStr && expenses.some(e => e.date === cell.dateStr);
                                                const isSelected = cell.dateStr && selectedCalendarDate === cell.dateStr;
                                                return (
                                                    <button 
                                                        key={idx}
                                                        onClick={() => { if(cell.dateStr) setSelectedCalendarDate(cell.dateStr); }}
                                                        disabled={!cell.day}
                                                        className={`h-10 rounded-xl flex flex-col items-center justify-center relative text-xs font-semibold select-none transition-all ${
                                                            !cell.day ? 'bg-transparent' :
                                                            isSelected ? 'bg-[#FF5FA2] text-white shadow shadow-[#FF5FA2]/20' :
                                                            'bg-slate-50 text-slate-700 hover:bg-[#FFF0F7] hover:text-[#FF5FA2]'
                                                        }`}
                                                    >
                                                        <span>{cell.day}</span>
                                                        {hasTransactions && (
                                                            <span className={`absolute bottom-1.5 w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-[#FF5FA2]'}`} />
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Transactions list on selected date (4 cols) */}
                                    <div className="md:col-span-4 p-5 bg-white border border-[#FF5FA2]/10 rounded-[24px] space-y-4 min-h-[300px]">
                                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                            Log on: {selectedCalendarDate ? formatDate(selectedCalendarDate) : 'Select date'}
                                        </h4>

                                        {(() => {
                                            const dayExpenses = expenses.filter(e => e.date === selectedCalendarDate);
                                            if (dayExpenses.length === 0) {
                                                return <p className="text-xs text-slate-400 font-medium py-10 text-center">No transaction records on this day.</p>;
                                            }
                                            return (
                                                <div className="space-y-3">
                                                    {dayExpenses.map((exp) => (
                                                        <div key={exp.id} className="p-3 bg-slate-50 rounded-2xl flex items-center justify-between text-xs border border-slate-100">
                                                            <div className="min-w-0">
                                                                <p className="font-bold text-slate-800 truncate">{exp.description || 'N/A'}</p>
                                                                <span className="text-[9px] uppercase font-bold text-slate-450 tracking-wider block mt-0.5">{exp.category}</span>
                                                            </div>
                                                            <span className="font-bold text-[#FF5FA2] shrink-0">-{formatCurrency(exp.amount)}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            );
                                        })()}
                                    </div>
                                </div>
                            </div>
                        </motion.main>
                    )}

                    {currentTab === 'account' && (
                        <motion.main 
                            key="account-tab"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.35 }}
                            className="space-y-6 max-w-4xl w-full mx-auto relative z-10"
                        >
                            <div className="bg-white rounded-[32px] border border-[#FF5FA2]/10 p-8 shadow-sm">
                                <div className="flex flex-col md:flex-row items-center gap-6 pb-6 border-b border-slate-100 mb-8">
                                    <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-[#FF5FA2] to-[#A855F7] flex items-center justify-center text-white font-black text-3xl shadow-md shadow-[#FF5FA2]/20">
                                        {user?.username?.substring(0, 2).toUpperCase() || 'AN'}
                                    </div>
                                    <div className="text-center md:text-left space-y-1">
                                        <h3 className="text-2xl font-black text-slate-800">{user?.username?.toUpperCase() || 'ANISH12'}</h3>
                                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest flex items-center justify-center md:justify-start gap-2">
                                            Premium Workspace Member <span className="w-1.5 h-1.5 rounded-full bg-[#FF5FA2]" />
                                        </p>
                                        <p className="text-xs text-slate-500">{user?.email || 'anish@example.com'}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="p-6 bg-[#FFF0F7]/20 border border-[#FF5FA2]/10 rounded-3xl space-y-4">
                                        <h4 className="text-sm font-bold text-slate-800">Account Details</h4>
                                        <div className="space-y-4">
                                            <div className="space-y-1">
                                                <label className="text-[10px] uppercase font-bold text-slate-450 tracking-wider">Username</label>
                                                <input 
                                                    type="text" 
                                                    value={editUsername}
                                                    onChange={(e) => setEditUsername(e.target.value)}
                                                    className="w-full px-4 py-2.5 bg-white border border-[#FF5FA2]/15 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#FF5FA2]/20 focus:border-[#FF5FA2] text-xs font-semibold"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] uppercase font-bold text-slate-450 tracking-wider">Email Address</label>
                                                <input 
                                                    type="email" 
                                                    value={editEmail}
                                                    onChange={(e) => setEditEmail(e.target.value)}
                                                    className="w-full px-4 py-2.5 bg-white border border-[#FF5FA2]/15 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#FF5FA2]/20 focus:border-[#FF5FA2] text-xs font-semibold"
                                                />
                                            </div>
                                            <div>
                                                <span className="text-[10px] uppercase font-bold text-slate-450 tracking-wider block">Subscription Plan</span>
                                                <p className="text-xs font-bold text-[#FF5FA2] mt-1.5 flex items-center gap-1.5">
                                                    SaaS Premium Lifetime Access 🎉
                                                </p>
                                            </div>
                                            <button 
                                                onClick={handleUpdateProfile}
                                                className="w-full mt-2 py-2.5 bg-[#FF5FA2] hover:bg-[#FF5FA2]/90 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-sm active:scale-95"
                                            >
                                                Save Profile Details
                                            </button>
                                        </div>
                                    </div>

                                    <div className="p-6 bg-white border border-[#FF5FA2]/10 rounded-3xl space-y-4">
                                        <h4 className="text-sm font-bold text-slate-800">Workspace Statistics</h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="p-3 bg-slate-50 rounded-2xl">
                                                <span className="text-[9px] uppercase font-bold text-slate-400 block">Total Logged</span>
                                                <span className="text-lg font-black text-slate-800 mt-1 block">{expenses.length} Entries</span>
                                            </div>
                                            <div className="p-3 bg-slate-50 rounded-2xl">
                                                <span className="text-[9px] uppercase font-bold text-slate-400 block">Total Month Spent</span>
                                                <span className="text-lg font-black text-[#FF5FA2] mt-1 block">{formatCurrency(thisMonthSpent)}</span>
                                            </div>
                                            <div className="p-3 bg-slate-50 rounded-2xl">
                                                <span className="text-[9px] uppercase font-bold text-slate-400 block">Active Budget</span>
                                                <span className="text-lg font-black text-slate-800 mt-1 block">{formatCurrency(monthlyBudget)}</span>
                                            </div>
                                            <div className="p-3 bg-slate-50 rounded-2xl">
                                                <span className="text-[9px] uppercase font-bold text-slate-400 block">Savings Goals</span>
                                                <span className="text-lg font-black text-slate-800 mt-1 block">{savingsGoals.length} Active</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end">
                                    <button 
                                        onClick={logout}
                                        className="px-6 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-500 hover:text-rose-600 font-bold text-xs uppercase tracking-wider rounded-xl active:scale-95 transition-all flex items-center gap-2"
                                    >
                                        <LogOut className="w-4 h-4" />
                                        Log Out Account
                                    </button>
                                </div>
                            </div>
                        </motion.main>
                    )}

                </AnimatePresence>

                {/* FOOTER */}
                <footer className="mt-auto pt-16 pb-6 border-t border-[#FF5FA2]/5 text-center text-xs text-slate-400 select-none font-semibold">
                    <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-[#FF5FA2] to-[#A855F7] flex items-center justify-center text-white text-[10px] font-black">L</div>
                            <span className="font-extrabold text-[13px] text-slate-700 tracking-tight">LedgerSaaS</span>
                        </div>
                        <div className="flex items-center gap-5 font-semibold text-[11px] text-slate-400">
                            <a href="#features" className="hover:text-[#FF5FA2] transition-colors">Security</a>
                            <a href="#privacy" className="hover:text-[#FF5FA2] transition-colors">Privacy Policy</a>
                            <a href="#terms" className="hover:text-[#FF5FA2] transition-colors">Terms of Service</a>
                            <a href="#support" className="hover:text-[#FF5FA2] transition-colors">Support Portal</a>
                        </div>
                        <p className="text-[11px] text-slate-400">
                            Handcrafted for financial freedom. © 2026 LedgerSaaS Inc. All rights reserved.
                        </p>
                    </div>
                </footer>

                {/* Radix Dialog Form */}
                <ExpenseForm 
                    isOpen={isFormOpen} 
                    onClose={() => setIsFormOpen(false)} 
                    onSubmit={handleFormSubmit} 
                    initialData={editingExpense} 
                />

                {/* Premium Active Benefits Modal */}
                <AnimatePresence>
                    {isPremiumModalOpen && (
                        <>
                            {/* Overlay */}
                            <div className="fixed inset-0 z-[1000] bg-slate-950/20 backdrop-blur-xs" onClick={() => setIsPremiumModalOpen(false)} />
                            
                            {/* Dialog Content */}
                            <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95, y: 15 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: 15 }}
                                    className="relative w-full max-w-md overflow-hidden rounded-[28px] border border-[#FF5FA2]/15 bg-white p-6 shadow-xl select-none"
                                >
                                    <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
                                        <div className="flex items-center gap-2">
                                            <Sparkles className="w-5 h-5 text-[#FF5FA2]" />
                                            <h4 className="text-lg font-bold text-slate-800">
                                                Premium Workspace
                                            </h4>
                                        </div>
                                        <button 
                                            onClick={() => setIsPremiumModalOpen(false)} 
                                            className="rounded-lg p-1.5 text-slate-400 hover:bg-[#FFF0F7] hover:text-[#FF5FA2] active:scale-95 transition-all"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>

                                    <div className="space-y-4">
                                        <p className="text-xs text-slate-550 leading-relaxed">
                                            As a lifetime Premium Member, you have unrestricted access to all advanced features in this workspace:
                                        </p>
                                        
                                        <ul className="space-y-2.5 text-xs text-slate-700 font-semibold">
                                            <li className="flex items-center gap-2">
                                                <Check className="w-4 h-4 text-emerald-500" />
                                                <span>AI Smart Financial Insights</span>
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <Check className="w-4 h-4 text-emerald-500" />
                                                <span>Multi-Savings Goals Tracking</span>
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <Check className="w-4 h-4 text-emerald-500" />
                                                <span>Real-time Spending Curves</span>
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <Check className="w-4 h-4 text-emerald-500" />
                                                <span>Activity Calendar Previewer</span>
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <Check className="w-4 h-4 text-emerald-500" />
                                                <span>Unlimited Entries & CSV Exports</span>
                                            </li>
                                        </ul>
                                    </div>

                                    <div className="flex justify-end pt-4 border-t border-slate-100 mt-6 font-semibold">
                                        <button 
                                            onClick={() => setIsPremiumModalOpen(false)}
                                            className="px-5 py-2 bg-[#FFF0F7] hover:bg-[#FFF0F7]/80 text-[#FF5FA2] rounded-xl active:scale-95 transition-all text-xs uppercase tracking-wide"
                                        >
                                            Got it
                                        </button>
                                    </div>
                                </motion.div>
                            </div>
                        </>
                    )}
                </AnimatePresence>

                {/* Smart Insights Modal */}
                <AnimatePresence>
                    {isInsightsModalOpen && (
                        <>
                            {/* Overlay */}
                            <div className="fixed inset-0 z-[1000] bg-slate-950/20 backdrop-blur-xs" onClick={() => setIsInsightsModalOpen(false)} />
                            
                            {/* Dialog Content */}
                            <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95, y: 15 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: 15 }}
                                    className="relative w-full max-w-lg overflow-hidden rounded-[28px] border border-[#FF5FA2]/15 bg-white p-6 shadow-xl select-none"
                                >
                                    <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
                                        <div className="flex items-center gap-2">
                                            <Sparkles className="w-5 h-5 text-[#FF5FA2]" />
                                            <h4 className="text-lg font-bold text-slate-800">
                                                Smart AI Insights
                                            </h4>
                                        </div>
                                        <button 
                                            onClick={() => setIsInsightsModalOpen(false)} 
                                            className="rounded-lg p-1.5 text-slate-400 hover:bg-[#FFF0F7] hover:text-[#FF5FA2] active:scale-95 transition-all"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>

                                    <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
                                        {/* Insight 1 */}
                                        <div className="p-4 bg-[#FFF0F7]/30 border border-[#FF5FA2]/5 rounded-2xl flex gap-3.5 items-start">
                                            <div className="w-8 h-8 rounded-xl bg-white border border-[#FF5FA2]/10 flex items-center justify-center text-[#FF5FA2] shrink-0 shadow-sm mt-0.5">
                                                <TrendingDown className="w-4.5 h-4.5" />
                                            </div>
                                            <div className="space-y-1">
                                                <h5 className="text-xs font-bold text-slate-800">Weekly Spending is Down</h5>
                                                <p className="text-[11px] text-slate-550 leading-relaxed">
                                                    You've spent <strong className="text-[#FF5FA2] font-semibold">12% less</strong> this week compared to your average weekly spending. Food remains your highest budget segment, but it is well controlled.
                                                </p>
                                            </div>
                                        </div>

                                        {/* Insight 2 */}
                                        <div className="p-4 bg-purple-50/30 border border-purple-100 rounded-2xl flex gap-3.5 items-start">
                                            <div className="w-8 h-8 rounded-xl bg-white border border-purple-100 flex items-center justify-center text-purple-500 shrink-0 shadow-sm mt-0.5">
                                                <PiggyBank className="w-4.5 h-4.5" />
                                            </div>
                                            <div className="space-y-1">
                                                <h5 className="text-xs font-bold text-slate-800">Savings Target Accelerator</h5>
                                                <p className="text-[11px] text-slate-550 leading-relaxed">
                                                    Your savings goal <strong className="text-purple-500 font-semibold">{primaryGoal.name}</strong> is currently at {savingsGoalProgress.toFixed(0)}%. Contributing an extra ₹1,500 monthly will hit your goal 2 weeks ahead of schedule.
                                                </p>
                                            </div>
                                        </div>

                                        {/* Insight 3 */}
                                        <div className="p-4 bg-amber-50/30 border border-amber-100 rounded-2xl flex gap-3.5 items-start">
                                            <div className="w-8 h-8 rounded-xl bg-white border border-amber-100 flex items-center justify-center text-amber-550 shrink-0 shadow-sm mt-0.5">
                                                <AlertTriangle className="w-4.5 h-4.5" />
                                            </div>
                                            <div className="space-y-1">
                                                <h5 className="text-xs font-bold text-slate-800">Weekend Spending Concentration</h5>
                                                <p className="text-[11px] text-slate-550 leading-relaxed">
                                                    Our analysis reveals that <strong className="text-amber-550 font-semibold">45%</strong> of your monthly outlays are registered on weekends. Consider setting a custom weekend transaction cap.
                                                </p>
                                            </div>
                                        </div>

                                        {/* Insight 4 */}
                                        <div className="p-4 bg-emerald-50/30 border border-emerald-100 rounded-2xl flex gap-3.5 items-start">
                                            <div className="w-8 h-8 rounded-xl bg-white border border-emerald-100 flex items-center justify-center text-[#10B981] shrink-0 shadow-sm mt-0.5">
                                                <Percent className="w-4.5 h-4.5" />
                                            </div>
                                            <div className="space-y-1">
                                                <h5 className="text-xs font-bold text-slate-800">Budget Limit Utilization</h5>
                                                <p className="text-[11px] text-slate-550 leading-relaxed">
                                                    You have utilized <strong className="text-[#10B981] font-semibold">{(thisMonthSpent / monthlyBudget * 100).toFixed(0)}%</strong> of your total monthly budget of {formatCurrency(monthlyBudget)}. You have {formatCurrency(remainingBudget)} remaining to safely spend.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex justify-end pt-4 border-t border-slate-100 mt-6 font-semibold">
                                        <button 
                                            onClick={() => setIsInsightsModalOpen(false)}
                                            className="px-5 py-2 bg-gradient-to-r from-[#FF5FA2] to-[#A855F7] text-white rounded-xl active:scale-95 transition-all text-xs uppercase tracking-wide"
                                        >
                                            Got it
                                        </button>
                                    </div>
                                </motion.div>
                            </div>
                        </>
                    )}
                </AnimatePresence>

                {/* Radix Dialog Form */}
                <ExpenseForm 
                    isOpen={isFormOpen} 
                    onClose={() => setIsFormOpen(false)} 
                    onSubmit={handleFormSubmit} 
                    initialData={editingExpense} 
                />

                {/* Savings Goal Edit Details Modal */}
                <AnimatePresence>
                    {isEditingGoalModal && (
                        <>
                            {/* Overlay */}
                            <div className="fixed inset-0 z-50 bg-slate-950/20 backdrop-blur-xs" onClick={() => setIsEditingGoalModal(false)} />
                            
                            {/* Dialog Content */}
                            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95, y: 15 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: 15 }}
                                    className="relative w-full max-w-md overflow-hidden rounded-[28px] border border-[#FF5FA2]/15 bg-white p-6 shadow-xl select-none"
                                >
                                    <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
                                        <h4 className="text-lg font-bold text-slate-800">
                                            {currentEditingGoal ? 'Edit Savings Goal' : 'Add Savings Goal'}
                                        </h4>
                                        <button 
                                            onClick={() => setIsEditingGoalModal(false)} 
                                            className="rounded-lg p-1.5 text-slate-400 hover:bg-[#FFF0F7] hover:text-[#FF5FA2] active:scale-95 transition-all"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>

                                    <div className="space-y-4">
                                        {/* Goal Name */}
                                        <div className="space-y-1">
                                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Goal Name</label>
                                            <input 
                                                type="text" 
                                                value={goalForm.name}
                                                onChange={(e) => setGoalForm({ ...goalForm, name: e.target.value })}
                                                placeholder="Goa Trip, New MacBook, Savings..."
                                                className="w-full px-4 py-3 bg-white border border-[#FF5FA2]/15 rounded-2xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#FF5FA2]/20 focus:border-[#FF5FA2] text-sm font-medium"
                                            />
                                        </div>

                                        {/* Target Amount */}
                                        <div className="space-y-1">
                                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Target Amount (₹)</label>
                                            <input 
                                                type="number" 
                                                value={goalForm.target}
                                                onChange={(e) => setGoalForm({ ...goalForm, target: e.target.value })}
                                                placeholder="20000"
                                                className="w-full px-4 py-3 bg-white border border-[#FF5FA2]/15 rounded-2xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#FF5FA2]/20 focus:border-[#FF5FA2] text-sm font-medium"
                                            />
                                        </div>

                                        {/* Current Saved */}
                                        <div className="space-y-1">
                                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Amount Saved (₹)</label>
                                            <input 
                                                type="number" 
                                                value={goalForm.saved}
                                                onChange={(e) => setGoalForm({ ...goalForm, saved: e.target.value })}
                                                placeholder="12000"
                                                className="w-full px-4 py-3 bg-white border border-[#FF5FA2]/15 rounded-2xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#FF5FA2]/20 focus:border-[#FF5FA2] text-sm font-medium"
                                            />
                                        </div>

                                        {/* Goal Icon/Emoji */}
                                        <div className="space-y-1">
                                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Goal Icon / Emoji</label>
                                            <input 
                                                type="text" 
                                                value={goalForm.icon}
                                                onChange={(e) => setGoalForm({ ...goalForm, icon: e.target.value })}
                                                placeholder="✈️"
                                                maxLength="2"
                                                className="w-full px-4 py-3 bg-white border border-[#FF5FA2]/15 rounded-2xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#FF5FA2]/20 focus:border-[#FF5FA2] text-sm font-medium text-center text-xl"
                                            />
                                        </div>

                                        {/* Action buttons */}
                                        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
                                            <button 
                                                onClick={() => setIsEditingGoalModal(false)}
                                                className="px-5 py-2.5 text-slate-500 bg-slate-50 rounded-2xl hover:bg-slate-100 active:scale-95 transition-all text-sm font-semibold"
                                            >
                                                Cancel
                                            </button>
                                            <button 
                                                onClick={handleSaveGoal}
                                                className="px-5 py-2.5 text-white bg-gradient-to-r from-[#FF5FA2] to-[#A855F7] hover:opacity-95 rounded-2xl active:scale-95 shadow-md shadow-[#FF5FA2]/15 transition-all text-sm font-semibold"
                                            >
                                                Save Details
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            </div>
                        </>
                    )}
                </AnimatePresence>

                {/* Animated Toast alert notification */}
                {toast && (
                    <Toast 
                        message={toast.message} 
                        type={toast.type} 
                        onClose={() => setToast(null)} 
                    />
                )}
            </div>
        </div>
    );
};

export default Dashboard;
