import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AnimatedShinyText } from '@/components/ui/animated-shiny-text';
import { Component as Orb } from '@/components/ui/orb';

const items = [
    { id: 1, content: "Pulling out my compass..." },
    { id: 2, content: "Unfolding the map..." },
    { id: 3, content: "Scanning the terrain..." },
    { id: 4, content: "Plotting the coordinates..." },
    { id: 5, content: "Setting up basecamp..." },
    { id: 6, content: "Tightening my boots..." },
    { id: 7, content: "Climbing to get a better view..." },
    { id: 8, content: "Packing supplies for the journey..." },
    { id: 9, content: "Surveying the landscape..." },
    { id: 10, content: "Checking the satellite signal..." },
    { id: 11, content: "Following the trail markers..." },
    { id: 12, content: "Reflecting on the last known location..." },
    { id: 13, content: "Sharpening my tools..." },
    { id: 14, content: "Asking the locals for directions..." },
    { id: 15, content: "Tying up loose ends..." },
    { id: 16, content: "Looking for signs of the unknown..." },
    { id: 17, content: "Marking a new waypoint..." },
    { id: 18, content: "Clearing obstacles off the path..." },
    { id: 19, content: "Consulting the expedition journal..." },
    { id: 20, content: "Triangulating your position..." },
    { id: 21, content: "Shining a light into the unknown..." },
    { id: 22, content: "Charting the stars for guidance..." }
  ];

export const AgentLoader = () => {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const id = setInterval(() => {
      setIndex((state) => {
        if (state >= items.length - 1) return 0;
        return state + 1;
      });
    }, 1500);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex py-2 px-3 items-center w-full border rounded-lg">
      <div className="w-6 h-6 flex-shrink-0">
        <Orb hue={280} hoverIntensity={0.3} rotateOnHover={true} forceHoverState={true} />
      </div>
            <AnimatePresence>
            <motion.div
                key={items[index].id}
                initial={{ y: 20, opacity: 0, filter: "blur(8px)" }}
                animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
                exit={{ y: -20, opacity: 0, filter: "blur(8px)" }}
                transition={{ ease: "easeInOut" }}
                style={{ position: "absolute" }}
                className='ml-7'
            >
                <AnimatedShinyText>{items[index].content}</AnimatedShinyText>
            </motion.div>
            </AnimatePresence>
        </div>
  );
};
