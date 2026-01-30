import Image from "next/image";

import { Button } from "../ui/button";

export default function Hero() {
  return (
    <div className="flex flex-col px-20 justify-center min-h-[calc(100vh-5rem)]">
      <div className="flex flex-col justify-center gap-4 max-w-[682px]">
        <Image
          src="/eth-boulder-logo.svg"
          alt="Eth Boulder"
          width={517}
          height={67}
        />
        <div className="font-montserrat text-5xl font-black">
          Collective Sensemaking Experience
        </div>
        <div className="font-laro-soft">
          Explore, visualize and interact with ETHBoulder's collective
          intelligence.
        </div>

        <div className="mt-3 flex gap-6">
          <Button variant="primary">Explore Graph</Button>
          <Button variant="outline">Join ETH Boulder Telegram group</Button>
        </div>
      </div>
    </div>
  );
}
