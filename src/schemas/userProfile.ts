import mongoose from "mongoose";
import client from "../index.js";

interface userProfileInterface extends mongoose.Document {
    _id: mongoose.Types.ObjectId,
    iv: string,

    user: {
        id: string,
        name: string,
    },

    roblox: {
        name: string,
        id: string,

        verified: boolean,
        verifiedAt: Date,
    },

    settings: Map<string, {
        name: string;
        description: string;

        value: any;
    }>;

    getByrobloxId: (robloxId: string) => Promise<userProfileInterface>,

    createdAt: Date,
    updatedAt: Date,
}

const userProfileSchema = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    iv: String,

    user: {
        id: { type: String, unique: true},
        name: String,
    },

    roblox: {
        name: String,
        id: String,

        verified: Boolean,
        verifiedAt: Date,
    },

    settings: {
        type: Map,
        of: {
            name: String,
            description: String,

            value: mongoose.Schema.Types.Mixed,
        }
    },

    createdAt: { type: Date, immutable : true, default: Date.now() },
    updatedAt: { type: Date, default: Date.now() },
});

userProfileSchema.pre("save", function (next) {
    // @ts-ignore
    this.updatedAt = Date.now();
    next();
});

userProfileSchema.post("save", function (doc: userProfileInterface, next) {
    client.success(`Saved user profile for "${doc.user.name}" [${doc.user.id}]`)
    client.Database.Cache.Users.set(doc.user.id, doc);
    next();
});

userProfileSchema.methods.verifyRoblox = async function (robloxId: string) {}

userProfileSchema.statics.getByrobloxId = async function (robloxId: string) {
    const found = await this.findOne({ "roblox.id": robloxId });

    if (!found) return null;
    return found as userProfileInterface;
}

const userProfile = mongoose.model("userProfile", userProfileSchema);

export default userProfile
export { userProfileSchema, type userProfileInterface };