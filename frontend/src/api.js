const API_BASE_URL = "http://localhost:8000"


async function apiGet(path) {
  const url = `${API_BASE_URL}${path}`
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`API error ${response.status} on ${path}`)
  }
  return response.json()
}


// ===== Articles ==========================================================

export async function listArticles({ limit = 20, offset = 0, language = null, category = null } = {}) {
  const params = new URLSearchParams({ limit: String(limit), offset: String(offset) })
  if (language) params.set("language", language)
  if (category) params.set("category", category)
  return apiGet(`/articles/?${params.toString()}`)
}

export async function getArticle(id) {
  return apiGet(`/articles/${id}`)
}

export async function getCategoryStats() {
  return apiGet("/articles/stats/categories")
}


// ===== BCS Feed ==========================================================

export async function getBCSFeed({ subject = null, relevance = null, limit = 30, offset = 0 } = {}) {
  const params = new URLSearchParams({ limit: String(limit), offset: String(offset) })
  if (subject) params.set("subject", subject)
  if (relevance) params.set("relevance", relevance)
  return apiGet(`/articles/bcs-feed?${params.toString()}`)
}

export async function getBCSStats() {
  return apiGet("/articles/bcs-feed/stats")
}


// ===== Sources ===========================================================

export async function listSources() {
  return apiGet("/sources/")
}


// ===== Search ============================================================

export async function searchArticles(q, type = "hybrid", limit = 20) {
  const params = new URLSearchParams({ q, type, limit: String(limit) })
  return apiGet(`/search/?${params.toString()}`)
}


// ===== Stories ===========================================================

export async function listStories({ multiOnly = false, limit = 20, offset = 0, language = null, category = null } = {}) {
  const params = new URLSearchParams({
    multi_only: String(multiOnly),
    limit: String(limit),
    offset: String(offset),
  })
  if (language) params.set("language", language)
  if (category) params.set("category", category)
  return apiGet(`/stories/?${params.toString()}`)
}

export async function getStory(id) {
  return apiGet(`/stories/${id}`)
}
