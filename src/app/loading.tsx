import Logo from "@/components/Logo";

export default function Loading() {
  return (
    <div className="flex flex-col min-h-screen bg-absolute-black text-light-gray items-center justify-center space-y-8">
      <div className="relative flex flex-col items-center gap-6">
        <Logo className="w-32 h-auto" />
      </div>

      <p className="text-xs font-bold tracking-[0.3em] text-muted-ash/70 uppercase animate-pulse">
        Loading your words...
      </p>
    </div>
  );
}
