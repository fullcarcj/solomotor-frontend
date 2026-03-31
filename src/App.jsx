import { createEffect, createMemo, createResource, createSignal, For, Show } from 'solid-js'
import './App.css'

function normalizeApiBaseUrl(value) {
  const raw = String(value || '').trim().replace(/\/+$/, '')
  return raw.replace(/\/api\/v1(?:\/catalog)?$/i, '')
}

const API_URL = normalizeApiBaseUrl(import.meta.env.VITE_API_URL || '')
const API_KEY = import.meta.env.VITE_FRONTEND_API_KEY || ''
const IMG_BASE_URL = import.meta.env.VITE_IMG_BASE_URL || ''
const PAGE_SIZE = 24

async function fetchCatalog(params) {
  if (!API_URL) {
    throw new Error('Falta VITE_API_URL')
  }
  if (!API_KEY) {
    throw new Error('Falta VITE_FRONTEND_API_KEY')
  }

  const url = new URL(`${API_URL}/api/v1/catalog`)
  const trimmed = (params?.search || '').trim()
  const page = Math.max(1, Number(params?.page || 1))
  const offset = (page - 1) * PAGE_SIZE
  if (trimmed) {
    url.searchParams.set('search', trimmed)
  }
  url.searchParams.set('limit', String(PAGE_SIZE))
  url.searchParams.set('offset', String(offset))

  const res = await fetch(url.toString(), {
    headers: {
      'X-API-KEY': API_KEY,
    },
  })

  let body = null
  try {
    body = await res.json()
  } catch (_) {
    body = null
  }

  if (!res.ok) {
    throw new Error(body?.detail || body?.error || `HTTP ${res.status}`)
  }

  return body
}

function buildImageUrl(sku) {
  const base = (IMG_BASE_URL || '').trim()
  const part = encodeURIComponent(String(sku || '').trim())
  if (!base || !part) return ''

  if (base.includes('firebasestorage.googleapis.com') && base.includes('/o/')) {
    const normalized = base.replace(/\?alt=media$/i, '')
    return `${normalized}${part}_1.webp?alt=media`
  }

  if (base.includes('?alt=media')) {
    const normalized = base.replace(/\?alt=media$/i, '')
    return `${normalized}${part}_1.webp?alt=media`
  }

  return `${base.replace(/\/+$/, '')}/${part}_1.webp`
}

function ProductImage(props) {
  const [imageError, setImageError] = createSignal(false)
  const src = createMemo(() => props.sku ? buildImageUrl(props.sku) : '')
  const showPlaceholder = createMemo(() => !src() || imageError())

  return (
    <div class="thumb-wrap">
      <Show when={!showPlaceholder()}>
        <img
          class="thumb"
          src={src()}
          alt={props.alt || 'Producto'}
          loading="lazy"
          onError={() => setImageError(true)}
        />
      </Show>
      <Show when={showPlaceholder()}>
        <div class="thumb placeholder" aria-label="Imagen no disponible">
          <div class="placeholder-inner">
            <svg
              class="placeholder-icon"
              viewBox="0 0 64 64"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <rect x="14" y="18" width="36" height="28" rx="6" stroke="currentColor" stroke-width="3" />
              <path d="M24 18V14C24 11.7909 25.7909 10 28 10H36C38.2091 10 40 11.7909 40 14V18" stroke="currentColor" stroke-width="3" stroke-linecap="round" />
              <path d="M24 31H40" stroke="currentColor" stroke-width="3" stroke-linecap="round" />
              <path d="M24 38H34" stroke="currentColor" stroke-width="3" stroke-linecap="round" />
            </svg>
            <span class="placeholder-title">Imagen en optimizacion</span>
            <span class="placeholder-copy">Foto no disponible por ahora</span>
          </div>
        </div>
      </Show>
    </div>
  )
}

function App() {
  const [searchInput, setSearchInput] = createSignal('')
  const [search, setSearch] = createSignal('')
  const [page, setPage] = createSignal(1)
  const [selectedId, setSelectedId] = createSignal(null)
  const [catalog] = createResource(() => ({ search: search(), page: page() }), fetchCatalog)

  const items = createMemo(() => catalog()?.items || [])
  const total = createMemo(() => catalog()?.total || 0)
  const totalPages = createMemo(() => Math.max(1, Math.ceil(total() / PAGE_SIZE)))
  const selectedItem = createMemo(() => items().find((item) => item.id === selectedId()) || items()[0] || null)

  createEffect(() => {
    const value = searchInput()
    const timer = setTimeout(() => {
      setPage(1)
      setSearch(value)
    }, 350)
    return () => clearTimeout(timer)
  })

  createEffect(() => {
    const first = items()[0]
    if (!first) {
      setSelectedId(null)
      return
    }
    const exists = items().some((item) => item.id === selectedId())
    if (!exists) {
      setSelectedId(first.id)
    }
  })

  return (
    <main class="page">
      <section class="hero">
        <p class="eyebrow">Frontend catalogo publico</p>
        <h1>Catalogo de productos</h1>
        <p class="subtitle">
          Consulta segura contra <code>/api/v1/catalog</code> con busqueda por SKU o nombre.
        </p>
      </section>

      <section class="toolbar">
        <div class="search-form">
          <input
            type="search"
            value={searchInput()}
            onInput={(event) => setSearchInput(event.currentTarget.value)}
            placeholder="Buscar por SKU o nombre"
            autocomplete="off"
          />
          <button type="button" onClick={() => setSearchInput('')}>
            Limpiar
          </button>
        </div>

        <div class="meta">
          <span>API: {API_URL || 'sin configurar'}</span>
          <Show when={catalog.loading}>
            <span>Cargando...</span>
          </Show>
          <Show when={!catalog.loading && !catalog.error}>
            <span>{total()} resultados</span>
          </Show>
          <Show when={search().trim()}>
            <span>Filtro: {search().trim()}</span>
          </Show>
        </div>
      </section>

      <Show when={catalog.error}>
        <section class="state error">
          <strong>Error:</strong> {catalog.error.message}
        </section>
      </Show>

      <Show when={!catalog.loading && !catalog.error && items().length === 0}>
        <section class="state empty">
          No hay productos para mostrar con ese criterio.
        </section>
      </Show>

      <section class="content">
        <section class="grid">
          <For each={items()}>
            {(item) => (
              <article
                class={`card ${selectedId() === item.id ? 'selected' : ''}`}
                onClick={() => setSelectedId(item.id)}
              >
                <ProductImage sku={item.sku} alt={item.nombre} />

                <div class="card-body">
                  <p class="sku">{item.sku}</p>
                  <h2>{item.nombre}</h2>
                  <p class="price">${Number(item.precio_venta || 0).toFixed(2)}</p>
                  <p class="stock">Stock: {item.stock}</p>
                  <p class="id">ID: {item.id}</p>
                </div>
              </article>
            )}
          </For>
        </section>

        <aside class="detail">
          <Show when={selectedItem()} fallback={<div class="state empty">Selecciona un producto.</div>}>
            {(item) => (
              <>
                <div class="detail-body">
                  <p class="sku">SKU: {item().sku}</p>
                  <h2>{item().nombre}</h2>
                  <p class="price">${Number(item().precio_venta || 0).toFixed(2)}</p>
                  <p>Stock disponible: {item().stock}</p>
                  <p>ID interno visible: {item().id}</p>
                  <p class="detail-note">
                    Esta vista solo consume los campos publicos permitidos por la API.
                  </p>
                </div>
              </>
            )}
          </Show>
        </aside>
      </section>

      <section class="pagination">
        <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page() <= 1}>
          Anterior
        </button>
        <span>
          Pagina {page()} de {totalPages()}
        </span>
        <button
          type="button"
          onClick={() => setPage((p) => Math.min(totalPages(), p + 1))}
          disabled={page() >= totalPages()}
        >
          Siguiente
        </button>
      </section>
    </main>
  )
}

export default App
