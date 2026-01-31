import Image from "next/image";
import Link from "next/link";

import { heroCopy } from "@/content";
import { footerCopy } from "@/content/landing-page";

import { Button } from "../ui/button";

export default function Footer() {
  const { title, subtitle, ctaPrimary, ctaSecondary } = footerCopy;
  return (
    <div className="flex flex-col px-20 py-6.5 justify-center items-center text-center">
      <div className="flex flex-col justify-center items-center max-w-[581px] my-36">
        <Image
          src="/logo-square.svg"
          alt="Bonfires.ai"
          width={80}
          height={80}
        />
        <div className="font-montserrat text-[2rem] mt-4.5 font-bold">
          {title}
        </div>
        <div className="font-laro-soft mt-2">{subtitle}</div>

        <div className="mt-6 flex gap-6">
          <Button variant="primary" className="z-10">
            {ctaPrimary}
          </Button>
          <Button variant="outline" className="z-10">
            {ctaSecondary}
          </Button>
        </div>
      </div>

      <div className="mt-auto flex w-full items-center">
        <Image
          src="/eth-boulder-logo.svg"
          alt="Eth Boulder"
          width={170}
          height={22}
        />
        <div className="flex gap-9 ml-auto">
          {[{
            icon: "/icons/twitter.svg",
            href: "https://t.me/bonfiresai",
          }, {
            icon: "/icons/discord.svg",
            href: "https://t.me/bonfiresai",
          }, {
            icon: "/icons/telegram.svg",
            href: "https://t.me/bonfiresai",
          }].map(item => (
            <Link href={item.href} key={item.href}>
              <Image src={item.icon} alt={item.href} width={24} height={24} />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
