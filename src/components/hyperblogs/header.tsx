"use client";

import { hyperblogsCopy } from "@/content/hyperblogs";

export default function HyperBlogsHeader() {
  const { description } = hyperblogsCopy;

  return (
    <div className="font-montserrat text-base lg:text-lg text-[#8da8af]">
      {description}
    </div>
  );
}
