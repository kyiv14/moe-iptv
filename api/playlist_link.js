// Serverless Function: api/playlist_link.js

// КОНФИГУРАЦИЯ (ОБЯЗАТЕЛЬНО ИЗМЕНИТЕ ЭТИ ЗНАЧЕНИЯ)
const GITHUB_OWNER = 'kyiv14';
const GITHUB_REPO = 'moe-iptv'; 
const CLIENTS_FILE_PATH = 'public/clients.json'; // Путь к файлу с данными клиентов
const TEST_DURATION_MS = 5 * 60 * 1000; // 5 минут в миллисекундах (300 000)

// URL для тестового и основного плейлиста
const TEST_PLAYLIST_URL = 'https://raw.githubusercontent.com/kyiv14/iptv-client/main/playlist.m3u8';
const BASE_URL = 'https://moe-iptv.vercel.app/'; // Базовый домен для основного плейлиста

/**
 * Вспомогательная функция для получения данных клиентов с GitHub.
 * В продакшене рекомендуется использовать токен для приватных репозиториев или
 * кешировать данные, чтобы не делать запрос при каждом обращении.
 */
async function fetchClients() {
    // ВАЖНО: Используйте прямую (RAW) ссылку на ваш clients.json
    const rawUrl = `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/main/${CLIENTS_FILE_PATH}`;
    
    try {
        const response = await fetch(rawUrl, { cache: 'no-store' }); // Отключаем кеширование
        if (!response.ok) {
            throw new Error(`Ошибка загрузки clients.json: ${response.status}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Ошибка при загрузке клиентов:", error.message);
        return null;
    }
}


// Основной обработчик Vercel Serverless Function
export default async function handler(req, res) {
    // Получаем номер телефона из query-параметров URL
    const { phone } = req.query; 

    if (!phone) {
        return res.status(400).send('Требуется параметр "phone"');
    }

    const clients = await fetchClients();
    if (!clients) {
        return res.status(503).send('Сервис временно недоступен (ошибка загрузки данных).');
    }
    
    // Ищем клиента по номеру телефона
    const client = clients.find(c => c.phone === phone);

    if (!client || !client.registration_date) {
        return res.status(404).send('Клиент не найден или нет даты регистрации.');
    }

    // Проверка тестового периода (5 минут)
    const registrationTime = new Date(client.registration_date).getTime();
    const currentTime = new Date().getTime();
    const elapsedTime = currentTime - registrationTime;

    let targetUrl;
    
    if (elapsedTime < TEST_DURATION_MS) {
        // Менее 5 минут прошло: даем тестовый плейлист
        targetUrl = TEST_PLAYLIST_URL; 
    } else {
        // 5 минут прошло: даем основной плейлист
        // Основной плейлист должен называться [номер].m3u
        targetUrl = `${BASE_URL}${phone}.m3u`;
    }

    // Выполняем HTTP-перенаправление (302 Found - временное)
    res.setHeader('Location', targetUrl);
    res.status(302).send('Redirecting to playlist...');
}