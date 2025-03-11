#!/usr/bin/env node

const restify = require('restify')
 
const server = restify.createServer()

server.use(restify.plugins.bodyParser())
server.use(restify.plugins.queryParser())

/*
const fs = require('node:fs')
const {createHmac} = require('node:crypto')

const secret = "abcdefg"

const hash = (str) => createHmac("sha256", secret).update(str).digest('hex')


let users
fs.readFile('passwrd.db', 'utf8', (err, data) => {
	if (err){
		console.log(err)
		return
	}
	users = (JSON.parse(data))
	
})
*/
let notes = []

const authenticate = (auth = "") => {

	const{user, pass} = atob(auth.slice(6)).split(":")
	return !!user  && !!pass && users[user] == hash(pass)
}

server.post('/api', (req, res, next) => {
	try {
		const params = JSON.parse(req.body)
		
        notes.push(params.note)
		res.send(201, params.note)
	} catch {
		res.send(400, '400: Bad Request')
	}
	return next()
})

server.get('/api', (req, res, next) => {
	//THIS NEEDS TO BE FIXED, THIS WILL BREAK WHEN WE START USING UIDS FOR NOTES
	//RIGHT NOW IT IS FINE BECAUSE WE ARENT PULLING NOTES OF A SPECIFIC ID
	//get our requested param...
	const index = req.query.index
	
	//let result hold our notes array
	let result = notes
	
	//check if we have notes... if we dont then no need to proceed
	if (!index){
		res.send(200, result)
	}
	//if our index exists, set result to that instead
	else if (index >= 0  && index < notes.length) {
		result = notes[index]
		res.send(200, result)
	}
	//else, index doesnt exist and we send 404
	else{
		res.send(404, '404: Not Found | No notes matching the search criteria')
	}

	return next()
})

server.put('/api', (req, res, next) => {
	//parse our body
	const params = JSON.parse(req.body)
	
	//get index of old note & our newnote
	const index = params.noteIndex
	const note = params.newNote

	//if we dont have a note, then something is wrong (we dont check index because thats serverside. If that isnt passed, our code sucks)
	if (!note) {
		res.send(400, '400: Bad Request | Note parameters are required')
	} 
	//else, we are successful, put change the data of note at that index, and send success
	else {
		notes[index] = note
		res.send(200, notes[index])
	}
	
	return next()
})

server.del('/api', (req, res, next) => {
	//Parse our body
	const params = JSON.parse(req.body)
	//Grab our note index
    const noteIndex = params.noteIndex
	console.log(noteIndex)

    if (noteIndex < 0 || noteIndex >= notes.length) {
            res.send(404,'404: Not Found | Note does not exist in database');
    }else {
            notes.splice(noteIndex, 1);
            res.send(200, 'Note Deleted');
    }

    return next();
});

/*
const handleRequest = (req, res, next) => {
  if (req.method === 'POST') {
	 
	console.log("Method = 'POST'")
    let body = ''

    req.on('data', (data) => {
      body += data
    })

    req.on('end', () => {
      const params = Object.fromEntries(body.split('&').map(
        (param) => param.split('=')
      ))

      if (!params.notePOST) {
        res.writeHead(400, { 'Content-Type': 'text/plain' })
        res.end('Bad Request: note parameters are required')
      } else {
        notes.push(params)

        res.writeHead(201, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify(params))
      }
    })

  } else if (req.method === 'GET') {
	console.log("Method = 'GET'")

    const url = new URL(req.url, `http://${req.headers.host}`)
    const splitRequest = req.split(" ")
	console.log(splitRequest)
	const search = ""
	console.log("search = " + search)

    let result = notes

    if (search) {
      result = notes.filter(note => note.notePOST.includes(search))
    }

    if (result.length !== 0) {
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify(result))
	  console.log("Found, return 200")
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' })
      res.end('404: Not Found | No notes matching the search criteria or no notes have been entered')
	  console.log("Not Found, return 404")
    }

  } else {
    res.writeHead(405, { 'Content-Type': 'text/plain' })
    res.end('405: Method Not Allowed')
	console.log("Method not allowed, return 405")
  }
}
*/

server.listen(3000, () => {
  console.log('Server listening on port 3000')
})