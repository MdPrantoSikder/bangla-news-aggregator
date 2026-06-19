import { Link } from "react-router-dom"
import { getBCSSubject } from "../bcs"


export default function BCSSubjectTag({ subject, asLink = true, size = "sm" }) {
  if (!subject || subject === "not_relevant") return null

  const info = getBCSSubject(subject)
  const sizeClasses = size === "lg"
    ? "text-xs px-2.5 py-1"
    : "text-[10px] px-2 py-0.5"

  const content = (
    <span className={`inline-flex items-center font-bold uppercase tracking-widest rounded-md ${info.light} ${sizeClasses}`}>
      {info.label}
    </span>
  )

  if (asLink) {
    return (
      <Link to={`/bcs-feed?subject=${subject}`} className="hover:opacity-80 transition-opacity">
        {content}
      </Link>
    )
  }
  return content
}
