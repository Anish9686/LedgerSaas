import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

const TOAST_STYLES = {
    success: 'bg-emerald-950/80 border-emerald-800/40 text-emerald-450 shadow-emerald-950/20',
    warning: 'bg-amber-950/80 border-amber-800/40 text-amber-450 shadow-amber-950/20',
    info: 'bg-indigo-955/80 border-indigo-800/40 text-indigo-400 shadow-indigo-950/20'
};

const TOAST_ICONS = {
    success: CheckCircle2,
    warning: AlertTriangle,
    info: Info
};

const Toast = ({ message, type = 'success', onClose }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 4000); // Auto-dismiss after 4 seconds

        return () => clearTimeout(timer);
    }, [onClose]);

    const Icon = TOAST_ICONS[type] || Info;

    return (
        <div className="fixed bottom-6 right-6 z-50 pointer-events-none">
            <AnimatePresence>
                {message && (
                    <motion.div
                        initial={{ opacity: 0, y: 30, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                        className={`pointer-events-auto flex items-center gap-3.5 px-4.5 py-3 rounded-2xl border backdrop-blur-xl shadow-xl max-w-sm ${TOAST_STYLES[type] || TOAST_STYLES.info}`}
                    >
                        <Icon className="w-5 h-5 shrink-0" />
                        <span className="text-xs font-semibold leading-normal">{message}</span>
                        <button
                            onClick={onClose}
                            className="p-1 rounded-lg hover:bg-white/10 hover:text-white transition-all text-slate-400 cursor-pointer active:scale-95"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Toast;
