import React from "react";
import { Component } from "@/components/ui/orb";

const DemoOne = () => {
  return (
  
    <div className="w-screen h-screen bg-black overflow-hidden"> 

      <Component
        hoverIntensity={0.6}    
        rotateOnHover={true}
        hue={240}               
        forceHoverState={false}
      />
    </div>
  );
};

export { DemoOne };
