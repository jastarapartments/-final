// Данные комнат (начальные данные для инициализации Firestore)

const initialRooms = [
    {
        id: "room-2person",
        name: "Комната на 2 человека",
        price: "100 000 тг / мес",
        description: "Уютная комната для двух человек с удобной планировкой и всеми необходимыми удобствами. Идеально подходит для студентов.",
        features: ["Wi-Fi", "Стиральная машина", "Общий зал", "Кухня", "Холодильник", "Мебель"],
        images: [
            "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800",
            "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800",
            "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800"
        ],
        area: "15 м²",
        beds: "2 кровати",
        maxOccupancy: 2
    },
    {
        id: "room-3person",
        name: "Комната на 3 человека",
        price: "80 000 тг / мес",
        description: "Просторная комната для трех человек. Больше места, больше удобств. Отличный выбор для друзей или группы студентов.",
        features: ["Wi-Fi", "Стиральная машина", "Общий зал", "Кухня", "Холодильник", "Мебель", "Шкаф"],
        images: [
            "https://images.unsplash.com/photo-1505693416388-ac5ce068feae?w=800",
            "https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=800",
            "https://images.unsplash.com/photo-1560449752-6530e6e6b4b2?w=800"
        ],
        area: "22 м²",
        beds: "3 кровати",
        maxOccupancy: 3
    }
];

// Инициализация комнат в Firestore (выполнить один раз)
async function initializeRooms() {
    try {
        const roomsSnapshot = await db.collection('rooms').get();
        if (roomsSnapshot.empty) {
            // Добавляем начальные данные
            const batch = db.batch();
            initialRooms.forEach(room => {
                const roomRef = db.collection('rooms').doc(room.id);
                batch.set(roomRef, {
                    name: room.name,
                    price: room.price,
                    description: room.description,
                    features: room.features,
                    images: room.images,
                    area: room.area,
                    beds: room.beds,
                    maxOccupancy: room.maxOccupancy,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            });
            await batch.commit();
            console.log('Комнаты успешно инициализированы');
            return true;
        }
        return false;
    } catch (error) {
        console.error('Ошибка инициализации комнат:', error);
        return false;
    }
}

// Экспорт функции для использования в консоли
window.initializeRooms = initializeRooms;

// Получение всех комнат из Firestore
async function getRooms() {
    try {
        const snapshot = await db.collection('rooms').get();
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Ошибка получения комнат:', error);
        return [];
    }
}

// Получение комнаты по ID
async function getRoomById(roomId) {
    try {
        const doc = await db.collection('rooms').doc(roomId).get();
        if (doc.exists) {
            return { id: doc.id, ...doc.data() };
        }
        return null;
    } catch (error) {
        console.error('Ошибка получения комнаты:', error);
        return null;
    }
}

