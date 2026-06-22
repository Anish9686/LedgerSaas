import React, { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { X, IndianRupee, Tag, Calendar, FileText, Loader2 } from 'lucide-react';
import { CATEGORIES } from '../../utils';

const ExpenseForm = ({ isOpen, onClose, onSubmit, initialData }) => {
    const [formData, setFormData] = useState({
        amount: '',
        description: '',
        category: '',
        date: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (initialData) {
            setFormData({
                amount: initialData.amount || '',
                description: initialData.description || '',
                category: initialData.category || '',
                date: initialData.date || ''
            });
        } else {
            const today = new Date().toISOString().split('T')[0];
            setFormData({ amount: '', description: '', category: '', date: today });
        }
        setError('');
    }, [initialData, isOpen]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        
        const amountNum = parseFloat(formData.amount);
        if (isNaN(amountNum) || amountNum <= 0) {
            setError('Please enter a valid amount greater than zero.');
            return;
        }
        if (!formData.category) {
            setError('Please select a category.');
            return;
        }

        setLoading(true);
        try {
            await onSubmit(formData);
        } catch (err) {
            setError('Failed to save expense. Please verify details.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog.Root open={isOpen} onOpenChange={(open) => { if (!open && !loading) onClose(); }}>
            <AnimatePresence>
                {isOpen && (
                    <Dialog.Portal forceMount>
                        {/* Overlay */}
                        <Dialog.Overlay asChild>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="fixed inset-0 z-50 bg-slate-950/20 backdrop-blur-xs"
                            />
                        </Dialog.Overlay>

                        {/* Content Container */}
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                            <Dialog.Content asChild>
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95, y: 15 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: 15 }}
                                    transition={{ duration: 0.25, cubicBezier: [0.16, 1, 0.3, 1] }}
                                    className="relative w-full max-w-md overflow-hidden rounded-[28px] border border-[#FF5FA2]/15 bg-white p-6 shadow-xl select-none"
                                >
                                    {/* Header */}
                                    <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
                                        <Dialog.Title className="text-lg font-bold text-slate-800">
                                            {initialData ? 'Edit Entry' : 'Log Expense'}
                                        </Dialog.Title>
                                        <Dialog.Close asChild disabled={loading}>
                                            <button className="rounded-lg p-1.5 text-slate-400 hover:bg-[#FFF0F7] hover:text-[#FF5FA2] active:scale-95 transition-all">
                                                <X className="w-4 h-4" />
                                            </button>
                                        </Dialog.Close>
                                    </div>

                                    {/* Error Message */}
                                    {error && (
                                        <div className="mb-4 rounded-2xl border border-[#FF5FA2]/20 bg-[#FFF0F7] p-3 text-xs text-[#FF5FA2] font-medium flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-[#FF5FA2] shrink-0" />
                                            <span>{error}</span>
                                        </div>
                                    )}

                                    {/* Form */}
                                    <form onSubmit={handleSubmit} className="space-y-4">
                                        {/* Amount */}
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                                Amount (₹)
                                            </label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                                                    <IndianRupee className="w-4 h-4" />
                                                </div>
                                                <input 
                                                    type="number" 
                                                    step="0.01" 
                                                    name="amount" 
                                                    value={formData.amount} 
                                                    onChange={handleChange} 
                                                    required
                                                    disabled={loading}
                                                    placeholder="0.00"
                                                    className="w-full pl-10 pr-4 py-3 bg-white border border-[#FF5FA2]/15 rounded-2xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#FF5FA2]/20 focus:border-[#FF5FA2] transition-all text-sm font-medium shadow-sm"
                                                />
                                            </div>
                                        </div>

                                        {/* Category */}
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                                Category
                                            </label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                                                    <Tag className="w-4 h-4" />
                                                </div>
                                                <select 
                                                    name="category" 
                                                    value={formData.category} 
                                                    onChange={handleChange} 
                                                    required
                                                    disabled={loading}
                                                    className="w-full pl-10 pr-8 py-3 bg-white border border-[#FF5FA2]/15 rounded-2xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#FF5FA2]/20 focus:border-[#FF5FA2] transition-all text-sm font-medium shadow-sm appearance-none"
                                                >
                                                    <option value="" className="text-slate-400">Select category</option>
                                                    {CATEGORIES.map((cat) => (
                                                        <option key={cat.name} value={cat.name} className="text-slate-850 bg-white">
                                                            {cat.name}
                                                        </option>
                                                    ))}
                                                </select>
                                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
                                                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                                                        <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                                                    </svg>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Description */}
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                                Description
                                            </label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                                                    <FileText className="w-4 h-4" />
                                                </div>
                                                <input 
                                                    type="text" 
                                                    name="description" 
                                                    value={formData.description} 
                                                    onChange={handleChange}
                                                    disabled={loading}
                                                    placeholder="Coffee, subscription, rent..."
                                                    className="w-full pl-10 pr-4 py-3 bg-white border border-[#FF5FA2]/15 rounded-2xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#FF5FA2]/20 focus:border-[#FF5FA2] transition-all text-sm font-medium shadow-sm"
                                                />
                                            </div>
                                        </div>

                                        {/* Date */}
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                                Date
                                            </label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                                                    <Calendar className="w-4 h-4" />
                                                </div>
                                                <input 
                                                    type="date" 
                                                    name="date" 
                                                    value={formData.date} 
                                                    onChange={handleChange} 
                                                    required
                                                    disabled={loading}
                                                    className="w-full pl-10 pr-4 py-3 bg-white border border-[#FF5FA2]/15 rounded-2xl text-slate-850 focus:outline-none focus:ring-2 focus:ring-[#FF5FA2]/20 focus:border-[#FF5FA2] transition-all text-sm font-medium shadow-sm"
                                                />
                                            </div>
                                        </div>

                                        {/* Footer Buttons */}
                                        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
                                            <button 
                                                type="button" 
                                                onClick={onClose}
                                                disabled={loading}
                                                className="px-5 py-2.5 text-slate-500 bg-slate-50 rounded-2xl hover:bg-slate-100 active:scale-95 transition-all text-sm font-semibold"
                                            >
                                                Cancel
                                            </button>
                                            <button 
                                                type="submit"
                                                disabled={loading}
                                                className="px-5 py-2.5 text-white bg-gradient-to-r from-[#FF5FA2] to-[#A855F7] hover:opacity-95 rounded-2xl active:scale-95 shadow-md shadow-[#FF5FA2]/15 transition-all text-sm font-semibold flex items-center gap-1.5"
                                            >
                                                {loading ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    initialData ? 'Update' : 'Save Expense'
                                                )}
                                            </button>
                                        </div>
                                    </form>
                                </motion.div>
                            </Dialog.Content>
                        </div>
                    </Dialog.Portal>
                )}
            </AnimatePresence>
        </Dialog.Root>
    );
};

export default ExpenseForm;
