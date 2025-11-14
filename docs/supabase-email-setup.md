# Configuração de Emails do Supabase

## 📧 Como Configurar os Templates de Email

### 1. Acessar o Dashboard do Supabase

1. Acesse: https://supabase.com/dashboard/project/qphofwxpmmhfplylozsh
2. Vá em **Authentication** > **Email Templates**

### 2. Configurar SMTP (Opcional - Para Produção)

Por padrão, o Supabase usa o próprio serviço de email deles (limitado a 4 emails/hora no plano free).

Para produção, configure SMTP customizado:

1. Vá em **Project Settings** > **Auth** > **SMTP Settings**
2. Configure com seu provedor (ex: SendGrid, Mailgun, AWS SES)

**Recomendado: SendGrid (Free tier: 100 emails/dia)**
- Host: `smtp.sendgrid.net`
- Port: `587`
- Username: `apikey`
- Password: Sua API Key do SendGrid

### 3. Personalizar Template de "Reset Password"

Este é o email enviado quando o usuário é criado via webhook.

**Template Sugerido:**

```html
<h2>Bem-vindo ao Odonto GPT! 🎉</h2>

<p>Olá {{ .Name }},</p>

<p>Sua compra foi confirmada e sua conta premium foi ativada com sucesso!</p>

<p><strong>Para acessar a plataforma pela primeira vez:</strong></p>

<ol>
  <li>Clique no botão abaixo para criar sua senha</li>
  <li>Você será redirecionado para o dashboard</li>
  <li>Comece a usar todos os recursos premium imediatamente!</li>
</ol>

<p><a href="{{ .ConfirmationURL }}" style="background-color: #2399B4; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">Criar Minha Senha e Acessar</a></p>

<p>Este link é válido por 24 horas.</p>

<p><strong>Seu acesso inclui:</strong></p>
<ul>
  <li>✅ IA especializada em Odontologia via WhatsApp</li>
  <li>✅ Acesso a cursos exclusivos</li>
  <li>✅ Material didático atualizado</li>
  <li>✅ Suporte prioritário</li>
  <li>✅ Válido por 1 ano</li>
</ul>

<p>Caso não tenha feito esta compra, ignore este email.</p>

<p>Equipe Odonto GPT<br>
<a href="https://odontogpt.com">odontogpt.com</a></p>
```

### 4. Personalizar Template de "Magic Link"

Template para login sem senha:

```html
<h2>Acesse sua conta Odonto GPT</h2>

<p>Olá,</p>

<p>Clique no botão abaixo para acessar sua conta:</p>

<p><a href="{{ .ConfirmationURL }}" style="background-color: #2399B4; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">Acessar Minha Conta</a></p>

<p>Este link é válido por 1 hora e só pode ser usado uma vez.</p>

<p>Caso não tenha solicitado este acesso, ignore este email.</p>

<p>Equipe Odonto GPT</p>
```

### 5. Configurar Redirect URLs

Em **Authentication** > **URL Configuration**:

- **Site URL**: `https://odontogpt.com`
- **Redirect URLs**:
  - `https://odontogpt.com/auth/callback`
  - `https://odontogpt.com/dashboard`
  - `http://localhost:3000/auth/callback` (para desenvolvimento)

### 6. Testar Emails

Após configurar, teste com:

```bash
python3 /tmp/test_real_user.py
```

Verifique:
1. ✅ Email recebido na caixa de entrada
2. ✅ Link funciona e redireciona para dashboard
3. ✅ Usuário consegue criar senha

## 📊 Monitoramento

### Ver Logs de Email

1. Acesse: https://supabase.com/dashboard/project/qphofwxpmmhfplylozsh/logs/edge-functions
2. Filtre por função: `cakto`
3. Procure por logs com `📧` (email enviado)

### Troubleshooting

**Email não está sendo enviado?**
- ✅ Verifique se SMTP está configurado
- ✅ Verifique rate limits (4/hora no free tier)
- ✅ Verifique logs da Edge Function
- ✅ Verifique spam/lixo eletrônico

**Link não funciona?**
- ✅ Verifique Redirect URLs
- ✅ Certifique-se que `APP_URL` está correto
- ✅ Link expira em 24h (recovery) ou 1h (magic link)

## 🚀 Fluxo Completo

```
1. Cliente compra no Cakto
   ↓
2. Webhook cria usuário no Supabase
   ↓
3. Supabase envia email automaticamente
   ↓
4. Cliente clica no link do email
   ↓
5. Cliente cria senha
   ↓
6. Redireciona para /dashboard
   ↓
7. ✅ Cliente logado com acesso premium
```

## 📝 Variáveis de Ambiente Necessárias

Já configuradas na Edge Function:
- ✅ `SUPABASE_URL`
- ✅ `SUPABASE_SERVICE_ROLE_KEY`
- ✅ `CAKTO_WEBHOOK_SECRET`
- ✅ `CAKTO_PRODUCT_ID`
- ✅ `APP_URL` (https://odontogpt.com)

## ✅ Status Atual

- ✅ Webhook criando usuários automaticamente
- ✅ Gerando links de recuperação de senha
- ✅ Gerando magic links
- ⏳ **PENDENTE**: Configurar templates de email no dashboard
- ⏳ **PENDENTE**: Configurar SMTP para produção (opcional)
