-- Seed default funnel configurations

-- 1. Prospecção Fria (Cold Prospecting)
INSERT INTO funnel_configurations (
  name,
  slug,
  description,
  funnel_type,
  trial_duration_days,
  stages,
  available_views,
  source_table,
  is_active,
  is_default
) VALUES (
  'Prospecção Fria',
  'prospeccao-fria',
  'Funil para leads importados via CSV ou capturados organicamente',
  'cold_prospecting',
  NULL,
  '[
    {"id": "novo_lead", "title": "Novo Lead", "emoji": "📥", "color": "bg-slate-500", "description": "Lead recém importado", "order": 1},
    {"id": "contato_realizado", "title": "Contato Realizado", "emoji": "📞", "color": "bg-blue-500", "description": "Primeiro contato feito", "order": 2},
    {"id": "interessado", "title": "Interessado", "emoji": "🔥", "color": "bg-amber-500", "description": "Demonstrou interesse real", "order": 3},
    {"id": "aguardando_cadastro", "title": "Aguardando Cadastro", "emoji": "⏳", "color": "bg-purple-500", "description": "Convite enviado", "order": 4},
    {"id": "convertido", "title": "Convertido", "emoji": "✅", "color": "bg-green-500", "description": "Cadastrou no trial", "order": 5},
    {"id": "descartado", "title": "Descartado", "emoji": "❌", "color": "bg-red-500", "description": "Não qualificado", "order": 6}
  ]'::jsonb,
  ARRAY['kanban']::funnel_view[],
  'leads',
  true,
  true
);

-- 2. Trial 7 Dias (Trial Tracking)
INSERT INTO funnel_configurations (
  name,
  slug,
  description,
  funnel_type,
  trial_duration_days,
  stages,
  available_views,
  source_table,
  is_active,
  is_default
) VALUES (
  'Trial 7 Dias',
  'trial-7-dias',
  'Acompanhamento de usuários em período de trial de 7 dias',
  'trial',
  7,
  '[
    {"id": "cadastro", "title": "Cadastro", "emoji": "📥", "color": "bg-slate-400", "description": "Recém cadastrado", "order": 1},
    {"id": "primeira_consulta", "title": "1ª Consulta", "emoji": "🧪", "color": "bg-cyan-400", "description": "Fez primeira consulta", "order": 2},
    {"id": "usou_vision", "title": "Usou Vision", "emoji": "🧠", "color": "bg-violet-400", "description": "Usou análise de imagem", "order": 3},
    {"id": "uso_recorrente", "title": "Uso Recorrente", "emoji": "🔄", "color": "bg-blue-400", "description": "3+ consultas", "order": 4},
    {"id": "barreira_plano", "title": "Barreira", "emoji": "🚧", "color": "bg-amber-400", "description": "Atingiu limite do trial", "order": 5},
    {"id": "convertido", "title": "Convertido", "emoji": "💳", "color": "bg-green-400", "description": "Pagamento confirmado", "order": 6},
    {"id": "risco_churn", "title": "Risco Churn", "emoji": "👻", "color": "bg-orange-400", "description": "Inativo há 3+ dias", "order": 7},
    {"id": "perdido", "title": "Perdido", "emoji": "❌", "color": "bg-red-400", "description": "Trial expirado", "order": 8}
  ]'::jsonb,
  ARRAY['kanban', 'timeline']::funnel_view[],
  'profiles',
  true,
  false
);

-- 3. Tráfego Pago (Paid Traffic)
INSERT INTO funnel_configurations (
  name,
  slug,
  description,
  funnel_type,
  trial_duration_days,
  stages,
  available_views,
  source_table,
  is_active,
  is_default
) VALUES (
  'Tráfego Pago',
  'trafego-pago',
  'Funil para leads vindos de anúncios pagos (Facebook, Google Ads, etc)',
  'paid_traffic',
  NULL,
  '[
    {"id": "novo_lead", "title": "Novo Lead", "emoji": "🎯", "color": "bg-blue-500", "description": "Lead capturado pelo anúncio", "order": 1},
    {"id": "qualificado", "title": "Qualificado", "emoji": "✨", "color": "bg-cyan-500", "description": "Lead qualificado", "order": 2},
    {"id": "interessado", "title": "Interessado", "emoji": "🔥", "color": "bg-amber-500", "description": "Demonstrou interesse", "order": 3},
    {"id": "aguardando_cadastro", "title": "Aguardando Cadastro", "emoji": "⏳", "color": "bg-purple-500", "description": "Link enviado", "order": 4},
    {"id": "convertido", "title": "Convertido", "emoji": "✅", "color": "bg-green-500", "description": "Cadastrou no trial", "order": 5},
    {"id": "descartado", "title": "Descartado", "emoji": "❌", "color": "bg-red-500", "description": "Não qualificado/spam", "order": 6}
  ]'::jsonb,
  ARRAY['kanban']::funnel_view[],
  'leads',
  true,
  false
);

-- 4. Eventos (Events/Webinars) - SEM trial_duration_days porque não é tipo trial
INSERT INTO funnel_configurations (
  name,
  slug,
  description,
  funnel_type,
  trial_duration_days,
  stages,
  available_views,
  source_table,
  is_active,
  is_default
) VALUES (
  'Eventos',
  'eventos',
  'Funil para participantes de webinars e eventos ao vivo',
  'event',
  NULL,
  '[
    {"id": "inscrito", "title": "Inscrito", "emoji": "📝", "color": "bg-slate-500", "description": "Inscreveu-se no evento", "order": 1},
    {"id": "confirmado", "title": "Confirmado", "emoji": "✅", "color": "bg-blue-500", "description": "Confirmou presença", "order": 2},
    {"id": "participou", "title": "Participou", "emoji": "🎥", "color": "bg-violet-500", "description": "Assistiu ao evento", "order": 3},
    {"id": "interessado", "title": "Interessado", "emoji": "🔥", "color": "bg-amber-500", "description": "Demonstrou interesse", "order": 4},
    {"id": "convertido", "title": "Convertido", "emoji": "💳", "color": "bg-green-500", "description": "Assinou o plano", "order": 5},
    {"id": "nao_compareceu", "title": "Não Compareceu", "emoji": "👻", "color": "bg-red-500", "description": "Não assistiu", "order": 6}
  ]'::jsonb,
  ARRAY['kanban']::funnel_view[],
  'profiles',
  true,
  false
);

-- Assign existing leads to the cold prospecting funnel (default)
UPDATE leads
SET funnel_id = (SELECT id FROM funnel_configurations WHERE slug = 'prospeccao-fria')
WHERE funnel_id IS NULL;

-- Assign existing trial users to the trial 7 dias funnel
UPDATE profiles
SET funnel_id = (SELECT id FROM funnel_configurations WHERE slug = 'trial-7-dias')
WHERE funnel_id IS NULL
  AND trial_started_at IS NOT NULL
  AND role NOT IN ('admin', 'vendedor');
