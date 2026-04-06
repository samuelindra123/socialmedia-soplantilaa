"use client";

interface GoogleLogoProps {
  className?: string;
}

export default function GoogleLogo({ className }: GoogleLogoProps) {
  return (
    // Gunakan logo resmi "G" dari Wikimedia (public domain) agar bentuk dan warna persis
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg"
      alt="Google"
      className={className}
    />
  );
}
