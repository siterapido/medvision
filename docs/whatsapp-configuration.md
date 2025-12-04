# Configuração do WhatsApp

## Visão Geral

A aba de WhatsApp no dashboard permite que os usuários entrem em contato diretamente com a equipe da Odonto GPT através do WhatsApp.

## Como Funciona

Quando o usuário clica na aba "WhatsApp" no menu lateral, ele é redirecionado automaticamente para uma conversa no WhatsApp com o número configurado da Odonto GPT.

## Configuração do Número

Para configurar o número do WhatsApp, edite o arquivo:

```
app/dashboard/whatsapp/page.tsx
```

Localize a linha que define o número:

```typescript
const whatsappNumber = "5511999999999"
```

### Formato do Número

O número deve estar no formato internacional, **sem espaços, traços ou parênteses**:

- **Código do país**: 55 (Brasil)
- **DDD**: 11, 21, etc.
- **Número**: 9 dígitos para celular

**Exemplos:**
- São Paulo: `5511999999999`
- Rio de Janeiro: `5521999999999`
- Brasília: `5561999999999`

### Personalizando a Mensagem Inicial

Você também pode personalizar a mensagem que aparece pré-preenchida no WhatsApp:

```typescript
const message = encodeURIComponent("Olá! Vim pelo dashboard da Odonto GPT.")
```

## Localização no Dashboard

A aba de WhatsApp aparece no menu lateral entre "Materiais" e "Perfil", com o ícone de mensagem (💬).

## Comportamento

1. Usuário clica em "WhatsApp" no menu
2. É exibida uma tela de carregamento com animação
3. Redirecionamento automático para o WhatsApp Web/App
4. A conversa é iniciada com a mensagem pré-configurada

## Suporte Mobile

O redirecionamento funciona tanto em desktop (WhatsApp Web) quanto em mobile (app do WhatsApp), detectando automaticamente a melhor opção para o dispositivo do usuário.


