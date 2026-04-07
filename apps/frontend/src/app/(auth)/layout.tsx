import { Space_Grotesk, Plus_Jakarta_Sans } from "next/font/google";

const displayFont = Space_Grotesk({ subsets: ["latin"], variable: "--font-marketing-display", weight: ["500", "700"] });
const bodyFont = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-marketing-body", weight: ["400", "500"] });

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${displayFont.variable} ${bodyFont.variable} font-sans`}>
      {children}
    </div>
  );
}
