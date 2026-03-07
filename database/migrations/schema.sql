USE donation_app_cse3100;

CREATE TABLE user (
  user_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(191) UNIQUE NOT NULL,
  pass_hash VARCHAR(255) NOT NULL,
  phone VARCHAR(30),
  address VARCHAR(255),
  user_type VARCHAR(30) NOT NULL,
  profile_url VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE category (
  category_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(80) NOT NULL,
  icon VARCHAR(255)
);

CREATE TABLE item (
  item_id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(150) NOT NULL,
  description TEXT,
  images TEXT,
  status VARCHAR(30) DEFAULT 'pending',
  delivery_available TINYINT(1) DEFAULT 0,
  pickup_location VARCHAR(255),
  post_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  donor_id INT NOT NULL,
  category_id INT NOT NULL,
  CONSTRAINT fk_item_donor
    FOREIGN KEY (donor_id) REFERENCES user(user_id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_item_category
    FOREIGN KEY (category_id) REFERENCES category(category_id)
    ON UPDATE CASCADE
);

CREATE TABLE donation (
  donation_id INT AUTO_INCREMENT PRIMARY KEY,
  item_id INT NOT NULL,
  donor_id INT NOT NULL,
  receiver_id INT NOT NULL,
  request_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(30) DEFAULT 'requested',
  CONSTRAINT fk_donation_item
    FOREIGN KEY (item_id) REFERENCES item(item_id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_donation_donor
    FOREIGN KEY (donor_id) REFERENCES user(user_id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_donation_receiver
    FOREIGN KEY (receiver_id) REFERENCES user(user_id)
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE notification (
  notify_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  type VARCHAR(50) NOT NULL,
  message TEXT NOT NULL,
  create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_notification_user
    FOREIGN KEY (user_id) REFERENCES user(user_id)
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE password_resets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  token_hash VARCHAR(64) NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX(user_id),
  INDEX(token_hash),
  CONSTRAINT fk_password_resets_user
    FOREIGN KEY (user_id) REFERENCES user(user_id)
    ON DELETE CASCADE
);