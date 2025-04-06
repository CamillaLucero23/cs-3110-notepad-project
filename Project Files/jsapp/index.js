#!/usr/bin/env node

const restify = require('restify');
const path = require('path');
const fs = require('node:fs');
const sqLite3 = require('sqlite3');
const { createHmac } = require('node:crypto');
console.log('path module loaded:', path);

// Create the server instance.
const server = restify.createServer();

// Middleware: parse JSON bodies and query parameters.
server.use(restify.plugins.bodyParser());
server.use(restify.plugins.queryParser());

// CORS pre-handler.
server.pre((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Authorization, Content-Type");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  next();
});

server.opts('*', (req, res, next) => {
  res.send(200);
  return next();
});

const secret = "abcdefg"; // Secret key for hashing passwords.
const hash = (str) => createHmac("sha256", secret).update(str).digest('hex');

// Update the users table to include role and comments.
let users = {};
const usersdb = new sqLite3.Database('users.sqlite3');

usersdb.run(`CREATE TABLE IF NOT EXISTS users(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username VARCHAR(256),
  password VARCHAR(256),
  email VARCHAR(255),
  first VARCHAR(255),
  last VARCHAR(255),
  role VARCHAR(64),
  comments TEXT,
  created TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)`);

// Load users from JSON file (for backward compatibility)
try {
  const data = fs.readFileSync('passwrd.db', 'utf8');
  users = JSON.parse(data);
} catch (err) {
  console.log("Error reading password file: " + err);
  users["admin"] = { hash: hash("admin123"), role: "admin", comments: "Default admin" };
  fs.writeFileSync('passwrd.db', JSON.stringify(users));
}

const notesdb = new sqLite3.Database('notes.sqlite3');

notesdb.run(`CREATE TABLE IF NOT EXISTS notes(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title VARCHAR(128),
  note VARCHAR(1048),
  username VARCHAR(256), -- Who created the note
  created TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)`);

// Asynchronous authenticate function using the users database.
const authenticate = (req, callback) => {
  console.log(req.headers);
  const authHeader = req.headers.authorization;
  console.log(authHeader);
  if (!authHeader || !authHeader.startsWith("Basic ")) return callback(false);
  
  const base64Credentials = authHeader.slice(6);
  const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
  const [username, password] = credentials.split(':');
  
  console.log("Attempting login for:", username);
  console.log("Provided password:", password);
  console.log("Hashed provided password:", hash(password));
  
  // Query the database for the user.
  usersdb.get("SELECT * FROM users WHERE username = ?", [username], (err, userRow) => {
    if (err || !userRow) {
      return callback(false);
    }
    // Compare the hash of the provided password with the stored one.
    if (userRow.password === hash(password)) {
      callback({ username: userRow.username, role: userRow.role });
    } else {
      callback(false);
    }
  });
};

// POST /api - Create a new note.
server.post('/api', (req, res, next) => {
  authenticate(req, (authUser) => {
    if (!authUser) {
      res.send(401, 'Unauthorized: Valid credentials are required to add a note');
      return next();
    }
    if (typeof req.body === 'string') {
      try {
        req.body = JSON.parse(req.body);
      } catch (err) {
        res.send(400, 'Bad Request: Unable to parse JSON');
        return next();
      }
    }
    console.log("Received POST body:", req.body);
    if (!req.body || (req.body.note === undefined || req.body.title === undefined)) {
      res.send(400, 'Bad Request: note is required');
      return next();
    }
    let q = notesdb.prepare(`INSERT INTO notes (title, note, username) VALUES (?, ?, ?);`);
    q.run(req.body.title, req.body.note, authUser.username);
    res.send(201, { title: req.body.title, note: req.body.note });
    return next();
  });
});

// GET /api - Retrieve notes.
server.get('/api', (req, res, next) => {
  authenticate(req, (authUser) => {
    if (!authUser) {
      res.send(401, 'Unauthorized: Please log in');
      return next();
    }
    console.log("Authenticated user:", authUser);
    const index = parseInt(req.query.noteIndex);
    if (!isNaN(index)) {
      notesdb.get(`SELECT * FROM notes WHERE id=?;`, [index], (err, note) => {
        if (err) {
          console.log("Error grabbing note", err);
          res.send(500, "Internal Server Error");
        } else if (!note || (note.username !== authUser.username && authUser.role !== 'admin')) {
          res.send(404, "Not Found or Unauthorized");
        } else {
          res.send(200, note);
        }
        return next();
      });
    } else {
      let query, params;
      if (authUser.role === 'admin') {
        query = `SELECT * FROM notes;`;
        params = [];
      } else {
        query = `SELECT * FROM notes WHERE username = ?;`;
        params = [authUser.username];
      }
      notesdb.all(query, params, (err, notes) => {
        if (err) {
          console.log("Error grabbing notes", err);
          res.send(500, "Internal Server Error");
        } else {
          console.log("Grabbed Notes - ", notes);
          res.send(200, notes);
        }
        return next();
      });
    }
  });
});

// PUT /api - Edit a note.
server.put('/api', (req, res, next) => {
  authenticate(req, (authUser) => {
    if (!authUser) {
      res.send(401, 'Unauthorized: Invalid credentials');
      return next();
    }
    const params = req.body;
    if (params.noteIndex === undefined) {
      res.send(400, 'Bad Request: noteIndex is required');
      return next();
    }
    if (params.newNote === undefined) {
      res.send(400, 'Bad Request: newNote is required');
      return next();
    }
    const index = Number(params.noteIndex);
    if (isNaN(index)) {
      res.send(400, 'Bad Request: noteIndex must be a number');
      return next();
    }
    
    console.log("PUT request received");
    let checkQuery = notesdb.prepare("SELECT * FROM notes WHERE id=?");
    let noteExists = checkQuery.run(index);
    console.log("Note Exists ", noteExists);
    
    if (!noteExists) {
      res.send(404, '404: Not Found | Note does not exist in database');
      return next();
    } else {
      let putQuery = notesdb.prepare(`UPDATE notes SET title=?, note=? WHERE id=?`);
      let title = '';
      if (params.newTitle === undefined) {
        title = ''; 
      } else {
        title = params.newTitle;
      }
      putQuery.run(title, params.newNote, index, function(err) {
        if (err) {
          res.send(500, "Internal Server Error");
        } else {
          console.log("PUT note", title, params.newNote, index);
          res.send(200, 'Note Changed');
        }
        return next();
      });
    }
  });
});

// DELETE /api - Delete a note.
server.del('/api', (req, res, next) => {
  authenticate(req, (authUser) => {
    if (!authUser) {
      res.send(401, 'Unauthorized: Invalid credentials');
      return next();
    }
    const noteIndex = req.query.noteIndex;
    console.log("Delete request for note index:", noteIndex);
    if (noteIndex === undefined) {
      res.send(400, 'Bad Request: noteIndex not provided');
      return next();
    }
    const index = Number(noteIndex);
    if (isNaN(index)) {
      res.send(400, 'Bad Request: noteIndex must be a number');
      return next();
    }
    console.log("DEL request received");
    let checkQuery = notesdb.prepare("SELECT * FROM notes WHERE id = ?");
    let noteExists = checkQuery.run(index);
    console.log("Note Exists ", noteExists);
    
    if (!noteExists) {
      res.send(404, '404: Not Found | Note does not exist in database');
      return next();
    } else {
      let deleteQuery = notesdb.prepare("DELETE FROM notes WHERE id = ?");
      deleteQuery.run(index, function(err) {
        if (err) {
          res.send(500, "Internal Server Error");
        } else {
          console.log("DEL note", index);
          res.send(200, 'Note Deleted');
        }
        return next();
      });
    }
  });
});

// POST /register - Create new credentials (only admin allowed for admin accounts).
server.post('/register', (req, res, next) => {
  const { newUsername, newPassword, role, comments } = req.body;
  if (!newUsername || !newPassword || !role) {
    res.send(400, 'Bad Request: newUsername, newPassword, and role are required');
    return next();
  }
  if (role !== 'admin' && role !== 'author') {
    res.send(400, 'Bad Request: role must be either "admin" or "author"');
    return next();
  }
  
  // If the requested role is 'admin', verify that the requester is an admin.
  if (role === 'admin') {
    authenticate(req, (authUser) => {
      if (!authUser || authUser.role !== 'admin') {
        res.send(401, 'Unauthorized: Only admin can create admin accounts');
        return next();
      }
      proceedWithRegistration();
    });
  } else {
    // For 'author' accounts, no authentication is required.
    proceedWithRegistration();
  }
  
  function proceedWithRegistration() {
    usersdb.get("SELECT * FROM users WHERE username = ?", [newUsername], (err, row) => {
      if (err) {
        res.send(500, "Internal Server Error");
        return next();
      }
      if (row) {
        res.send(409, "Conflict: User already exists");
        return next();
      }
      const insertStmt = `INSERT INTO users (username, password, role, comments) VALUES (?, ?, ?, ?)`;
      usersdb.run(insertStmt, [newUsername, hash(newPassword), role, comments || ''], function(err) {
        if (err) {
          console.error("Error inserting new user:", err);
          res.send(500, "Internal Server Error: Could not save new user");
        } else {
          res.send(201, `User ${newUsername} created successfully`);
        }
        return next();
      });
    });
  }
});

// GET /login - Log in and return user details.
server.get('/login', (req, res, next) => {
  authenticate(req, (authUser) => {
    if (authUser) {
      res.send(200, { username: authUser.username, role: authUser.role });
    } else {
      res.send(401, 'Invalid credentials');
    }
    return next();
  });
});

// GET /users - List users (admin only).
server.get('/users', (req, res, next) => {
  authenticate(req, (authUser) => {
    if (!authUser || authUser.role !== 'admin') {
      res.send(401, 'Unauthorized');
      return next();
    }
    let usersList = [];
    for (const [username, info] of Object.entries(users)) {
      usersList.push({
        username,
        role: info.role,
        comments: info.comments
      });
    }
    res.send(200, usersList);
    return next();
  });
});

// DELETE /users/:username - Delete a user (admin only).
server.del('/users/:username', (req, res, next) => {
  authenticate(req, (authUser) => {
    if (!authUser || authUser.role !== 'admin') {
      res.send(401, 'Unauthorized');
      return next();
    }
    const targetUser = req.params.username;
    if (!users[targetUser]) {
      res.send(404, 'User not found');
      return next();
    }
    if (authUser.username === targetUser) {
      res.send(403, 'Forbidden: Cannot delete your own account');
      return next();
    }
    delete users[targetUser];
    fs.writeFile('passwrd.db', JSON.stringify(users), (err) => {
      if (err) {
        res.send(500, 'Internal Server Error: Could not update user list');
        return next();
      }
      res.send(200, 'User deleted successfully');
      return next();
    });
  });
});

// Serve static files.
server.get('/', restify.plugins.serveStatic({
  directory: path.join(__dirname, '../html'),
  default: 'login.html'
}));

server.get('/*', restify.plugins.serveStatic({
  directory: path.join(__dirname, '../html')
}));

server.get('/static/*', restify.plugins.serveStatic({
  directory: path.join(__dirname, '../html')
}));

server.listen(3000, () => {
  console.log('Server listening on port 3000');
});
