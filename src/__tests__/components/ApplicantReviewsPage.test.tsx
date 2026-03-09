import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import ApplicantReviewsPage from "../../app/(main)/applicant-reviews/page";

jest.mock("react-hot-toast", () => ({
  __esModule: true,
  default: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock("@/lib/api/client", () => ({
  apiClient: {
    post: jest.fn(),
  },
}));

jest.mock("@/hooks/queries/useApplicantReviewsQuery", () => ({
  useApplicantReviewsQuery: jest.fn(() => ({
    data: { items: [], total: 0, limit: 50, offset: 0 },
    isLoading: false,
  })),
  useApplicantReviewDetail: jest.fn(() => ({
    data: undefined,
    isLoading: false,
  })),
}));

describe("ApplicantReviewsPage", () => {
  it("renders the import form and empty-state guidance", () => {
    const queryClient = new QueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <ApplicantReviewsPage />
      </QueryClientProvider>,
    );

    expect(screen.getByText("Applicant Reviews")).toBeInTheDocument();
    expect(
      screen.getByText("Paste table text"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Enter a bonfire ID and import a batch to begin reviewing.",
      ),
    ).toBeInTheDocument();
  });
});
