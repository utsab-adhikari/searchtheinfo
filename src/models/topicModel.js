import mongoose from 'mongoose';

const topicSchema = new mongoose.Schema({
    topic: {
        type: String,
        required: true,
    },
    description: {
        type: String,
    },
    isResearched: {type: Boolean, default: false},
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
    }
}, {timestamps: true});

const Topic = mongoose.models.Topic || mongoose.model("Topic", topicSchema, "topics");

export default Topic;