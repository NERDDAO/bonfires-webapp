import Image from "next/image";

import { howItWorksSectionCopy } from "@/content/landing-page";

import SpecularCircle from "./specular-circle";

export default function HowItWorks() {
  const { title, description, steps } = howItWorksSectionCopy;
  return (
    <div className="flex flex-col items-center justify-center px-20 my-36">
      <div className="z-10 flex flex-col items-center justify-center gap-4">
        <h2 className="text-5xl font-black font-montserrat">{title}</h2>
        <p className="max-w-[544px] mx-auto font-laro-soft text-center">
          {description}
        </p>
      </div>

      <div className="grid grid-cols-4 gap-8 mt-20 z-10">
        {steps.map((step, index) => (
          <div
            key={index}
            className="relative max-w-[280px] flex flex-col items-center text-center"
          >
            <SpecularCircle icon={step.icon} count={index + 1} />
            <h3 className="text-xl font-bold mt-8">{step.title}</h3>
            <p className="text-[#94A3B8] text-sm mt-4">{step.description}</p>
            {index < steps.length - 1 && (
              <div className="-z-10 absolute top-12 left-1/2 w-full h-1.5 bg-[#1A2129]" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
