const Participant = require('./participant');

class Conversation {
  constructor({ id, participants, custom, subject, createdAt, topicId, photoUrl, welcomeMessages, lastMessage }) {
    this.id = id;
    this.participants = {};
    if (participants && typeof participants === 'object') {
      for (const [userId, data] of Object.entries(participants)) {
        this.participants[userId] = new Participant(data);
      }
    }
    this.custom = custom;
    this.subject = subject;
    this.createdAt = createdAt;
    this.topicId = topicId;
    this.photoUrl = photoUrl;
    this.welcomeMessages = welcomeMessages;
    this.lastMessage = lastMessage;
  }
}

module.exports = Conversation; 