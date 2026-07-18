import { useEffect, useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import type { HelpDoc } from '../lib/types'
import { api } from '../lib/api'
import { cn } from '../lib/utils'

function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

export default function Help() {
  const [docs, setDocs] = useState<HelpDoc[]>([])
  const [activeTitle, setActiveTitle] = useState<string>('')
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getHelp('zh_CN')
      .then(({ docs }) => {
        setDocs(docs)
        setActiveTitle(docs[0]?.title ?? '')
      })
      .catch(() => setDocs([]))
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return docs
    return docs.filter(doc =>
      doc.title.toLowerCase().includes(q) || stripHtml(doc.content).toLowerCase().includes(q)
    )
  }, [docs, query])

  const activeDoc = filtered.find(doc => doc.title === activeTitle) ?? filtered[0] ?? null

  useEffect(() => {
    if (filtered.length > 0 && !filtered.some(doc => doc.title === activeTitle)) {
      setActiveTitle(filtered[0].title)
    }
  }, [activeTitle, filtered])

  return (
    <div className="p-4 md:p-6 h-full">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <h2 className="text-lg font-bold text-ba-navy">帮助</h2>
          <p className="text-sm text-ba-muted mt-0.5">原项目内置说明</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ba-muted" />
          <input
            className="ba-input pl-9"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="搜索说明"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)] gap-4 min-h-[calc(100vh-140px)]">
        <div className="ba-card overflow-hidden">
          <div className="px-4 py-3 border-b border-ba-border text-xs font-semibold text-ba-muted">
            文档
          </div>
          <div className="max-h-[calc(100vh-190px)] overflow-y-auto p-2">
            {loading && <div className="text-sm text-ba-muted px-3 py-4">加载中...</div>}
            {!loading && filtered.length === 0 && <div className="text-sm text-ba-muted px-3 py-4">没有匹配文档</div>}
            {filtered.map(doc => (
              <button
                key={doc.title}
                onClick={() => setActiveTitle(doc.title)}
                className={cn(
                  'w-full text-left px-3 py-2 rounded-lg text-sm transition-colors',
                  activeDoc?.title === doc.title
                    ? 'bg-ba-pale text-ba-primary font-semibold'
                    : 'text-ba-navy hover:bg-ba-pale/60'
                )}
              >
                {doc.title}
              </button>
            ))}
          </div>
        </div>

        <div className="ba-card overflow-hidden">
          {activeDoc ? (
            <>
              <div className="px-5 py-4 border-b border-ba-border">
                <h3 className="font-semibold text-ba-navy">{activeDoc.title}</h3>
              </div>
              <div
                className="help-doc max-h-[calc(100vh-190px)] overflow-y-auto px-5 py-4 text-sm text-ba-navy"
                dangerouslySetInnerHTML={{ __html: activeDoc.content }}
              />
            </>
          ) : (
            <div className="text-sm text-ba-muted px-5 py-8">暂无帮助内容</div>
          )}
        </div>
      </div>
    </div>
  )
}
