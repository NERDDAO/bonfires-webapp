"use client";

import type { ReactNode } from "react";
import Link from "next/link";

type FeatureVariant = "graph" | "web3" | "documents";

interface FeatureCardProps {
  title: string;
  description: string;
  icon: ReactNode;
  features: string[];
  variant: FeatureVariant;
  href: string;
  badge?: string;
}

const variantStyles: Record<
  FeatureVariant,
  { iconBg: string; borderColor: string; badgeClass: string; badgeText: string }
> = {
  graph: {
    iconBg: "bg-primary/10",
    borderColor: "border-primary/20 hover:border-primary/40",
    badgeClass: "badge-primary",
    badgeText: "text-primary-content",
  },
  web3: {
    iconBg: "bg-secondary/10",
    borderColor: "border-secondary/20 hover:border-secondary/40",
    badgeClass: "badge-secondary",
    badgeText: "text-secondary-content",
  },
  documents: {
    iconBg: "bg-accent/10",
    borderColor: "border-accent/20 hover:border-accent/40",
    badgeClass: "badge-accent",
    badgeText: "text-accent-content",
  },
};

export function FeatureCard({
  title,
  description,
  icon,
  features,
  variant,
  href,
  badge,
}: FeatureCardProps) {
  const styles = variantStyles[variant];

  return (
    <Link href={href} className="block h-full">
      <div
        className={`card bg-base-100 h-full border ${styles.borderColor} transition-all duration-200 hover:shadow-lg hover:-translate-y-1`}
      >
        <div className="card-body">
          <div className="flex items-start justify-between">
            <div
              className={`w-14 h-14 rounded-xl ${styles.iconBg} flex items-center justify-center`}
            >
              {icon}
            </div>
            {badge && (
              <span className={`badge ${styles.badgeClass} ${styles.badgeText}`}>
                {badge}
              </span>
            )}
          </div>
          <h3 className="card-title text-xl mt-4">{title}</h3>
          <p className="text-base-content/70 text-sm">{description}</p>
          <ul className="mt-4 space-y-2">
            {features.map((feature, index) => (
              <li
                key={index}
                className="flex items-center gap-2 text-sm text-base-content/60"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="w-4 h-4 text-success flex-shrink-0"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                    clipRule="evenodd"
                  />
                </svg>
                {feature}
              </li>
            ))}
          </ul>
          <div className="card-actions justify-end mt-auto pt-4">
            <span className="text-sm font-medium text-base-content group-hover:underline">
              Explore {title} →
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default FeatureCard;
