import React, { ReactNode } from 'react'
import { motion } from 'framer-motion'

interface AnimatedScrollWrapperProps {
  children: ReactNode
}
const AnimatedScrollWrapper = ({ children }: AnimatedScrollWrapperProps) => {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 10 },
        visible: {
          opacity: 1,
          y: 0,
          transition: {
            duration: 0.5,
            ease: 'easeInOut',
            // delay: 0.25,
          },
        },
      }}
      initial='hidden'
      whileInView='visible'
    >
      {children}
    </motion.div>
  )
}

export default AnimatedScrollWrapper
