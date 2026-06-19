import { useEffect, useState } from "react"
import { useParams, Link } from "react-router-dom"
import { getStory } from "../api"
import SourceBadge from "../components/SourceBadge"
import LangBadge from "../components/LangBadge"
import { timeAgo } from "../utils"

function StoryPage() {
  const { id } = useParams()
  const [story, setStory] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    setError(null)
    getStory(id)
      .then((data) => {
        setStory(data)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }, [id])

  if (loading) return <p className="text-slate-600 text-center py-12">Loading...</p>
  if (error) return (
    <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
      <strong>Error:</strong> {error}
    </div>
  )
  if (!story) return null

  const firstWithSummary = story.articles.find((a) => a.summary_en || a.summary_bn)

  return (
    <div className="max-w-4xl mx-auto">
      <Link to="/" className="text-sm text-indigo-600 hover:underline">&larr; Home</Link>

      <div className="mt-4 mb-6">
        <span className="inline-block text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-600 text-white mb-3">
          STORY &middot; {story.article_count} sources
        </span>
        <h1 className="text-3xl font-bold text-slate-900 leading-tight mb-2">
          {story.articles[0].headline}
        </h1>
        <p className="text-sm text-slate-500">
          Clustered {timeAgo(story.created_at)} &middot; {story.article_count} articles
        </p>
      </div>

      {firstWithSummary && (firstWithSummary.summary_en || firstWithSummary.summary_bn) && (
        <div className="bg-indigo-50 border-l-4 border-indigo-500 p-4 rounded-r-lg mb-8">
          <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wide mb-2">
            AI Summary
          </p>
          {firstWithSummary.summary_en && (
            <p className="text-sm text-slate-700 mb-2">
              <span className="font-semibold">EN: </span>{firstWithSummary.summary_en}
            </p>
          )}
          {firstWithSummary.summary_bn && (
            <p className="text-sm text-slate-700">
              <span className="font-semibold">BN: </span>{firstWithSummary.summary_bn}
            </p>
          )}
        </div>
      )}

      <h2 className="text-xl font-bold text-slate-900 mb-4">
        Coverage from {story.article_count} sources
      </h2>
      <div className="space-y-3">
        {story.articles.map((a) => (
          <Link
            key={a.id}
            to={`/article/${a.id}`}
            className="block bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition border border-slate-100"
          >
            <div className="flex items-center gap-2 mb-2">
              <SourceBadge sourceId={a.source_id} />
              <LangBadge language={a.language} />
              <span className="text-xs text-slate-400 ml-auto">
                {timeAgo(a.scraped_at)}
              </span>
            </div>
            <h3 className="text-base font-semibold text-slate-900 leading-snug">
              {a.headline}
            </h3>
            {(a.summary_en || a.summary_bn) && (
              <p className="text-sm text-slate-600 line-clamp-2 mt-2">
                {a.summary_en || a.summary_bn}
              </p>
            )}
          </Link>
        ))}
      </div>
    </div>
  )
}

export default StoryPage