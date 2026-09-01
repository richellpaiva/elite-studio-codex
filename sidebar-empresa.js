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

    if (empresaId) {
        const { data, error } = await db.from('empresas').select('razao, logo').eq('id', empresaId).single();
        if (!error && data) {
            nomeEmpresa = data.razao;
            logoUrl = data.logo || '';
        }
    }

    const logoHTML = logoUrl 
        ? `<img src="${logoUrl}" alt="Logo" style="max-width: 120px; max-height: 80px; object-fit: contain; margin: 0 auto;">`
        : `<div style="width: 60px; height: 60px; background: #e0f2fe; border-radius: 16px; display: flex; align-items: center; justify-content: center; color: #3b82f6; font-size: 30px; margin: 0 auto;"><i class="fas fa-building"></i></div>`;

    container.innerHTML = `
        <div id="sidebar" style="position: fixed; top: 0; left: 0; width: 280px; height: 100%; background: rgba(255,255,255,0.7); backdrop-filter: blur(10px); border-right: 1px solid rgba(59,130,246,0.2); padding: 20px 15px; z-index: 100; display: flex; flex-direction: column; transition: width 0.3s ease;">
            <div style="text-align: center; margin-bottom: 15px;">
                ${logoHTML}
            </div>
            <h2 style="color: #1e3a8a; text-align: center; font-size: 1.1rem; margin-bottom: 30px; word-wrap: break-word;">${nomeEmpresa}</h2>
            
            <!-- Botão recolher/expandir -->
            <div style="text-align: center; margin-bottom: 15px;">
                <button onclick="toggleSidebar()" style="background: #e0f2fe; border: none; border-radius: 8px; padding: 8px 12px; cursor: pointer; color: #1e3a8a;">
                    <i class="fas fa-bars"></i> <span class="menu-text">Recolher Menu</span>
                </button>
            </div>

            <!-- Menu (links para outras páginas) -->
            <nav style="display: flex; flex-direction: column; gap: 8px;">
                <a href="acompanhamento-devolucoes.html" class="menu-link" style="display: flex; align-items: center; gap: 10px; color: #1e3a8a; text-decoration: none; padding: 12px; border-radius: 12px; transition: 0.3s; font-weight: 500;">
                    <i class="fas fa-undo-alt" style="color: #3b82f6; font-size: 1.2rem; min-width: 20px;"></i>
                    <span class="menu-text">Acompanhamento de Devoluções</span>
                </a>
                <!-- Adicione novos links aqui -->
                <!-- <a href="outra-pagina.html" class="menu-link">...</a> -->
            </nav>

            <!-- Rodapé -->
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
        
        <!-- Botão hambúrguer quando recolhido (funcionalidade extra) -->
    `;
    
    // Ajusta o margin-left do conteúdo principal baseado na sidebar
    const mainContent = document.querySelector('.main-content-empresa');
    if (mainContent) mainContent.style.marginLeft = '280px';

    // Função de toggle sidebar (global)
    window.toggleSidebar = function() {
        const sidebar = document.getElementById('sidebar');
        const mainContent = document.querySelector('.main-content-empresa');
        const texts = sidebar.querySelectorAll('.menu-text');
        const collapsed = sidebar.style.width === '70px';
        
        if (!collapsed) {
            sidebar.style.width = '70px';
            sidebar.style.padding = '20px 10px';
            if (mainContent) mainContent.style.marginLeft = '70px';
            texts.forEach(el => el.style.display = 'none');
            sidebar.querySelector('h2').style.display = 'none';
        } else {
            sidebar.style.width = '280px';
            sidebar.style.padding = '20px 15px';
            if (mainContent) mainContent.style.marginLeft = '280px';
            texts.forEach(el => el.style.display = 'inline');
            sidebar.querySelector('h2').style.display = 'block';
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
    // Aguarda o supabaseClient ser criado (script.js já faz isso com retry)
    const waitForSupabase = setInterval(() => {
        if (window.supabaseClient) {
            clearInterval(waitForSupabase);
            injetarSidebar();
        }
    }, 200);
});