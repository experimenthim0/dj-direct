const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const youtube = require('youtube-search-api');
const crypto = require('crypto');

dotenv.config();

const Room = require('./models/Room');
const Request = require('./models/Request');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});








app.use(cors({
  origin: 'https://dj-direct.vercel.app', // ✅ no trailing slash
  methods: ['GET', 'POST'],
  credentials: true
}));
app.use(express.json());
// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// --- API Routes ---

// Create a Room
app.post('/api/rooms', async (req, res) => {
  try {
    const { name } = req.body;
    const shortId = crypto.randomBytes(3).toString('hex'); // Simple short ID
    
    // Set initial expiry to 3 hours from now
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 3);

    const room = new Room({ shortId, name, expiresAt });
    await room.save();
    res.status(201).json(room);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get Room Details
app.get('/api/rooms/:shortId', async (req, res) => {
  try {
    const room = await Room.findOne({ shortId: req.params.shortId });
    if (!room) return res.status(404).json({ error: 'Room not found' });
    
    const requests = await Request.find({ roomId: room._id }).sort({ createdAt: -1 });
    res.json({ room, requests });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Extend Room Session (+30 Minutes)
app.patch('/api/rooms/:shortId/extend', async (req, res) => {
  try {
    const room = await Room.findOne({ shortId: req.params.shortId });
    if (!room) return res.status(404).json({ error: 'Room not found' });

    // Add 30 minutes to existing expiry
    const newExpiry = new Date(room.expiresAt);
    newExpiry.setMinutes(newExpiry.getMinutes() + 30);
    
    room.expiresAt = newExpiry;
    await room.save();

    res.json({ message: 'Session extended by 30 minutes', expiresAt: room.expiresAt });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// YouTube Search API Proxy
app.get('/api/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.status(400).json({ error: 'Query required' });
    
    // Using youtube-search-api to avoid needing a Google API Key
    const results = await youtube.GetListByKeyword(q, false, 5);
    res.json(results.items.map(item => ({
      id: item.id,
      title: item.title,
      thumbnail: item.thumbnail?.thumbnails[0]?.url || ''
    })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Submit a Request
app.post('/api/requests', async (req, res) => {
  try {
    const { roomId, title, thumbnail, deviceId } = req.body;
    
    // Check if room exists
    const room = await Room.findById(roomId);
    if (!room) return res.status(404).json({ error: 'Room not found' });

    // Simple anti-spam: limit 3 active requests per device per room
    const recentCount = await Request.countDocuments({ roomId, deviceId });
    if (recentCount >= 5) {
      return res.status(429).json({ error: 'Request limit reached. Wait for the DJ to clear some.' });
    }

    const request = new Request({ roomId, title, thumbnail, deviceId });
    await request.save();

    // Broadcast to the specific room
    io.to(roomId.toString()).emit('new-request', request);

    res.status(201).json(request);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DJ: Delete a Request (Clear from list)
app.delete('/api/requests/:id', async (req, res) => {
  try {
    const request = await Request.findByIdAndDelete(req.params.id);
    if (!request) return res.status(404).json({ error: 'Request not found' });
    
    io.to(request.roomId.toString()).emit('request-deleted', req.params.id);
    res.json({ message: 'Request cleared' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- Socket.io Handling ---
io.on('connection', (socket) => {
  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    console.log(`Socket ${socket.id} joined room ${roomId}`);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
