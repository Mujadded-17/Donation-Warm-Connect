USE donation_app_cse3100;

CREATE TABLE IF NOT EXISTS chat_message (
  chat_id INT AUTO_INCREMENT PRIMARY KEY,
  sender_id INT NOT NULL,
  receiver_id INT NOT NULL,
  message TEXT NOT NULL,
  create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_chat_message_sender (sender_id),
  INDEX idx_chat_message_receiver (receiver_id),
  INDEX idx_chat_message_time (create_time),
  CONSTRAINT fk_chat_message_sender
    FOREIGN KEY (sender_id) REFERENCES user(user_id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_chat_message_receiver
    FOREIGN KEY (receiver_id) REFERENCES user(user_id)
    ON DELETE CASCADE ON UPDATE CASCADE
);
