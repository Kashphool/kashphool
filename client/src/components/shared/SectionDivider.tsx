/*
  DESIGN: Sacred Geometry Modernism
  - Gold gradient line divider between sections
  - Optional small mandala/lotus accent in center
*/

export default function SectionDivider({ withAccent = false }: { withAccent?: boolean }) {
  return (
    <div className="relative py-4">
      <div className="h-[1px] bg-gradient-to-r from-transparent via-gold/25 to-transparent" />
      {withAccent && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center">
          <div className="w-3 h-3 rotate-45 border border-gold/40 bg-charcoal" />
        </div>
      )}
    </div>
  );
}
