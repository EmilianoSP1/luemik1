import { useRef, useEffect } from 'react';
import {
  motion,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
  useAnimationFrame,
  useMotionValue,
} from 'framer-motion';

// wrap(min, max, v): asegura ciclo continuo entre -100% y 0%
const wrap = (min, max, v) => {
  const range = max - min;
  return ((((v - min) % range) + range) % range) + min;
};

export default function TextScrollMarquee({
  children,
  baseVelocity = 1,
  className = '',
  scrollDependent = false,
  delay = 0,
  direction = 'left',
}) {
  const baseX = useMotionValue(0);
  const { scrollY } = useScroll();
  const scrollVelocity = useVelocity(scrollY);
  const smoothVelocity = useSpring(scrollVelocity, { damping: 50, stiffness: 400 });
  const velocityFactor = useTransform(smoothVelocity, [0, 1000], [0, 2], { clamp: false });

  // Loop perfecto: de -100% a 0%
  const x = useTransform(baseX, (v) => `${wrap(-100, 0, v % 100)}%`);

  const directionRef = useRef(direction === 'left' ? 1 : -1);
  const hasStarted = useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => { hasStarted.current = true; }, delay);
    return () => clearTimeout(timer);
  }, [delay]);

  useEffect(() => {
    directionRef.current = direction === 'left' ? 1 : -1;
  }, [direction]);

  useAnimationFrame((_, delta) => {
    if (!hasStarted.current) return;

    let moveBy = directionRef.current * baseVelocity * (delta / 1000);

    if (scrollDependent) {
      const vf = velocityFactor.get();
      if (vf < 0) directionRef.current = -1;
      else if (vf > 0) directionRef.current = 1;
      moveBy += directionRef.current * moveBy * vf;
    }

    baseX.set(baseX.get() + moveBy);
  });

  return (
    <div className="overflow-hidden whitespace-nowrap flex flex-nowrap">
      <motion.div className="flex whitespace-nowrap gap-10 flex-nowrap" style={{ x }}>
        {Array.from({ length: 4 }).map((_, index) => (
          <span key={index} className={`block text-[5vw] ${className}`}>
            {children}
          </span>
        ))}
      </motion.div>
    </div>
  );
}
