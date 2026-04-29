import { RefreshCw } from "lucide-react";
interface Props {
    source?: string;
    updatedAt?: string;
    compact?: boolean;
}
function timeAgo(iso?: string): string {
    if (!iso)
        return "";
    const diffSec = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
    if (diffSec < 60)
        return "just now";
    if (diffSec < 3600)
        return `${Math.floor(diffSec / 60)} min ago`;
    return `${Math.floor(diffSec / 3600)} h ago`;
}
export function LiveSourceChip({ source, updatedAt, compact = false }: Props) {
    if (!source)
        return null;
    const href = source.startsWith("http") ? source : `https://${source}`;
    const label = source.replace(/^https?:\/\//, "").replace(/\/$/, "");
    return (<a href={href} target="_blank" rel="noopener noreferrer" className={`inline-flex items-center gap-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors ${compact ? "px-2.5 py-1 text-[11px]" : "px-3 py-1.5 text-xs"}`} title={`Live weather data from ${label} — click to visit`}>
      <span className="live-dot" aria-hidden/>
      <span className="text-white/50 uppercase tracking-wider text-[10px]">
        Live from
      </span>
      <span className="font-semibold text-white/90">{label}</span>
      {updatedAt && !compact && (<span className="hidden sm:flex items-center gap-1 text-white/40 ml-1 border-l border-white/10 pl-2">
          <RefreshCw className="w-3 h-3"/>
          {timeAgo(updatedAt)}
        </span>)}
    </a>);
}
