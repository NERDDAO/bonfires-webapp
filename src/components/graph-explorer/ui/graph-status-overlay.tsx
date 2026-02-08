import { LoadingSpinner } from "@/components/common";

export default function GraphStatusOverlay({
  isLoading,
  message,
  isError,
  errorMessage,
}: {
  isLoading: boolean;
  message?: string;
  isError?: boolean;
  errorMessage?: string;
}) {
  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-base-100/50">
      {isLoading && (
        <LoadingSpinner size="lg" text={message ?? "Loading graph..."} />
      )}
      {isError && (
        <div className="text-center text-base-content/60">{errorMessage}</div>
      )}
    </div>
  );
}
