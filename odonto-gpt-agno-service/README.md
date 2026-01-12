# Serviço de Agentes Odonto GPT com Agno

Este serviço utiliza o framework Agno (anteriormente Phidata) para fornecer inteligência ao Odonto GPT.

## Pré-requisitos

- Python 3.9+
- Pip
- Chave da API da OpenAI

## Instalação

1. Navegue até a pasta do serviço:
   ```bash
   cd odonto-gpt-agno-service
   ```

2. Instale as dependências:
   ```bash
   pip install -r requirements.txt
   ```
   
   Alternativamente, da raiz do projeto:
   ```bash
   npm run agno:install
   ```

## Configuração

1. Copie o arquivo de exemplo de variáveis de ambiente:
   ```bash
   cp .env.example .env
   ```

2. Edite o arquivo `.env` e adicione suas chaves:
   - `OPENAI_API_KEY`: Sua chave da OpenAI (Necessária para GPT-4o)
   - `SUPABASE_DB_URL`: URL de conexão do banco de dados (se necessário para memória)

## Executando o Serviço

Para iniciar o servidor de desenvolvimento:

```bash
python -m uvicorn app.main:app --reload
```

Ou da raiz do projeto (recomendado):

```bash
npm run agno:dev
```

O serviço estará disponível em `http://localhost:8000`.

## Estrutura

- `app/main.py`: Ponto de entrada da aplicação FastAPI
- `app/api.py`: Rotas da API e endpoints de streaming
- `app/agents/`: Definições dos agentes Agno
  - `qa_agent.py`: Agente de perguntas e respostas odontológicas
  - `image_agent.py`: Agente de análise de imagens (Raio-X, fotos)

## Solução de Problemas

Se o chat no frontend retornar erro de conexão:
1. Verifique se este serviço Python está rodando na porta 8000.
2. Verifique se `AGNO_SERVICE_URL` está configurado corretamente no frontend (padrão: `http://localhost:8000/api/v1`).
