import mongoose, { Schema, Document } from 'mongoose';

// 1. Define Interface
export interface Card {
    id: string;
    userId: string; // Firebase user ID
    player: string;
    sport: string;
    year: number;
    brand: string;
    series: string;
    cardType: string;
    purchasePrice: number;
    currency: 'USD' | 'CNY';
    currentValue: number;
    priceHistory: { date: string; value: number }[];
    imageUrl?: string;
    watchlist?: boolean;
    sold?: boolean;
    soldPrice?: number;
    soldDate?: string;
    graded?: boolean;
    gradeCompany?: string;
    gradeValue?: number;
    certNumber?: string;
    notes?: string;
    serialNumber?: string;
    purchaseDate?: string;
}

// 2. Define Mongoose Schema
const CardSchema = new Schema({
    id: { type: String, required: true, unique: true },
    userId: { type: String, required: true, index: true }, // Firebase user ID with index for faster queries
    player: { type: String, required: true },
    sport: { type: String, required: true },
    year: { type: Number, required: true },
    brand: { type: String, required: true },
    series: { type: String, required: true },
    cardType: { type: String, required: true },
    purchasePrice: { type: Number, required: true },
    currency: { type: String, enum: ['USD', 'CNY'], default: 'USD' },
    currentValue: { type: Number, required: true },
    priceHistory: [{
        date: { type: String, required: true },
        value: { type: Number, required: true }
    }],
    imageUrl: String,
    watchlist: Boolean,
    sold: Boolean,
    soldPrice: Number,
    soldDate: String,
    graded: Boolean,
    gradeCompany: String,
    gradeValue: Number,
    certNumber: String,
    notes: String,
    serialNumber: String,
    purchaseDate: String
});

// 3. Create Model
// Use a global variable to prevent recompiling model in serverless hot-reloads
const CardModel = mongoose.models.Card || mongoose.model<Card & Document>('Card', CardSchema);

// 4. Connection Logic
let isConnected = false;
export const connectToDb = async () => {
    if (isConnected) {
        console.log('[DB] Already connected to MongoDB');
        return;
    }

    const uri = process.env.MONGODB_URI;
    console.log('[DB] MONGODB_URI exists:', !!uri);

    if (!uri) {
        const error = new Error("MONGODB_URI environment variable is not set");
        console.error('[DB]', error.message);
        throw error;
    }

    try {
        console.log('[DB] Attempting to connect to MongoDB...');
        await mongoose.connect(uri);
        isConnected = true;
        console.log('[DB] Successfully connected to MongoDB');
    } catch (error) {
        console.error('[DB] MongoDB connection error:', error);
        throw error;
    }
};

// 5. Service Implementation
export const db = {
    async getCards(userId: string): Promise<Card[]> {
        await connectToDb();
        const docs = await CardModel.find({ userId });
        return docs.map(d => d.toObject());
    },

    async saveCard(card: Card, userId: string): Promise<Card> {
        await connectToDb();
        // Ensure userId is set
        const cardWithUser = { ...card, userId };

        // Upsert: Update if exists for this user, Insert if not
        const result = await CardModel.findOneAndUpdate(
            { id: card.id, userId },
            cardWithUser,
            { new: true, upsert: true }
        );
        return result.toObject();
    },

    async deleteCard(id: string, userId: string): Promise<void> {
        await connectToDb();
        await CardModel.deleteOne({ id, userId });
    },

    async updatePrice(id: string, userId: string, newPrice: number, dateStr?: string): Promise<Card | null> {
        await connectToDb();
        const card = await CardModel.findOne({ id, userId });
        if (!card) return null;

        const history = [...card.priceHistory];
        const newDate = dateStr ? new Date(dateStr).toISOString() : new Date().toISOString();
        const inputDateShort = newDate.split('T')[0];

        const existingIndex = history.findIndex(h => h.date.split('T')[0] === inputDateShort);

        if (existingIndex >= 0) {
            history[existingIndex].value = newPrice;
        } else {
            history.push({ date: newDate, value: newPrice });
        }

        history.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        const lastHistoryDate = new Date(history[history.length - 1].date).getTime();
        const newEntryDate = new Date(newDate).getTime();
        const shouldUpdateCurrent = newEntryDate >= lastHistoryDate;

        // Update fields
        card.priceHistory = history;
        if (shouldUpdateCurrent) {
            card.currentValue = newPrice;
        }

        await card.save();
        return card.toObject();
    }
};
