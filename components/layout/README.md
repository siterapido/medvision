# Componentes de Layout Reutilizáveis

Este diretório contém componentes genéricos de layout que podem ser reutilizados em diferentes partes da aplicação.

## Header

Componente de cabeçalho flexível e responsivo.

### Uso Básico

```tsx
import { Header } from "@/components/layout/header"

export function MyPage() {
  return (
    <Header
      leftContent={
        <button onClick={handleToggle}>Menu</button>
      }
      rightContent={
        <button onClick={handleLogout}>Logout</button>
      }
    />
  )
}
```

### Props

- `leftContent` - Conteúdo do lado esquerdo (desktop)
- `rightContent` - Conteúdo do lado direito (desktop)
- `mobileLeftContent` - Conteúdo mobile esquerdo
- `mobileRightContent` - Conteúdo mobile direito
- `onToggleMenu` - Callback para toggle do menu mobile
- `isMenuOpen` - Estado do menu (aberto/fechado)
- `showLogo` - Mostrar logo (padrão: true)
- `logoHref` - URL da logo (padrão: "/")
- `className` - Classes CSS adicionais

## Footer

Componente de rodapé com copyright e links.

### Uso Básico

```tsx
import { Footer } from "@/components/layout/footer"

export function MyPage() {
  return (
    <Footer
      copyrightText="OdontoGPT. Todos os direitos reservados."
      links={[
        { label: "Termos", href: "/termos" },
        { label: "Privacidade", href: "/privacidade" },
        { label: "Suporte", href: "/suporte" },
      ]}
    />
  )
}
```

### Props

- `copyrightText` - Texto de copyright (sem ano)
- `links` - Array de links `{ label: string, href: string }`
- `showSeparators` - Mostrar separadores entre links (padrão: true)
- `leftContent` - Conteúdo adicional à esquerda
- `rightContent` - Conteúdo adicional à direita
- `className` - Classes CSS adicionais

## Sidebar

Componente de barra lateral com navegação.

### Uso Básico

```tsx
import { Sidebar, SidebarDrawer } from "@/components/layout/sidebar"
import { Home, Settings, User } from "lucide-react"
import { Logo } from "@/components/logo"

const navItems = [
  { name: "Início", href: "/", icon: Home },
  { name: "Perfil", href: "/perfil", icon: User },
  { name: "Configurações", href: "/config", icon: Settings },
]

export function MyLayout() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  return (
    <>
      {/* Desktop */}
      <Sidebar
        items={navItems}
        width={200}
        isVisible={true}
        topContent={<Logo width={120} height={32} variant="white" />}
      />

      {/* Mobile */}
      <SidebarDrawer
        items={navItems}
        width={200}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        topContent={<Logo width={120} height={32} variant="white" />}
      />
    </>
  )
}
```

### Props Sidebar

- `items` - Array de itens de navegação `{ name: string, href: string, icon: LucideIcon }`
- `width` - Largura em pixels (padrão: 200)
- `isVisible` - Sidebar visível (padrão: true)
- `onClose` - Callback quando fecha (mobile)
- `topContent` - Conteúdo do topo (ex: logo)
- `bottomContent` - Conteúdo do rodapé
- `className` - Classes CSS adicionais

### Props SidebarDrawer

- `items` - Array de itens de navegação
- `width` - Largura em pixels (padrão: 200)
- `isOpen` - Drawer aberto (padrão: false)
- `onClose` - Callback quando fecha (obrigatório)
- `topContent` - Conteúdo do topo
- `bottomContent` - Conteúdo do rodapé

## Exemplo Completo de Layout

```tsx
"use client"

import { useState } from "react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Sidebar, SidebarDrawer } from "@/components/layout/sidebar"
import { Home, Settings, User, LogOut } from "lucide-react"
import { Logo } from "@/components/logo"

const navItems = [
  { name: "Início", href: "/", icon: Home },
  { name: "Perfil", href: "/perfil", icon: User },
  { name: "Configurações", href: "/config", icon: Settings },
]

const footerLinks = [
  { label: "Termos", href: "/termos" },
  { label: "Privacidade", href: "/privacidade" },
  { label: "Suporte", href: "/suporte" },
]

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarVisible, setIsSidebarVisible] = useState(true)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  const handleToggle = () => {
    // Desktop: toggle sidebar
    // Mobile: toggle drawer
    if (window.innerWidth >= 768) {
      setIsSidebarVisible(!isSidebarVisible)
    } else {
      setIsDrawerOpen(!isDrawerOpen)
    }
  }

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Sidebar Desktop */}
      <Sidebar
        items={navItems}
        width={200}
        isVisible={isSidebarVisible}
        topContent={<Logo width={120} height={32} variant="white" />}
      />

      {/* Sidebar Mobile */}
      <SidebarDrawer
        items={navItems}
        width={200}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        topContent={<Logo width={120} height={32} variant="white" />}
      />

      <div className="flex flex-1 flex-col">
        {/* Header */}
        <Header
          onToggleMenu={handleToggle}
          isMenuOpen={isDrawerOpen}
          leftContent={
            <button onClick={handleToggle}>Toggle Menu</button>
          }
          rightContent={
            <button className="flex items-center gap-2">
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          }
        />

        {/* Main Content */}
        <main className="flex flex-1 flex-col overflow-auto bg-[#eff4fb] p-4 md:p-6 lg:p-8">
          {children}
        </main>

        {/* Footer */}
        <Footer
          copyrightText="OdontoGPT. Todos os direitos reservados."
          links={footerLinks}
        />
      </div>
    </div>
  )
}
```

## Estilo Visual

Todos os componentes compartilham o mesmo tema visual:

- **Background**: Gradiente de `slate-950` → `slate-900` → `slate-950`
- **Bordas**: `slate-800` com opacidade
- **Textos**: `slate-400` (normal), `slate-200` (hover), `white` (ativo)
- **Botões**: Bordas sutis com `backdrop-blur-sm`
- **Transições**: `duration-200` para interações suaves
- **Hover**: Escala de ícones e mudança de cores

## Customização

Você pode sobrescrever os estilos padrão usando a prop `className`:

```tsx
<Header className="bg-blue-950 border-blue-800" />
<Footer className="bg-gray-900" />
<Sidebar className="bg-indigo-950" />
```
