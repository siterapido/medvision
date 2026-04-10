import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import * as readline from 'readline';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Missing environment variables: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt: string): Promise<string> {
  return new Promise(resolve => {
    rl.question(prompt, resolve);
  });
}

async function createAdminUser() {
  try {
    const email = await question('Email do admin: ');
    const password = await question('Senha do admin: ');
    const fullName = await question('Nome completo (opcional): ');

    console.log(`\nCriando usuário admin ${email}...`);

    // Verificar se usuário já existe
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();

    if (listError) {
      console.error('Erro ao listar usuários:', listError);
      process.exit(1);
    }

    const existingUser = users.find(u => u.email === email);

    if (existingUser) {
      console.log(`\nUsuário ${email} já existe. Atualizando...`);

      // Atualizar usuário existente para admin
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(existingUser.id, {
        password,
        email_confirm: true,
        user_metadata: {
          role: 'admin',
          full_name: fullName || undefined,
        },
      });

      if (updateError) {
        console.error('Erro ao atualizar usuário:', updateError);
        process.exit(1);
      }

      // Atualizar role na tabela profiles
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .update({ role: 'admin' })
        .eq('id', existingUser.id);

      if (profileError) {
        console.error('Erro ao atualizar profile:', profileError);
        process.exit(1);
      }

      console.log('✅ Usuário atualizado como admin com sucesso!');
    } else {
      console.log(`\nCriando novo usuário ${email}...`);

      // Criar novo usuário com role admin
      const { data, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          role: 'admin',
          full_name: fullName || undefined,
        },
      });

      if (createError) {
        console.error('Erro ao criar usuário:', createError);
        console.error('Se este erro persistir, verifique se a service role key é válida e tem privilégios de admin.');
        process.exit(1);
      }

      // Criar entrada na tabela profiles
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: data.user.id,
          email,
          role: 'admin',
          full_name: fullName || email.split('@')[0],
        });

      if (profileError) {
        console.error('Erro ao criar profile:', profileError);
        process.exit(1);
      }

      console.log(`✅ Usuário admin criado com sucesso!`);
      console.log(`ID do usuário: ${data.user.id}`);
    }

    console.log(`\nCredenciais de acesso:`);
    console.log(`Email: ${email}`);
    console.log(`Senha: ${password}`);
    console.log(`\nAcesse a plataforma e faça login em: /login`);

  } catch (error) {
    console.error('Erro inesperado:', error);
    process.exit(1);
  } finally {
    rl.close();
  }
}

createAdminUser();
