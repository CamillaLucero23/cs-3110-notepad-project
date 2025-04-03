const notePad = new Quill('#noteInput', {
    theme: 'snow' //donot change this! this has toolbar!
  });

const params = new URLSearchParams(document.location.search)
const noteIndex = params.get('noteIndex').toString()  
  
const populateNote = () => {
	const authHeader = sessionStorage.getItem("authHeader")
	console.log("Auth header from sessionStorage: ", authHeader)

	fetch(`/api?noteIndex=${noteIndex}`,{
		method: 'GET',
		headers: {
		"Authorization": authHeader,
		"Content-Type": "application/json"
		}
	})
	.then(body => body.json())
	.then(note => { 
		console.log(note)
		notePad.root.innerHTML = note.note //tell our editor to get all text from 0 to our length
		document.getElementById('noteTitle').value = note.title
	})	

	
}

populateNote();

//Initiate Put
document.getElementById("saveNoteButton").addEventListener(
  'click',
  () => {
	const noteLength = notePad.getLength(); //get our note length
	const note = notePad.getSemanticHTML(0, noteLength); //tell our editor to get all text from 0 to our length
	const title = document.getElementById('noteTitle').value;

	editNote(noteIndex, title, note);
  }
)

document.getElementById("goToNotes").onclick = function () {
        location.href = "/notes.html";
    };


//PUT
const editNote = (noteIndex, newTitle, newNote) => {
	const authHeader = sessionStorage.getItem("authHeader");
	console.log("Auth header from sessionStorage:", authHeader);
	
    fetch(`/api?noteIndex=${noteIndex}`, {
        method: 'PUT',
		headers: {
		"Authorization": authHeader,
		"Content-Type": "application/json"
		},
		body: JSON.stringify({ noteIndex, newTitle, newNote }),
    })
	.catch(error => console.error('Error edititng note:', error))

}