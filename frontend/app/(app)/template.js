'use client';
import { motion } from 'framer-motion';
import { ease } from '@/components/motion';

// template.js remounts on every navigation, so each page gets a soft entrance transition.
export default function Template({ children }) {
  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease }}>
      {children}
    </motion.div>
  );
}
