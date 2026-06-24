import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

/**
 * BottomSheet component - responsive modal that shows as bottom sheet on mobile
 * and regular modal on desktop
 * 
 * @param {boolean} isOpen - Controls visibility
 * @param {function} onClose - Callback when closing
 * @param {string} title - Header title
 * @param {node} children - Content
 * @param {string} size - 'sm', 'md', 'lg', 'xl', 'full'
 */
export default function BottomSheet({
    isOpen,
    onClose,
    title,
    children,
    size = 'md',
    showCloseButton = true,
    className = ''
}) {
    const sheetRef = useRef(null);

    // Size configurations
    const sizes = {
        sm: 'max-w-md',
        md: 'max-w-2xl',
        lg: 'max-w-4xl',
        xl: 'max-w-6xl',
        full: 'max-w-[calc(100vw-400px)]'
    };

    // Mobile height configurations
    const mobileHeights = {
        sm: 'h-[40vh]',
        md: 'h-[50vh]',
        lg: 'h-[70vh]',
        xl: 'h-[85vh]',
        full: 'h-[95vh]'
    };

    // Handle escape key
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    // Prevent scroll propagation on mobile
    const handleTouchMove = (e) => {
        e.stopPropagation();
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-[5000] bg-black/50 backdrop-blur-sm"
                        onClick={onClose}
                    />

                    {/* Desktop Modal - Centered with sidebar accounting */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ duration: 0.2 }}
                        className="hidden md:flex fixed inset-0 z-[5001] items-center justify-center p-4 pointer-events-none"
                        style={{ paddingLeft: '360px' }}
                    >
                        <div
                            className={`pointer-events-auto bg-white dark:bg-slate-900 rounded-2xl shadow-2xl ${sizes[size]} h-full max-h-[90vh] overflow-hidden flex flex-col`}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
                                <h3 className="text-lg font-bold text-slate-800 dark:text-white">{title}</h3>
                                {showCloseButton && (
                                    <button
                                        onClick={onClose}
                                        className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                    >
                                        <X className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                                    </button>
                                )}
                            </div>

                            {/* Content */}
                            <div className="flex-1 overflow-y-auto">
                                {children}
                            </div>
                        </div>
                    </motion.div>

                    {/* Mobile Bottom Sheet */}
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                        drag="y"
                        dragConstraints={{ top: 0, bottom: 0 }}
                        dragElastic={{ top: 0, bottom: 0.5 }}
                        onDragEnd={(e, { offset, velocity }) => {
                            // Close if dragged down significantly
                            if (offset.y > 100 || velocity.y > 500) {
                                onClose();
                            }
                        }}
                        className="md:hidden fixed bottom-0 left-0 right-0 z-[5001] pointer-events-none"
                    >
                        <div
                            className={`pointer-events-auto bg-white dark:bg-slate-900 rounded-t-3xl shadow-2xl ${mobileHeights[size]} w-full flex flex-col`}
                            onTouchMove={handleTouchMove}
                        >
                            {/* Drag Handle */}
                            <div className="flex justify-center pt-3 pb-2">
                                <div className="w-10 h-1 bg-slate-300 dark:bg-slate-600 rounded-full" />
                            </div>

                            {/* Header */}
                            <div className="px-4 pb-3 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-white dark:bg-slate-900 rounded-t-3xl">
                                <h3 className="text-lg font-bold text-slate-800 dark:text-white">{title}</h3>
                                {showCloseButton && (
                                    <button
                                        onClick={onClose}
                                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                    >
                                        <X className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                                    </button>
                                )}
                            </div>

                            {/* Content */}
                            <div className="flex-1 overflow-y-auto overscroll-contain pb-safe">
                                {children}
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
