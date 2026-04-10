import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// Carrega as variáveis de ambiente do .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Sanitização para evitar erros de caractere invisível/quebra de linha
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.replace(/\s/g, '');

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Erro: Variáveis de ambiente faltando no .env.local');
    process.exit(1);
}

// Cliente público para testar o login
const supabasePublic = createClient(supabaseUrl, supabaseAnonKey);

async function runTest() {
    console.log('--- 🛡️ Iniciando Teste de DB e Autenticação ---');
    console.log('🔗 URL:', supabaseUrl);

    const testUser = {
        email: 'test-user@medvision.local',
        password: 'password123',
        name: 'Usuário de Teste'
    };

    try {
        // 3. Testar Login
        console.log('\n🔐 Testando login com as credenciais...');
        const { data: authData, error: authError } = await supabasePublic.auth.signInWithPassword({
            email: testUser.email,
            password: testUser.password,
        });

        if (authError) {
            console.error('❌ Erro no login:', authError.message);
            console.log('Dica: Verifique se o usuário existe e se a senha está correta.');
        } else {
            console.log('✅ Login bem-sucedido! Sessão iniciada.');
            console.log('👤 User ID:', authData.user.id);
            console.log('--- 🚀 Teste concluído com sucesso ---');
        }
    } catch (err: any) {
        console.error('\n💥 Erro inesperado durante o teste:');
        console.error(err.message || err);
    }
}

runTest().catch(console.error);
