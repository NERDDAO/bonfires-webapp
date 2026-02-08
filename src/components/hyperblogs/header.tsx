import { hyperblogsCopy } from "@/content/hyperblogs";

import { Button } from "../ui/button";

export default function HyperBlogsHeader() {
  const { title, description } = hyperblogsCopy;

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-4">
        <div className="font-montserrat text-2xl lg:text-5xl font-black">
          {title}
        </div>
        <Button variant="primary" className="ml-auto hidden lg:block">
          Create your own
        </Button>
      </div>

      <div className="font-laro-soft mt-2 lg:mt-4 text-sm lg:text-base">
        {description}
      </div>
    </div>
  );
}
