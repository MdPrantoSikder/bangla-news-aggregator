const TABS = [
  { value: null, label: "All" },
  { value: "en", label: "English" },
  { value: "bn", label: "বাংলা" },
]

export default function LanguageTabs({ selected, onChange }) {
  return (
    <div className="inline-flex rounded-lg bg-slate-100 p-1 mb-6">
      {TABS.map((tab) => {
        const active = tab.value === selected
        return (
          <button
            key={String(tab.value)}
            onClick={() => onChange(tab.value)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${
              active
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}