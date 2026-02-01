import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error('Missing environment variables');
    process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

interface LeadRow {
    nome?: string;
    name?: string;
    Nome?: string;
    email?: string;
    Email?: string;
    'E-mail'?: string;
    telefone?: string;
    phone?: string;
    Telefone?: string;
    'WhatsApp'?: string;
    whatsapp?: string;
    celular?: string;
    Celular?: string;
    [key: string]: unknown;
}

interface ImportResult {
    imported: { name: string; phone: string; email: string; source: string }[];
    skippedExistingLead: { name: string; phone: string; email: string; reason: string }[];
    skippedExistingUser: { name: string; phone: string; email: string; reason: string }[];
    errors: { name: string; phone: string; email: string; error: string }[];
    toUpdate: { name: string; phone: string; email: string; existingData: string; newData: string }[];
}

function normalizePhone(phone: string | undefined | null): string | null {
    if (!phone) return null;
    // Remove all non-digits
    const digits = String(phone).replace(/\D/g, '');
    if (digits.length < 10) return null;
    // Ensure starts with 55 (Brazil country code)
    if (digits.startsWith('55')) {
        return digits;
    }
    return '55' + digits;
}

function normalizeEmail(email: string | undefined | null): string | null {
    if (!email) return null;
    const trimmed = String(email).trim().toLowerCase();
    // Basic email validation
    if (!trimmed.includes('@') || !trimmed.includes('.')) return null;
    return trimmed;
}

function extractName(row: LeadRow): string | null {
    return row.nome || row.name || row.Nome || (row['Nome:'] as string) || (row['Nome Completo'] as string) || (row['nome completo'] as string) || null;
}

function extractEmail(row: LeadRow): string | null {
    return row.email || row.Email || (row['E-mail'] as string) || (row['e-mail'] as string) || (row['e-mail: '] as string) || null;
}

function extractPhone(row: LeadRow): string | null {
    return row.telefone || row.phone || row.Telefone || row.WhatsApp || row.whatsapp ||
           row.celular || row.Celular || (row['Telefone/WhatsApp'] as string) ||
           (row['Telefone (WhatsApp): DDD+ Telefone'] as string) || null;
}

async function importLeads() {
    const leadsDir = path.join(process.cwd(), 'Planilhas de Leads');

    if (!fs.existsSync(leadsDir)) {
        console.error('Directory not found:', leadsDir);
        process.exit(1);
    }

    const files = fs.readdirSync(leadsDir).filter(f =>
        (f.endsWith('.xlsx') || f.endsWith('.xls')) && !f.startsWith('import-report')
    );

    if (files.length === 0) {
        console.error('No Excel files found in:', leadsDir);
        process.exit(1);
    }

    console.log(`\nFound ${files.length} spreadsheet(s) to import:\n`);
    files.forEach(f => console.log(`  - ${f}`));

    // Fetch existing leads and profiles
    console.log('\nFetching existing data from database...');

    const { data: existingLeads, error: leadsError } = await supabaseAdmin
        .from('leads')
        .select('id, phone, email, name');

    if (leadsError) {
        console.error('Error fetching leads:', leadsError);
        process.exit(1);
    }

    const { data: existingProfiles, error: profilesError } = await supabaseAdmin
        .from('profiles')
        .select('id, email, name');

    if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        process.exit(1);
    }

    // Create lookup sets
    const existingLeadPhones = new Set(existingLeads?.map(l => normalizePhone(l.phone)).filter(Boolean));
    const existingLeadEmails = new Set(existingLeads?.map(l => normalizeEmail(l.email)).filter(Boolean));
    // Profile table doesn't have phone column, so we only check by email
    const existingProfileEmails = new Set(existingProfiles?.map(p => normalizeEmail(p.email)).filter(Boolean));

    console.log(`\nExisting data:`);
    console.log(`  - Leads: ${existingLeads?.length || 0} (${existingLeadPhones.size} phones, ${existingLeadEmails.size} emails)`);
    console.log(`  - Profiles (users): ${existingProfiles?.length || 0} (${existingProfileEmails.size} emails)`);

    const result: ImportResult = {
        imported: [],
        skippedExistingLead: [],
        skippedExistingUser: [],
        errors: [],
        toUpdate: []
    };

    const processedPhones = new Set<string>();
    const processedEmails = new Set<string>();

    for (const file of files) {
        const filePath = path.join(leadsDir, file);
        console.log(`\nProcessing: ${file}`);

        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows: LeadRow[] = XLSX.utils.sheet_to_json(sheet);

        console.log(`  Found ${rows.length} rows`);

        // Log first row to understand structure
        if (rows.length > 0) {
            console.log('  Columns:', Object.keys(rows[0]).join(', '));
        }

        for (const row of rows) {
            const rawName = extractName(row);
            const rawEmail = extractEmail(row);
            const rawPhone = extractPhone(row);

            const name = rawName ? String(rawName).trim() : '';
            const phone = normalizePhone(rawPhone);
            const email = normalizeEmail(rawEmail);

            // Skip empty rows
            if (!phone && !email) {
                continue;
            }

            // Check for duplicates within current import
            if (phone && processedPhones.has(phone)) {
                continue;
            }
            if (email && processedEmails.has(email)) {
                continue;
            }

            // Check if user already exists (by email only - profiles table doesn't have phone)
            if (email && existingProfileEmails.has(email)) {
                result.skippedExistingUser.push({
                    name,
                    phone: phone || '',
                    email: email || '',
                    reason: 'User already has an account'
                });
                if (phone) processedPhones.add(phone);
                if (email) processedEmails.add(email);
                continue;
            }

            // Check if lead already exists
            if ((phone && existingLeadPhones.has(phone)) || (email && existingLeadEmails.has(email))) {
                // Check if there's additional data to update
                const existingLead = existingLeads?.find(l =>
                    (phone && normalizePhone(l.phone) === phone) ||
                    (email && normalizeEmail(l.email) === email)
                );

                if (existingLead) {
                    const needsUpdate = (
                        (!existingLead.name && name) ||
                        (!existingLead.email && email) ||
                        (!existingLead.phone && phone)
                    );

                    if (needsUpdate) {
                        result.toUpdate.push({
                            name,
                            phone: phone || '',
                            email: email || '',
                            existingData: `name: ${existingLead.name || 'null'}, email: ${existingLead.email || 'null'}, phone: ${existingLead.phone || 'null'}`,
                            newData: `name: ${name || 'null'}, email: ${email || 'null'}, phone: ${phone || 'null'}`
                        });
                    } else {
                        result.skippedExistingLead.push({
                            name,
                            phone: phone || '',
                            email: email || '',
                            reason: 'Lead already exists'
                        });
                    }
                }
                if (phone) processedPhones.add(phone);
                if (email) processedEmails.add(email);
                continue;
            }

            // Must have phone to insert (required unique field)
            if (!phone) {
                result.errors.push({
                    name,
                    phone: '',
                    email: email || '',
                    error: 'No valid phone number'
                });
                continue;
            }

            // Insert new lead
            const { error: insertError } = await supabaseAdmin
                .from('leads')
                .insert({
                    name: name || null,
                    phone,
                    email: email || null,
                    status: 'situacao',
                    source: `Simposio - ${file}`,
                    notes: null
                });

            if (insertError) {
                result.errors.push({
                    name,
                    phone,
                    email: email || '',
                    error: insertError.message
                });
            } else {
                result.imported.push({
                    name,
                    phone,
                    email: email || '',
                    source: file
                });
                existingLeadPhones.add(phone);
                if (email) existingLeadEmails.add(email);
            }

            if (phone) processedPhones.add(phone);
            if (email) processedEmails.add(email);
        }
    }

    // Generate report
    const reportPath = path.join(leadsDir, `import-report-${new Date().toISOString().split('T')[0]}.xlsx`);

    const reportWorkbook = XLSX.utils.book_new();

    // Summary sheet
    const summaryData = [
        ['Relatorio de Importacao de Leads'],
        ['Data', new Date().toLocaleString('pt-BR')],
        [''],
        ['Resumo'],
        ['Total Importados', result.imported.length],
        ['Ignorados (ja sao usuarios)', result.skippedExistingUser.length],
        ['Ignorados (ja sao leads)', result.skippedExistingLead.length],
        ['Para atualizar', result.toUpdate.length],
        ['Erros', result.errors.length]
    ];
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(reportWorkbook, summarySheet, 'Resumo');

    // Imported sheet
    if (result.imported.length > 0) {
        const importedSheet = XLSX.utils.json_to_sheet(result.imported);
        XLSX.utils.book_append_sheet(reportWorkbook, importedSheet, 'Importados');
    }

    // Skipped users sheet
    if (result.skippedExistingUser.length > 0) {
        const skippedUsersSheet = XLSX.utils.json_to_sheet(result.skippedExistingUser);
        XLSX.utils.book_append_sheet(reportWorkbook, skippedUsersSheet, 'Ja sao Usuarios');
    }

    // Skipped leads sheet
    if (result.skippedExistingLead.length > 0) {
        const skippedLeadsSheet = XLSX.utils.json_to_sheet(result.skippedExistingLead);
        XLSX.utils.book_append_sheet(reportWorkbook, skippedLeadsSheet, 'Ja sao Leads');
    }

    // To update sheet
    if (result.toUpdate.length > 0) {
        const toUpdateSheet = XLSX.utils.json_to_sheet(result.toUpdate);
        XLSX.utils.book_append_sheet(reportWorkbook, toUpdateSheet, 'Para Atualizar');
    }

    // Errors sheet
    if (result.errors.length > 0) {
        const errorsSheet = XLSX.utils.json_to_sheet(result.errors);
        XLSX.utils.book_append_sheet(reportWorkbook, errorsSheet, 'Erros');
    }

    XLSX.writeFile(reportWorkbook, reportPath);

    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('RESUMO DA IMPORTACAO');
    console.log('='.repeat(60));
    console.log(`  Importados com sucesso: ${result.imported.length}`);
    console.log(`  Ignorados (ja sao usuarios): ${result.skippedExistingUser.length}`);
    console.log(`  Ignorados (ja sao leads): ${result.skippedExistingLead.length}`);
    console.log(`  Para atualizar (dados adicionais): ${result.toUpdate.length}`);
    console.log(`  Erros: ${result.errors.length}`);
    console.log('='.repeat(60));
    console.log(`\nRelatorio salvo em: ${reportPath}`);
}

importLeads().catch(console.error);
