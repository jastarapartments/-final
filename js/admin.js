// Логика админ панели

let currentFilter = 'all';
let applications = [];
let rooms = [];

// Инициализация
document.addEventListener('DOMContentLoaded', async function() {
    // Проверка авторизации
    const user = await checkAuth();
    if (user) {
        showAdminPanel();
        await loadApplications();
        await loadRoomsAdmin();
        setupEventListeners();
    } else {
        showLoginScreen();
        setupLoginForm();
    }
});

// Показать экран входа
function showLoginScreen() {
    document.getElementById('login-screen').classList.remove('hidden');
    document.getElementById('admin-panel').classList.add('hidden');
}

// Показать админ панель
function showAdminPanel() {
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('admin-panel').classList.remove('hidden');
}

// Настройка формы входа
function setupLoginForm() {
    const form = document.getElementById('login-form');
    const errorDiv = document.getElementById('login-error');
    
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const submitBtn = form.querySelector('button[type="submit"]');
        
        submitBtn.disabled = true;
        submitBtn.textContent = 'Вход...';
        errorDiv.classList.add('hidden');
        
        const result = await adminLogin(email, password);
        
        if (result.success) {
            showAdminPanel();
            await loadApplications();
            await loadRoomsAdmin();
            setupEventListeners();
            // Очистка формы
            form.reset();
        } else {
            errorDiv.textContent = result.error || 'Неверный email или пароль';
            errorDiv.classList.remove('hidden');
        }
        
        submitBtn.disabled = false;
        submitBtn.textContent = 'Войти';
    });
}

// Настройка обработчиков событий
function setupEventListeners() {
    // Выход
    document.getElementById('logout-btn')?.addEventListener('click', async function() {
        if (confirm('Вы уверены, что хотите выйти?')) {
            await adminLogout();
            showLoginScreen();
        }
    });
    
    // Табы
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const tab = this.getAttribute('data-tab');
            switchTab(tab);
        });
    });
    
    // Фильтры заявок
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const filter = this.getAttribute('data-filter');
            setFilter(filter);
        });
    });
    
    // Добавление комнаты
    document.getElementById('add-room-btn')?.addEventListener('click', function() {
        openRoomEditModal(null);
    });
    
    // Закрытие модалок
    document.getElementById('close-application-modal')?.addEventListener('click', function() {
        document.getElementById('application-modal').classList.add('hidden');
    });
    
    document.getElementById('close-room-modal')?.addEventListener('click', function() {
        document.getElementById('room-edit-modal').classList.add('hidden');
    });
    
    document.getElementById('cancel-room-edit')?.addEventListener('click', function() {
        document.getElementById('room-edit-modal').classList.add('hidden');
    });
    
    // Форма редактирования комнаты
    document.getElementById('room-edit-form')?.addEventListener('submit', async function(e) {
        e.preventDefault();
        await saveRoom();
    });
    
    // Удаление комнаты
    document.getElementById('delete-room-btn')?.addEventListener('click', async function() {
        const roomId = document.getElementById('room-edit-id').value;
        if (roomId && confirm('Вы уверены, что хотите удалить эту комнату?')) {
            await deleteRoom(roomId);
        }
    });
}

// Переключение табов
function switchTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active', 'bg-teal-600', 'text-white', 'shadow-md');
        btn.classList.add('bg-gray-100', 'text-gray-700', 'hover:bg-gray-200');
    });
    
    const activeBtn = document.querySelector(`.tab-btn[data-tab="${tab}"]`);
    activeBtn.classList.add('active', 'bg-teal-600', 'text-white', 'shadow-md');
    activeBtn.classList.remove('bg-gray-100', 'text-gray-700', 'hover:bg-gray-200');
    
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.add('hidden');
    });
    
    if (tab === 'applications') {
        document.getElementById('applications-section').classList.remove('hidden');
    } else if (tab === 'rooms') {
        document.getElementById('rooms-section').classList.remove('hidden');
    }
}

// Установка фильтра
function setFilter(filter) {
    currentFilter = filter;
    
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active', 'bg-teal-600', 'text-white', 'shadow-md', 'hover:shadow-lg');
        btn.classList.add('bg-gray-100', 'text-gray-700', 'hover:bg-gray-200');
    });
    
    const activeBtn = document.querySelector(`.filter-btn[data-filter="${filter}"]`);
    activeBtn.classList.add('active', 'bg-teal-600', 'text-white', 'shadow-md', 'hover:shadow-lg');
    activeBtn.classList.remove('bg-gray-100', 'text-gray-700', 'hover:bg-gray-200');
    
    renderApplications();
}

// Загрузка заявок
async function loadApplications() {
    try {
        const snapshot = await db.collection('applications')
            .orderBy('createdAt', 'desc')
            .get();
        
        applications = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        updateStatistics();
        renderApplications();
        
        // Подписка на изменения в реальном времени
        db.collection('applications')
            .orderBy('createdAt', 'desc')
            .onSnapshot((snapshot) => {
                applications = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                updateStatistics();
                renderApplications();
            });
    } catch (error) {
        console.error('Ошибка загрузки заявок:', error);
    }
}

// Обновление статистики
function updateStatistics() {
    const total = applications.length;
    const pending = applications.filter(a => a.status === 'pending').length;
    const approved = applications.filter(a => a.status === 'approved').length;
    const rejected = applications.filter(a => a.status === 'rejected').length;
    
    document.getElementById('stat-total').textContent = total;
    document.getElementById('stat-pending').textContent = pending;
    document.getElementById('stat-approved').textContent = approved;
    document.getElementById('stat-rejected').textContent = rejected;
}

// Рендеринг заявок
function renderApplications() {
    const tbody = document.getElementById('applications-table-body');
    if (!tbody) return;
    
    let filtered = applications;
    
    if (currentFilter !== 'all') {
        filtered = applications.filter(a => a.status === currentFilter);
    }
    
    if (filtered.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="px-4 py-8 text-center text-gray-500">
                    Нет заявок с выбранным фильтром
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = filtered.map(app => {
        const date = app.createdAt ? (app.createdAt.toDate ? app.createdAt.toDate().toLocaleDateString('ru-RU') : new Date(app.createdAt.seconds * 1000).toLocaleDateString('ru-RU')) : '—';
        const statusClass = {
            'pending': 'bg-yellow-100 text-yellow-800',
            'approved': 'bg-green-100 text-green-800',
            'rejected': 'bg-red-100 text-red-800'
        }[app.status] || 'bg-gray-100 text-gray-800';
        
        const statusText = {
            'pending': 'Новая',
            'approved': 'Одобрена',
            'rejected': 'Отклонена'
        }[app.status] || 'Неизвестно';
        
        return `
            <tr class="border-b hover:bg-gray-50">
                <td class="px-4 py-3">${date}</td>
                <td class="px-4 py-3">${app.name || '—'}</td>
                <td class="px-4 py-3">
                    <a href="tel:${app.phone}" class="text-teal-600 hover:text-teal-800">${app.phone || '—'}</a>
                </td>
                <td class="px-4 py-3">${app.roomName || '—'}</td>
                <td class="px-4 py-3">${app.moveInDate || '—'}</td>
                <td class="px-4 py-3">
                    <span class="px-3 py-1 rounded-full text-sm font-semibold ${statusClass}">${statusText}</span>
                </td>
                <td class="px-4 py-3">
                    <div class="flex space-x-2">
                        <button onclick="viewApplication('${app.id}')" 
                                class="text-blue-600 hover:text-blue-800" title="Просмотр">
                            <i class="fas fa-eye"></i>
                        </button>
                        ${app.status === 'pending' ? `
                            <button onclick="approveApplication('${app.id}')" 
                                    class="text-green-600 hover:text-green-800" title="Одобрить">
                                <i class="fas fa-check"></i>
                            </button>
                            <button onclick="rejectApplication('${app.id}')" 
                                    class="text-red-600 hover:text-red-800" title="Отклонить">
                                <i class="fas fa-times"></i>
                            </button>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// Просмотр заявки
window.viewApplication = function(appId) {
    const app = applications.find(a => a.id === appId);
    if (!app) return;
    
    const modal = document.getElementById('application-modal');
    const content = document.getElementById('application-modal-content');
    
    const date = app.createdAt ? (app.createdAt.toDate ? app.createdAt.toDate().toLocaleString('ru-RU') : new Date(app.createdAt.seconds * 1000).toLocaleString('ru-RU')) : '—';
    const statusText = {
        'pending': 'Новая',
        'approved': 'Одобрена',
        'rejected': 'Отклонена'
    }[app.status] || 'Неизвестно';
    
    content.innerHTML = `
        <div class="space-y-4">
            <div>
                <label class="text-gray-600 font-semibold">Дата заявки:</label>
                <p class="text-gray-800">${date}</p>
            </div>
            <div>
                <label class="text-gray-600 font-semibold">Имя:</label>
                <p class="text-gray-800">${app.name || '—'}</p>
            </div>
            <div>
                <label class="text-gray-600 font-semibold">Телефон:</label>
                <p class="text-gray-800">
                    <a href="tel:${app.phone}" class="text-teal-600 hover:text-teal-800">${app.phone || '—'}</a>
                </p>
            </div>
            <div>
                <label class="text-gray-600 font-semibold">Комната:</label>
                <p class="text-gray-800">${app.roomName || '—'}</p>
            </div>
            <div>
                <label class="text-gray-600 font-semibold">Дата заселения:</label>
                <p class="text-gray-800">${app.moveInDate || '—'}</p>
            </div>
            <div>
                <label class="text-gray-600 font-semibold">Статус:</label>
                <p class="text-gray-800">${statusText}</p>
            </div>
            ${app.message ? `
                <div>
                    <label class="text-gray-600 font-semibold">Дополнительная информация:</label>
                    <p class="text-gray-800">${app.message}</p>
                </div>
            ` : ''}
        </div>
    `;
    
    modal.classList.remove('hidden');
};

// Одобрение заявки
window.approveApplication = async function(appId) {
    try {
        await db.collection('applications').doc(appId).update({
            status: 'approved'
        });
    } catch (error) {
        console.error('Ошибка одобрения заявки:', error);
        alert('Ошибка при одобрении заявки');
    }
};

// Отклонение заявки
window.rejectApplication = async function(appId) {
    if (!confirm('Вы уверены, что хотите отклонить эту заявку?')) {
        return;
    }
    
    try {
        await db.collection('applications').doc(appId).update({
            status: 'rejected'
        });
    } catch (error) {
        console.error('Ошибка отклонения заявки:', error);
        alert('Ошибка при отклонении заявки');
    }
};

// Загрузка комнат для админ панели
async function loadRoomsAdmin() {
    try {
        const roomsData = await getRooms();
        rooms = roomsData;
        renderRoomsAdmin();
        
        // Подписка на изменения
        db.collection('rooms').onSnapshot((snapshot) => {
            rooms = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            renderRoomsAdmin();
        });
    } catch (error) {
        console.error('Ошибка загрузки комнат:', error);
    }
}

// Рендеринг комнат в админ панели
function renderRoomsAdmin() {
    const container = document.getElementById('rooms-admin-container');
    if (!container) return;
    
    if (rooms.length === 0) {
        container.innerHTML = '<div class="col-span-full text-center text-gray-500 py-8">Комнаты не добавлены</div>';
        return;
    }
    
    container.innerHTML = rooms.map(room => `
        <div class="bg-white rounded-lg shadow-md overflow-hidden">
            <div class="relative h-48 overflow-hidden">
                <img src="${room.images && room.images[0] ? room.images[0] : 'https://via.placeholder.com/800x600?text=No+Image'}" 
                     alt="${room.name}" 
                     class="w-full h-full object-cover">
            </div>
            <div class="p-4">
                <h4 class="text-lg font-bold text-gray-800 mb-2">${room.name}</h4>
                <p class="text-teal-600 font-semibold mb-2">${room.price || 'Цена не указана'}</p>
                <p class="text-gray-600 text-sm mb-4 line-clamp-2">${room.description || ''}</p>
                <button onclick="openRoomEditModal('${room.id}')" 
                        class="w-full bg-teal-600 text-white py-2 rounded-lg hover:bg-teal-700 transition-colors">
                    <i class="fas fa-edit mr-2"></i>Редактировать
                </button>
            </div>
        </div>
    `).join('');
}

// Открытие модалки редактирования комнаты
window.openRoomEditModal = async function(roomId) {
    const modal = document.getElementById('room-edit-modal');
    const title = document.getElementById('room-edit-title');
    const deleteBtn = document.getElementById('delete-room-btn');
    
    if (roomId) {
        // Редактирование существующей комнаты
        title.textContent = 'Редактировать комнату';
        deleteBtn.classList.remove('hidden');
        
        const room = rooms.find(r => r.id === roomId);
        if (room) {
            document.getElementById('room-edit-id').value = room.id;
            document.getElementById('room-name').value = room.name || '';
            document.getElementById('room-price').value = room.price || '';
            document.getElementById('room-description').value = room.description || '';
            document.getElementById('room-area').value = room.area || '';
            document.getElementById('room-beds').value = room.beds || '';
            document.getElementById('room-features').value = room.features ? room.features.join(', ') : '';
            document.getElementById('room-images').value = room.images ? room.images.join('\n') : '';
        }
    } else {
        // Добавление новой комнаты
        title.textContent = 'Добавить комнату';
        deleteBtn.classList.add('hidden');
        document.getElementById('room-edit-form').reset();
        document.getElementById('room-edit-id').value = '';
    }
    
    modal.classList.remove('hidden');
};

// Сохранение комнаты
async function saveRoom() {
    const roomId = document.getElementById('room-edit-id').value;
    const name = document.getElementById('room-name').value.trim();
    const price = document.getElementById('room-price').value.trim();
    const description = document.getElementById('room-description').value.trim();
    const area = document.getElementById('room-area').value.trim();
    const beds = document.getElementById('room-beds').value.trim();
    const featuresStr = document.getElementById('room-features').value.trim();
    const imagesStr = document.getElementById('room-images').value.trim();
    
    if (!name || !price || !description || !featuresStr) {
        alert('Пожалуйста, заполните все обязательные поля');
        return;
    }
    
    const features = featuresStr.split(',').map(f => f.trim()).filter(f => f);
    const images = imagesStr.split('\n').map(img => img.trim()).filter(img => img);
    
    const roomData = {
        name,
        price,
        description,
        features,
        images,
        area: area || '',
        beds: beds || '',
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    try {
        if (roomId) {
            // Обновление
            await db.collection('rooms').doc(roomId).update(roomData);
        } else {
            // Создание
            roomData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
            await db.collection('rooms').add(roomData);
        }
        
        document.getElementById('room-edit-modal').classList.add('hidden');
        alert(roomId ? 'Комната успешно обновлена' : 'Комната успешно добавлена');
    } catch (error) {
        console.error('Ошибка сохранения комнаты:', error);
        alert('Ошибка при сохранении комнаты');
    }
}

// Удаление комнаты
async function deleteRoom(roomId) {
    try {
        await db.collection('rooms').doc(roomId).delete();
        document.getElementById('room-edit-modal').classList.add('hidden');
        alert('Комната успешно удалена');
    } catch (error) {
        console.error('Ошибка удаления комнаты:', error);
        alert('Ошибка при удалении комнаты');
    }
}


