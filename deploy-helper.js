const SUPABASE_PROJECT_REF = 'qhycrmwizbavnicjgoqq';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'SUA_CHAVE_AQUI';

console.log('🚀 Configurando Edge Function no Supabase...\n');

console.log('📋 Informações do Projeto:');
console.log(`   Project ID: ${SUPABASE_PROJECT_REF}`);
console.log(`   Function: ai-service`);
console.log(`   OpenAI Key: ${OPENAI_API_KEY.substring(0, 20)}...`);

console.log('\n⚠️  IMPORTANTE: Para completar o deploy, você precisa:');
console.log('\n1️⃣  Instalar Supabase CLI via Scoop:');
console.log('   Execute no PowerShell (como Administrador):');
console.log('   ```powershell');
console.log('   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser');
console.log('   Invoke-RestMethod -Uri https://get.scoop.sh | Invoke-Expression');
console.log('   scoop bucket add supabase https://github.com/supabase/scoop-bucket.git');
console.log('   scoop install supabase');
console.log('   ```');

console.log('\n2️⃣  Fazer login no Supabase:');
console.log('   ```bash');
console.log('   supabase login');
console.log('   ```');

console.log('\n3️⃣  Linkar o projeto:');
console.log('   ```bash');
console.log(`   supabase link --project-ref ${SUPABASE_PROJECT_REF}`);
console.log('   ```');

console.log('\n4️⃣  Configurar a chave da OpenAI:');
console.log('   ```bash');
console.log(`   supabase secrets set OPENAI_API_KEY=${OPENAI_API_KEY}`);
console.log('   ```');

console.log('\n5️⃣  Deploy da função:');
console.log('   ```bash');
console.log('   supabase functions deploy ai-service');
console.log('   ```');

console.log('\n✅ Após o deploy, a função estará em:');
console.log(`   https://${SUPABASE_PROJECT_REF}.supabase.co/functions/v1/ai-service`);

console.log('\n📝 ALTERNATIVA RÁPIDA:');
console.log('   Se preferir, continue usando a versão atual que já está funcionando!');
console.log('   A chave está no frontend, mas para desenvolvimento está OK.');
console.log('   Migre para Edge Function apenas antes do deploy em produção.');

console.log('\n🎯 Status Atual: ✅ IA FUNCIONANDO (via frontend)');
console.log('🔐 Status Ideal: ⏳ Migrar para Edge Function (backend seguro)');
