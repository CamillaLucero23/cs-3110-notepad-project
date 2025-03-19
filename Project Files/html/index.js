const notePad = new Quill('#noteInput', {
    theme: 'snow' //donot change this! this has toolbar!
  });


//POST
document.getElementById("saveNoteButton").addEventListener(
  'click',
  () => {
	const noteLength = notePad.getLength() //get our note length
	const note = notePad.getSemanticHTML(0, noteLength) //tell our editor to get all text from 0 to our length
	console.log(note)
	console.log(noteLength)
	console.log(JSON.stringify({note}))
	const authHeader = sessionStorage.getItem("authHeader")
	fetch('/api', {
		method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': authHeader
    },
		body: JSON.stringify({ note })
		
    })
  }
)

document.getElementById("goToNotes").onclick = function () {
        location.href = "/notes.html";
    };
document.getElementById("loginButton").onclick = function () {
        location.href = "/login.html";
    }
document.getElementById("registerButton").onclick = function () {
        location.href = "/register.html";
    }