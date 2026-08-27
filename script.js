// ==============================================
// 1. CONFIGURAÇÃO DO SUPABASE
// ==============================================
const SUPABASE_URL = 'https://bvlhrwgwdiaucmumvemcgda.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ2bHdyZ3diYXVjdW11dmVtY2dhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc3OTQ3NjEsImV4cCI6MjEwMzM3MDc2MX0.WyqGW_W-Xn83la22wecKT6HtlY38fV000uX6Ar6wtwM';

let supabaseClient = null;
if (typeof window.supabase !== 'undefined') {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} else {
    console.warn("Biblioteca Supabase não carregada. O sistema continuará funcionando localmente.");
}

// ==============================================
// 2. AUTENTICAÇÃO E PROTEÇÃO DE ROTAS
// ==============================================

function logout() {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userName');
    localStorage.removeItem('empresaId');
    window.location.href = 'index.html';
}

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const loginInput = document.getElementById('login').value;
            const passInput = document.getElementById('password').value;
            let users = JSON.parse(localStorage.getItem('users')) || [];
            const userFound = users.find(u => u.login === loginInput && u.pass === passInput);
            if (userFound) {
                localStorage.setItem('isLoggedIn', 'true');
                localStorage.setItem('userName', userFound.name);
                localStorage.setItem('empresaId', userFound.empresaId || 1);
                
                // Redirecionamento inteligente:
                // Se for Administrador (nome "Administrador" ou login "RICHELL"), vai para home.html
                // Caso contrário, vai para painel-empresa.html
                if (userFound.name === 'Administrador' || userFound.login === 'RICHELL') {
                    window.location.href = 'home.html';
                } else {
                    window.location.href = 'painel-empresa.html';
                }
            } else {
                const errorMsg = document.getElementById('loginError');
                if(errorMsg) errorMsg.style.display = 'block';
            }
        });
    }
});

function redirectIfNotLoggedIn() {
    if (localStorage.getItem('isLoggedIn') !== 'true') {
        window.location.href = 'index.html';
    }
}

// ==============================================
// 3. DEFINIÇÃO DAS COLUNAS
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
// 4. FORMATAÇÃO DE NÚMEROS
// ==============================================

function formatCellValue(val, tipo) {
    if (val === null || val === undefined || val === '') return '';
    let str = String(val).trim();
    
    if (tipo === 'numero_int') {
        let cleanStr = str.replace(/[^\d]/g, '');
        let num = parseInt(cleanStr, 10);
        if (!isNaN(num)) return num.toString();
        return str;
    }

    if (tipo === 'numero_milhar') {
        let cleanStr = str.replace(/[^\d]/g, '');
        let num = parseInt(cleanStr, 10);
        if (!isNaN(num)) return num.toLocaleString('pt-BR');
        return str;
    }

    return str;
}

// ==============================================
// 5. FUNÇÕES DE BANCO DE DADOS (SUPABASE)
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
    if (!supabaseClient) { alert("Biblioteca Supabase não carregada. Dados salvos localmente."); return; }
    const { error: deleteError } = await supabaseClient.from('relatorio_1707').delete().neq('id', 0);
    if (deleteError) { console.error('Erro ao apagar dados:', deleteError); return; }
    const CHUNK_SIZE = 500;
    for (let i = 0; i < data.length; i += CHUNK_SIZE) {
        const chunk = data.slice(i, i + CHUNK_SIZE);
        const { error: insertError } = await supabaseClient.from('relatorio_1707').insert(chunk);
        if (insertError) { console.error('Erro ao inserir dados:', insertError); return; }
    }
    alert('Dados salvos com sucesso no banco de dados!');
}

// ==============================================
// 6. MÓDULO DE IMPORTAÇÃO (EXCEL)
// ==============================================

document.addEventListener('DOMContentLoaded', () => {
    const dropArea = document.getElementById('dropArea');
    const fileInput = document.getElementById('fileInput');
    if (dropArea && fileInput) {
        dropArea.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', (e) => { if (e.target.files.length > 0) handleFileUpload(e.target.files[0]); });
        dropArea.addEventListener('dragover', (e) => { e.preventDefault(); dropArea.style.borderColor = '#3b82f6'; });
        dropArea.addEventListener('dragleave', () => { dropArea.style.borderColor = 'rgba(59,130,246,0.3)'; });
        dropArea.addEventListener('drop', (e) => { e.preventDefault(); if (e.dataTransfer.files.length > 0) handleFileUpload(e.dataTransfer.files[0]); });
    }
});

function handleFileUpload(file) {
    showLoadingModal();
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            const dataRows = jsonData.filter(row => row && row.some(cell => cell !== undefined && cell !== null && cell !== ''));
            if (dataRows.length === 0) { alert("Arquivo vazio."); hideLoadingModal(); return; }
            const total = dataRows.length, chunkSize = 500, parsedData = [];
            let processed = 0;
            function processChunk(start) {
                const end = Math.min(start + chunkSize, total);
                for (let i = start; i < end; i++) {
                    const row = dataRows[i]; if (!row) continue;
                    parsedData.push({ cod_produto: row[0]||'', descricao: row[1]||'', depositos: row[2]||'', ruas: row[3]||'', predios: row[4]||'', niveis: row[5]||'', apt: row[6]||'', unid: row[7]||'', capacidade: row[8]||'', p_reposicao: row[9]||'', qt_o_s: row[10]||'', picking: row[11]||'', pulmao: row[12]||'', qt_enderecado: row[13]||'', qt_gerencial: row[14]||'' });
                }
                processed = end;
                updateLoadingProgress(Math.round((processed/total)*100));
                if (end < total) setTimeout(() => processChunk(end), 15);
                else { saveToDatabase(parsedData); currentParsedData = parsedData; applyFiltersAndSort(); document.getElementById('previewContainer').style.display = 'block'; document.getElementById('importBtn').style.display = 'flex'; hideLoadingModal(); }
            }
            processChunk(0);
        } catch (error) { alert("Erro: " + error.message); hideLoadingModal(); }
    };
    reader.readAsArrayBuffer(file);
}

// ==============================================
// 7. ORDENAÇÃO, FILTRO E RENDERIZAÇÃO
// ==============================================

function applyFiltersAndSort() {
    let filteredData = [...currentParsedData];
    Object.keys(currentFilters).forEach(colIndex => {
        const selectedValues = currentFilters[colIndex];
        if (selectedValues && selectedValues.length > 0) {
            const key = COLUMNS[colIndex].key;
            filteredData = filteredData.filter(row => selectedValues.includes(formatCellValue(row[key], COLUMNS[colIndex].tipo)));
        }
    });
    if (currentSort.col !== null) {
        const key = COLUMNS[currentSort.col].key, asc = currentSort.asc;
        filteredData.sort((a,b) => {
            let numA = parseInt(String(a[key]).replace(/[^\d]/g,''),10), numB = parseInt(String(b[key]).replace(/[^\d]/g,''),10);
            if (!isNaN(numA) && !isNaN(numB)) return asc ? numA - numB : numB - numA;
            let strA = String(a[key]).toLowerCase(), strB = String(b[key]).toLowerCase();
            return strA < strB ? (asc?-1:1) : (strA > strB ? (asc?1:-1) : 0);
        });
    }
    currentDisplayData = filteredData;
    renderTable();
}

function renderTable() {
    const thead = document.getElementById('tableHead'), tbody = document.getElementById('tableBody');
    if (!thead || !tbody) return;
    thead.innerHTML = '<tr>' + COLUMNS.map((col, index) => `
        <th style="padding:12px 10px; background: linear-gradient(135deg, #3b82f6, #2563eb); color:#fff; border-bottom:2px solid #1e3a8a; cursor:pointer;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <span onclick="triggerSort(${index})">${col.label}</span>
                <div style="display:flex; gap:5px;">
                    <span onclick="triggerSort(${index})" style="color:${currentSort.col===index?(currentSort.asc?'#fff':'#e0f2fe'):'#dbeafe'}">${currentSort.col===index?(currentSort.asc?'▲':'▼'):'⇅'}</span>
                    <i class="fas fa-filter" style="color:#dbeafe; cursor:pointer;" onclick="toggleFilterModal(${index}, event)"></i>
                </div>
            </div>
        </th>`).join('') + '</tr>';
    tbody.innerHTML = '';
    currentDisplayData.forEach(row => {
        const tr = document.createElement('tr');
        tr.innerHTML = COLUMNS.map(col => `<td style="padding:8px 10px; border-bottom:1px solid rgba(59,130,246,0.1); color:#1e3a8a;">${formatCellValue(row[col.key], col.tipo)}</td>`).join('');
        tbody.appendChild(tr);
    });
}

function triggerSort(colIndex) {
    if (currentSort.col === colIndex) currentSort.asc = !currentSort.asc;
    else { currentSort.col = colIndex; currentSort.asc = true; }
    applyFiltersAndSort();
}

// As funções de filtro modal, carregamento e confirmação permanecem as mesmas do seu código anterior (já funcionando).
// Para não gerar arquivo gigante, mantive apenas o essencial. Se precisar do restante completo, me avise.
