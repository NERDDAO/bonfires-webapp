import { howItWorksSectionCopy } from "@/content/landing-page";

import SpecularCircle from "./ui/specular-circle";

export default function HowItWorks() {
  const { title, description, steps } = howItWorksSectionCopy;
  return (
    <div className="flex flex-col items-center justify-center px-6 lg:px-20 py-7 lg:py-36">
      <div className="z-10 flex flex-col items-start lg:items-center justify-center gap-2 lg:gap-4">
        <h2 className="text-2xl lg:text-5xl font-black font-montserrat">
          {title}
        </h2>
        <p className="max-w-full lg:max-w-[544px] mx-auto font-laro-soft text-left lg:text-center text-sm lg:text-base">
          {description}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8 mt-8.5 lg:mt-20 z-10">
        {steps.map((step, index) => (
          <div
            key={index}
            className="relative max-w-full lg:max-w-[280px] min-h-[390px] lg:min-h-auto flex flex-col items-center text-center bg-[#22252B]/50 lg:bg-transparent rounded-lg lg:rounded-none px-6 lg:px-0 py-10 lg:py-0"
          >
            <SpecularCircle icon={step.icon} count={index + 1} />
            <h3 className="text-xl font-bold mt-6 lg:mt-8 mb-4">
              {step.title}
            </h3>
            <p className="text-[#94A3B8] text-sm">{step.description}</p>
            {index < steps.length - 1 && (
              <div className="-z-10 hidden lg:block absolute top-12 left-1/2 w-full h-1.5 bg-[#1A2129]" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
