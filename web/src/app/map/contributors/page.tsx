import dynamic from "next/dynamic";

const CEXLoader = dynamic(() => import("./CEXLoader.client"), { ssr: false });

export default function ContributorsPage() {
  return <CEXLoader />;
}