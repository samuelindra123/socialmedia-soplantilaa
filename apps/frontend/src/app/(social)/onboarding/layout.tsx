import { Metadata } from "next";
import Logo from "@/components/Logo";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Selesaikan Profil Anda - Renunganku",
};

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="p-6">
        <Link href="/">
          <Logo variant="full" height={28} className="text-slate-900" />
        </Link>
      </header>
      <main className="flex-1 flex flex-col items-center justify-center p-4">
        {children}
      </main>
    </div>
  );
}