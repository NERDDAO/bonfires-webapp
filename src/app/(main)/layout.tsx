import { Providers } from "../providers";
import { Background } from "@/components/background";
import { Navbar } from "@/components/navbar";
import { SubdomainResolver } from "@/components/subdomain/SubdomainResolver";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SubdomainResolver>
      <Providers>
        <Background>
          <Navbar />
          {children}
        </Background>
      </Providers>
    </SubdomainResolver>
  );
}
