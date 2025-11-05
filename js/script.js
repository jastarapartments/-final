// Основная логика сайта

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    // Проверка логотипа
    checkLogo();
    
    // Ждем немного, чтобы Firebase точно инициализировался
    setTimeout(() => {
        loadRooms();
        setupNavigation();
        setupMobileMenu();
        setupApplicationForm();
        setupContactForm();
        setupRoomModal();
    }, 100);
});

// Проверка наличия логотипа
function checkLogo() {
    const logo = document.querySelector('#hero-section img[src*="logo"]');
    if (logo) {
        logo.addEventListener('error', function() {
            console.warn('Логотип не найден по пути: images/logo.jpg');
            // Можно показать placeholder или скрыть
            this.style.display = 'none';
        });
        logo.addEventListener('load', function() {
            console.log('Логотип успешно загружен');
        });
    }
}

// Открытие формы заявки
window.openApplicationForm = function(roomType) {
    const modal = document.getElementById('application-modal');
    const roomSelect = document.getElementById('room_type');
    
    if (modal) {
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
        
        // Устанавливаем тип комнаты если указан
        if (roomSelect && roomType) {
            roomSelect.value = roomType;
        }
    }
};

// Закрытие формы заявки
window.closeApplicationForm = function() {
    const modal = document.getElementById('application-modal');
    if (modal) {
        modal.classList.add('hidden');
        document.body.style.overflow = '';
    }
};

// Переключение мобильного меню
window.toggleMobileMenu = function() {
    const menu = document.getElementById('mobile-menu');
    if (menu) {
        menu.classList.toggle('hidden');
    }
};

// Загрузка комнат из Firestore
async function loadRooms() {
    const container = document.getElementById('rooms-container');
    const roomSelect = document.getElementById('room-select');
    
    try {
        let rooms = await getRooms();
        
        // Если комнат нет, пытаемся инициализировать
        if (rooms.length === 0) {
            console.log('Комнат не найдено, пытаемся инициализировать...');
            const initialized = await initializeRooms();
            if (initialized) {
                // Перезагружаем комнаты после инициализации
                rooms = await getRooms();
            } else {
                // Комнаты уже были инициализированы ранее, но их нет - возможно ошибка
                container.innerHTML = `
                    <div class="col-span-full text-center text-gray-600 py-8">
                        <p class="mb-4">Комнаты пока не добавлены</p>
                        <p class="text-sm text-gray-500 mb-4">Если это первый запуск, проверьте консоль на наличие ошибок</p>
                        <button onclick="manualInitializeRooms()" 
                                class="bg-teal-600 text-white px-6 py-3 rounded-lg hover:bg-teal-700 transition-colors">
                            Инициализировать комнаты
                        </button>
                    </div>
                `;
                return;
            }
        }
        
        if (rooms.length === 0) {
            container.innerHTML = `
                <div class="col-span-full text-center text-gray-600 py-8">
                    <p class="mb-4">Комнаты пока не добавлены</p>
                    <button onclick="manualInitializeRooms()" 
                            class="bg-teal-600 text-white px-6 py-3 rounded-lg hover:bg-teal-700 transition-colors">
                        Инициализировать комнаты
                    </button>
                </div>
            `;
            return;
        }
        
        // Рендеринг карточек комнат
        container.innerHTML = rooms.map(room => {
            const roomType = room.name.includes('2') ? '2-местная' : room.name.includes('3') ? '3-местная' : 'Общая';
            const imageUrl = room.images && room.images[0] ? room.images[0] : (roomType === '2-местная' ? 'images/photo1.jpg' : 'images/photo2.jpg');
            
            return `
                <div class="bg-white rounded-2xl shadow-xl overflow-hidden transition duration-500 hover:shadow-2xl hover:scale-[1.02]">
                    <img src="${imageUrl}" alt="${room.name}" class="w-full h-64 object-cover" onerror="this.src='https://via.placeholder.com/800x600?text=No+Image'">
                    <div class="p-6">
                        <h3 class="text-2xl font-semibold text-text_dark mb-2">${room.name.includes('2') ? '🛏️' : '🏠'} ${room.name}</h3>
                        <p class="text-3xl font-bold text-primary mb-4">${room.price || 'Цена по запросу'}</p>
                        <ul class="list-disc list-inside text-gray-600 space-y-1 mb-6">
                            ${room.features ? room.features.slice(0, 3).map(feature => `<li>${feature}</li>`).join('') : ''}
                        </ul>
                        <button onclick="openApplicationForm('${roomType}')" class="w-full bg-secondary text-text_dark px-6 py-3 rounded-xl font-semibold hover:bg-amber-400 transition duration-300">
                            Оставить заявку на ${roomType}
                        </button>
                    </div>
                </div>
            `;
        }).join('');
        
        // Заполнение select в форме заявки
        if (roomSelect) {
            const options = rooms.map(room => {
                const roomType = room.name.includes('2') ? '2-местная' : room.name.includes('3') ? '3-местная' : 'Общая';
                return `<option value="${roomType}">${room.name} (${room.price || 'Цена по запросу'})</option>`;
            }).join('');
            roomSelect.innerHTML = '<option value="">Выберите комнату...</option><option value="Общая">Не имеет значения</option>' + options;
        }
        
        // Обработчики кликов уже встроены в кнопки через onclick
        
    } catch (error) {
        console.error('Ошибка загрузки комнат:', error);
        container.innerHTML = `
            <div class="col-span-full text-center text-red-600 py-8">
                <p class="mb-4">Ошибка загрузки комнат</p>
                <p class="text-sm text-gray-600 mb-4">Проверьте консоль браузера (F12) для деталей ошибки</p>
                <p class="text-sm text-gray-600 mb-4">Убедитесь, что:</p>
                <ul class="text-sm text-gray-600 mb-4 text-left inline-block">
                    <li>1. Firebase конфигурация правильная в js/firebase-config.js</li>
                    <li>2. Firestore Database создана и правила опубликованы</li>
                    <li>3. Интернет подключен</li>
                </ul>
                <button onclick="loadRooms()" 
                        class="bg-teal-600 text-white px-6 py-3 rounded-lg hover:bg-teal-700 transition-colors">
                    Попробовать снова
                </button>
            </div>
        `;
    }
}

// Ручная инициализация комнат (для кнопки)
window.manualInitializeRooms = async function() {
    const container = document.getElementById('rooms-container');
    container.innerHTML = `
        <div class="col-span-full text-center py-8">
            <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
            <p class="mt-4 text-gray-600">Инициализация комнат...</p>
        </div>
    `;
    
    try {
        const initialized = await initializeRooms();
        if (initialized) {
            // Перезагружаем комнаты
            await loadRooms();
        } else {
            // Комнаты уже были
            await loadRooms();
        }
    } catch (error) {
        console.error('Ошибка инициализации:', error);
        container.innerHTML = `
            <div class="col-span-full text-center text-red-600 py-8">
                <p class="mb-4">Ошибка инициализации комнат</p>
                <p class="text-sm text-gray-600">Проверьте консоль браузера (F12) для деталей</p>
                <button onclick="manualInitializeRooms()" 
                        class="mt-4 bg-teal-600 text-white px-6 py-3 rounded-lg hover:bg-teal-700 transition-colors">
                    Попробовать снова
                </button>
            </div>
        `;
    }
};

// Открытие модального окна комнаты
async function openRoomModal(roomId) {
    try {
        const room = await getRoomById(roomId);
        if (!room) {
            alert('Комната не найдена');
            return;
        }
        
        const modal = document.getElementById('room-modal');
        const modalTitle = document.getElementById('modal-title');
        const modalGallery = document.getElementById('modal-gallery');
        const modalContent = document.getElementById('modal-content');
        const applyBtn = document.getElementById('apply-from-modal');
        
        modalTitle.textContent = room.name;
        
        // Галерея
        if (room.images && room.images.length > 0) {
            modalGallery.innerHTML = `
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    ${room.images.map((img, index) => `
                        <img src="${img}" alt="${room.name} - фото ${index + 1}" 
                             class="w-full h-64 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                             onclick="openImageModal('${img}')">
                    `).join('')}
                </div>
            `;
        } else {
            modalGallery.innerHTML = '<div class="bg-gray-200 h-64 rounded-lg flex items-center justify-center text-gray-500">Нет фотографий</div>';
        }
        
        // Контент
        modalContent.innerHTML = `
            <div class="mb-6">
                <div class="flex items-center justify-between mb-4">
                    <span class="text-3xl font-bold text-teal-600">${room.price || 'Цена по запросу'}</span>
                    <div class="text-gray-600">
                        ${room.area ? `<i class="fas fa-ruler-combined mr-2"></i>${room.area}` : ''}
                        ${room.beds ? `<i class="fas fa-bed ml-4 mr-2"></i>${room.beds}` : ''}
                    </div>
                </div>
                <p class="text-gray-700 text-lg mb-6">${room.description || ''}</p>
            </div>
            ${room.features && room.features.length > 0 ? `
                <div>
                    <h4 class="text-xl font-bold mb-4 text-gray-800">Удобства:</h4>
                    <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
                        ${room.features.map(feature => `
                            <div class="flex items-center bg-gray-50 p-3 rounded-lg">
                                <i class="${getFeatureIconClass(feature)} text-teal-600 mr-2"></i>
                                <span class="text-gray-700">${feature}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
        `;
        
        // Кнопка заявки
        if (applyBtn) {
            applyBtn.onclick = function() {
                closeModal();
                // Выбираем комнату в форме
                const roomSelect = document.getElementById('room-select');
                if (roomSelect) {
                    roomSelect.value = room.id;
                }
                // Прокрутка к форме
                document.getElementById('application')?.scrollIntoView({ behavior: 'smooth' });
            };
        }
        
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
        
    } catch (error) {
        console.error('Ошибка открытия модалки:', error);
        alert('Ошибка загрузки информации о комнате');
    }
}

// Закрытие модального окна
function closeModal() {
    const modal = document.getElementById('room-modal');
    if (modal) {
        modal.classList.add('hidden');
        document.body.style.overflow = '';
    }
}

// Настройка модального окна
function setupRoomModal() {
    const closeBtn = document.getElementById('close-modal');
    const modal = document.getElementById('room-modal');
    
    if (closeBtn) {
        closeBtn.addEventListener('click', closeModal);
    }
    
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                closeModal();
            }
        });
    }
}

// Настройка формы заявки
function setupApplicationForm() {
    const form = document.getElementById('application-form');
    if (!form) return;
    
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const submitBtn = form.querySelector('button[type="submit"]');
        const formMessage = document.getElementById('form-message');
        const name = document.getElementById('name').value.trim();
        const phone = document.getElementById('phone').value.trim();
        const roomType = document.getElementById('room_type').value;
        const moveInDate = document.getElementById('move_in_date').value;
        const comment = document.getElementById('comment').value.trim();
        
        // Валидация
        if (!name || !phone || !roomType) {
            showFormMessage('Пожалуйста, заполните все обязательные поля', 'error', formMessage);
            return;
        }
        
        const roomName = roomType;
        
        // Отключение кнопки
        submitBtn.disabled = true;
        submitBtn.textContent = 'Отправка...';
        
        try {
            // Сохранение заявки в Firestore
            await db.collection('applications').add({
                name: name,
                phone: phone,
                roomId: '',
                roomName: roomName,
                moveInDate: moveInDate || '',
                message: comment || '',
                status: 'pending',
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            showFormMessage('Заявка успешно отправлена! Мы свяжемся с вами в ближайшее время.', 'success', formMessage);
            form.reset();
            
            // Закрываем форму через 3 секунды
            setTimeout(() => {
                closeApplicationForm();
            }, 3000);
            
        } catch (error) {
            console.error('Ошибка отправки заявки:', error);
            showFormMessage('Произошла ошибка при отправке заявки. Попробуйте еще раз или свяжитесь с нами по телефону.', 'error', formMessage);
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Отправить заявку';
        }
    });
}

// Настройка формы обратной связи
function setupContactForm() {
    const form = document.getElementById('contact-form');
    if (!form) return;
    
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const submitBtn = form.querySelector('button[type="submit"]');
        const formMessage = document.getElementById('contact-message');
        const name = document.getElementById('contact-name').value.trim();
        const phone = document.getElementById('contact-phone').value.trim();
        const roomType = document.getElementById('contact-room').value;
        
        // Валидация
        if (!name || !phone || !roomType) {
            showFormMessage('Пожалуйста, заполните все поля', 'error', formMessage);
            return;
        }
        
        // Отключение кнопки
        submitBtn.disabled = true;
        submitBtn.textContent = 'Отправка...';
        
        try {
            // Сохранение заявки в Firestore
            await db.collection('applications').add({
                name: name,
                phone: phone,
                roomId: '',
                roomName: roomType,
                moveInDate: '',
                message: '',
                status: 'pending',
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            showFormMessage('Сообщение успешно отправлено! Мы свяжемся с вами в ближайшее время.', 'success', formMessage);
            form.reset();
            
        } catch (error) {
            console.error('Ошибка отправки сообщения:', error);
            showFormMessage('Произошла ошибка при отправке. Попробуйте еще раз или свяжитесь с нами по телефону.', 'error', formMessage);
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Отправить';
        }
    });
}

// Показ сообщения формы
function showFormMessage(text, type, formMessageElement) {
    const formMessage = formMessageElement || document.getElementById('form-message');
    if (!formMessage) return;
    
    formMessage.textContent = text;
    formMessage.className = `p-4 rounded-lg ${type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`;
    formMessage.classList.remove('hidden');
    
    // Автоскрытие через 5 секунд
    setTimeout(() => {
        formMessage.classList.add('hidden');
    }, 5000);
}

// Навигация без плавной прокрутки
function setupNavigation() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'auto', block: 'start' });
                document.getElementById('mobile-menu')?.classList.add('hidden');
            }
        });
    });
}

// Мобильное меню
function setupMobileMenu() {
    const btn = document.getElementById('mobile-menu-btn');
    const menu = document.getElementById('mobile-menu');
    
    if (btn && menu) {
        btn.addEventListener('click', function() {
            menu.classList.toggle('hidden');
        });
    }
}

// Вспомогательные функции для иконок
function getFeatureIcon(feature) {
    const icons = {
        'Wi-Fi': '📶',
        'Стиральная машина': '🧺',
        'Общий зал': '🛋️',
        'Кухня': '🍳',
        'Холодильник': '🧊',
        'Балкон': '🌅',
        'Кондиционер': '❄️',
        'Телевизор': '📺',
        'Собственный санузел': '🚿',
        'Шкаф': '🚪',
        'Рабочее место': '💻',
        'Мебель': '🪑'
    };
    return icons[feature] || '✓';
}

function getFeatureIconClass(feature) {
    const icons = {
        'Wi-Fi': 'fas fa-wifi',
        'Стиральная машина': 'fas fa-tshirt',
        'Общий зал': 'fas fa-couch',
        'Кухня': 'fas fa-utensils',
        'Холодильник': 'fas fa-snowflake',
        'Балкон': 'fas fa-door-open',
        'Кондиционер': 'fas fa-wind',
        'Телевизор': 'fas fa-tv',
        'Собственный санузел': 'fas fa-shower',
        'Шкаф': 'fas fa-archive',
        'Рабочее место': 'fas fa-laptop',
        'Мебель': 'fas fa-chair'
    };
    return icons[feature] || 'fas fa-check';
}

// Открытие фото в полноэкранном режиме
window.openImageModal = function(imageSrc) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4';
    modal.innerHTML = `
        <div class="relative max-w-6xl w-full">
            <img src="${imageSrc}" alt="Фото комнаты" class="w-full h-auto rounded-lg">
            <button onclick="this.closest('.fixed').remove(); document.body.style.overflow = '';" 
                    class="absolute top-4 right-4 text-white text-4xl hover:text-gray-300">&times;</button>
        </div>
    `;
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';
};


