
import React, { useEffect, useState, useRef } from 'react';
import { motion, animate } from 'framer-motion';

interface CounterLabelProps {
  value: number;
}

const CounterLabel: React.FC<CounterLabelProps> = ({ value }) => {
  const [displayValue, setDisplayValue] = useState(0);
  const prevValueRef = useRef(0);

  useEffect(() => {
    const controls = animate(prevValueRef.current, value, {
      duration: 0.8,
      ease: [0.22, 1, 0.36, 1],
      onUpdate(latest) {
        setDisplayValue(Math.floor(latest));
      },
    });
    
    prevValueRef.current = value;
    return () => controls.stop();
  }, [value]);

  return (
    <div className="flex flex-col items-center select-none font-mono">
      <motion.div 
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center"
      >
        <div className="relative">
            {/* Background "ghost" digits */}
            <span className="text-green-900/10 absolute inset-0 text-5xl sm:text-6xl tracking-widest tabular-nums">
                000000
            </span>
            {/* Actual dynamic counter */}
            <span className="relative text-5xl sm:text-6xl font-bold text-[#33FF33] tabular-nums tracking-widest drop-shadow-[0_0_10px_rgba(51,255,51,0.4)]">
                {displayValue.toString().padStart(1, '0')}
            </span>
        </div>
        
        <div className="mt-2 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_5px_#33FF33]" />
            <span className="text-green-500/60 text-[10px] sm:text-xs uppercase tracking-[0.3em] font-medium">
                Live counter
            </span>
        </div>
      </motion.div>
      
      {/* Decorative scanline bar */}
      <div className="w-32 h-[1px] bg-green-500/20 mt-4 relative overflow-hidden">
        <motion.div 
            initial={{ left: '-100%' }}
            animate={{ left: '100%' }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            className="absolute top-0 h-full w-12 bg-gradient-to-r from-transparent via-green-500/40 to-transparent"
        />
      </div>
    </div>
  );
};

export default CounterLabel;
