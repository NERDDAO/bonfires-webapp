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

      <div className="font-laro-soft mt-2 lg:mt-4 text-sm lg:text-base">
        {description}
      </div>
    </div>
  );
}
