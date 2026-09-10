import mongoose from "mongoose";

const toolCallSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    input: { type: mongoose.Schema.Types.Mixed },
    output: { type: mongoose.Schema.Types.Mixed },
  },
  { _id: false },
);

const messageSchema = new mongoose.Schema({
  chatId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Chat",
    required: true,
    index: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  role: {
    type: String,
    enum: ["user", "assistant", "tool"],
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  // For message branching: parentId points to the message this branches from
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Message",
  },
  branchIndex: {
    type: Number,
    default: 0,
  },
  // Tool call telemetry (for agent transparency)
  toolCalls: [toolCallSchema],
  // Metadata
  model: {
    type: String,
  },
  latencyMs: {
    type: Number,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

messageSchema.index({ chatId: 1, createdAt: 1 });

export default mongoose.model("Message", messageSchema);
