import Link from "next/link";

export default function SubdomainNotFoundPage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 px-4">
      <h1 className="text-2xl font-semibold">Subdomain not found</h1>
      <p className="text-center text-muted-foreground max-w-md">
        This bonfire is not available or the subdomain could not be resolved.
      </p>
      <Link
        href="/"
        className="rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
      >
        Go to home
      </Link>
    </div>
  );
}
