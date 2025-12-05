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
    insert: string;
    parallel?: string;
    purchasePrice: number;
    currency: 'USD' | 'CNY';
    currentValue: number;
    priceHistory: { date: string; value: number; platform?: string; parallel?: string; grade?: string; serialNumber?: string }[];
    imageUrl?: string;
    watchlist?: boolean;
    sold?: boolean;
    soldPrice?: number;
    soldDate?: string;
    soldVia?: 'sale' | 'trade';
    graded?: boolean;
    gradeCompany?: string;
    gradeValue?: string;
    autoGrade?: string;
    certNumber?: string;
    notes?: string;
    serialNumber?: string;
    purchaseDate?: string;
    acquisitionSource?: string;
    acquisitionSourceOther?: string;
    offers?: Array<{
        id: string;
        offerPrice: number;
        platform: string;
        senderName: string;
        date: string;
        notes?: string;
    }>;
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
    insert: { type: String, required: true },
    parallel: String,
    purchasePrice: { type: Number, required: true },
    currency: { type: String, enum: ['USD', 'CNY'], default: 'USD' },
    currentValue: { type: Number, required: true },
    priceHistory: [{
        date: { type: String, required: true },
        value: { type: Number, required: true },
        platform: String,
        parallel: String,
        grade: String,
        serialNumber: String
    }],
    imageUrl: String,
    watchlist: Boolean,
    sold: Boolean,
    soldPrice: Number,
    soldDate: String,
    soldVia: { type: String, enum: ['sale', 'trade'] },
    graded: Boolean,
    gradeCompany: String,
    gradeValue: String,
    autoGrade: String,
    certNumber: String,
    notes: String,
    serialNumber: String,
    purchaseDate: String,
    acquisitionSource: String,
    acquisitionSourceOther: String,
    offers: [{
        id: String,
        offerPrice: Number,
        platform: String,
        senderName: String,
        date: String,
        notes: String
    }]
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

        // Explicitly convert undefined to null for MongoDB
        if (cardWithUser.gradeValue === undefined) {
            (cardWithUser as any).gradeValue = null;
        }
        if (cardWithUser.autoGrade === undefined) {
            (cardWithUser as any).autoGrade = null;
        }

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

    async updatePrice(id: string, userId: string, newPrice: number, dateStr?: string, platform?: string, parallel?: string, grade?: string, serialNumber?: string): Promise<Card | null> {
        await connectToDb();
        console.log('[DB] updatePrice called with:', { id, userId, newPrice, dateStr, platform, parallel, grade, serialNumber });
        const card = await CardModel.findOne({ id, userId });
        if (!card) {
            console.log('[DB] Card not found:', id);
            return null;
        }

        const history = [...card.priceHistory];
        // Always create a new entry with current timestamp to allow multiple entries per day
        const newDate = dateStr ? new Date(dateStr).toISOString() : new Date().toISOString();

        console.log('[DB] Creating new price entry with:', { date: newDate, value: newPrice, platform, parallel, grade, serialNumber });
        const newEntry: any = { date: newDate, value: newPrice };
        if (platform !== undefined && platform !== '') newEntry.platform = platform;
        if (parallel !== undefined && parallel !== '') newEntry.parallel = parallel;
        if (grade !== undefined && grade !== '') newEntry.grade = grade;
        if (serialNumber !== undefined && serialNumber !== '') newEntry.serialNumber = serialNumber;
        history.push(newEntry);

        history.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        const lastHistoryDate = new Date(history[history.length - 1].date).getTime();
        const newEntryDate = new Date(newDate).getTime();

        // Only update currentValue if the parallel matches the card's parallel AND it's the most recent entry
        const parallelMatches = !card.parallel || !parallel || card.parallel === parallel;
        const shouldUpdateCurrent = newEntryDate >= lastHistoryDate && parallelMatches;

        // Update fields
        card.priceHistory = history;
        if (shouldUpdateCurrent) {
            card.currentValue = newPrice;
        }

        await card.save();
        console.log('[DB] Price updated successfully, priceHistory length:', card.priceHistory.length);
        return card.toObject();
    },

    async deletePriceEntry(id: string, userId: string, priceDate: string): Promise<Card | null> {
        await connectToDb();
        console.log('[DB] deletePriceEntry called with:', { id, userId, priceDate });
        const card = await CardModel.findOne({ id, userId });
        if (!card) {
            console.log('[DB] Card not found:', id);
            return null;
        }

        // Filter out the entry with matching date
        const history = card.priceHistory.filter(p => p.date !== priceDate);

        if (history.length === card.priceHistory.length) {
            console.log('[DB] Price entry not found:', priceDate);
            return null;
        }

        card.priceHistory = history;

        // Recalculate currentValue from the most recent matching parallel entry
        if (history.length > 0) {
            // Find the most recent entry that matches the card's parallel
            const matchingEntries = history.filter(p =>
                !card.parallel || !p.parallel || card.parallel === p.parallel
            );
            if (matchingEntries.length > 0) {
                card.currentValue = matchingEntries[matchingEntries.length - 1].value;
            }
        }

        await card.save();
        console.log('[DB] Price entry deleted successfully, remaining entries:', card.priceHistory.length);
        return card.toObject();
    },

    async editPriceEntry(id: string, userId: string, oldDate: string, newPrice: number, newDate?: string, platform?: string, parallel?: string, grade?: string, serialNumber?: string): Promise<Card | null> {
        await connectToDb();
        console.log('[DB] editPriceEntry called with:', { id, userId, oldDate, newPrice, newDate, platform, parallel, grade, serialNumber });
        const card = await CardModel.findOne({ id, userId });
        if (!card) {
            console.log('[DB] Card not found:', id);
            return null;
        }

        // Find the entry to edit
        const entryIndex = card.priceHistory.findIndex(p => p.date === oldDate);
        if (entryIndex === -1) {
            console.log('[DB] Price entry not found:', oldDate);
            return null;
        }

        // Update the entry
        const updatedDate = newDate ? new Date(newDate).toISOString() : oldDate;
        const updatedEntry: any = {
            date: updatedDate,
            value: newPrice
        };
        if (platform !== undefined && platform !== '') updatedEntry.platform = platform;
        if (parallel !== undefined && parallel !== '') updatedEntry.parallel = parallel;
        if (grade !== undefined && grade !== '') updatedEntry.grade = grade;
        if (serialNumber !== undefined && serialNumber !== '') updatedEntry.serialNumber = serialNumber;
        card.priceHistory[entryIndex] = updatedEntry;

        // Re-sort if date changed
        if (newDate && newDate !== oldDate) {
            card.priceHistory.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        }

        // Recalculate currentValue if needed
        const lastEntry = card.priceHistory[card.priceHistory.length - 1];
        const parallelMatches = !card.parallel || !parallel || card.parallel === parallel;
        if (lastEntry.date === updatedDate && parallelMatches) {
            card.currentValue = newPrice;
        }

        await card.save();
        console.log('[DB] Price entry edited successfully');
        return card.toObject();
    }
};
