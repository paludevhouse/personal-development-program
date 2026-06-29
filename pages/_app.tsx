import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import "@mantine/dates/styles.css";
import type { AppProps } from "next/app";
import type { NextPage } from "next";
import type { ReactElement, ReactNode } from "react";
import { useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AppLayout } from "@/components/AppLayout";
import { routeMeta, APP_NAME } from "@/lib/routes";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export type NextPageWithLayout<P = {}> = NextPage<P> & {
  getLayout?: (page: ReactElement) => ReactNode;
};

export default function App({ Component, pageProps }: AppProps & { Component: NextPageWithLayout }) {
  const [qc] = useState(() => new QueryClient());
  const { pathname } = useRouter();
  const meta = routeMeta(pathname);
  const pageTitle = pathname === "/" ? APP_NAME : `${meta.title} · ${APP_NAME}`;
  const getLayout = Component.getLayout ?? ((page) => <AppLayout>{page}</AppLayout>);
  return (
    <>
      <Head>
        <title>{pageTitle}</title>
      </Head>
      <MantineProvider>
        <Notifications />
        <QueryClientProvider client={qc}>
          {getLayout(<Component {...pageProps} />)}
        </QueryClientProvider>
      </MantineProvider>
    </>
  );
}
