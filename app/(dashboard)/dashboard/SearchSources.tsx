interface Source {
  index: number
  title: string
  url: string
  snippet: string
}

export default function SearchSources({ sources }: { sources: Source[] }) {
  if (!sources?.length) return null

  return (
    <div className="mt-3 pt-3 border-t border-white/5">
      <p className="text-xs text-white/30 mb-2 uppercase tracking-wide">
        Sources
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {sources.map((s) => (
          <a
            key={s.index}
            href={s.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex gap-2 p-2 rounded-lg bg-white/[0.03] border border-white/[0.07]
            hover:bg-white/[0.06] hover:border-white/15 transition-all duration-200 text-xs"
          >
            <span className="text-white/30 shrink-0">[{s.index}]</span>
            <div className="min-w-0">
              <p className="text-white/80 truncate">{s.title}</p>
              <p className="text-white/30 truncate">
                {(() => {
                  try {
                    return new URL(s.url).hostname
                  } catch {
                    return s.url
                  }
                })()}
              </p>
            </div>
          </a>
        ))}
      </div>
    </div>
  )
}