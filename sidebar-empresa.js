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
        ? `<img src="${logoUrl}" alt="Logo" id="empresa-logo-img" style="max-width: 120px; max-height: 80px; object-fit: contain; margin: 0 auto; filter: drop-shadow(0 4px 10px rgba(59, 130, 246, 0.4)); transition: all 0.3s ease;">`
        : `<div style="width: 60px; height: 60px; background: #e0f2fe; border-radius: 16px; display: flex; align-items: center; justify-content: center; color: #3b82f6; font-size: 30px; margin: 0 auto;"><i class="fas fa-building"></i></div>`;

    const urlVoltar = empresaId ? 'painel-empresa.html' : 'home.html';

    container.innerHTML = `
        <style>
            #sidebar {
                position: fixed; top: 0; left: 0; width: 280px; height: 100%;
                background: rgba(255, 255, 255, 0.7);
                backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
                border-right: 1px solid rgba(255, 255, 255, 0.6);
                box-shadow: 10px 0 30px rgba(30, 58, 138, 0.15), 0 0 30px rgba(59, 130, 246, 0.2);
                padding: 20px 15px;
                z-index: 100;
                display: flex; flex-direction: column;
                transition: width 0.3s ease, padding 0.3s ease;
            }

            #sidebar .logo-area { text-align: center; margin-bottom: 15px; }
            #sidebar .empresa-nome { color: #1e3a8a; text-align: center; font-size: 1.1rem; margin-bottom: 30px; word-wrap: break-word; text-shadow: 0 2px 5px rgba(255, 255, 255, 0.5); }

            #sidebar .botao-recolher {
                background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(255, 255, 255, 0.6);
                border-radius: 8px; padding: 8px 12px; cursor: pointer; color: #1e3a8a;
                box-shadow: 0 0 10px rgba(59, 130, 246, 0.2); font-weight: 500; width: 100%; margin-bottom: 15px;
                display: flex; align-items: center; gap: 10px;
            }

            #sidebar .menu-link {
                display: flex; align-items: center; gap: 10px;
                width: 100%; box-sizing: border-box; padding: 12px;
                border-radius: 12px; text-decoration: none; color: #1e3a8a; font-weight: 500;
                border: 1px solid transparent; transition: all 0.3s ease;
            }

            #sidebar .menu-link:hover {
                background: #e0f2fe; border-color: rgba(59, 130, 246, 0.3); transform: translateX(4px);
            }

            #sidebar .menu-link.active {
                background: rgba(59, 130, 246, 0.1); border-color: rgba(59, 130, 246, 0.2);
            }

            #sidebar .menu-link i {
                min-width: 20px; text-align: center; color: #3b82f6; font-size: 1.1rem;
            }

            #sidebar .menu-text { flex-grow: 1; }

            #sidebar .rodape { margin-top: auto; padding-top: 15px; border-top: 1px solid rgba(255, 255, 255, 0.6); }
            #sidebar .rodape .menu-link { color: #64748b; }
            #sidebar .rodape .menu-link:hover { color: #1e3a8a; background: #e0f2fe; }
            #sidebar .rodape .menu-link i { color: #3b82f6; }
        </style>

        <div id="sidebar">
            <div class="logo-area">${logoHTML}</div>
            <h2 class="empresa-nome" id="empresa-nome-sidebar">${nomeEmpresa}</h2>
            <button class="botao-recolher" onclick="toggleSidebar()">
                <i class="fas fa-bars"></i> 
                <span class="menu-text">Recolher Menu</span>
            </button>
            <nav id="nav-menu" style="display: flex; flex-direction: column; gap: 8px; flex-grow: 1; margin-top: 10px;"></nav>
            <div class="rodape">
                <a href="${urlVoltar}" class="menu-link"><i class="fas fa-arrow-left"></i> <span class="menu-text">Voltar ao Painel</span></a>
                <a href="#" onclick="logout()" class="menu-link" style="color: #ef4444;"><i class="fas fa-sign-out-alt"></i> <span class="menu-text">Sair</span></a>
            </div>
        </div>
    `;
    
    // Encontra o conteúdo principal correto e ajusta o margin-left
    const mainContent = document.querySelector('.main-content-empresa') || document.querySelector('.dash-content') || document.querySelector('.menu-content') || document.getElementById('main-content');
    if (mainContent) {
        mainContent.style.marginLeft = '280px';
        mainContent.style.width = 'calc(100% - 280px)';
    }

    if (typeof window.afterSidebarInjected === 'function') {
        window.afterSidebarInjected();
    }

    window.toggleSidebar = function() {
        const sidebar = document.getElementById('sidebar');
        const mainContent = document.querySelector('.main-content-empresa') || document.querySelector('.dash-content') || document.querySelector('.menu-content') || document.getElementById('main-content');
        const textos = sidebar.querySelectorAll('.menu-text');
        const logoImg = document.getElementById('empresa-logo-img');
        const nomeEmpresa = document.getElementById('empresa-nome-sidebar');
        const collapsed = sidebar.style.width === '70px';
        
        if (!collapsed) {
            sidebar.style.width = '70px';
            sidebar.style.padding = '20px 10px';
            if (mainContent) {
                mainContent.style.marginLeft = '70px';
                mainContent.style.width = 'calc(100% - 70px)'; // Ajusta a largura para preencher a tela
            }
            
            textos.forEach(el => el.style.display = 'none');
            nomeEmpresa.style.display = 'none';
            
            sidebar.querySelectorAll('.menu-link').forEach(link => {
                link.style.justifyContent = 'center';
                link.style.padding = '12px 0';
            });

            sidebar.querySelector('.botao-recolher').innerHTML = '<i class="fas fa-bars"></i>';
            if (logoImg) logoImg.style.maxWidth = '40px';
        } else {
            sidebar.style.width = '280px';
            sidebar.style.padding = '20px 15px';
            if (mainContent) {
                mainContent.style.marginLeft = '280px';
                mainContent.style.width = 'calc(100% - 280px)'; // Restaura a largura original
            }
            
            textos.forEach(el => el.style.display = 'inline');
            nomeEmpresa.style.display = 'block';
            
            sidebar.querySelectorAll('.menu-link').forEach(link => {
                link.style.justifyContent = 'flex-start';
                link.style.padding = '12px';
            });

            sidebar.querySelector('.botao-recolher').innerHTML = '<i class="fas fa-bars"></i> <span class="menu-text">Recolher Menu</span>';
            if (logoImg) logoImg.style.maxWidth = '120px';
        }
    };
}

window.logout = function() {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userName');
    localStorage.removeItem('empresaId');
    localStorage.removeItem('userId');
    window.location.href = 'index.html';
};

document.addEventListener('DOMContentLoaded', () => {
    const waitForSupabase = setInterval(() => {
        if (window.supabaseClient) {
            clearInterval(waitForSupabase);
            injetarSidebar();
        }
    }, 200);
});