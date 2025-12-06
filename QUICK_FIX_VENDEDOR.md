# 🚀 Quick Fix: Erro ao Criar Vendedor

## O Problema
Erro 400 ao tentar criar vendedor: **"Não foi possível criar o vendedor"**

## A Causa
`SUPABASE_SERVICE_ROLE_KEY` está usando projeto antigo

## A Solução (5 minutos)

### 1️⃣ Obter nova chave
```
https://supabase.com/dashboard/project/qphofwxpmmhfplylozsh/settings/api
```
Copie a chave **service_role** (secret)

### 2️⃣ Atualizar .env.local
Abra `.env.local` e substitua:
```env
SUPABASE_SERVICE_ROLE_KEY=<COLE_A_NOVA_CHAVE_AQUI>
```

### 3️⃣ Reiniciar servidor
```bash
# Ctrl+C no terminal
npm run dev
```

### 4️⃣ Validar
```bash
npm run validate:env
```

### 5️⃣ Testar
Tente criar o vendedor novamente! ✅

---

## 📖 Mais Detalhes
- **Guia completo:** `docs/FIX_VENDEDOR_ERROR.md`
- **Troubleshooting:** `docs/TROUBLESHOOTING_ENV.md`


