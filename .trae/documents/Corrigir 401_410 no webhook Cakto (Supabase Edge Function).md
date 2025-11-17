## Diagnóstico
- O endpoint `https://qphofwxpmmhfplylozsh.functions.supabase.co/cakto` está retornando `401 Missing authorization header`, típico de Edge Functions com verificação de JWT ativa.
- Para webhooks externos (Cakto), a função deve aceitar requisições sem `Authorization`. O guia recomenda desabilitar JWT: `npx supabase functions deploy cakto --no-verify-jwt` (docs/guia-integracao-cakto-local.md:113).
- Caso o erro percebido seja `410`, geralmente indica URL antiga/indisponível ou recurso removido; também valide que o produto Cakto está ativo (docs/guia-integracao-cakto-local.md:105-111).

## Correções Propostas
1. Verificar a configuração da função:
   - Abrir `supabase/functions/cakto/function.toml` e confirmar `verify_jwt = false`.
   - Se estiver `true` ou ausente, ajustar para `false` e preparar reimplantação.
2. Reimplantar a função sem verificação de JWT:
   - Executar `npx supabase functions deploy cakto --no-verify-jwt` para garantir que o gateway não exija `Authorization` nas chamadas do Cakto.
3. Confirmar variáveis de ambiente:
   - Garantir `CAKTO_WEBHOOK_SECRET=25031965-ab73-495c-84c0-affd56d5d531` e `CAKTO_PRODUCT_ID=3263gsd_647430` no ambiente de produção (docs/guia-integracao-cakto-local.md:30-36, 43-46).
4. Validar endpoint e webhook no painel Cakto:
   - Em Configurações → Webhooks, usar exatamente a URL da função `.../cakto` e enviar o teste de webhook (docs/guia-integracao-cakto-local.md:107-112).
5. Testar manualmente:
   - Enviar um `POST` com `Content-Type: application/json` para o endpoint com o payload de exemplo e sem `Authorization`.
   - Esperar logs semelhantes aos do guia (docs/guia-integracao-cakto-local.md:128-133), e status 200/400 conforme assinatura.

## Verificações Adicionais (se houver 410 ou "Produto não encontrado")
- Confirmar que o produto `3263gsd_647430` está ativo no Cakto e que o webhook aceita tanto `short_id` quanto `id`/URL, pois há normalização (docs/guia-integracao-cakto-local.md:38, 105-106).
- Se retornar 404/410, revisar se o webhook aponta para a URL atual da função e se ela está implantada.

## Resultado Esperado
- O `401 Missing authorization header` deixa de ocorrer após o deploy com `--no-verify-jwt` ou `verify_jwt = false` no `function.toml`.
- Webhook de teste do Cakto retorna sucesso, com atualizações de `profiles` e inserção em `payment_history` conforme a implementação descrita (docs/guia-integracao-cakto-local.md:66-73).