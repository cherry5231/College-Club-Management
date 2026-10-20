
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

const app = express();

app.use(cors({
  origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173'
}));

app.use(express.json());

// MongoDB connection management
let mongoConnectionPromise;

async function connectToDatabase() {
  if (mongoose.connection.readyState === 1) {
    return;
  }

  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI environment variable is missing');
  }

  if (!mongoConnectionPromise) {
    mongoConnectionPromise = mongoose
      .connect(process.env.MONGO_URI)
      .catch((error) => {
        mongoConnectionPromise = null;
        throw error;
      });
  }

  await mongoConnectionPromise;
}

// Connect to MongoDB before handling API requests
app.use(async (req, res, next) => {
  try {
    await connectToDatabase();
    next();
  } catch (error) {
    next(error);
  }
});

// Club Schema
const clubSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  category: { type: String, required: true },
  description: { type: String, default: '' },
  president: { type: String, required: true },
  membersCount: { type: Number, default: 0, min: 0 }
}, { timestamps: true });

// Event Schema
const eventSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  club: { type: String, required: true },
  date: { type: String, required: true },
  venue: { type: String, required: true },
  status: {
    type: String,
    enum: ['Upcoming', 'Completed', 'Cancelled'],
    default: 'Upcoming'
  },
  description: { type: String, default: '' }
}, { timestamps: true });

// Member Schema
const memberSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, lowercase: true },
  studentId: { type: String, required: true, trim: true },
  club: { type: String, required: true },
  status: {
    type: String,
    enum: ['Active', 'Pending'],
    default: 'Active'
  }
}, { timestamps: true });

memberSchema.index({ email: 1, club: 1 }, { unique: true });

// Models
const Club = mongoose.models.Club ||
  mongoose.model('Club', clubSchema);

const Event = mongoose.models.Event ||
  mongoose.model('Event', eventSchema);

const Member = mongoose.models.Member ||
  mongoose.model('Member', memberSchema);

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    database: mongoose.connection.readyState === 1
      ? 'connected'
      : 'disconnected'
  });
});

// Dashboard
app.get('/api/dashboard', async (req, res, next) => {
  try {
    const [clubs, members, events, upcomingEvents] = await Promise.all([
      Club.countDocuments(),
      Member.countDocuments(),
      Event.countDocuments(),
      Event.countDocuments({ status: 'Upcoming' })
    ]);

    res.json({ clubs, members, events, upcomingEvents });
  } catch (error) {
    next(error);
  }
});

// Clubs
app.get('/api/clubs', async (req, res, next) => {
  try {
    res.json(await Club.find().sort({ createdAt: -1 }));
  } catch (error) {
    next(error);
  }
});

app.post('/api/clubs', async (req, res, next) => {
  try {
    res.status(201).json(await Club.create(req.body));
  } catch (error) {
    next(error);
  }
});

app.put('/api/clubs/:id', async (req, res, next) => {
  try {
    const item = await Club.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!item) {
      return res.status(404).json({ message: 'Club not found' });
    }

    res.json(item);
  } catch (error) {
    next(error);
  }
});

app.delete('/api/clubs/:id', async (req, res, next) => {
  try {
    const item = await Club.findByIdAndDelete(req.params.id);

    if (!item) {
      return res.status(404).json({ message: 'Club not found' });
    }

    res.json({ message: 'Club deleted' });
  } catch (error) {
    next(error);
  }
});

// Events
app.get('/api/events', async (req, res, next) => {
  try {
    res.json(await Event.find().sort({ date: 1 }));
  } catch (error) {
    next(error);
  }
});

app.post('/api/events', async (req, res, next) => {
  try {
    res.status(201).json(await Event.create(req.body));
  } catch (error) {
    next(error);
  }
});

app.put('/api/events/:id', async (req, res, next) => {
  try {
    const item = await Event.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!item) {
      return res.status(404).json({ message: 'Event not found' });
    }

    res.json(item);
  } catch (error) {
    next(error);
  }
});

app.delete('/api/events/:id', async (req, res, next) => {
  try {
    const item = await Event.findByIdAndDelete(req.params.id);

    if (!item) {
      return res.status(404).json({ message: 'Event not found' });
    }

    res.json({ message: 'Event deleted' });
  } catch (error) {
    next(error);
  }
});

// Members
app.get('/api/members', async (req, res, next) => {
  try {
    res.json(await Member.find().sort({ createdAt: -1 }));
  } catch (error) {
    next(error);
  }
});

app.post('/api/members', async (req, res, next) => {
  try {
    res.status(201).json(await Member.create(req.body));
  } catch (error) {
    next(error);
  }
});

app.delete('/api/members/:id', async (req, res, next) => {
  try {
    const item = await Member.findByIdAndDelete(req.params.id);

    if (!item) {
      return res.status(404).json({ message: 'Member not found' });
    }

    res.json({ message: 'Member removed' });
  } catch (error) {
    next(error);
  }
});

// Error Handling
app.use((err, req, res, next) => {
  console.error(err);

  if (err.code === 11000) {
    return res.status(409).json({
      message: 'This student is already registered for that club.'
    });
  }

  if (err.name === 'ValidationError') {
    return res.status(400).json({ message: err.message });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({ message: 'Invalid record ID.' });
  }

  res.status(500).json({
    message: 'Server error. Check the backend logs and MongoDB connection.'
  });
});

// Local development server
const PORT = process.env.PORT || 5001;

if (!process.env.VERCEL) {
  connectToDatabase()
    .then(() => {
      app.listen(PORT, () => {
        console.log(`API running at http://localhost:${PORT}`);
      });
    })
    .catch((error) => {
      console.error('MongoDB connection failed:', error.message);
      process.exit(1);
    });
}

// Vercel serverless entry point
export default app;
