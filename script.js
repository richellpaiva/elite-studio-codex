// ==============================================
// 1. CONFIGURAÇÃO DO SUPABASE (PROJETO SÃO PAULO)
// ==============================================
const SUPABASE_URL = 'https://wkugyzxnbcvxetsawmaz.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_IQ3w71GgWpu18YA4mZWL3Q_3tJ59ATO';

let supabaseClient = null;

// Cria o cliente IMEDIATAMENTE (sem esperar DOMContentLoaded)
if (typeof window.supabase !== 'undefined') {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    window.supabaseClient = supabaseClient;
    console.log("Supabase conectado com sucesso!");
} else {
    console.warn("Biblioteca Supabase não carregada. Tentando novamente em 200ms...");
    setTimeout(() => {
        if (typeof window.supabase !== 'undefined') {
            supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            window.supabaseClient = supabaseClient;
            console.log("Supabase conectado com sucesso!");
        } else {
            console.error("Erro crítico: Biblioteca Supabase não encontrada.");
        }
    }, 200);
}

// ==============================================
// 2. AUTENTICAÇÃO (COM SUPABASE)
// ==============================================
function logout() {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userName');
    localStorage.removeItem('empresaId');
    localStorage.removeItem('userId');
    window.location.href = 'index.html';
}

async function handleLogin(loginInput, passInput) {
    if (!supabaseClient) {
        // Se o cliente não estiver pronto, aguarda um pouco
        await new Promise(r => setTimeout(r, 300));
        if (!supabaseClient) {
            alert("Erro: Banco de dados não conectado. Verifique sua internet.");
            return;
        }
    }

    if (typeof window.hideLoginError === 'function') window.hideLoginError();

    const { data, error } = await supabaseClient
        .from('usuarios')
        .select('*')
        .eq('login', loginInput)
        .eq('senha', passInput);

    if (error) {
        console.error("Erro ao buscar usuário:", error);
        if (typeof window.showLoginError === 'function') window.showLoginError();
        return;
    }

    if (data && data.length > 0) {
        const user = data[0];
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('userName', user.nome);
        localStorage.setItem('userId', user.id);
        localStorage.setItem('empresaId', user.empresa_id || '');

        if (user.empresa_id) {
            window.location.href = 'painel-empresa.html';
        } else {
            window.location.href = 'home.html';
        }
    } else {
        if (typeof window.showLoginError === 'function') window.showLoginError();
    }
}

// ==============================================
// 3. COLUNAS DA TABELA 1707
// ==============================================
const COLUMNS = [
    { key: 'cod_produto',      label: 'COD_PRODUTO',       tipo: 'texto' },
    { key: 'descricao',        label: 'DESCRICAO_PRODUTO', tipo: 'texto' },
    { key: 'depositos',        label: 'DEPOSITOS',         tipo: 'numero_int' },
    { key: 'ruas',             label: 'RUAS',              tipo: 'numero_int' },
    { key: 'predios',          label: 'PREDIOS',           tipo: 'numero_int' },
    { key: 'niveis',           label: 'NIVEIS',            tipo: 'numero_int' },
    { key: 'apt',              label: 'APT',               tipo: 'numero_int' },
    { key: 'unid',             label: 'UNID',              tipo: 'texto' },
    { key: 'capacidade',       label: 'CAPACIDADE',        tipo: 'numero_milhar' },
    { key: 'p_reposicao',      label: 'P_REPOSICAO',       tipo: 'numero_milhar' },
    { key: 'qt_o_s',           label: 'QT_O_S',            tipo: 'numero_milhar' },
    { key: 'picking',          label: 'PICKING',           tipo: 'numero_milhar' },
    { key: 'pulmao',           label: 'PULMAO',            tipo: 'numero_milhar' },
    { key: 'qt_enderecado',    label: 'QT_ENDERECADO',     tipo: 'numero_milhar' },
    { key: 'qt_gerencial',     label: 'QT_GERENCIAL',      tipo: 'numero_milhar' }
];

// ==============================================
// 4. FUNÇÕES DE BANCO (RELATÓRIO 1707)
// ==============================================
let currentParsedData = [];
let currentDisplayData = [];
let currentSort = { col: null, asc: true };
let currentFilters = {}; 
let modalColumnIndex = null; 
let modalSortDir = null;

async function loadFromDatabase() {
    if (!supabaseClient) return;
    const { data, error } = await supabaseClient.from('relatorio_1707').select('*').order('id');
    if (error) { console.error('Erro ao carregar do banco:', error); return; }
    if (data && data.length > 0) {
        currentParsedData = data;
        currentFilters = {};
        currentSort = { col: null, asc: true };
        applyFiltersAndSort();
        document.getElementById('previewContainer').style.display = 'block';
        document.getElementById('importBtn').style.display = 'none';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('previewContainer')) loadFromDatabase();
});

async function saveToDatabase(data) {
    if (!supabaseClient) { throw new Error("Cliente Supabase não configurado."); }
    const { error: deleteError } = await supabaseClient.from('relatorio_1707').delete().neq('id', 0);
    if (deleteError) throw deleteError;
    const CHUNK_SIZE = 500;
    for (let i = 0; i < data.length; i += CHUNK_SIZE) {
        const chunk = data.slice(i, i + CHUNK_SIZE);
        const { error: insertError } = await supabaseClient.from('relatorio_1707').insert(chunk);
        if (insertError) throw insertError;
    }
}

// ... (mantenha o restante das funções de importação e filtros se já estiverem funcionando)

// ==============================================
// EXPORTA FUNÇÕES GLOBAIS
// ==============================================
window.salvarEmpresa = salvarEmpresa;
window.listarEmpresas = listarEmpresas;
window.excluirEmpresa = excluirEmpresa;
window.atualizarEmpresa = atualizarEmpresa;
