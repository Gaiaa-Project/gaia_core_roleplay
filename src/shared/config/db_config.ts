export const DbConfig = {
  // Max simultaneous connections to the DB
  // Too low = queries waiting, too high = MariaDB overload
  connectionLimit: 10,

  // Max time (ms) to establish a connection with MariaDB — 60s
  // If MariaDB doesn't respond within this delay, throws an error
  connectTimeout: 60000,

  // Max time (ms) to get a free connection from the pool — 30s
  // If all connections are busy and none frees up, throws an error
  acquireTimeout: 30000,

  // Allows sending multiple SQL queries in a single call, separated by ;
  multipleStatements: true,

  // Returns dates as strings ("2026-02-23") instead of JS Date objects
  // Avoids timezone issues and simplifies handling
  dateStrings: true,

  // Returns insertId as JS number instead of BigInt
  insertIdAsNumber: true,

  // Returns DECIMAL as JS number instead of string
  decimalAsNumber: true,

  // Returns BIGINT as JS number instead of BigInt
  bigIntAsNumber: true,
} as const;
