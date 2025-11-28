# Guia de Uso: Anexos de Arquivos em Aulas

## Quem pode anexar arquivos?
- Apenas usuários com papel `admin`.

## Como anexar arquivos na área admin
1. Acesse `Admin → Cursos → Aulas` e entre em "Editar Aula".
2. Na seção "Anexos da aula", clique em "Enviar arquivo".
3. Selecione um arquivo válido (PDF, DOCX, PPTX, XLSX, imagens, ZIP) de até 10MB.
4. Acompanhe a barra de progresso; ao concluir, o arquivo aparece na lista.
5. Use o botão de lixeira para remover anexos quando necessário.

## Como os alunos acessam os anexos
- Na página da aula, há a seção "Arquivos da aula" com lista de anexos.
- O botão "Baixar" libera a URL CDN do Bunny apenas para usuários autorizados.
- Apenas usuários autorizados (inscritos no curso) conseguem obter o link.

## Boas práticas
- Nomeie arquivos com títulos claros (ex.: "Checklist Pré-Operatório.pdf").
- Prefira PDF para materiais textuais.
- Mantenha o tamanho abaixo de 10MB para melhor experiência.

## Limites e formatos
- Tamanho máximo por arquivo: configurável por `NEXT_PUBLIC_MAX_ATTACHMENT_MB` (padrão 10MB).
- Formatos suportados: PDF, DOC/DOCX, PPT/PPTX, XLS/XLSX, imagens, ZIP.

## Infra
- Armazenamento: Bunny Storage (`BUNNY_STORAGE_ZONE`), servido via CDN (`BUNNY_CDN_BASE_URL`).
- Credenciais: `BUNNY_STORAGE_API_KEY` (AccessKey da Storage Zone) configurada no backend.
