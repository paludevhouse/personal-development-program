import Link from "next/link";
import { Button } from "@mantine/core";
import { WarningOctagon } from "@phosphor-icons/react";
import { StateView } from "@/components/StateView";
import type { NextPageWithLayout } from "@/pages/_app";

const Custom500: NextPageWithLayout = () => (
  <div style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
    <StateView
      icon={<WarningOctagon size={48} weight="duotone" />}
      title="Terjadi kesalahan"
      description="Maaf, terjadi kesalahan pada sistem. Silakan coba lagi."
      action={<Button component={Link} href="/" mt="sm">Kembali ke Dasbor</Button>}
    />
  </div>
);
Custom500.getLayout = (page) => page;
export default Custom500;
