import { Background } from "@/components/background";
import { Navbar } from "@/components/navbar";
import { OrgSwitchGuard } from "@/components/subdomain/OrgSwitchGuard";
import { SubdomainResolver } from "@/components/subdomain/SubdomainResolver";

import { Providers } from "../providers";

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
          <OrgSwitchGuard>{children}</OrgSwitchGuard>
        </Background>
      </Providers>
    </SubdomainResolver>
  );
}
