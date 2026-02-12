import Image from "next/image";
import Link from "next/link";

import { heroCopy } from "@/content";
import { footerCopy } from "@/content/landing-page";

import { Button } from "../ui/button";

export default function Footer() {
  const {
    title,
    mobileTitle,
    subtitle,
    mobileSubtitle,
    primaryCta,
    primaryCtaHref,
    secondaryCta,
    secondaryCtaHref,
    logo,
    logoAlt,
    socialLinks,
  } = footerCopy;
  return (
    <div className="flex flex-col px-6 lg:px-20 py-6.5 justify-center items-center text-center min-h-svh lg:min-h-auto">
      <div className="flex flex-col justify-center items-center max-w-full lg:max-w-[581px] my-auto lg:my-36">
        <Image
          src="/logo-square.svg"
          alt="Bonfires.ai"
          width={80}
          height={80}
        />
        <div className="font-montserrat text-[2rem] mt-4.5 font-bold text-center">
          <span className="hidden lg:block">{title}</span>
          <span className="block lg:hidden max-w-[240px]">{mobileTitle}</span>
        </div>

        <div className="font-laro-soft mt-2">
          <span className="hidden lg:block">{subtitle}</span>
          <span className="block lg:hidden">{mobileSubtitle}</span>
        </div>

        <div className="mt-6 flex gap-6 flex-col lg:flex-row">
          <Button
            variant="primary"
            className="z-10 w-full lg:w-auto"
            href={primaryCtaHref}
          >
            {primaryCta}
          </Button>
          <Button variant="outline" className="z-10" href={secondaryCtaHref}>
            {secondaryCta}
          </Button>
        </div>
      </div>

      <div className="mt-auto w-full items-center hidden lg:flex">
        <Image src={logo} alt={logoAlt} width={170} height={22} />
        <div className="flex gap-9 ml-auto">
          {socialLinks.map((item) => (
            <Link target="_blank" href={item.href} key={item.href}>
              <Image src={item.icon} alt={item.href} width={24} height={24} />
            </Link>
          ))}
        </div>
      </div>

      <div className="w-full items-center flex flex-col mb-12 lg:hidden">
        <Image src={logo} alt={logoAlt} width={170} height={22} />
        <div className="flex gap-4 mt-6">
          {socialLinks.map((item) => (
            <Button variant="outline-white" href={item.href} key={item.href}>
              <Image src={item.icon} alt={item.href} width={24} height={24} />
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
