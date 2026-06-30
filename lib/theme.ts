import { createTheme, MantineColorsTuple } from "@mantine/core";

const brand: MantineColorsTuple = [
  "#e3fafc", "#c5f6fa", "#99e9f2", "#66d9e8", "#3bc9db",
  "#22b8cf", "#0fa6b5", "#009ca6", "#08818c", "#0b6b73",
];
const accent: MantineColorsTuple = [
  "#fff4e6", "#ffe8cc", "#ffd8a8", "#ffc078", "#ffa94d",
  "#ff922b", "#fd7e14", "#f58a1f", "#e8590c", "#d9480f",
];

const FALLBACK = "Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif";

export function createAppTheme(fontFamily?: string) {
  const ff = fontFamily ?? FALLBACK;
  return createTheme({
    primaryColor: "brand",
    primaryShade: 7,
    colors: { brand, accent },
    defaultRadius: "md",
    fontFamily: ff,
    headings: { fontFamily: ff, fontWeight: "700" },
    shadows: {
      sm: "0 1px 2px rgba(11,107,115,0.06), 0 2px 6px rgba(11,107,115,0.08)",
      md: "0 4px 12px rgba(11,107,115,0.10)",
    },
    components: {
      Paper: { defaultProps: { shadow: "sm", radius: "md", withBorder: true } },
      Card: { defaultProps: { shadow: "sm", radius: "md", withBorder: true } },
      Table: { defaultProps: { highlightOnHover: true, striped: "odd", withTableBorder: true, verticalSpacing: "sm", horizontalSpacing: "md" } },
      Button: { defaultProps: { radius: "md" } },
      TextInput: { defaultProps: { radius: "md" } },
      PasswordInput: { defaultProps: { radius: "md" } },
      Select: { defaultProps: { radius: "md" } },
      Textarea: { defaultProps: { radius: "md" } },
      Modal: { styles: { title: { fontWeight: 700 } } },
    },
  });
}

export const theme = createAppTheme();
