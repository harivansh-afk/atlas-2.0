import React, { useEffect, useState } from 'react'
import { motion, useAnimation } from 'framer-motion'

// Interface for different loading variants
interface AnimatedLoadingSkeletonProps {
    variant?: 'chat' | 'dashboard' | 'full'
    className?: string
}

// Interface for grid configuration structure
interface GridConfig {
    numCards: number // Total number of cards to display
    cols: number // Number of columns in the grid
    xBase: number // Base x-coordinate for positioning
    yBase: number // Base y-coordinate for positioning
    xStep: number // Horizontal step between cards
    yStep: number // Vertical step between cards
}

const AnimatedLoadingSkeleton = ({ variant = 'full', className = '' }: AnimatedLoadingSkeletonProps) => {
    const [windowWidth, setWindowWidth] = useState(0) // State to store window width for responsiveness
    const controls = useAnimation() // Controls for Framer Motion animations

    // Simplified grid configuration - always 3 cards
    const getGridConfig = (width: number): GridConfig => {
        const numCards = 3
        const cols = width >= 768 ? 3 : width >= 640 ? 2 : 1
        return {
            numCards,
            cols,
            xBase: 20,
            yBase: 20,
            xStep: 120,
            yStep: 140
        }
    }

    // Generates random animation paths for the search icon
    const generateSearchPath = (config: GridConfig) => {
        const { numCards, cols, xBase, yBase, xStep, yStep } = config
        const rows = Math.ceil(numCards / cols) // Calculate rows based on cards and columns
        let allPositions = []

        // Generate grid positions for cards
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                if ((row * cols + col) < numCards) {
                    allPositions.push({
                        x: xBase + (col * xStep),
                        y: yBase + (row * yStep)
                    })
                }
            }
        }

        // Shuffle positions to create random animations
        const numRandomCards = Math.min(3, allPositions.length)
        const shuffledPositions = allPositions
            .sort(() => Math.random() - 0.5)
            .slice(0, numRandomCards)

        // Ensure loop completion by adding the starting position
        shuffledPositions.push(shuffledPositions[0])

        return {
            x: shuffledPositions.map(pos => pos.x),
            y: shuffledPositions.map(pos => pos.y),
            scale: Array(shuffledPositions.length).fill(1.2),
            transition: {
                duration: shuffledPositions.length * 2,
                repeat: Infinity, // Loop animation infinitely
                ease: [0.4, 0, 0.2, 1], // Ease function for smooth animation
                times: shuffledPositions.map((_, i) => i / (shuffledPositions.length - 1))
            }
        }
    }

    // Handles window resize events and updates the window width
    useEffect(() => {
        setWindowWidth(window.innerWidth)
        const handleResize = () => setWindowWidth(window.innerWidth)
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    // Updates animation path whenever the window width changes
    useEffect(() => {
        const config = getGridConfig(windowWidth)
        controls.start(generateSearchPath(config))
    }, [windowWidth, controls])

    // Variants for frame animations
    const frameVariants = {
        hidden: { opacity: 0, scale: 0.95 }, // Initial state (hidden)
        visible: { opacity: 1, scale: 1, transition: { duration: 0.5 } } // Transition to visible state
    }

    // Variants for individual card animations
    const cardVariants = {
        hidden: { y: 20, opacity: 0 }, // Initial state (off-screen)
        visible: (i: number) => ({ // Animate based on card index
            y: 0,
            opacity: 1,
            transition: { delay: i * 0.1, duration: 0.4 } // Staggered animation
        })
    }

    // Glow effect variants for the search icon
    const glowVariants = {
        animate: {
            boxShadow: [
                "0 0 20px rgba(59, 130, 246, 0.2)",
                "0 0 35px rgba(59, 130, 246, 0.4)",
                "0 0 20px rgba(59, 130, 246, 0.2)"
            ],
            scale: [1, 1.1, 1], // Pulsating effect
            transition: {
                duration: 1,
                repeat: Infinity,
                ease: "easeInOut" // Smooth pulsation
            }
        }
    }

    const config = getGridConfig(windowWidth) // Get current grid configuration

    return (
        <motion.div
            className={`relative w-full max-w-2xl mx-auto p-6 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 rounded-lg border overflow-hidden ${className}`}
            variants={frameVariants}
            initial="hidden"
            animate="visible"
        >
            {/* Search icon with animation */}
            <motion.div
                className="absolute z-10 pointer-events-none"
                animate={controls}
                style={{ left: 16, top: 16 }}
            >
                <motion.div
                    className="bg-primary/20 p-3 rounded-full backdrop-blur-sm"
                    variants={glowVariants}
                    animate="animate"
                >
                    <svg
                        className="w-6 h-6 text-primary"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                    </svg>
                </motion.div>
            </motion.div>

            {/* Grid of simple animated cards */}
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
                {[...Array(3)].map((_, i) => (
                    <motion.div
                        key={i}
                        variants={cardVariants}
                        initial="hidden"
                        animate="visible"
                        custom={i} // Index-based animation delay
                        whileHover={{ scale: 1.02 }} // Slight scale on hover
                        className="bg-card rounded-lg shadow-sm p-4 border h-32"
                    >
                        {/* Empty card - no internal skeleton components */}
                    </motion.div>
                ))}
            </div>
        </motion.div>
    )
}

export default AnimatedLoadingSkeleton
