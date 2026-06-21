import { notFound } from "next/navigation";
import { CompanyPage } from "@/components/company-page";
import { getCompanyResearch } from "@/lib/server/research";

export default async function StockPage({
  params
}: {
  params: Promise<{ symbol: string }>;
}) {
  const { symbol } = await params;

  if (!symbol || symbol.length > 12) {
    notFound();
  }

  const research = await getCompanyResearch(symbol);

  return <CompanyPage research={research} />;
}

