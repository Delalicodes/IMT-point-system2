import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, X } from 'lucide-react';

interface CustomAlertProps {
  message: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function CustomAlert({ message, isOpen, onClose }: CustomAlertProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-4 right-4 z-50"
        >
          <div className="bg-white rounded-lg shadow-xl border border-red-100 p-4 max-w-md">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <AlertCircle className="h-6 w-6 text-red-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{message}</p>
              </div>
              <button
                onClick={onClose}
                className="flex-shrink-0 rounded-md p-1.5 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <X className="h-4 w-4 text-gray-400" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
