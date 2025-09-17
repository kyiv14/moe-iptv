document.addEventListener('DOMContentLoaded', () => {
    // Глобальные переменные и состояние приложения
    let clients = [];
    let currentClient = null;

    // Элементы DOM
    const ui = {
        authModal: document.getElementById('authModal'),
        appContainer: document.getElementById('appContainer'),
        loginInput: document.getElementById('loginInput'),
        passwordInput: document.getElementById('passwordInput'),
        authButton: document.getElementById('authButton'),
        authError: document.getElementById('authError'),
        clientsList: document.getElementById('clientsList'),
        clientsCount: document.getElementById('clientsCount'),
        searchInput: document.getElementById('searchInput'),
        // ... (добавьте сюда остальные элементы по мере необходимости)
    };

    // --- API Взаимодействие ---
    // Абстрагируем все сетевые запросы в одном месте
    const api = {
        // Аутентификация
        login: async (login, password) => {
            const response = await fetch('/api/auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ login, password }),
            });
            if (!response.ok) throw new Error('Ошибка авторизации');
            return response.json(); // Ожидаем токен сессии или подтверждение
        },
        // Получение клиентов
        getClients: async () => {
            const response = await fetch('/api/clients');
            if (!response.ok) throw new Error('Не удалось загрузить клиентов');
            return response.json();
        },
        // Сохранение (добавление/обновление) клиента
        saveClient: async (clientData, isNew) => {
            const response = await fetch('/api/clients', {
                method: isNew ? 'POST' : 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(clientData),
            });
            if (!response.ok) throw new Error('Не удалось сохранить клиента');
            return response.json();
        },
        // Удаление клиента
        deleteClient: async (phone) => {
            const response = await fetch('/api/clients', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone }),
            });
            if (!response.ok) throw new Error('Не удалось удалить клиента');
        },
    };

    // --- Функции-помощники ---

    const extractPhoneNumber = (phone) => phone.replace(/\D/g, '').slice(-10);
    const formatDate = (dateString) => dateString ? new Date(dateString).toLocaleDateString('ru-RU') : 'Не указана';

    function calculateDaysLeft(paymentDate, months) {
        if (!paymentDate || !months) return { days: 0, text: 'N/A' };
        
        const endDate = new Date(paymentDate);
        endDate.setMonth(endDate.getMonth() + parseInt(months, 10));
        
        const diff = endDate - new Date();
        const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
        
        const text = days >= 0 ? `${days} дн.` : `${Math.abs(days)} дн.`;
        return { days, text };
    }

    const showStatus = (elementId, message, type) => {
        const el = document.getElementById(elementId);
        el.innerHTML = message;
        el.className = type;
        el.style.display = 'block';
        setTimeout(() => { el.style.display = 'none'; }, 5000);
    };

    const toggleButtonLoading = (button, isLoading) => {
        button.disabled = isLoading;
        button.textContent = isLoading ? 'Сохранение...' : 'Сохранить';
    };

    // --- Рендеринг ---

    function renderClients(clientsToRender = clients) {
        ui.clientsList.innerHTML = '';
        if (clientsToRender.length === 0) {
            ui.clientsList.innerHTML = '<p style="text-align: center; color: var(--system-gray);">Клиенты не найдены</p>';
        }

        clientsToRender.forEach(client => {
            const { days, text } = calculateDaysLeft(client.paymentDate, client.months);
            
            const card = document.createElement('div');
            card.className = 'client-card';
            if (days < 0) card.classList.add('expired');
            
            card.innerHTML = `
                <h3>${client.name || 'Без имени'}</h3>
                <p>${client.phone}</p>
                <div class="days-left ${days >= 0 ? 'positive' : 'negative'}">${text}</div>
            `;
            card.addEventListener('click', () => showClientInfo(client));
            ui.clientsList.appendChild(card);
        });
        ui.clientsCount.textContent = clients.length;
    }

    function showClientInfo(client) {
        currentClient = client;
        // ... (логика отображения информации о клиенте, модальные окна и т.д.)
        // Эта часть остается почти без изменений
        openModal('clientInfoModal');
    }
    
    // --- Инициализация и обработчики событий ---

    async function init() {
        // Обработчик авторизации
        const handleAuth = async () => {
            const login = ui.loginInput.value.trim().toLowerCase();
            const password = ui.passwordInput.value.trim();
            ui.authError.style.display = 'none';
            ui.authButton.disabled = true;

            try {
                // Прямой вызов к вашему API
                await api.login(login, password);
                ui.authModal.style.display = 'none';
                ui.appContainer.style.display = 'block';
                loadInitialClients();
            } catch (error) {
                ui.authError.style.display = 'block';
            } finally {
                ui.authButton.disabled = false;
            }
        };

        ui.authButton.addEventListener('click', handleAuth);
        ui.passwordInput.addEventListener('keypress', (e) => e.key === 'Enter' && handleAuth());
        ui.loginInput.addEventListener('keypress', (e) => e.key === 'Enter' && handleAuth());
        
        // Поиск
        ui.searchInput.addEventListener('input', (e) => {
            const searchText = e.target.value.replace(/\D/g, '');
            const filtered = searchText 
                ? clients.filter(c => c.phone.includes(searchText))
                : clients;
            renderClients(filtered);
        });
        
        // ... (добавьте здесь остальные обработчики для кнопок и модальных окон)
    }

    async function loadInitialClients() {
        ui.clientsList.innerHTML = '<div class="loader-container"><div class="loader"></div></div>';
        try {
            clients = await api.getClients();
            renderClients();
        } catch (error) {
            ui.clientsList.innerHTML = `<p class="error">${error.message}</p>`;
        }
    }

    // Запуск приложения
    init();

    // Вспомогательные функции для модальных окон (для примера)
    function openModal(id) { document.getElementById(id).style.display = 'flex'; }
    function closeModal(id) { document.getElementById(id).style.display = 'none'; }
});