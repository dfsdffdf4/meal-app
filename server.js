const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const DATA_FILE = path.join(__dirname, 'data.json');

function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    }
  } catch (e) { console.error('Load error:', e); }
  return { orders: [], names: { husband: '老公', wife: '老婆' }, favs: {} };
}

function saveData(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) { console.error('Save error:', e); }
}

let data = loadData();
const devices = {};


// Auto-delete orders older than 7 days
function cleanupOldOrders() {
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const before = data.orders.length;
  data.orders = data.orders.filter(o => o.id > sevenDaysAgo);
  if (data.orders.length < before) {
    saveData(data);
    console.log('Cleaned up ' + (before - data.orders.length) + ' old orders (7-day limit)');
  }
}
setInterval(cleanupOldOrders, 60 * 60 * 1000); // Run every hour
cleanupOldOrders(); // Run on startup

io.on('connection', (socket) => {
  console.log('Connected:', socket.id);

  socket.on('register', (info) => {
    devices[socket.id] = { person: info.person, joinedAt: Date.now() };
    socket.emit('syncData', { orders: data.orders, names: data.names, favs: data.favs });
    io.emit('deviceStatus', getOnlineDevices());
  });

  socket.on('submitOrder', (order) => {
    const newOrder = {
      id: Date.now(),
      time: new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }),
      person: order.person,
      items: order.items,
      status: 'pending'
    };
    data.orders.unshift(newOrder);
    saveData(data);
    io.emit('newOrder', newOrder);
    console.log('Order from ' + order.person + ': ' + order.items.map(i => i.n).join(', '));
  });

  socket.on('updateStatus', (info) => {
    const order = data.orders.find(o => o.id === info.orderId);
    if (order) {
      order.status = info.status;
      saveData(data);
      io.emit('orderUpdated', order);
    }
  });

  socket.on('updateNames', (names) => {
    data.names = names;
    saveData(data);
    io.emit('namesUpdated', names);
  });

  socket.on('updateFavs', (favs) => {
    data.favs = favs;
    saveData(data);
  });

  socket.on('disconnect', () => {
    delete devices[socket.id];
    io.emit('deviceStatus', getOnlineDevices());
  });
});

function getOnlineDevices() {
  const result = { husband: 0, wife: 0 };
  Object.values(devices).forEach(d => {
    if (d.person === 'husband') result.husband++;
    else if (d.person === 'wife') result.wife++;
  });
  return result;
}

app.get('/api/data', (req, res) => res.json(data));
app.get('/api/health', (req, res) => res.json({ status: 'ok', devices: Object.keys(devices).length }));

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log('');
  console.log('🍽️  点菜服务器已启动！');
  console.log('📱 本地访问: http://localhost:' + PORT);
  const os = require('os');
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        console.log('📱 手机访问: http://' + net.address + ':' + PORT);
      }
    }
  }
  console.log('');
  console.log('💡 两台手机都打开上面的地址，选择不同身份即可使用');
  console.log('');
});

