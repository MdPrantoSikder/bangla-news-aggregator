import { LANG_LABEL } from "../utils"

export default function LangBadge({ language }) {
  return (
    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
      {LANG_LABEL[language] || language}
    </span>
  )
}