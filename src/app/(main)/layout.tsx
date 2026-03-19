import { Background } from "@/components/background";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/shared/Footer";
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
            <OrgSwitchGuard>
              <div className="bf-page">
                <main className="bf-container" style={{ paddingTop: 24, paddingBottom: 48 }}>
                  {children}
                </main>
                <Footer />
              </div>
            </OrgSwitchGuard>
          </Background>
        </SiteConfigProvider>
      </Providers>
    </SubdomainResolver>
  );
}
