// Hook client-side para proteção contra cópia, print e dev tools

export function initDocsProtection() {
  // Desabilita seleção de texto
  document.documentElement.style.userSelect = 'none'
  document.documentElement.style.webkitUserSelect = 'none'
  document.documentElement.style.msUserSelect = 'none'
  document.documentElement.style.mozUserSelect = 'none'

  // Desabilita drag and drop
  document.addEventListener('dragstart', (e) => e.preventDefault(), false)
  document.addEventListener('selectstart', (e) => e.preventDefault(), false)

  // Desabilita copy/paste
  document.addEventListener('copy', (e) => {
    e.preventDefault()
    return false
  }, false)

  document.addEventListener('paste', (e) => {
    e.preventDefault()
    return false
  }, false)

  // Desabilita cut
  document.addEventListener('cut', (e) => {
    e.preventDefault()
    return false
  }, false)

  // Desabilita print (Ctrl+P, Cmd+P)
  document.addEventListener('keydown', (e) => {
    if (
      (e.ctrlKey || e.metaKey) &&
      (e.key === 'p' || e.key === 'P')
    ) {
      e.preventDefault()
      e.stopPropagation()
      return false
    }

    // Desabilita F12 (DevTools)
    if (e.key === 'F12') {
      e.preventDefault()
      return false
    }

    // Desabilita Ctrl+Shift+I (DevTools Windows/Linux)
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'i' || e.key === 'I')) {
      e.preventDefault()
      return false
    }

    // Desabilita Ctrl+Shift+C (Inspecionar elemento)
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'c' || e.key === 'C')) {
      e.preventDefault()
      return false
    }

    // Desabilita Ctrl+Shift+J (DevTools console Windows/Linux)
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'j' || e.key === 'J')) {
      e.preventDefault()
      return false
    }

    // Desabilita Cmd+Option+I (DevTools Mac)
    if (e.metaKey && e.altKey && (e.key === 'i' || e.key === 'I')) {
      e.preventDefault()
      return false
    }

    // Desabilita Cmd+Option+J (DevTools console Mac)
    if (e.metaKey && e.altKey && (e.key === 'j' || e.key === 'J')) {
      e.preventDefault()
      return false
    }
  }, false)

  // Desabilita print via @media
  const style = document.createElement('style')
  style.innerHTML = `
    @media print {
      body { display: none !important; }
    }

    * {
      -webkit-user-select: none !important;
      -moz-user-select: none !important;
      -ms-user-select: none !important;
      user-select: none !important;
      -webkit-touch-callout: none !important;
    }
  `
  document.head.appendChild(style)

  // Desabilita context menu (clique direito)
  document.addEventListener('contextmenu', (e) => {
    e.preventDefault()
    return false
  }, false)

  // Detecta tentativa de inspecionar elemento
  let devToolsOpen = false
  const checkDevTools = setInterval(() => {
    if (
      window.outerHeight - window.innerHeight > 100 ||
      window.outerWidth - window.innerWidth > 100
    ) {
      if (!devToolsOpen) {
        devToolsOpen = true
        handleDevToolsDetected()
      }
    } else {
      devToolsOpen = false
    }
  }, 1000)

  return () => clearInterval(checkDevTools)
}

function handleDevToolsDetected() {
  // Mostra mensagem ao usuário
  console.warn(
    '%c⚠️ ACESSO NEGADO',
    'color: red; font-size: 16px; font-weight: bold;'
  )
  console.warn(
    '%cVocê está tentando acessar ferramentas do desenvolvedor. Isso não é permitido nesta página.',
    'color: red; font-size: 12px;'
  )

  // Opcional: redireciona para login se DevTools foi aberto
  // Descomente a linha abaixo se desejar fazer logout automático
  // sessionStorage.removeItem('docs_authenticated')
  // window.location.href = '/documentacao'
}

// Função para verificar se usuário está autenticado
export function isDocsAuthenticated(): boolean {
  if (typeof window === 'undefined') return false
  return sessionStorage.getItem('docs_authenticated') === 'true'
}

// Função para fazer logout
export function logoutDocs() {
  sessionStorage.removeItem('docs_authenticated')
  window.location.href = '/documentacao'
}
