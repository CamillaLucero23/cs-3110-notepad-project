#!/usr/bin/env node

const restify = require('restify');
const path = require('path');
const fs = require('node:fs');
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

let users = {};
try {
  const data = fs.readFileSync('passwrd.db', 'utf8');
  users = JSON.parse(data);
} catch (err) {
  console.log("Error reading password file: " + err);
  users["admin"] = { hash: hash("admin123"), role: "admin", comments: "Default admin" };
  fs.writeFileSync('passwrd.db', JSON.stringify(users));
}

let notes = [];

const authenticate = (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Basic ")) return false;
  
  const base64Credentials = authHeader.slice(6);
  const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
  const [username, password] = credentials.split(':');
  
  console.log("Attempting login for:", username);
  console.log("Provided password:", password);
  console.log("Hashed provided password:", hash(password));
  
  if (username in users) {
    console.log("Stored hash:", users[username].hash);
  }
  
  if (username in users && users[username].hash === hash(password)) {
    return { username, role: users[username].role };
  }
  return false;
};


server.post('/api', (req, res, next) => {
  // Check for valid authentication. If missing/invalid, simply return a 401.
  const authUser = authenticate(req);
  if (!authUser) {
    res.send(401, 'Unauthorized: Valid credentials are required to add a note');
    return next();
  }

  // Parse the request body if needed.
  if (typeof req.body === 'string') {
    try {
      req.body = JSON.parse(req.body);
    } catch (err) {
      res.send(400, 'Bad Request: Unable to parse JSON');
      return next();
    }
  }

  console.log("Received POST body:", req.body);
  if (!req.body || req.body.note === undefined) {
    res.send(400, 'Bad Request: note is required');
    return next();
  }

  // If all checks pass, save the note.
  notes.push(req.body.note);
  res.send(201, { note: req.body.note });
  return next();
});

  
// GET 
// - Retrieve notes.
server.get('/api', (req, res, next) => {
  const index = req.query.index;
  let result = notes;
  if (index === undefined) {
    res.send(200, result);
  } else if (index >= 0 && index < notes.length) {
    result = notes[index];
    res.send(200, result);
  } else {
    res.send(404, '404: Not Found | No notes matching the search criteria');
  }
  return next();
});

// PUT /api - Edit a note (requires valid Basic Auth).
server.put('/api', (req, res, next) => {
  const authUser = authenticate(req);
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
  const idx = Number(params.noteIndex);
  if (isNaN(idx)) {
    res.send(400, 'Bad Request: noteIndex must be a number');
    return next();
  }
  if (idx < 0 || idx >= notes.length) {
    res.send(404, 'Not Found: Note does not exist');
    return next();
  }
  notes[idx] = params.newNote;
  res.send(200, notes[idx]);
  return next();
});

// DELETE /api - Delete a note (requires valid Basic Auth).
server.del('/api', (req, res, next) => {
  const authUser = authenticate(req);
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
  if (index < 0 || index >= notes.length) {
    res.send(404, '404: Not Found | Note does not exist in database');
  } else {
    notes.splice(index, 1);
    res.send(200, 'Note Deleted');
  }
  return next();
});

// POST /register - Create new credentials (only admin allowed).
server.post('/register', (req, res, next) => {
  const adminUser = authenticate(req);
  if (!adminUser || adminUser.role !== 'admin') {
    res.send(401, 'Unauthorized: Only admin can create new credentials');
    return next();
  }
  const { newUsername, newPassword, role, comments } = req.body;
  if (!newUsername || !newPassword || !role) {
    res.send(400, 'Bad Request: newUsername, newPassword, and role are required');
    return next();
  }
  if (role !== 'admin' && role !== 'author') {
    res.send(400, 'Bad Request: role must be either "admin" or "author"');
    return next();
  }
  if (users[newUsername]) {
    res.send(409, 'Conflict: User already exists');
    return next();
  }
  users[newUsername] = {
    hash: hash(newPassword),
    role: role,
    comments: comments || ''
  };
  fs.writeFile('passwrd.db', JSON.stringify(users), (err) => {
    if (err) {
      res.send(500, 'Internal Server Error: Could not save new user');
      return next();
    }
    res.send(201, `User ${newUsername} created successfully`);
    return next();
  });
});

// GET /login - Log in and return user details.
server.get('/login', (req, res, next) => {
  const authUser = authenticate(req);
  if (authUser) {
    res.send(200, { username: authUser.username, role: authUser.role });
  } else {
    res.send(401, 'Invalid credentials');
  }
  return next();
});

server.get('/users', (req, res, next) => {
  const authUser = authenticate(req);
  if (!authUser || authUser.role !== 'admin') {
    res.send(401, 'Unauthorized');
    return next();
  }
  // Build a list of users excluding the password hash
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

server.del('/users/:username', (req, res, next) => {
  const authUser = authenticate(req);
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
  // Save the updated users list
  fs.writeFile('passwrd.db', JSON.stringify(users), (err) => {
    if (err) {
      res.send(500, 'Internal Server Error: Could not update user list');
      return next();
    }
    res.send(200, 'User deleted successfully');
    return next();
  });
});

// Serve the default login page at the root.
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
