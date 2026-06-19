import { useState, useEffect, useCallback } from "react"

const KEYS = {
  articles:  "studyspace_articles",
  keyPoints: "studyspace_keypoints",
  glossary:  "studyspace_glossary",
  folders:   "studyspace_folders",
}

function load(key) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function save(key, data) {
  try { localStorage.setItem(key, JSON.stringify(data)) }
  catch { console.error("localStorage write failed:", key) }
}

export function useStudySpace() {
  const [savedArticles, setSavedArticles] = useState(() => load(KEYS.articles))
  const [keyPoints,     setKeyPoints]     = useState(() => load(KEYS.keyPoints))
  const [glossary,      setGlossary]      = useState(() => load(KEYS.glossary))
  const [folders,       setFolders]       = useState(() => load(KEYS.folders))

  useEffect(() => { save(KEYS.articles,  savedArticles) }, [savedArticles])
  useEffect(() => { save(KEYS.keyPoints, keyPoints)     }, [keyPoints])
  useEffect(() => { save(KEYS.glossary,  glossary)      }, [glossary])
  useEffect(() => { save(KEYS.folders,   folders)       }, [folders])

  // ── Saved Articles ──────────────────────────────────────────────
  const isArticleSaved = useCallback(
    (id) => savedArticles.some((a) => a.id === id),
    [savedArticles]
  )

  const saveArticle = useCallback((article) => {
    setSavedArticles((prev) => {
      if (prev.some((a) => a.id === article.id)) return prev
      return [{
        id:         article.id,
        headline:   article.headline,
        source_id:  article.source_id,
        language:   article.language,
        category:   article.category,
        image_url:  article.image_url,
        summary_en: article.summary_en,
        summary_bn: article.summary_bn,
        savedAt:    new Date().toISOString(),
        note:       "",
        folderId:   null,
      }, ...prev]
    })
  }, [])

  const unsaveArticle = useCallback((id) => {
    setSavedArticles((prev) => prev.filter((a) => a.id !== id))
  }, [])

  const updateArticleNote = useCallback((id, note) => {
    setSavedArticles((prev) =>
      prev.map((a) => (a.id === id ? { ...a, note } : a))
    )
  }, [])

  const moveToFolder = useCallback((articleId, folderId) => {
    setSavedArticles((prev) =>
      prev.map((a) => (a.id === articleId ? { ...a, folderId } : a))
    )
  }, [])

  // ── Key Points ──────────────────────────────────────────────────
  const addKeyPoint = useCallback((articleId, articleHeadline, text) => {
    setKeyPoints((prev) => [{
      id: Date.now(),
      articleId,
      articleHeadline,
      text: text.trim(),
      savedAt: new Date().toISOString(),
    }, ...prev])
  }, [])

  const deleteKeyPoint = useCallback((id) => {
    setKeyPoints((prev) => prev.filter((kp) => kp.id !== id))
  }, [])

  // ── Glossary ────────────────────────────────────────────────────
  const addGlossaryTerm = useCallback((term, definition, language = "en") => {
    setGlossary((prev) => {
      if (prev.some((g) => g.term.toLowerCase() === term.toLowerCase())) return prev
      return [{
        id: Date.now(),
        term: term.trim(),
        definition: definition.trim(),
        language,
        addedAt: new Date().toISOString(),
      }, ...prev]
    })
  }, [])

  const deleteGlossaryTerm = useCallback((id) => {
    setGlossary((prev) => prev.filter((g) => g.id !== id))
  }, [])

  // ── Nested Folders ──────────────────────────────────────────────
  const createFolder = useCallback((name, parentId = null) => {
    setFolders((prev) => {
      // Duplicate check ONLY within the same parent.
      const dup = prev.some(
        (f) => f.parentId === parentId && f.name.toLowerCase() === name.toLowerCase()
      )
      if (dup) return prev
      return [...prev, {
        id:        Date.now(),
        name:      name.trim(),
        parentId,
        createdAt: new Date().toISOString(),
      }]
    })
  }, [])

  const deleteFolder = useCallback((folderId) => {
    // Collect this folder + ALL descendants (recursive).
    const idsToDelete = new Set()
    const collect = (id) => {
      idsToDelete.add(id)
      for (const f of folders) {
        if (f.parentId === id) collect(f.id)
      }
    }
    collect(folderId)

    setFolders((prev) => prev.filter((f) => !idsToDelete.has(f.id)))
    // Move articles in any of those folders back to unorganized.
    setSavedArticles((prev) =>
      prev.map((a) => (idsToDelete.has(a.folderId) ? { ...a, folderId: null } : a))
    )
  }, [folders])

  const renameFolder = useCallback((folderId, newName) => {
    setFolders((prev) =>
      prev.map((f) => (f.id === folderId ? { ...f, name: newName.trim() } : f))
    )
  }, [])

  // ── Stats ───────────────────────────────────────────────────────
  const stats = {
    articles:  savedArticles.length,
    keyPoints: keyPoints.length,
    glossary:  glossary.length,
    folders:   folders.length,
  }

  return {
    savedArticles, keyPoints, glossary, folders,
    stats,
    isArticleSaved, saveArticle, unsaveArticle,
    updateArticleNote, moveToFolder,
    addKeyPoint, deleteKeyPoint,
    addGlossaryTerm, deleteGlossaryTerm,
    createFolder, deleteFolder, renameFolder,
  }
}
