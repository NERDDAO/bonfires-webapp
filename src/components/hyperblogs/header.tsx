"use client";

import { hyperblogsCopy } from "@/content/hyperblogs";

import { Button } from "../ui/button";

export default function HyperBlogsHeader({
  onCreateClick,
  showCreateButton,
}: {
  onCreateClick?: () => void;
  showCreateButton?: boolean;
}) {
  const { title, description } = hyperblogsCopy;

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-4">
        <div className="font-montserrat text-2xl lg:text-5xl font-black">
          {title}
        </div>
        {showCreateButton && (
          <Button
            variant="primary"
            className="ml-auto"
            onClick={onCreateClick}
          >
            Create Dataroom
          </Button>
        )}
      </div>

      <div className="font-montserrat mt-2 lg:mt-4 text-base lg:text-lg text-[#8da8af]">
        {description}
      </div>
    </div>
  );
}
