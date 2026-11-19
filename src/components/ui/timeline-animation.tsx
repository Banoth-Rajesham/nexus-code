"use client"

import * as React from "react"
import { motion } from "motion/react"

interface TimelineContentProps extends React.HTMLAttributes<HTMLElement> {
  as?: string
  animationNum?: number
  timelineRef?: React.RefObject<HTMLDivElement | null>
  customVariants?: any
  children?: React.ReactNode
}

export const TimelineContent: React.FC<TimelineContentProps> = ({
  as = "div",
  animationNum = 0,
  timelineRef,
  customVariants,
  children,
  className,
  ...props
}) => {
  const Component = typeof as === "string" && (motion as any)[as] ? (motion as any)[as] : motion.div

  return (
    <Component
      variants={customVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      custom={animationNum}
      className={className}
      {...props}
    >
      {children}
    </Component>
  )
}
