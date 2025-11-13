# Configuração do Template de E-mail no Supabase

## Como configurar o template de convite de usuário

### Passo 1: Acessar o Dashboard do Supabase

1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto
3. No menu lateral, vá em **Authentication**
4. Clique em **Email Templates**

### Passo 2: Configurar o Template "Invite user"

1. Encontre o template **"Invite user"** na lista
2. Clique para editar
3. Cole o conteúdo do arquivo `supabase-email-template-invite.html`
4. Clique em **Save** para salvar as alterações

### Variáveis Disponíveis no Template

O Supabase fornece estas variáveis que você pode usar no template:

- `{{ .Email }}` - E-mail do usuário
- `{{ .ConfirmationURL }}` - URL de confirmação/ativação da conta
- `{{ .SiteURL }}` - URL do seu site/aplicação
- `{{ .Token }}` - Token de confirmação (se precisar usar manualmente)
- `{{ .TokenHash }}` - Hash do token

### Passo 3: Configurar URL de Redirecionamento

1. Ainda em **Authentication**, vá em **URL Configuration**
2. Configure o **Site URL** para: `https://seu-dominio.com`
3. Adicione **Redirect URLs** permitidas:
   - `https://seu-dominio.com/**`
   - `http://localhost:3000/**` (para desenvolvimento)

### Passo 4: Testar o Template

Você pode testar o template enviando um convite de teste:

1. Vá em **Authentication > Users**
2. Clique em **Invite user**
3. Digite um e-mail de teste
4. Verifique se o e-mail chegou com o template correto

### Customização Adicional

#### Alterar Cores

Para alterar a paleta de cores do template, modifique estes valores:

- **Cor primária (roxo)**: `#667eea` e `#764ba2`
- **Cor de fundo**: `#f5f5f5`
- **Cor do texto**: `#333333`
- **Cor de destaque**: `#ffa726`

#### Alterar Logotipo

Substitua o emoji 🦷 por uma imagem:

```html
<img src="https://seu-dominio.com/logo.png"
     alt="OdontoGPT"
     style="width: 150px; height: auto;" />
```

#### Adicionar Redes Sociais

Adicione ícones de redes sociais no rodapé:

```html
<div style="margin: 20px 0;">
  <a href="https://instagram.com/seu-perfil" style="margin: 0 10px;">
    <img src="https://cdn-icons-png.flaticon.com/512/2111/2111463.png"
         alt="Instagram"
         style="width: 24px; height: 24px;" />
  </a>
  <a href="https://facebook.com/seu-perfil" style="margin: 0 10px;">
    <img src="https://cdn-icons-png.flaticon.com/512/733/733547.png"
         alt="Facebook"
         style="width: 24px; height: 24px;" />
  </a>
</div>
```

### Outros Templates Disponíveis

Você também pode personalizar estes templates:

1. **Confirm signup** - Confirmação de cadastro
2. **Magic Link** - Link mágico de login
3. **Change Email Address** - Alteração de e-mail
4. **Reset Password** - Redefinição de senha

### Dicas de Design

✅ **Sempre teste em diferentes clientes de e-mail:**
- Gmail (Desktop e Mobile)
- Outlook
- Apple Mail
- Yahoo Mail

✅ **Mantenha a largura máxima em 600px** para compatibilidade

✅ **Use tabelas HTML para layout** (não use flexbox/grid)

✅ **Inline CSS sempre que possível** (alguns clientes removem `<style>`)

✅ **Evite JavaScript** (não funciona em e-mails)

✅ **Otimize imagens** (use CDN e compressão)

### Troubleshooting

**E-mails não estão sendo enviados?**
- Verifique se o domínio está verificado no Supabase
- Confira se o SMTP está configurado corretamente
- Verifique a pasta de spam

**Template não está aparecendo corretamente?**
- Teste em diferentes clientes de e-mail
- Valide o HTML em: https://validator.w3.org/
- Use ferramentas de teste como Litmus ou Email on Acid

**Link de confirmação não funciona?**
- Verifique se a URL de redirecionamento está configurada
- Confirme que a URL está na lista de URLs permitidas
- Verifique se o token não expirou (24h por padrão)

### Configuração Avançada: SMTP Customizado

Para usar seu próprio servidor SMTP:

1. Vá em **Project Settings > Auth**
2. Role até **SMTP Settings**
3. Configure:
   - Host: `smtp.seu-provedor.com`
   - Port: `587` (ou 465 para SSL)
   - Username: `seu-email@dominio.com`
   - Password: `sua-senha`
   - Sender email: `noreply@seu-dominio.com`
   - Sender name: `OdontoGPT`

### Exemplo de Configuração Completa

```env
# Supabase Auth Settings
SUPABASE_AUTH_SITE_URL=https://odontogpt.com
SUPABASE_AUTH_REDIRECT_URLS=https://odontogpt.com/**,http://localhost:3000/**

# SMTP Settings (Opcional)
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=SG.xxxxxxxxxxxxx
SMTP_SENDER_EMAIL=noreply@odontogpt.com
SMTP_SENDER_NAME=OdontoGPT
```

### Suporte

Se tiver problemas, consulte:
- Documentação oficial: https://supabase.com/docs/guides/auth/auth-email-templates
- Comunidade Supabase: https://github.com/supabase/supabase/discussions
- Suporte: https://supabase.com/support
