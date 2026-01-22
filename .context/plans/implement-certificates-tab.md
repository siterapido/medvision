# Plano de Implementação: Aba de Certificados

Este plano descreve a implementação do sistema de certificados para o Odonto GPT, permitindo que estudantes solicitem e visualizem certificados de conclusão de cursos, e que administradores gerenciem essas emissões.

## Objetivos e Escopo

- **Estudante**: Visualizar certificados emitidos, baixar certificados e solicitar novos certificados para cursos concluídos.
- **Administrador**: Cadastrar certificados manualmente, visualizar solicitações de certificados e aprovar/rejeitar solicitações.
- **Integração**: Conectar com a tabela de cursos e progresso do usuário para validar elegibilidade.

## Fases de Implementação

### Fase 1: Banco de Dados e Esquema
1. Criar tabela `certificates`:
   - `id`: uuid (PK)
   - `user_id`: uuid (FK -> profiles)
   - `course_id`: uuid (FK -> courses)
   - `issue_date`: timestamp
   - `hours`: integer (carga horária)
   - `certificate_url`: text (link para o arquivo ou gerador)
   - `status`: text (active, revoked)
2. Criar tabela `certificate_requests`:
   - `id`: uuid (PK)
   - `user_id`: uuid (FK -> profiles)
   - `course_id`: uuid (FK -> courses)
   - `request_date`: timestamp
   - `status`: text (pending, approved, rejected)
   - `admin_notes`: text

### Fase 2: Backend e APIs
1. Criar `app/api/certificates/route.ts`:
   - GET: Lista certificados do usuário logado.
2. Criar `app/api/certificates/request/route.ts`:
   - POST: Cria uma nova solicitação de certificado.
3. Criar `app/api/admin/certificates/route.ts`:
   - GET: Lista todos os certificados.
   - POST: Emite um certificado manualmente.
4. Criar `app/api/admin/certificate-requests/route.ts`:
   - GET: Lista solicitações pendentes.
   - PATCH: Atualiza status da solicitação.

### Fase 3: Interface do Estudante (New Dashboard)
1. Desenvolver `app/newdashboard/certificados/page.tsx`.
2. Criar componentes:
   - `CertificateList`: Lista cards de certificados com botão de download.
   - `RequestCertificateForm`: Lista cursos concluídos que ainda não possuem certificado emitido/solicitado.

### Fase 4: Interface do Administrador
1. Desenvolver `app/admin/certificados/page.tsx`.
2. Criar componentes:
   - `AdminCertificateManager`: Tabela de certificados emitidos.
   - `PendingRequestsTable`: Tabela para aprovação de solicitações.
   - `IssueCertificateModal`: Modal para emissão manual.

## Critérios de Sucesso
- Estudante consegue ver seus certificados emitidos.
- Estudante consegue enviar uma solicitação de certificado.
- Administrador consegue aprovar uma solicitação e o certificado aparece para o estudante.
- A carga horária é exibida corretamente no certificado/lista.
