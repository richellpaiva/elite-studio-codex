// ==============================================
// SIDEBAR DINÂMICA PARA PAINEL DA EMPRESA
// ==============================================

async function injetarSidebar() {
    const container = document.getElementById('sidebar-container');
    if (!container) return;

    const db = window.supabaseClient;
    if (!db) return;

    const empresaId = localStorage.getItem('empresaId');
    let logoUrl = '';
    let nomeEmpresa = 'Empresa';

    // Busca dados da empresa no banco
    if (empresaId) {
        const { data, error } = await db.from('empresas').select('razao, logo').eq('id', empresaId).single();
        if (!error && data) {
            nomeEmpresa = data.razao;
            logoUrl = data.logo || '';
        }
    }

    // Define o HTML do logo (imagem ou placeholder)
    const logoHTML = logoUrl 
        ? `<img src="${logoUrl}" alt="Logo" id="empresa-logo-img" style="max-width: 120px; max-height: 80px; object-fit: contain; margin: 0 auto; transition: all 0.3s ease;">`
        : `<div style="width: 60px; height: 60px; background: #e0f2fe; border-radius: 16px; display: flex; align-items: center; justify-content: center; color: #3b82f6; font-size: 30px; margin: 0 auto;"><i class="fas fa-building"></i></div>`;

    // Monta o HTML da sidebar
    container.innerHTML = `
        <div id="sidebar" style="position: fixed; top: 0; left: 0; width: 280px; height: 100%; background: rgba(255,255,255,0.7); backdrop-filter: blur(10px); border-right: 1px solid rgba(59,130,246,0.2); padding: 20px 15px; z-index: 100; display: flex; flex-direction: column; transition: all 0.3s ease;">
            
            <!-- Logo centralizada -->
            <div style="text-align: center; margin-bottom: 15px;">
                ${logoHTML}
            </div>

            <!-- Nome da empresa -->
            <h2 id="empresa-nome-sidebar" style="color: #1e3a8a; text-align: center; font-size: 1.1rem; margin-bottom: 30px; word-wrap: break-word;">${nomeEmpresa}</h2>
            
            <!-- Botão recolher/expandir -->
            <div style="text-align: center; margin-bottom: 15px;">
                <button onclick="toggleSidebar()" style="background: #e0f2fe; border: none; border-radius: 8px; padding: 8px 12px; cursor: pointer; color: #1e3a8a;">
                    <i class="fas fa-bars"></i> <span class="menu-text">Recolher Menu</span>
                </button>
            </div>

            <!-- Área de navegação (os links serão preenchidos pelo painel-empresa.html) -->
            <nav id="nav-menu" style="display: flex; flex-direction: column; gap: 8px;">
                <!-- Conteúdo dinâmico -->
            </nav>

            <!-- Rodapé fixo -->
            <div style="margin-top: auto; padding-top: 15px; border-top: 1px solid rgba(59,130,246,0.2);">
                <a href="home.html" class="menu-link" style="display: flex; align-items: center; gap: 10px; color: #64748b; text-decoration: none; padding: 10px;">
                    <i class="fas fa-arrow-left" style="min-width: 20px;"></i>
                    <span class="menu-text">Voltar ao Painel Geral</span>
                </a>
                <a href="#" onclick="logout()" style="display: flex; align-items: center; gap: 10px; color: #ef4444; text-decoration: none; padding: 10px;">
                    <i class="fas fa-sign-out-alt" style="min-width: 20px;"></i>
                    <span class="menu-text">Sair</span>
                </a>
            </div>
        </div>
    `;
    
    // Ajusta o margin-left do conteúdo principal baseado na sidebar
    const mainContent = document.querySelector('.main-content-empresa');
    if (mainContent) mainContent.style.marginLeft = '280px';

    // Chama a função de personalização definida no painel-empresa.html (se existir)
    if (typeof window.afterSidebarInjected === 'function') {
        window.afterSidebarInjected();
    }

    // Define a função global de toggle (recolher/expandir)
    window.toggleSidebar = function() {
        const sidebar = document.getElementById('sidebar');
        const mainContent = document.querySelector('.main-content-empresa');
        const texts = sidebar.querySelectorAll('.menu-text');
        const logoImg = document.getElementById('empresa-logo-img');
        const nomeEmpresa = document.getElementById('empresa-nome-sidebar');
        
        // Verifica se está recolhido (70px) ou expandido (280px)
        const collapsed = sidebar.style.width === '70px';
        
        if (!collapsed) {
            // RECOLHER
            sidebar.style.width = '70px';
            sidebar.style.padding = '20px 10px';
            if (mainContent) mainContent.style.marginLeft = '70px';
            
            // Ocultar textos
            texts.forEach(el => el.style.display = 'none');
            // Ocultar nome da empresa
            nomeEmpresa.style.display = 'none';
            
            // Reduzir a logo para caber na barra
            if (logoImg) {
                logoImg.style.maxWidth = '40px';
                logoImg.style.maxHeight = '40px';
            } else {
                // Se for o placeholder, reduzir também
                const placeholder = sidebar.querySelector('div[style*="border-radius: 16px"]');
                if (placeholder) {
                    placeholder.style.width = '40px';
                    placeholder.style.height = '40px';
                    placeholder.style.fontSize = '18px';
                }
            }
        } else {
            // EXPANDIR
            sidebar.style.width = '280px';
            sidebar.style.padding = '20px 15px';
            if (mainContent) mainContent.style.marginLeft = '280px';
            
            // Mostrar textos
            texts.forEach(el => el.style.display = 'inline');
            // Mostrar nome da empresa
            nomeEmpresa.style.display = 'block';
            
            // Restaurar a logo para o tamanho original
            if (logoImg) {
                logoImg.style.maxWidth = '120px';
                logoImg.style.maxHeight = '80px';
            } else {
                // Restaurar placeholder
                const placeholder = sidebar.querySelector('div[style*="border-radius: 16px"]');
                if (placeholder) {
                    placeholder.style.width = '60px';
                    placeholder.style.height = '60px';
                    placeholder.style.fontSize = '30px';
                }
            }
        }
    };
}

// Função global de logout
window.logout = function() {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userName');
    localStorage.removeItem('empresaId');
    localStorage.removeItem('userId');
    window.location.href = 'index.html';
};

// Inicializa quando o DOM estiver pronto e o Supabase carregar
document.addEventListener('DOMContentLoaded', () => {
    const waitForSupabase = setInterval(() => {
        if (window.supabaseClient) {
            clearInterval(waitForSupabase);
            injetarSidebar();
        }
    }, 200);
});
