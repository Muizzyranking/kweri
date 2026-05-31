"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";


export function FirstVisitGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const key = "kweri_visited";
    const visited = localStorage.getItem(key);
    if (!visited) {
      localStorage.setItem(key, "1");
      router.replace("/checkout");
    } else {
      setAllowed(true);
    }
  }, [router]);

  if (!allowed) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="w-6 h-6 rounded-full border-2 border-border border-t-orange animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
