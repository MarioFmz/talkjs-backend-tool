class Participant {
  constructor({ access, notify, isUnread, joinedAt }) {
    this.access = access;
    this.notify = notify;
    this.isUnread = isUnread;
    this.joinedAt = joinedAt;
  }
}

module.exports = Participant; 