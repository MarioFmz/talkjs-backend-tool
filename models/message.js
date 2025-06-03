class Message {
  constructor({
    id,
    type,
    origin,
    location,
    text,
    content,
    attachment,
    custom,
    conversationId,
    readBy,
    senderId,
    createdAt,
    editedAt,
    referencedMessageId
  }) {
    this.id = id;
    this.type = type;
    this.origin = origin;
    this.location = location;
    this.text = text;
    this.content = content;
    this.attachment = attachment;
    this.custom = custom;
    this.conversationId = conversationId;
    this.readBy = readBy;
    this.senderId = senderId;
    this.createdAt = createdAt;
    this.editedAt = editedAt;
    this.referencedMessageId = referencedMessageId;
  }
}

module.exports = Message; 