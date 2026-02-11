"use client";

import { hyperblogsCopy } from "@/content/hyperblogs";
import { useSubdomainBonfire } from "@/contexts";
import { useBonfireById } from "@/hooks/queries/useBonfiresQuery";

import { Button } from "../ui/button";

function useHyperblogsDescription(): string {
  const { subdomainConfig, isSubdomainScoped } = useSubdomainBonfire();
  const { data: bonfire } = useBonfireById(
    isSubdomainScoped ? (subdomainConfig?.bonfireId ?? null) : null,
  );

  const graphLabel = bonfire?.name
    ? `the ${bonfire.name} graph`
    : isSubdomainScoped
      ? "the graph"
      : "all the graphs";

  return hyperblogsCopy.description.replace("{graphLabel}", graphLabel);
}

export default function HyperBlogsHeader() {
  const { title } = hyperblogsCopy;
  const description = useHyperblogsDescription();

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-4">
        <div className="font-montserrat text-2xl lg:text-5xl font-black">
          {title}
        </div>
        <Button variant="primary" className="sr-only ml-auto hidden lg:block">
          Create your own
        </Button>
      </div>

      <div className="font-laro-soft mt-2 lg:mt-4 text-sm lg:text-base">
        {description}
      </div>
    </div>
  );
}
