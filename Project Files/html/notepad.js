const notePad = new Quill('#noteInput', {
    theme: 'snow' //donot change this! this has toolbar!
  });


//POST
document.getElementById("saveNoteButton").addEventListener(
  'click',
  () => {
	const noteLength = notePad.getLength() //get our note length
	const note = notePad.getSemanticHTML(0, noteLength) //tell our editor to get all text from 0 to our length
	const title = document.getElementById('noteTitle').value
	
	const authHeader = sessionStorage.getItem("authHeader")
	console.log("Auth header from sessionStorage: ", authHeader)
	
	fetch('/api', {
		method: 'POST',
		headers: {
            "Content-Type": "application/json",
            "Authorization": authHeader
          },
		body: JSON.stringify({ title, note })
		
    })
  }
)

document.getElementById("goToNotes").onclick = function () {
        location.href = "/notes.html";
    };




