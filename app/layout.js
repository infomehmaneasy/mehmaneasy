import { Cormorant_Garamond, Inter, Syne } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import AppShell from "@/components/AppShell";

const cormorant = Cormorant_Garamond({ subsets: ["latin"], variable: "--font-serif", weight: ["400", "500", "600", "700"], style: ["normal", "italic"] });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", weight: ["400", "500", "600"] });
const syne = Syne({ subsets: ["latin"], variable: "--font-sora", weight: ["400", "600", "700", "800"] });


export const metadata = {
  title: "Mehmaan Easy | Stay Better. Book Easier.",
  description:
    "Discover thoughtful stays across India with Mehmaan Easy. Find a home that feels like yours, and make every trip a little more memorable.",
};


export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${cormorant.variable} ${inter.variable} ${syne.variable} font-body bg-ink text-cream antialiased`}>

        <AuthProvider>
          <AppShell>{children}</AppShell>
        </AuthProvider>
      </body>
    </html>
  );
}
