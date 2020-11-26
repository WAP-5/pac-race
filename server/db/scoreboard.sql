CREATE DATABASE IF NOT EXISTS pacman;
USE pacman;

CREATE TABLE scoreboard (
  id int NOT NULL AUTO_INCREMENT,
  player varchar(10),
  PRIMARY KEY (id)
)ENGINE=InnoDB DEFAULT CHARSET=utf8;

