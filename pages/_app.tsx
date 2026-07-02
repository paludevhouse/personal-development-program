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
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { notifications } from "@mantine/notifications";
import { getErrorMessage, getErrorStatus } from "@/lib/api/errorMessage";
import { AppLayout } from "@/components/AppLayout";
import { routeMeta, APP_NAME } from "@/lib/routes";
import { createAppTheme } from "@/lib/theme";
import { Plus_Jakarta_Sans } from "next/font/google";
import pkg from "../package.json";

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700"], display: "swap" });

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export type NextPageWithLayout<P = {}> = NextPage<P> & {
  getLayout?: (page: ReactElement) => ReactNode;
};

export default function App({ Component, pageProps }: AppProps & { Component: NextPageWithLayout }) {
  const [qc] = useState(() => new QueryClient({
    queryCache: new QueryCache({
      onError: (error) => {
        const s = getErrorStatus(error);
        notifications.show({ color: "red", title: s ? `Gagal memuat (${s})` : "Gagal memuat", message: getErrorMessage(error) });
      },
    }),
    mutationCache: new MutationCache({
      onError: (error, _vars, _ctx, mutation) => {
        if (mutation.meta?.suppressErrorToast) return;
        const s = getErrorStatus(error);
        notifications.show({ color: "red", title: s ? `Gagal (${s})` : "Gagal", message: getErrorMessage(error) });
      },
    }),
    defaultOptions: {
      queries: {
        retry: 1,
        staleTime: 10 * 60_000,
        gcTime: 24 * 60 * 60_000,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
      },
    },
  }));
  const persister = useMemo(
    () =>
      typeof window !== "undefined"
        ? createSyncStoragePersister({ storage: window.localStorage, key: "pedevpro-query-cache" })
        : undefined,
    []
  );
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
        {persister ? (
          <PersistQueryClientProvider
            client={qc}
            persistOptions={{
              persister,
              maxAge: 24 * 60 * 60 * 1000,
              buster: pkg.version,
              dehydrateOptions: {
                shouldDehydrateQuery: (q) => q.state.status === "success" && q.queryKey[0] !== "grade",
              },
            }}
          >
            {getLayout(<Component {...pageProps} />)}
          </PersistQueryClientProvider>
        ) : (
          <QueryClientProvider client={qc}>{getLayout(<Component {...pageProps} />)}</QueryClientProvider>
        )}
      </MantineProvider>
    </>
  );
}
