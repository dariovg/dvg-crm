import { Inter } from "next/font/google";
import "./globals.css";
import { APP_PAGE_TITLE, APP_DESCRIPTION } from "@/lib/app-brand";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata = {
  title: APP_PAGE_TITLE,
  description: APP_DESCRIPTION,
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" suppressHydrationWarning className={inter.variable}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("dvg-crm-theme");if(t==="dark"||t==="light")document.documentElement.setAttribute("data-theme",t);var l=localStorage.getItem("dvg-crm-locale");if(l==="en"||l==="es")document.documentElement.setAttribute("lang",l)}catch(e){}})();`,
          }}
        />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
