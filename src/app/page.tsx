import { Dashboard } from "@/components/dashboard";
import { getDashboardModel } from "@/lib/server/research";

export default async function Home() {
  const model = await getDashboardModel();

  return <Dashboard model={model} />;
}

