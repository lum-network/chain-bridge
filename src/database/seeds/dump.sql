/* Generate proposals_deposits table */
CREATE TABLE IF NOT EXISTS proposals_deposits(
id VARCHAR,
proposal_id int,
depositor_address VARCHAR,
amount JSON
);
/* First delete if any rows exists */
/* This allows to re-run the e2e tests anytime without clearing the DB */
DELETE FROM proposals_deposits;

/* Insert seed data into proposals_deposits table */
INSERT INTO proposals_deposits(id, proposal_id, depositor_address, amount)
VALUES
(
'21:lumvaloper1ss7vkqzfal7h4m8ug8lh8peqqyt7vq3sjr9zvg', 21, 'lumvaloper1ss7vkqzfal7h4m8ug8lh8peqqyt7vq3sjr9zvg', '{"denom": "0000636363636366", "amount": "0000136363636311"}'
);

/* Generate proposals_votes table */
CREATE TABLE IF NOT EXISTS proposals_votes(
id VARCHAR,
proposal_id int,
voter_address VARCHAR,
voter_operator_address VARCHAR,
vote_option int,
vote_weight VARCHAR
);

/* First delete if any row exists */
/* This allows to re-run the e2e tests anytime without clearing the DB */
DELETE FROM proposals_votes;

/* Insert seed data into proposals_votes table */
INSERT INTO proposals_votes(id, proposal_id, voter_address, voter_operator_address, vote_option, vote_weight)
VALUES
(
'21:lum14a3kmsuu75njmfe3xj9wt5sld5gw88vdfrn9kv', 21, 'lum14a3kmsuu75njmfe3xj9wt5sld5gw88vdfrn9kv', 'lumvaloper14a3kmsuu75njmfe3xj9wt5sld5gw88vdk56kdg', 1, '1000000000000000000'
),(
'21:lum1aqzs28dufw3p9jrvtwtpke4c4lutnxfsclw08z', 21, 'lum1aqzs28dufw3p9jrvtwtpke4c4lutnxfsclw08z', 'lumvaloper1aqzs28dufw3p9jrvtwtpke4c4lutnxfs8g8uux', 3, '1000000000000000000'
),(
'21:lum1e9hr3fnf749sv40yge30dcz2jxrrwh9lw8yhrc', 21, 'lum1e9hr3fnf749sv40yge30dcz2jxrrwh9lw8yhrc', 'lumvaloper1e9hr3fnf749sv40yge30dcz2jxrrwh9l3sdycu', 4, '1000000000000000000'
),(
'21:lum1mjxsv6j9e2srh36ncsuj5yhlxa0vu97a6rjl47', 21, 'lum1mjxsv6j9e2srh36ncsuj5yhlxa0vu97a6rjl47', 'lumvaloper1mjxsv6j9e2srh36ncsuj5yhlxa0vu97a95mvw6', 0, '1000000000000000000'
),(
'21:lum1ny8y5e9js03xnz9wv4s3n4u05yz8x50fuvm87c', 21, 'lum1ny8y5e9js03xnz9wv4s3n4u05yz8x50fuvm87c', 'lumvaloper1ny8y5e9js03xnz9wv4s3n4u05yz8x50frmj59u', 1, '1000000000000000000'
),(
'21:lum1p02gahyrqn68weajhy7gaxyx4gzlvfn6gy2nvr', 21, 'lum1p02gahyrqn68weajhy7gaxyx4gzlvfn6gy2nvr', 'lumvaloper1p02gahyrqn68weajhy7gaxyx4gzlvfn6hnrqh8', 2, '1000000000000000000'
),(
'21:lum1sfc34ujkys84eeqmegm7lle955y3edyt47rpc5', 21, 'lum1sfc34ujkys84eeqmegm7lle955y3edyt47rpc5', 'lumvaloper1sfc34ujkys84eeqmegm7lle955y3edyt2f2jrs', 2, '1000000000000000000'
),(
'21:lum1ss7vkqzfal7h4m8ug8lh8peqqyt7vq3sd5v3hv', 21, 'lum1ss7vkqzfal7h4m8ug8lh8peqqyt7vq3sd5v3hv', 'lumvaloper1ss7vkqzfal7h4m8ug8lh8peqqyt7vq3sjr9zvg', 3, '1000000000000000000'
),(
'21:lum1xjvhpmflhue38mc8j75gqj2h0fds9guxaga7p5', 21, 'lum1xjvhpmflhue38mc8j75gqj2h0fds9guxaga7p5', 'lumvaloper1xjvhpmflhue38mc8j75gqj2h0fds9guxzl5d6s', 2, '1000000000000000000'
),(
'21:lum1yhaswwgg5tz7veknxwaj8vc8rfa9s0nahkjq30', 21, 'lum1yhaswwgg5tz7veknxwaj8vc8rfa9s0nahkjq30', 'lumvaloper1yhaswwgg5tz7veknxwaj8vc8rfa9s0nagpmn2t', 3, '1000000000000000000'
);
CREATE TABLE IF NOT EXISTS assets(
id VARCHAR,
value JSON,
extra JSON
);



