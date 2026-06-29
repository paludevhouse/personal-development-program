import Link from "next/link";
import { Button } from "@mantine/core";
import { Compass } from "@phosphor-icons/react";
import { StateView } from "@/components/StateView";
import type { NextPageWithLayout } from "@/pages/_app";

const NotFound: NextPageWithLayout = () => (
  <div style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
    <StateView
      icon={<Compass size={48} weight="duotone" />}
      title="Halaman tidak ditemukan"
      description="Halaman yang Anda cari tidak ada atau telah dipindahkan."
      action={<Button component={Link} href="/" mt="sm">Kembali ke Dasbor</Button>}
    />
  </div>
);
NotFound.getLayout = (page) => page;
export default NotFound;
