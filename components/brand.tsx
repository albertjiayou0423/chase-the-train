import Image from "next/image";

export function Brand({ compact = false }: { compact?: boolean }) {
  return <span className="inline-flex items-center gap-2 font-semibold">
    <Image src="/icon.svg" alt="" width={28} height={28} className="size-7" />
    {!compact && <span>Chase The Train</span>}
  </span>;
}
