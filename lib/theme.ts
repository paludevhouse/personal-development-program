import { createTheme, MantineColorsTuple } from "@mantine/core";

const brand: MantineColorsTuple = [
  "#e3fafc", "#c5f6fa", "#99e9f2", "#66d9e8", "#3bc9db",
  "#22b8cf", "#0fa6b5", "#009ca6", "#08818c", "#0b6b73",
];

const accent: MantineColorsTuple = [
  "#fff4e6", "#ffe8cc", "#ffd8a8", "#ffc078", "#ffa94d",
  "#ff922b", "#fd7e14", "#f58a1f", "#e8590c", "#d9480f",
];

export const theme = createTheme({
  primaryColor: "brand",
  primaryShade: 7,
  colors: { brand, accent },
  defaultRadius: "md",
});
