import { Background } from "@/components/background";
import { Navbar } from "@/components/navbar";
import { OrgSwitchGuard } from "@/components/subdomain/OrgSwitchGuard";
import { SubdomainResolver } from "@/components/subdomain/SubdomainResolver";
import { SiteConfigProvider } from "@/contexts";

import { Providers } from "../providers";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SubdomainResolver>
      <Providers>
        <SiteConfigProvider>
          <Background>
            <Navbar />
            <OrgSwitchGuard>{children}</OrgSwitchGuard>
          </Background>
        </SiteConfigProvider>
      </Providers>
    </SubdomainResolver>
  );
}
