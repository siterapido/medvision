'use client'

import { cn } from "@/lib/utils"

const logos = [
  { name: "Perplexity", weight: "font-bold", style: "tracking-tight" },
  { name: "PubMed", weight: "font-bold", style: "" },
  { name: "USP", weight: "font-black", style: "tracking-widest" },
  { name: "BVS", weight: "font-bold", style: "" },
  { name: "CAPES", weight: "font-bold", style: "" },
]

export function LogoScroll() {
  return (
    <div className="w-full bg-[#0B1423] py-8 border-y border-slate-800/50 overflow-hidden">
      <div className="container mx-auto px-4 mb-6 text-center">
        <p className="text-sm text-slate-500 font-medium uppercase tracking-wider">
          Base de conhecimento fundamentada em
        </p>
      </div>
      <div className="relative flex overflow-x-hidden group">
        <div 
          className="flex animate-scroll whitespace-nowrap" 
          style={{ 
            "--gap": "4rem", 
            "--duration": "30s" 
          } as React.CSSProperties}
        >
           {/* Render logos multiple times to ensure smooth scrolling */}
           {/* We render 2 identical sets of logos. Each set contains 4 repetitions of the logo list to ensure it's wide enough. */}
           {/* This allows us to animate to -50% (exactly the width of one set) for a seamless loop. */}
           {[...Array(2)].map((_, setIndex) => (
             <div key={`set-${setIndex}`} className="flex shrink-0">
               {[...Array(4)].map((_, i) => (
                <div key={`group-${i}`} className="flex gap-16 items-center mx-8">
                  {logos.map((logo) => (
                    <span 
                      key={logo.name} 
                      className={cn(
                        "text-2xl text-slate-400/50 hover:text-slate-300 transition-colors cursor-default select-none", 
                        logo.weight, 
                        logo.style
                      )}
                    >
                      {logo.name}
                    </span>
                  ))}
                </div>
               ))}
             </div>
           ))}
        </div>
        <div className="pointer-events-none absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-[#0B1423] to-transparent"></div>
        <div className="pointer-events-none absolute inset-y-0 right-0 w-1/4 bg-gradient-to-l from-[#0B1423] to-transparent"></div>
      </div>
    </div>
  )
}
