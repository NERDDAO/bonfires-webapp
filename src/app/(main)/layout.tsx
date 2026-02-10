import { cookies, headers } from "next/headers";

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
  const headersList = await headers();
  const cookieStore = await cookies();
  const showSignin =
    headersList.get("x-is-admin-override") === "true" ||
    cookieStore.get("x-is-admin-override")?.value === "true";

  return (
    <SubdomainResolver>
      <Providers>
        <SiteConfigProvider>
          <Background>
            <Navbar showSignin={showSignin} />
            <OrgSwitchGuard>{children}</OrgSwitchGuard>
          </Background>
        </SiteConfigProvider>
      </Providers>
    </SubdomainResolver>
  );
}
