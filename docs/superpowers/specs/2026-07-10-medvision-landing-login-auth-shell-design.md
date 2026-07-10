# MedVision — Landing mínima + Login rebuild (auth shell)

**Data:** 2026-07-10  
**Status:** aprovado (brainstorming)  
**Registro:** brand (landing) + product (login) — composição compartilhada  
**Relacionado:** `2026-07-10-medvision-ui-simplify-laudo-first-design.md` (expande §8: landing entra nesta fase)

---

## 1. Contexto

Produto autenticado já laudo-first (tokens, shell, Med Vision, Laudos).  
`/` só fazia `redirect('/login')`. Login paper ok, mas layout centrado SaaS (badges Shield/Zap, “Criar conta”, card).  
Usuário pediu landing + login na nova UI.

---

## 2. Decisões

| Decisão | Escolha |
|---------|---------|
| Escopo landing | Hero mínimo: marca + 1 headline + 1 frase + 1 CTA |
| CTAs | Só **Entrar** → `/login` (sem Assinar) |
| Login | Rebuild do zero no mesmo visual da landing |
| Abordagem | Composição única compartilhada (`auth-shell`) |
| Auth backend | Neon Auth intacto (`signInWithPassword`) |
| `/assinar`, `/register` | Fora — ficam como estão |
| Admin nav cut | Fora desta fase |

---

## 3. Intent

Visitante/médico chega em `/`, lê marca clínica quieta, entra.  
Login continua a mesma composição — continuidade marca→auth, sem teatro de IA.

---

## 4. Composição compartilhada

**Desktop (split ~55/45):**
- Esquerda: marca **MedVision** hero-level + headline + frase
- Direita: slot — CTA Entrar (`/`) ou form (`/login`)
- Fundo: `--paper` + atmosfera sutil ardósia (gradiente/textura leve; não flat puro; não emerald)
- Sem cards no hero. Borders-only no form.

**Mobile:** stack — marca+copy em cima; CTA/form embaixo.

**Tokens:** `--paper`, `--surface`, `--ink`, `--ink-muted`, `--rule`, `--signal` (já em `globals.css`).

**Proibido:** glass, blur decorativo, glow emerald/cyan, gradient text, Sparkles, side-stripe >1px, badges Shield/Zap no login.

---

## 5. Copy (PT-BR)

| Slot | Texto |
|------|--------|
| Headline | Laudo clínico. Sem teatro. |
| Frase | Imagem → achados → PDF. IA nos bastidores. |
| CTA landing | Entrar |
| Título form | Acesso |
| Link secundário | Esqueci a senha → `/forgot-password` |

Sem “Bem-vindo de volta”. Sem “Criar conta” no login nesta fase.

---

## 6. Arquitetura de arquivos

| Arquivo | Ação |
|---------|------|
| `components/marketing/auth-shell.tsx` | Novo — layout split + atmosfera |
| `components/marketing/landing-hero.tsx` | Novo — marca + copy (esquerda) |
| `app/page.tsx` | Rebuild — shell + hero + CTA Entrar |
| `app/login/page.tsx` | Rebuild — shell + hero + form no slot |
| `components/auth/login-form.tsx` | Rebuild light-only; remover `variant="dark"` e debug fetches `127.0.0.1` |

Não deletar `components/landing/*` legado (usado por `/assinar`).

---

## 7. Motion

1. Fade-in copy (ease-out, `prefers-reduced-motion` respeitado)
2. Slot direito: entrada sutil (opacity/translate)
3. Focus ring `--signal` nos inputs

---

## 8. Auth / edge cases

- Lógica Neon Auth / redirect pós-login inalterada
- Erros: inline no form
- Se já existir redirect de autenticado em `/` ou `/login` → manter
- `/assinar` e marketing legado: intocados

---

## 9. Aceite

- [ ] `/` = hero paper, marca dominante, 1 headline, 1 frase, 1 CTA Entrar
- [ ] `/login` = mesma composição, form no slot direito
- [ ] Sem glass / glow / emerald / Sparkles / CTA Assinar
- [ ] Logo legível (ink em paper)
- [ ] Mobile stack legível
- [ ] Login funcional (Neon Auth)

---

## 10. Fora de escopo

- Redesign `/assinar`, `/register`, forgot-password visual
- Pricing, FAQ, prova social
- Admin nav (Cursos/Materiais)
- Dark mode
- Mudança de API/modelo de auth

---

## 11. Próximo passo

Plano de implementação → `docs/superpowers/plans/2026-07-10-medvision-landing-login-auth-shell.md`  
Depois: executing-plans / subagent-driven-development.
