#!/usr/bin/env node

const restify = require('restify');
const path = require('path');
const fs = require('node:fs');
const sqLite3 = require('sqlite3');
const { createHmac } = require('node:crypto');

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
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Basic ")) return callback(false);
  
  const base64Credentials = authHeader.slice(6);
  const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
  const [username, password] = credentials.split(':');
  
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

// GET /api - Retrieve notes
server.get('/api', (req, res, next) => {
  authenticate(req, (authUser) => {
    if (!authUser) {
      res.send(401, 'Unauthorized: Please log in');
      return next();
    }

    const index = parseInt(req.query.noteIndex);
    if (!isNaN(index)) {
      notesdb.get(`SELECT * FROM notes WHERE id=?;`, [index], (err, note) => {
        if (err) {
          res.send(500, "Internal Server Error");
        } else if (!note || (note.username !== authUser.username && authUser.role !== 'admin')) {
          res.send(404, "Not Found or Unauthorized");
        } else {
          // Add the username as the author
          note.author = note.username;
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
          res.send(500, "Internal Server Error");
        } else {
          // Loop through the notes and add the username as the author for each
          notes.forEach(note => {
            note.author = note.username;  // Add the username as author
          });
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
    
    let checkQuery = notesdb.prepare("SELECT * FROM notes WHERE id=?");
    let noteExists = checkQuery.run(index);
    
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
    if (noteIndex === undefined) {
      res.send(400, 'Bad Request: noteIndex not provided');
      return next();
    }
    const index = Number(noteIndex);
    if (isNaN(index)) {
      res.send(400, 'Bad Request: noteIndex must be a number');
      return next();
    }
    let checkQuery = notesdb.prepare("SELECT * FROM notes WHERE id = ?");
    let noteExists = checkQuery.run(index);
    
    if (!noteExists) {
      res.send(404, '404: Not Found | Note does not exist in database');
      return next();
    } else {
      let deleteQuery = notesdb.prepare("DELETE FROM notes WHERE id = ?");
      deleteQuery.run(index, function(err) {
        if (err) {
          res.send(500, "Internal Server Error");
        } else {
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

  // POST /api/share - Share a note with another user (creating a copy of the note)
server.post('/api/share', (req, res, next) => {
  authenticate(req, (authUser) => {
    if (!authUser) {
      res.send(401, 'Unauthorized: Valid credentials are required to share a note');
      return next();
    }

    const { noteId, username } = req.body;

    // Validate inputs
    if (!noteId || !username) {
      res.send(400, 'Bad Request: noteId and username are required');
      return next();
    }

    // Check if the user exists
    usersdb.get("SELECT * FROM users WHERE username = ?", [username], (err, userRow) => {
      if (err || !userRow) {
        res.send(404, 'User not found');
        return next();
      }

      // Get the note to share
      notesdb.get("SELECT * FROM notes WHERE id = ?", [noteId], (err, noteRow) => {
        if (err || !noteRow) {
          res.send(404, 'Note not found');
          return next();
        }

        // Create a new note with the same content, but for the target user
        const newNoteQuery = `INSERT INTO notes (title, note, username) VALUES (?, ?, ?)`;
        notesdb.run(newNoteQuery, [noteRow.title, noteRow.note, username], function (err) {
          if (err) {
            res.send(500, "Internal Server Error: Could not share the note");
            return next();
          }
          res.send(201, { success: true, message: 'Note shared successfully!' });
          return next();
        });
      });
    });
  });
});

  
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

server.listen(3000, () => {
  console.log('Server listening on port 3000');
});
