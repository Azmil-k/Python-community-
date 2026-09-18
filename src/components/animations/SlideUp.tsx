import { motion, Variants } from 'framer-motion';
import React, { ReactNode } from 'react';

interface SlideUpProps {
  children: ReactNode;
  delay?: number;
  duration?: number;
}

const slideUpVariants = (delay: number, duration: number): Variants => ({
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { delay, duration, ease: 'easeOut' } },
});

export default function SlideUp({ children, delay = 0, duration = 0.5 }: SlideUpProps) {
  return (
    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={slideUpVariants(delay, duration)}>
      {children}
    </motion.div>
  );
}
