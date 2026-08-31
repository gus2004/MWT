import "./globals.css";
import { ThemeProvider } from "./theme-context";

export const metadata = {
  title: "MWT Prototipo",
  description: "Sistema Web MWT",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}