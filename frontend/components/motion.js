'use client';
import { useEffect, useRef } from 'react';
import { animate, motion, useInView, useMotionValue, useTransform } from 'framer-motion';

export const ease = [0.22, 1, 0.36, 1]; // easeOutExpo-ish: fast start, silky settle

/** Fade + rise on mount; use `delay` to choreograph blocks. */
export function Reveal({ children, delay = 0, y = 16, className, style }) {
  return (
    <motion.div
      className={className}
      style={style}
      initial={{ opacity: 0, y }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay, ease }}
    >
      {children}
    </motion.div>
  );
}

/** Reveal when scrolled into view (charts below the fold). */
export function InView({ children, delay = 0, className, style }) {
  const ref = useRef(null);
  const visible = useInView(ref, { once: true, margin: '-40px' });
  return (
    <motion.div
      ref={ref}
      className={className}
      style={style}
      initial={{ opacity: 0, y: 24 }}
      animate={visible ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease }}
    >
      {children}
    </motion.div>
  );
}

/** Number that counts up smoothly whenever `value` changes. */
export function CountUp({ value, decimals = 0 }) {
  const mv = useMotionValue(0);
  const text = useTransform(mv, (v) => v.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }));
  useEffect(() => {
    const controls = animate(mv, Number(value) || 0, { duration: 1.1, ease });
    return () => controls.stop();
  }, [value, mv]);
  return <motion.span>{text}</motion.span>;
}

/** Table row with a gentle staggered entrance. */
export function MRow({ i = 0, children }) {
  return (
    <motion.tr
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(i, 12) * 0.035, ease }}
    >
      {children}
    </motion.tr>
  );
}

export const listVariants = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
export const itemVariants = {
  hidden: { opacity: 0, y: 18, scale: 0.98 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease } },
};
