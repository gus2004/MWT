import "./globals.css";
import { ThemeProvider } from "./theme-context";
import { ConfirmProvider } from "@/components/ConfirmProvider";

export const metadata = {
  title: "MWT Motorsport",
  description: "Sistema Web MWT",
  icons: {
    icon: [
      { url: "/LOGO-Icono.png", type: "image/png" },
      { url: "/LOGO-Icono.ico" },
    ],
    apple: "/LOGO-Icono.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        <ThemeProvider>
          <ConfirmProvider>{children}</ConfirmProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}