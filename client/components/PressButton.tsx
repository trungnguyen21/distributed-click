
import React from 'react';
import { motion } from 'framer-motion';

interface PressButtonProps {
  onPress: () => void;
}

const PressButton: React.FC<PressButtonProps> = ({ onPress }) => {
  return (
    <motion.button
      onClick={onPress}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.92 }}
      initial={{ scale: 0, rotate: -10 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ 
        type: 'spring', 
        stiffness: 260, 
        damping: 20 
      }}
      className="group relative flex items-center justify-center w-48 h-48 sm:w-56 sm:h-56 rounded-full focus:outline-none"
    >
      {/* Outer Glow Ring */}
      <div className="absolute inset-0 rounded-full border-2 border-green-500/20 group-hover:border-green-400 group-hover:shadow-[0_0_40px_rgba(51,255,51,0.3)] transition-all duration-300" />
      
      {/* Inner Button Circle */}
      <div className="absolute inset-4 rounded-full bg-[#050505] border border-green-500/30 flex items-center justify-center overflow-hidden">
        {/* Subtle Radial Gradient Overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(51,255,51,0.1)_0%,transparent_70%)] pointer-events-none" />
        
        {/* Terminal Power Icon */}
        <div className="relative z-10 w-12 h-12 sm:w-16 sm:h-16 border-4 border-green-500 rounded-full flex items-center justify-center group-active:border-green-300 transition-colors">
            <div className="w-1.5 h-6 sm:h-8 bg-green-500 rounded-full group-active:bg-green-300 transition-colors" />
        </div>
      </div>

      {/* Pulsing Aura */}
      <motion.div
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.2, 0.05, 0.2],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute inset-0 rounded-full bg-green-500/10 blur-xl -z-10"
      />
    </motion.button>
  );
};

export default PressButton;
