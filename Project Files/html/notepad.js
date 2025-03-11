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
	
	fetch('/api', {
		method: 'POST',
		body: JSON.stringify({ note })
		
    })
  }
)

document.getElementById("goToNotes").onclick = function () {
        location.href = "/notes.html";
    };




