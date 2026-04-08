'use client';

import { motion, AnimatePresence } from 'framer-motion';

interface Step {
  label: string;
  active: boolean;
  completed: boolean;
}

interface BookingStepperProps {
  steps: Step[];
  dotBgColor?: string;
}

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

export function BookingStepper({ steps, dotBgColor = '#fff' }: BookingStepperProps) {
  // Find which step index is active so we can stagger delays
  const activeIndex = steps.findIndex((s) => s.active);

  return (
    <div className="booking-review__stepper-wrap">
      <div className="booking-review__stepper">
        {steps.map((step, i) => {
          // The line before this dot just finished filling — delay the dot activation
          // so it feels like the progress bar "arrives" and triggers the dot
          const isBecomingActive = step.active && i > 0;
          const dotDelay = isBecomingActive ? 0.3 : 0;

          return (
            <div key={i} className="booking-review__step-item">
              <motion.div
                className={`booking-review__step-dot ${
                  step.active ? 'booking-review__step-dot--active' :
                  step.completed ? 'booking-review__step-dot--completed' : ''
                }`}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                animate={{
                  borderColor: step.active || step.completed ? '#0e7c6b' : '#d0d0d0',
                  backgroundColor: step.completed ? '#0e7c6b' : step.active ? '#0e7c6b' : dotBgColor,
                  scale: step.active ? 1.1 : 1,
                  boxShadow: step.active
                    ? 'inset 0 0 0 1.5px #fff'
                    : 'inset 0 0 0 0px #fff',
                }}
                transition={{
                  type: 'spring',
                  stiffness: 400,
                  damping: 20,
                  delay: dotDelay,
                }}
              >
                <AnimatePresence mode="wait">
                  {step.completed ? (
                    <motion.div
                      key="check"
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                    >
                      <CheckIcon />
                    </motion.div>
                  ) : step.active ? (
                    <motion.div
                      key="dot"
                      className="booking-review__step-dot-inner"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      transition={{
                        type: 'spring',
                        stiffness: 500,
                        damping: 25,
                        delay: dotDelay + 0.05, // 0.35
                      }}
                    />
                  ) : null}
                </AnimatePresence>
              </motion.div>

              <motion.span
                className="booking-review__step-label"
                animate={{
                  color: step.active || step.completed ? '#0e7c6b' : '#999',
                  fontWeight: step.active ? 600 : 500,
                }}
                transition={{ duration: 0.2, delay: step.active ? dotDelay : 0 }} // label syncs with circle at 0.3
              >
                {step.label}
              </motion.span>

              {i < steps.length - 1 && (
                <div className="booking-review__step-line">
                  <motion.div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      height: '100%',
                      width: '100%',
                      backgroundColor: '#0e7c6b',
                      transformOrigin: 'left',
                    }}
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: step.completed ? 1 : 0 }}
                    transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
