import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import "@mantine/dates/styles.css";
import type { AppProps } from "next/app";
import type { NextPage } from "next";
import type { ReactElement, ReactNode } from "react";
import { useState, useMemo } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import { QueryClient, QueryClientProvider, QueryCache, MutationCache } from "@tanstack/react-query";
import { notifications } from "@mantine/notifications";
import { getErrorMessage } from "@/lib/api/errorMessage";
import { AppLayout } from "@/components/AppLayout";
import { routeMeta, APP_NAME } from "@/lib/routes";
import { createAppTheme } from "@/lib/theme";
import { Plus_Jakarta_Sans } from "next/font/google";

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700"], display: "swap" });

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export type NextPageWithLayout<P = {}> = NextPage<P> & {
  getLayout?: (page: ReactElement) => ReactNode;
};

export default function App({ Component, pageProps }: AppProps & { Component: NextPageWithLayout }) {
  const [qc] = useState(() => new QueryClient({
    queryCache: new QueryCache({
      onError: (error) => {
        notifications.show({ color: "red", title: "Gagal memuat", message: getErrorMessage(error) });
      },
    }),
    mutationCache: new MutationCache({
      onError: (error, _vars, _ctx, mutation) => {
        if (mutation.meta?.suppressErrorToast) return;
        notifications.show({ color: "red", title: "Gagal", message: getErrorMessage(error) });
      },
    }),
    defaultOptions: { queries: { retry: 1 } },
  }));
  const { pathname } = useRouter();
  const meta = routeMeta(pathname);
  const pageTitle = pathname === "/" ? APP_NAME : `${meta.title} · ${APP_NAME}`;
  const getLayout = Component.getLayout ?? ((page) => <AppLayout>{page}</AppLayout>);
  const theme = useMemo(() => createAppTheme(jakarta.style.fontFamily), []);
  return (
    <>
      <Head>
        <title>{pageTitle}</title>
      </Head>
      <MantineProvider theme={theme}>
        <Notifications />
        <QueryClientProvider client={qc}>
          {getLayout(<Component {...pageProps} />)}
        </QueryClientProvider>
      </MantineProvider>
    </>
  );
}
