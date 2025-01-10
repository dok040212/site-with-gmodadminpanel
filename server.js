const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const fs = require('fs');
const path = require('path');
const RCON = require('rcon');

const app = express();
const port = 3000;

// Настройка сессий
app.use(
  session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false },
  })
);

app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.use(express.static('public'));

// Пути к папкам и файлам
const viewsDir = path.join(__dirname, 'views');
const publicDir = path.join(__dirname, 'public');
const adminFilePath = path.join(__dirname, 'admin.json');
const bansFilePath = path.join(__dirname, 'bans.json');
const logsFilePath = path.join(__dirname, 'logs.json');
const statsFilePath = path.join(__dirname, 'stats.json');
const mapsFilePath = path.join(__dirname, 'maps.json');
const pluginsFilePath = path.join(__dirname, 'plugins.json');

// Создание папок, если они отсутствуют
if (!fs.existsSync(viewsDir)) fs.mkdirSync(viewsDir);
if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir);

// Функция для создания файла, если он отсутствует
const createFileIfNotExists = (filePath, defaultContent) => {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(defaultContent, null, 2));
    console.log(`Файл ${path.basename(filePath)} создан.`);
  }
};

// Создание файлов данных
createFileIfNotExists(adminFilePath, { username: 'admin', password: 'admin' });
createFileIfNotExists(bansFilePath, []);
createFileIfNotExists(logsFilePath, []);
createFileIfNotExists(statsFilePath, { labels: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'], data: [0, 0, 0, 0, 0, 0, 0] });
createFileIfNotExists(mapsFilePath, ['gm_flatgrass', 'gm_construct', 'ttt_aircraft']);
createFileIfNotExists(pluginsFilePath, ['ulx', 'ulib', 'sandbox']);

// Функция для создания шаблонов
const createTemplateFile = (filePath, content) => {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, content);
    console.log(`Файл ${path.basename(filePath)} создан.`);
  }
};

// Создание шаблонов EJS
createTemplateFile(
  path.join(viewsDir, 'index.ejs'),
  `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Админ-панель</title>
  <link rel="stylesheet" href="/styles.css">
</head>
<body>
  <div class="sidebar">
    <h2>Меню</h2>
    <ul>
      <li><a href="/">Управление</a></li>
      <li><a href="/bans">Баны</a></li>
      <li><a href="/stats">Статистика</a></li>
      <li><a href="/logs">Логи</a></li>
      <li><a href="/logout">Выйти</a></li>
    </ul>
  </div>
  <div class="main-content">
    <h1>Админ-панель</h1>
    <div class="card">
      <h2>Управление сервером</h2>
      <form action="/send-command" method="POST">
        <input type="text" name="command" placeholder="Введите команду" required>
        <button type="submit">Отправить команду</button>
      </form>
    </div>
    <div class="card">
      <h2>Забанить игрока</h2>
      <form action="/ban-player" method="POST">
        <input type="text" name="steamid" placeholder="SteamID" required>
        <input type="text" name="reason" placeholder="Причина бана" required>
        <input type="text" name="admin" placeholder="Ваше имя" required>
        <button type="submit">Забанить</button>
      </form>
    </div>
    <div class="card">
      <h2>Логи</h2>
      <table>
        <thead>
          <tr>
            <th>Дата</th>
            <th>Действие</th>
            <th>Детали</th>
          </tr>
        </thead>
        <tbody>
          <% logs.forEach(log => { %>
            <tr>
              <td><%= log.date %></td>
              <td><%= log.action %></td>
              <td><%= log.details %></td>
            </tr>
          <% }) %>
        </tbody>
      </table>
    </div>
  </div>
</body>
</html>`
);

createTemplateFile(
  path.join(viewsDir, 'login.ejs'),
  `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Login</title>
  <link rel="stylesheet" href="/styles.css">
</head>
<body>
  <div class="login-container">
    <h1>Login</h1>
    <form action="/login" method="POST">
      <input type="text" name="username" placeholder="Username" required>
      <input type="password" name="password" placeholder="Password" required>
      <button type="submit">Login</button>
    </form>
  </div>
</body>
</html>`
);

createTemplateFile(
  path.join(viewsDir, 'register.ejs'),
  `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Register</title>
  <link rel="stylesheet" href="/styles.css">
</head>
<body>
  <div class="register-container">
    <h1>Register Admin</h1>
    <form action="/register" method="POST">
      <input type="text" name="username" placeholder="Username" required>
      <input type="password" name="password" placeholder="Password" required>
      <button type="submit">Register</button>
    </form>
  </div>
</body>
</html>`
);

createTemplateFile(
  path.join(viewsDir, 'bans.ejs'),
  `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Баны</title>
  <link rel="stylesheet" href="/styles.css">
</head>
<body>
  <div class="sidebar">
    <h2>Меню</h2>
    <ul>
      <li><a href="/">Управление</a></li>
      <li><a href="/bans">Баны</a></li>
      <li><a href="/stats">Статистика</a></li>
      <li><a href="/logs">Логи</a></li>
      <li><a href="/logout">Выйти</a></li>
    </ul>
  </div>
  <div class="main-content">
    <h1>Баны</h1>
    <table>
      <thead>
        <tr>
          <th>SteamID</th>
          <th>Причина</th>
          <th>Админ</th>
          <th>Дата</th>
        </tr>
      </thead>
      <tbody>
        <% bans.forEach(ban => { %>
          <tr>
            <td><%= ban.steamid %></td>
            <td><%= ban.reason %></td>
            <td><%= ban.admin %></td>
            <td><%= ban.date %></td>
          </tr>
        <% }) %>
      </tbody>
    </table>
  </div>
</body>
</html>`
);

createTemplateFile(
  path.join(viewsDir, 'logs.ejs'),
  `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Логи</title>
  <link rel="stylesheet" href="/styles.css">
</head>
<body>
  <div class="sidebar">
    <h2>Меню</h2>
    <ul>
      <li><a href="/">Управление</a></li>
      <li><a href="/bans">Баны</a></li>
      <li><a href="/stats">Статистика</a></li>
      <li><a href="/logs">Логи</a></li>
      <li><a href="/logout">Выйти</a></li>
    </ul>
  </div>
  <div class="main-content">
    <h1>Логи</h1>
    <table>
      <thead>
        <tr>
          <th>Дата</th>
          <th>Действие</th>
          <th>Детали</th>
        </tr>
      </thead>
      <tbody>
        <% logs.forEach(log => { %>
          <tr>
            <td><%= log.date %></td>
            <td><%= log.action %></td>
            <td><%= log.details %></td>
          </tr>
        <% }) %>
      </tbody>
    </table>
  </div>
</body>
</html>`
);

createTemplateFile(
  path.join(viewsDir, 'stats.ejs'),
  `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Статистика</title>
  <link rel="stylesheet" href="/styles.css">
</head>
<body>
  <div class="sidebar">
    <h2>Меню</h2>
    <ul>
      <li><a href="/">Управление</a></li>
      <li><a href="/bans">Баны</a></li>
      <li><a href="/stats">Статистика</a></li>
      <li><a href="/logs">Логи</a></li>
      <li><a href="/logout">Выйти</a></li>
    </ul>
  </div>
  <div class="main-content">
    <h1>Статистика</h1>
    <div class="chart">
      <canvas id="playerChart"></canvas>
    </div>
  </div>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <script>
    const ctx = document.getElementById('playerChart').getContext('2d');
    const playerChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: <%= JSON.stringify(stats.labels) %>,
        datasets: [{
          label: 'Игроки онлайн',
          data: <%= JSON.stringify(stats.data) %>,
          borderColor: '#3498db',
          fill: false,
        }]
      },
      options: {
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });
  </script>
</body>
</html>`
);

createTemplateFile(
  path.join(publicDir, 'styles.css'),
  `/* Общие стили */
body {
  font-family: 'Arial', sans-serif;
  margin: 0;
  padding: 0;
  background-color: #2c3e50; /* Серый фон */
  color: #ecf0f1;
  display: flex;
  height: 100vh;
  overflow: hidden;
  position: relative;
}

/* Боковая панель */
.sidebar {
  width: 250px;
  background-color: #34495e;
  color: white;
  height: 100vh;
  padding: 20px;
  box-shadow: 2px 0 5px rgba(0, 0, 0, 0.1);
}

.sidebar h2 {
  margin-bottom: 20px;
}

.sidebar ul {
  list-style: none;
  padding: 0;
}

.sidebar ul li {
  margin: 15px 0;
}

.sidebar ul li a {
  color: white;
  text-decoration: none;
  font-size: 18px;
}

.sidebar ul li a:hover {
  text-decoration: underline;
}

/* Основной контент */
.main-content {
  flex-grow: 1;
  padding: 20px;
  overflow-y: auto;
}

.main-content h1 {
  color: #3498db; /* Голубой цвет */
  margin-bottom: 1rem;
  animation: glow 2s infinite alternate;
}

@keyframes glow {
  from {
    text-shadow: 0 0 10px #3498db, 0 0 20px #3498db, 0 0 30px #3498db;
  }
  to {
    text-shadow: 0 0 20px #3498db, 0 0 30px #3498db, 0 0 40px #3498db;
  }
}

/* Карточки */
.card {
  background: rgba(255, 255, 255, 0.1);
  padding: 1.5rem;
  border-radius: 10px;
  margin: 1rem 0;
  animation: slideIn 1s ease-in-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(-50px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* Таблицы */
table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
}

table th, table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

table th {
  background-color: rgba(52, 152, 219, 0.7); /* Голубой фон для заголовков */
  color: white;
}

/* Формы */
input[type="text"], input[type="password"] {
  width: 100%;
  padding: 10px;
  margin: 10px 0;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 5px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

input[type="text"]:focus, input[type="password"]:focus {
  outline: none;
  border-color: #3498db;
}

button {
  background: linear-gradient(45deg, #3498db, #2980b9); /* Голубой градиент */
  border: none;
  color: white;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  border-radius: 25px;
  cursor: pointer;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  margin: 0.5rem;
}

button:hover {
  transform: scale(1.1);
  box-shadow: 0 0 15px rgba(52, 152, 219, 0.7);
}

/* График */
.chart {
  background: rgba(255, 255, 255, 0.1);
  padding: 1.5rem;
  border-radius: 10px;
  margin: 1rem 0;
}`
);

// Подключение к RCON
const rcon = new RCON('your-server-ip', 27015, 'your-rcon-password');

rcon.on('auth', function () {
  console.log('Authenticated successfully!');
})
  .on('response', function (str) {
    console.log('Response: ' + str);
  })
  .on('error', function (err) {
    console.log('Error: ' + err);
  })
  .on('end', function () {
    console.log('Connection closed');
  });

rcon.connect();

// Middleware для проверки авторизации
const requireLogin = (req, res, next) => {
  if (!req.session.admin) {
    return res.redirect('/login');
  }
  next();
};

// Маршруты
app.get('/', requireLogin, (req, res) => {
  const bans = JSON.parse(fs.readFileSync(bansFilePath, 'utf-8'));
  const logs = JSON.parse(fs.readFileSync(logsFilePath, 'utf-8'));
  const stats = JSON.parse(fs.readFileSync(statsFilePath, 'utf-8'));

  res.render('index', { admin: req.session.admin, bans, logs, stats });
});

app.post('/send-command', requireLogin, (req, res) => {
  const command = req.body.command;
  rcon.send(command, function (response) {
    res.send(response);
  });
});

app.post('/ban-player', requireLogin, (req, res) => {
  const { steamid, reason, admin } = req.body;
  const bans = JSON.parse(fs.readFileSync(bansFilePath, 'utf-8'));
  bans.push({ steamid, reason, admin, date: new Date().toISOString() });
  fs.writeFileSync(bansFilePath, JSON.stringify(bans));

  rcon.send(`ulx banid "${steamid}" 0 "${reason}"`, function (response) {
    res.send(response);
  });
});

app.get('/bans', requireLogin, (req, res) => {
  const bans = JSON.parse(fs.readFileSync(bansFilePath, 'utf-8'));
  res.render('bans', { bans });
});

app.get('/stats', requireLogin, (req, res) => {
  const stats = JSON.parse(fs.readFileSync(statsFilePath, 'utf-8'));
  res.render('stats', { stats });
});

app.get('/logs', requireLogin, (req, res) => {
  const logs = JSON.parse(fs.readFileSync(logsFilePath, 'utf-8'));
  res.render('logs', { logs });
});

app.get('/login', (req, res) => {
  const admin = JSON.parse(fs.readFileSync(adminFilePath, 'utf-8'));
  if (admin) {
    res.render('login');
  } else {
    res.redirect('/register');
  }
});

app.get('/register', (req, res) => {
  const admin = JSON.parse(fs.readFileSync(adminFilePath, 'utf-8'));
  if (!admin) {
    res.render('register');
  } else {
    res.redirect('/login');
  }
});

app.post('/register', (req, res) => {
  const { username, password } = req.body;
  const admin = { username, password };
  fs.writeFileSync(adminFilePath, JSON.stringify(admin));
  req.session.admin = admin;
  res.redirect('/');
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const admin = JSON.parse(fs.readFileSync(adminFilePath, 'utf-8'));
  if (admin && admin.username === username && admin.password === password) {
    req.session.admin = admin;
    res.redirect('/');
  } else {
    res.send('Invalid username or password');
  }
});

app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.redirect('/');
    }
    res.redirect('/login');
  });
});

// Запуск сервера
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});