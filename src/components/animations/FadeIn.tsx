import { motion, Variants } from 'framer-motion';
import React, { ReactNode } from 'react';

interface FadeInProps {
  children: ReactNode;
  delay?: number;
  duration?: number;
}

const fadeInVariants = (delay: number, duration: number): Variants => ({
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { delay, duration, ease: 'easeOut' } },
});

export default function FadeIn({ children, delay = 0, duration = 0.5 }: FadeInProps) {
  return (
    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={fadeInVariants(delay, duration)}>
      {children}
    </motion.div>
  );
}
