// ==============================================
// 1. CONFIGURAÇÃO DO SUPABASE (COM PROTEÇÃO)
// ==============================================
const SUPABASE_URL = 'https://bvlhrwgwdiaucmumvemcgda.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ2bHdyZ3diYXVjdW11dmVtY2dhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc3OTQ3NjEsImV4cCI6MjEwMzM3MDc2MX0.WyqGW_W-Xn83la22wecKT6HtlY38fV000uX6Ar6wtwM';

// Verifica se a biblioteca do Supabase foi carregada antes de usar
let supabase = null;
if (typeof window.supabase !== 'undefined') {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} else {
    console.warn("Biblioteca Supabase não carregada. O sistema continuará funcionando localmente.");
}

// ==============================================
// 2. LÓGICA DE AUTENTICAÇÃO E PROTEÇÃO DE ROTAS
// ==============================================

function logout() {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userName');
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
                window.location.href = 'home.html';
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

// Carrega dados do banco ao abrir a página (apenas se supabase estiver disponível)
async function loadFromDatabase() {
    if (!supabase) return; // Se não carregou, ignora

    const { data, error } = await supabase.from('relatorio_1707').select('*').order('id');
    if (error) {
        console.error('Erro ao carregar do banco:', error);
        alert('Erro ao carregar dados do banco.');
        return;
    }
    
    if (data && data.length > 0) {
        currentParsedData = data;
        currentFilters = {};
        currentSort = { col: null, asc: true };
        applyFiltersAndSort();
        document.getElementById('previewContainer').style.display = 'block';
        document.getElementById('importBtn').style.display = 'none';
    }
}

// Chama a função ao abrir a página de importação
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('previewContainer')) {
        loadFromDatabase();
    }
});

// Salva os dados no banco (apaga tudo e insere novos)
async function saveToDatabase(data) {
    if (!supabase) {
        alert("Biblioteca Supabase não carregada. Dados salvos localmente.");
        return;
    }

    // Primeiro apaga todos os registros
    const { error: deleteError } = await supabase.from('relatorio_1707').delete().neq('id', 0);
    if (deleteError) {
        console.error('Erro ao apagar dados:', deleteError);
        alert('Erro ao apagar dados antigos.');
        return;
    }

    // Insere os novos dados (em blocos para não estourar limites)
    const CHUNK_SIZE = 500;
    for (let i = 0; i < data.length; i += CHUNK_SIZE) {
        const chunk = data.slice(i, i + CHUNK_SIZE);
        const { error: insertError } = await supabase.from('relatorio_1707').insert(chunk);
        if (insertError) {
            console.error('Erro ao inserir dados:', insertError);
            alert('Erro ao salvar dados no banco.');
            return;
        }
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
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) handleFileUpload(e.target.files[0]);
        });
        dropArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropArea.style.borderColor = '#3b82f6';
            dropArea.style.background = 'rgba(59, 130, 246, 0.1)';
        });
        dropArea.addEventListener('dragleave', () => {
            dropArea.style.borderColor = 'rgba(59,130,246,0.3)';
            dropArea.style.background = 'rgba(255,255,255,0.4)';
        });
        dropArea.addEventListener('drop', (e) => {
            e.preventDefault();
            dropArea.style.borderColor = 'rgba(59,130,246,0.3)';
            dropArea.style.background = 'rgba(255,255,255,0.4)';
            if (e.dataTransfer.files.length > 0) handleFileUpload(e.dataTransfer.files[0]);
        });
    }
});

function handleFileUpload(file) {
    showLoadingModal();

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

            const dataRows = jsonData; 
            const filteredRows = dataRows.filter(row => {
                return row && row.some(cell => cell !== undefined && cell !== null && cell !== '');
            });

            if (filteredRows.length === 0) {
                alert("Arquivo vazio ou sem dados válidos.");
                hideLoadingModal();
                return;
            }

            const totalLines = filteredRows.length;
            const CHUNK_SIZE = 500;
            let processedLines = 0;
            const parsedData = [];

            function processChunk(startIdx) {
                const endIdx = Math.min(startIdx + CHUNK_SIZE, totalLines);
                for (let i = startIdx; i < endIdx; i++) {
                    const row = filteredRows[i];
                    if (!row) continue;
                    
                    parsedData.push({
                        cod_produto:   row[0] || '',
                        descricao:     row[1] || '',
                        depositos:     row[2] || '',
                        ruas:          row[3] || '',
                        predios:       row[4] || '',
                        niveis:        row[5] || '',
                        apt:           row[6] || '',
                        unid:          row[7] || '',
                        capacidade:    row[8] || '',
                        p_reposicao:   row[9] || '',
                        qt_o_s:        row[10] || '',
                        picking:       row[11] || '',
                        pulmao:        row[12] || '',
                        qt_enderecado: row[13] || '',
                        qt_gerencial:  row[14] || ''
                    });
                }

                processedLines = endIdx;
                const percent = Math.round((processedLines / totalLines) * 100);
                updateLoadingProgress(percent);

                if (endIdx < totalLines) {
                    setTimeout(() => processChunk(endIdx), 15);
                } else {
                    // Salva no banco de dados (se disponível)
                    saveToDatabase(parsedData);
                    
                    currentParsedData = parsedData;
                    currentFilters = {};
                    currentSort = { col: null, asc: true };
                    applyFiltersAndSort();
                    document.getElementById('importBtn').style.display = 'flex';
                    document.getElementById('previewContainer').style.display = 'block';
                    setTimeout(hideLoadingModal, 400);
                }
            }

            processChunk(0);
        } catch (error) {
            alert("Erro ao ler o arquivo: " + error.message);
            hideLoadingModal();
        }
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
            filteredData = filteredData.filter(row => {
                return selectedValues.includes(formatCellValue(row[key], COLUMNS[colIndex].tipo));
            });
        }
    });

    if (currentSort.col !== null) {
        const key = COLUMNS[currentSort.col].key;
        const asc = currentSort.asc;
        filteredData.sort((a, b) => {
            let valA = a[key];
            let valB = b[key];
            let numA = parseInt(String(valA).replace(/[^\d]/g, ''), 10);
            let numB = parseInt(String(valB).replace(/[^\d]/g, ''), 10);
            if (!isNaN(numA) && !isNaN(numB)) {
                return asc ? numA - numB : numB - numA;
            } else {
                let strA = String(valA).toLowerCase();
                let strB = String(valB).toLowerCase();
                if (strA < strB) return asc ? -1 : 1;
                if (strA > strB) return asc ? 1 : -1;
                return 0;
            }
        });
    }

    currentDisplayData = filteredData;
    renderTable();
}

function applyFiltersWithProgress() {
    showLoadingModal();
    const filteredData = [];
    const total = currentParsedData.length;
    const CHUNK_SIZE = 500;
    let processed = 0;
    const filters = { ...currentFilters };
    
    function processChunk(startIdx) {
        const endIdx = Math.min(startIdx + CHUNK_SIZE, total);
        for (let i = startIdx; i < endIdx; i++) {
            const row = currentParsedData[i];
            let passes = true;
            for (const colIdx in filters) {
                const selectedValues = filters[colIdx];
                if (selectedValues && selectedValues.length > 0) {
                    const key = COLUMNS[colIdx].key;
                    const cellValue = formatCellValue(row[key], COLUMNS[colIdx].tipo);
                    if (!selectedValues.includes(cellValue)) {
                        passes = false;
                        break;
                    }
                }
            }
            if (passes) filteredData.push(row);
        }
        
        processed = endIdx;
        const percent = Math.round((processed / total) * 100);
        updateLoadingProgress(percent);
        
        if (endIdx < total) {
            setTimeout(() => processChunk(endIdx), 15);
        } else {
            currentDisplayData = filteredData;
            renderTable();
            setTimeout(hideLoadingModal, 400);
        }
    }
    processChunk(0);
}

function renderTable() {
    const thead = document.getElementById('tableHead');
    const tbody = document.getElementById('tableBody');
    if(!thead || !tbody) return;

    thead.innerHTML = '<tr>' + COLUMNS.map((col, index) => `
        <th style="padding: 12px 10px; background: linear-gradient(135deg, #3b82f6, #2563eb); border-bottom: 2px solid #1e3a8a; color: #ffffff; font-weight: 700; white-space: nowrap; position: relative; cursor: pointer;">
            <div style="display: flex; align-items: center; justify-content: space-between;">
                <span onclick="triggerSort(${index})">${col.label}</span>
                <div style="display: flex; align-items: center; gap: 5px;">
                    <span onclick="triggerSort(${index})" style="color: ${currentSort.col === index ? (currentSort.asc ? '#ffffff' : '#e0f2fe') : '#dbeafe'}; font-size: 0.8rem;">
                        ${currentSort.col === index ? (currentSort.asc ? '▲' : '▼') : '⇅'}
                    </span>
                    <i class="fas fa-filter" style="color: #dbeafe; font-size: 0.8rem; cursor: pointer; padding: 2px;" onclick="toggleFilterModal(${index}, event)"></i>
                </div>
            </div>
        </th>
    `).join('') + '</tr>';

    tbody.innerHTML = '';
    currentDisplayData.forEach(row => {
        const tr = document.createElement('tr');
        tr.innerHTML = COLUMNS.map(col => `
            <td style="padding: 8px 10px; border-bottom: 1px solid rgba(59,130,246,0.1); color: #1e3a8a; vertical-align: middle;">
                ${formatCellValue(row[col.key], col.tipo)}
            </td>
        `).join('');
        tbody.appendChild(tr);
    });
}

function triggerSort(colIndex) {
    if (currentSort.col === colIndex) {
        currentSort.asc = !currentSort.asc;
    } else {
        currentSort.col = colIndex;
        currentSort.asc = true;
    }
    applyFiltersAndSort();
}

// ==============================================
// 8. MODAL DE FILTRO
// ==============================================

function toggleFilterModal(colIndex, event) {
    event.stopPropagation();
    const overlay = document.getElementById('filterOverlay');
    if (overlay) {
        closeFilterModal();
        return;
    }

    modalColumnIndex = colIndex;
    modalSortDir = null;

    const col = COLUMNS[colIndex];
    const key = col.key;
    const label = col.label;
    const tipo = col.tipo;

    const uniqueValues = [...new Set(currentParsedData.map(row => formatCellValue(row[key], tipo)))]
        .filter(v => v !== '' && v !== null && v !== 'undefined');

    const overlayEl = document.createElement('div');
    overlayEl.id = 'filterOverlay';
    overlayEl.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(255, 255, 255, 0.8); backdrop-filter: blur(4px);
        z-index: 9999; display: flex; align-items: center; justify-content: center;
    `;
    overlayEl.addEventListener('click', (e) => {
        if (e.target === overlayEl) closeFilterModal();
    });

    const modal = document.createElement('div');
    modal.id = 'filterModalBox';
    modal.style.cssText = `
        background: #ffffff; border: 1px solid #3b82f6;
        border-radius: 16px; padding: 20px;
        min-width: 320px; max-width: 450px; width: 90%;
        max-height: 80vh; display: flex; flex-direction: column;
        position: relative; z-index: 10000;
        box-shadow: 0 10px 30px rgba(59, 130, 246, 0.2);
    `;

    const header = document.createElement('div');
    header.style.cssText = `
        display: flex; justify-content: space-between; align-items: center; 
        margin-bottom: 15px; border-bottom: 1px solid #e0f2fe; 
        padding-bottom: 10px;
    `;
    header.innerHTML = `
        <span style="color: #1e3a8a; font-size: 1.1rem; font-weight: 700;">Filtrar: ${label}</span>
        <div style="display:flex; align-items:center; gap:8px;">
            <button onclick="changeModalSort('asc')" title="Menor/Maior ou A-Z" style="background:transparent; border:1px solid #ccc; color:#1e3a8a; border-radius:4px; padding:2px 6px; cursor:pointer; font-size:0.8rem;">▲</button>
            <button onclick="changeModalSort('desc')" title="Maior/Menor ou Z-A" style="background:transparent; border:1px solid #ccc; color:#1e3a8a; border-radius:4px; padding:2px 6px; cursor:pointer; font-size:0.8rem;">▼</button>
            <button onclick="closeFilterModal()" style="background:transparent; border:none; color:#888; cursor:pointer; font-size:1.2rem;">&times;</button>
        </div>
    `;
    modal.appendChild(header);

    const scrollArea = document.createElement('div');
    scrollArea.id = 'filterScrollArea';
    scrollArea.style.cssText = `
        max-height: 300px; overflow-y: auto; 
        display: flex; flex-direction: column; gap: 0px; 
        padding: 5px 0px; background: #ffffff;
    `;
    
    function renderModalCheckboxes() {
        scrollArea.innerHTML = ''; 
        let sortedValues = [...uniqueValues];
        
        if (modalSortDir === 'asc') {
            sortedValues.sort((a, b) => {
                let numA = parseInt(String(a).replace(/[^\d]/g, ''), 10);
                let numB = parseInt(String(b).replace(/[^\d]/g, ''), 10);
                if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
                return String(a).localeCompare(String(b));
            });
        } else if (modalSortDir === 'desc') {
            sortedValues.sort((a, b) => {
                let numA = parseInt(String(a).replace(/[^\d]/g, ''), 10);
                let numB = parseInt(String(b).replace(/[^\d]/g, ''), 10);
                if (!isNaN(numA) && !isNaN(numB)) return numB - numA;
                return String(b).localeCompare(String(a));
            });
        }

        const selectedValues = currentFilters[modalColumnIndex] || [];
        sortedValues.forEach(val => {
            const labelEl = document.createElement('label');
            labelEl.style.cssText = `
                display: flex; align-items: center; gap: 12px; 
                color: #1e3a8a; font-size: 0.95rem; cursor: pointer; 
                padding: 8px 15px; background: #ffffff; 
            `;
            labelEl.onmouseenter = () => labelEl.style.background = '#e0f2fe';
            labelEl.onmouseleave = () => labelEl.style.background = '#ffffff';

            const cb = document.createElement('input');
            cb.type = 'checkbox';
            cb.value = val;
            cb.checked = selectedValues.includes(val);
            cb.style.cssText = 'accent-color: #3b82f6; cursor: pointer; transform: scale(1.1);';
            cb.onchange = () => { };
            
            labelEl.appendChild(cb);
            labelEl.appendChild(document.createTextNode(val));
            scrollArea.appendChild(labelEl);
        });
    }

    renderModalCheckboxes();
    modal.appendChild(scrollArea);

    const actionArea = document.createElement('div');
    actionArea.style.cssText = `
        display: flex; flex-direction: column; gap: 10px;
        margin-top: 10px; border-top: 1px solid #e0f2fe;
        padding-top: 15px; background: #ffffff;
    `;

    const row1 = document.createElement('div');
    row1.style.cssText = 'display: flex; gap: 10px;';
    
    const btnSelectAll = document.createElement('button');
    btnSelectAll.textContent = 'Marcar Todos';
    btnSelectAll.className = 'btn-outline';
    btnSelectAll.style.cssText = 'flex:1; justify-content:center; font-size:0.85rem;';
    btnSelectAll.onclick = () => {
        document.getElementById('filterScrollArea').querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = true);
    };

    const btnClear = document.createElement('button');
    btnClear.textContent = 'Limpar';
    btnClear.className = 'btn-outline';
    btnClear.style.cssText = 'flex:1; justify-content:center; font-size:0.85rem;';
    btnClear.onclick = () => {
        document.getElementById('filterScrollArea').querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
    };

    row1.appendChild(btnSelectAll);
    row1.appendChild(btnClear);
    actionArea.appendChild(row1);

    const btnApply = document.createElement('button');
    btnApply.textContent = 'Filtrar Selecionados';
    btnApply.className = 'btn-primary';
    btnApply.style.cssText = 'width: 100%; justify-content: center; font-size: 0.95rem;';
    btnApply.onclick = () => {
        const currentScrollArea = document.getElementById('filterScrollArea');
        if (!currentScrollArea) return;
        const checked = currentScrollArea.querySelectorAll('input[type="checkbox"]:checked');
        const values = Array.from(checked).map(cb => cb.value);
        if (values.length > 0) {
            currentFilters[modalColumnIndex] = values;
        } else {
            delete currentFilters[modalColumnIndex];
        }
        closeFilterModal();
        applyFiltersWithProgress();
    };

    actionArea.appendChild(btnApply);
    modal.appendChild(actionArea);

    overlayEl.appendChild(modal);
    document.body.appendChild(overlayEl);
}

function changeModalSort(direction) {
    if (modalColumnIndex === null) return;
    modalSortDir = direction;
    
    const overlay = document.getElementById('filterOverlay');
    if (overlay) {
        const scrollArea = document.getElementById('filterScrollArea');
        if (scrollArea) {
            const currentScrollArea = scrollArea;
            const col = COLUMNS[modalColumnIndex];
            const key = col.key;
            const tipo = col.tipo;
            const uniqueValues = [...new Set(currentParsedData.map(row => formatCellValue(row[key], tipo)))]
                .filter(v => v !== '' && v !== null && v !== 'undefined');

            let sortedValues = [...uniqueValues];
            if (direction === 'asc') {
                sortedValues.sort((a, b) => {
                    let numA = parseInt(String(a).replace(/[^\d]/g, ''), 10);
                    let numB = parseInt(String(b).replace(/[^\d]/g, ''), 10);
                    if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
                    return String(a).localeCompare(String(b));
                });
            } else if (direction === 'desc') {
                sortedValues.sort((a, b) => {
                    let numA = parseInt(String(a).replace(/[^\d]/g, ''), 10);
                    let numB = parseInt(String(b).replace(/[^\d]/g, ''), 10);
                    if (!isNaN(numA) && !isNaN(numB)) return numB - numA;
                    return String(b).localeCompare(String(a));
                });
            }

            const selectedValues = currentFilters[modalColumnIndex] || [];
            currentScrollArea.innerHTML = '';

            sortedValues.forEach(val => {
                const labelEl = document.createElement('label');
                labelEl.style.cssText = `
                    display: flex; align-items: center; gap: 12px; 
                    color: #1e3a8a; font-size: 0.95rem; cursor: pointer; 
                    padding: 8px 15px; background: #ffffff; 
                `;
                labelEl.onmouseenter = () => labelEl.style.background = '#e0f2fe';
                labelEl.onmouseleave = () => labelEl.style.background = '#ffffff';

                const cb = document.createElement('input');
                cb.type = 'checkbox';
                cb.value = val;
                cb.checked = selectedValues.includes(val);
                cb.style.cssText = 'accent-color: #3b82f6; cursor: pointer; transform: scale(1.1);';
                cb.onchange = () => { };
                
                labelEl.appendChild(cb);
                labelEl.appendChild(document.createTextNode(val));
                currentScrollArea.appendChild(labelEl);
            });
        }
    }
}

function closeFilterModal() {
    const overlay = document.getElementById('filterOverlay');
    if (overlay) {
        overlay.remove();
        modalColumnIndex = null;
        modalSortDir = null;
    }
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeFilterModal();
    }
});

// ==============================================
// 9. CONTROLE DO MODAL DE CARREGAMENTO
// ==============================================

function showLoadingModal() {
    const overlay = document.getElementById('loadingOverlay');
    const ring = document.getElementById('donutRing');
    if (overlay) {
        overlay.style.display = 'flex';
        if (ring) ring.style.setProperty('--progress', '0%');
        document.getElementById('progressText').textContent = '0%';
    }
}

function updateLoadingProgress(percent) {
    const ring = document.getElementById('donutRing');
    const text = document.getElementById('progressText');
    if (ring) ring.style.setProperty('--progress', percent + '%');
    if (text) text.textContent = percent + '%';
}

function hideLoadingModal() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) overlay.style.display = 'none';
}

// ==============================================
// 10. CONFIRMAÇÃO DE IMPORTAÇÃO
// ==============================================

function confirmImport() {
    const existingData = localStorage.getItem(STORAGE_KEY);
    let shouldProceed = true;

    if (currentParsedData.length > 0) {
        shouldProceed = confirm("⚠️ Já existem dados armazenados no banco.\n\nDeseja zerar os dados existentes e importar os novos?\n(Clique em 'Cancelar' para manter os dados atuais).");
    }

    if (shouldProceed) {
        const btn = document.getElementById('importBtn');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-check-circle"></i> Importado com sucesso!';
        btn.style.background = 'linear-gradient(135deg, #22c55e, #16a34a)';
        btn.disabled = true;

        setTimeout(() => {
            btn.innerHTML = originalText;
            btn.style.background = '';
            btn.disabled = false;
            document.getElementById('fileInput').value = '';
            document.getElementById('previewContainer').style.display = 'block';
            document.getElementById('importBtn').style.display = 'none';
            currentParsedData = [];
            currentDisplayData = [];
            loadFromDatabase();
        }, 3000);
    } else {
        alert("Importação cancelada. Os dados antigos foram mantidos.");
    }
}
