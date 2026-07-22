// A small gold ornament for marking a chapter break between sections -
// used sparingly, not as a general-purpose divider (plain .rule / border
// lines still do that job everywhere else).
export default function Flourish({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2.5 py-1 ${className}`} aria-hidden="true">
      <span className="h-px flex-1 bg-gradient-to-r from-transparent to-gold/50" />
      <span className="h-1.5 w-1.5 rotate-45 bg-gold/70" />
      <span className="h-px flex-1 bg-gradient-to-l from-transparent to-gold/50" />
    </div>
  );
}
