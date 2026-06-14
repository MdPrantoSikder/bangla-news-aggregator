import { useState } from "react"
import { Link } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import {
  Folder, FolderOpen, FolderPlus, Plus, X, Pencil, Check,
  ChevronDown, ChevronRight, Trash2, ExternalLink, Bookmark
} from "lucide-react"
import { useStudySpace } from "../../hooks/useStudySpace"
import SourceBadge from "../../components/SourceBadge"
import StudyShell from "../../components/StudyShell"
import { CATEGORY_LABEL } from "../../utils"


function buildFolderPath(folders, folderId) {
  if (!folderId) return ""
  const parts = []
  let current = folders.find(f => f.id === folderId)
  while (current) {
    parts.unshift(current.name)
    current = current.parentId ? folders.find(f => f.id === current.parentId) : null
  }
  return parts.join(" / ")
}


function MiniArticle({ article, onDelete }) {
  return (
    <div className="bg-white rounded-lg border border-brand-navy-100 p-3 flex items-center gap-3 group">
      {article.image_url && (
        <div className="w-12 h-12 flex-shrink-0 rounded overflow-hidden bg-brand-navy-50">
          <img src={article.image_url} alt="" className="w-full h-full object-cover"
            onError={(e) => { e.target.parentElement.style.display = "none" }} />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <SourceBadge sourceId={article.source_id} />
          {article.category && (
            <span className="text-[10px] uppercase tracking-widest font-bold text-brand-navy-500">
              {CATEGORY_LABEL[article.category] || article.category}
            </span>
          )}
        </div>
        <h4 lang={article.language} className="text-sm font-semibold text-brand-navy-900 line-clamp-1">
          {article.headline}
        </h4>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Link to={`/article/${article.id}`}
          className="p-1.5 rounded text-brand-navy-400 hover:text-brand-navy-700 hover:bg-brand-navy-50">
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
        <button onClick={() => onDelete(article.id)}
          className="p-1.5 rounded text-brand-navy-400 hover:text-red-600 hover:bg-red-50">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}


function FolderNode({ folder, allFolders, savedArticles, depth, onDelete, onMoveToFolder, createFolder, deleteFolder, renameFolder }) {
  const [open, setOpen] = useState(true)
  const [renaming, setRenaming] = useState(false)
  const [renameVal, setRenameVal] = useState(folder.name)
  const [addingChild, setAddingChild] = useState(false)
  const [childName, setChildName] = useState("")

  const children = allFolders.filter(f => f.parentId === folder.id)
  const folderArticles = savedArticles.filter(a => a.folderId === folder.id)
  const totalItems = children.length + folderArticles.length

  const handleRename = () => { if (renameVal.trim()) renameFolder(folder.id, renameVal); setRenaming(false) }
  const handleAddChild = () => {
    if (childName.trim()) { createFolder(childName, folder.id); setChildName(""); setAddingChild(false) }
  }

  return (
    <div className="mb-2" style={{ marginLeft: depth * 20 }}>
      <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-brand-navy-100 hover:border-brand-gold-300 transition-colors">
        <button onClick={() => setOpen(!open)} className="flex items-center gap-2 flex-1 min-w-0">
          {open ? <ChevronDown className="w-3.5 h-3.5 text-brand-navy-400 flex-shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 text-brand-navy-400 flex-shrink-0" />}
          {open ? <FolderOpen className="w-4 h-4 text-brand-gold-500 flex-shrink-0" /> : <Folder className="w-4 h-4 text-brand-gold-500 flex-shrink-0" />}
          {renaming ? (
            <input value={renameVal} onChange={(e) => setRenameVal(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleRename()}
              onClick={(e) => e.stopPropagation()}
              className="flex-1 text-sm font-bold px-2 py-0.5 rounded border border-brand-gold-400 focus:outline-none"
              autoFocus />
          ) : (
            <span className="font-bold text-sm text-brand-navy-900 truncate">{folder.name}</span>
          )}
          <span className="text-xs text-brand-navy-400 flex-shrink-0">{totalItems} item{totalItems !== 1 ? "s" : ""}</span>
        </button>

        <div className="flex items-center gap-1 flex-shrink-0">
          {renaming ? (
            <button onClick={handleRename} className="p-1.5 rounded-lg text-brand-gold-600 hover:bg-brand-gold-50" title="Save">
              <Check className="w-3.5 h-3.5" />
            </button>
          ) : (
            <>
              <button onClick={() => setAddingChild(true)} className="p-1.5 rounded-lg text-brand-navy-400 hover:text-brand-gold-600 hover:bg-brand-gold-50" title="Add sub-folder">
                <FolderPlus className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => { setRenaming(true); setRenameVal(folder.name) }} className="p-1.5 rounded-lg text-brand-navy-400 hover:text-brand-navy-700 hover:bg-brand-navy-100" title="Rename">
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => {
                if (totalItems > 0 && !confirm(`Delete "${folder.name}" and all its contents?`)) return
                deleteFolder(folder.id)
              }} className="p-1.5 rounded-lg text-brand-navy-400 hover:text-red-600 hover:bg-red-50" title="Delete">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>

      {addingChild && (
        <div className="mt-2 ml-6 flex gap-2 items-center bg-brand-navy-50 rounded-lg p-2 border border-brand-navy-200">
          <input value={childName} onChange={(e) => setChildName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddChild()}
            placeholder="Sub-folder name..."
            className="flex-1 text-sm p-1.5 rounded border border-brand-navy-200 focus:outline-none focus:border-brand-gold-400 bg-white"
            autoFocus />
          <button onClick={handleAddChild} className="px-3 py-1.5 rounded bg-brand-gold-500 text-brand-navy-950 text-xs font-bold hover:bg-brand-gold-600">Add</button>
          <button onClick={() => { setAddingChild(false); setChildName("") }} className="p-1.5 rounded text-brand-navy-400 hover:bg-brand-navy-100">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }} className="overflow-hidden mt-2 space-y-2">
            {folderArticles.length > 0 && (
              <div className="space-y-2 ml-6">
                {folderArticles.map(a => <MiniArticle key={a.id} article={a} onDelete={onDelete} />)}
              </div>
            )}
            {children.map(child => (
              <FolderNode key={child.id} folder={child} allFolders={allFolders} savedArticles={savedArticles}
                depth={depth + 1} onDelete={onDelete} onMoveToFolder={onMoveToFolder}
                createFolder={createFolder} deleteFolder={deleteFolder} renameFolder={renameFolder} />
            ))}
            {totalItems === 0 && (
              <div className="ml-6 py-3 text-xs text-brand-navy-400 italic">
                Empty &mdash; add sub-folders or move articles here from Saved
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}


export default function FoldersPage() {
  const [newName, setNewName] = useState("")
  const [showCreate, setShowCreate] = useState(false)

  const {
    folders, savedArticles, unsaveArticle, moveToFolder,
    createFolder, deleteFolder, renameFolder,
  } = useStudySpace()

  const topLevelFolders = folders.filter(f => !f.parentId)

  const handleCreate = () => {
    if (!newName.trim()) return
    createFolder(newName, null)
    setNewName("")
    setShowCreate(false)
  }

  const action = (
    <button onClick={() => setShowCreate(!showCreate)}
      className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg bg-brand-gold-500 text-brand-navy-950 hover:bg-brand-gold-600 transition-colors">
      <Plus className="w-3.5 h-3.5" /> New Folder
    </button>
  )

  return (
    <StudyShell icon={Folder} title="Folders" subtitle={`${folders.length} folder${folders.length !== 1 ? "s" : ""} &middot; nesting supported`} action={action}>
      {showCreate && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="bg-brand-navy-50 rounded-xl p-4 border border-brand-navy-200 mb-4 flex gap-2">
          <input value={newName} onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            placeholder="Top-level folder name (e.g. BCS Prep)"
            className="flex-1 text-sm p-2.5 rounded-lg border border-brand-navy-200 focus:outline-none focus:border-brand-gold-400 bg-white"
            autoFocus />
          <button onClick={handleCreate} className="px-4 py-2 rounded-lg bg-brand-gold-500 text-brand-navy-950 text-sm font-bold hover:bg-brand-gold-600">
            Create
          </button>
          <button onClick={() => setShowCreate(false)} className="p-2 rounded-lg text-brand-navy-400 hover:bg-brand-navy-100">
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}

      {folders.length === 0 ? (
        <div className="text-center py-16 bg-brand-navy-50 rounded-2xl">
          <Folder className="w-10 h-10 text-brand-navy-300 mx-auto mb-3" />
          <p className="font-semibold text-brand-navy-600">No folders yet</p>
          <p className="text-sm text-brand-navy-400 mt-1 mb-4">Create folders to organize your study materials</p>
          <Link to="/study-space/saved" className="text-sm font-semibold text-brand-gold-600 hover:underline">
            See saved articles &rarr;
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {topLevelFolders.map(folder => (
            <FolderNode key={folder.id} folder={folder} allFolders={folders} savedArticles={savedArticles}
              depth={0} onDelete={unsaveArticle} onMoveToFolder={moveToFolder}
              createFolder={createFolder} deleteFolder={deleteFolder} renameFolder={renameFolder} />
          ))}
        </div>
      )}

      {/* Help footer */}
      <div className="mt-8 p-4 bg-brand-navy-50 rounded-xl text-xs text-brand-navy-500 leading-relaxed">
        <p className="font-bold text-brand-navy-700 mb-1">Tips:</p>
        <ul className="space-y-1">
          <li>&middot; Click <FolderPlus className="inline w-3 h-3 text-brand-gold-500" /> to add a sub-folder inside any folder</li>
          <li>&middot; To put articles into folders, go to <Link to="/study-space/saved" className="text-brand-gold-600 hover:underline">Saved Articles</Link> &rarr; click "Add to folder" on any article</li>
        </ul>
      </div>
    </StudyShell>
  )
}
