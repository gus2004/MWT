import "./globals.css";
import { ThemeProvider } from "./theme-context";
import { ConfirmProvider } from "@/components/ConfirmProvider";

export const metadata = {
  title: "MWT Prototipo",
  description: "Sistema Web MWT",
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