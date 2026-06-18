import "./globals.css";

export const metadata = {
  title: "DVG CRM",
  description: "CRM interno DVG Studio",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
