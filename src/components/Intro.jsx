import React from 'react';
import { Button } from "@/components/ui/button";
import BoxReveal from "@/components/ui/box-reveal";
import pic from "../assets/pic.jpg"
function Intro() {
  return (
    <>
    <div className='mt-28 flex justify-center items-center '>
    
    <BoxReveal boxColor={"#757576"} duration={0.5}>

      <img src={pic} className='h-60 w-60   aspect-square object-cover' alt="Tasky"  />
   
             
      </BoxReveal>
        
        </div>
        
     <div className=' mx-auto max-w-xl text-center'>
    <div className="w-full max-w-lg items-center justify-center overflow-hidden pt-8 text-center mx-auto ">
       <div className='flex justify-center'>
<BoxReveal boxColor={"#757576"} duration={0.5}>
        <p className="text-[3.5rem] font-semibold text-center">
          TASKY.
        </p>
      </BoxReveal>
       </div>
      
 
      <BoxReveal boxColor={"#757576"} duration={0.5}>
        <h2 className="mt-[.5rem] text-[1rem] font-semibold  ">
        Streamline Your Day, Effortlessly.{" "}
          <span className="text-[#757576]">Your Personal To-Do List Manager</span>
        </h2>
      </BoxReveal>
 
      <BoxReveal boxColor={"#757576"} duration={0.5}>
        <div className="mt-6 px-4">
          <p className='font-semibold'>
            -&gt; Prioritize. Organize. Achieve. A seamless platform to track and manage tasks with precision.
          </p>
        </div>
      </BoxReveal>
      <div className='text-center items-center justify-center flex mb-10'>
<BoxReveal boxColor={"#757576"} duration={0.5}>
        <Button className="mt-[1.6rem] bg-[#000000] ">Explore</Button>
      </BoxReveal>
      </div>
      
    </div>
  
    </div>  
    </>
  )
}

export default Intro