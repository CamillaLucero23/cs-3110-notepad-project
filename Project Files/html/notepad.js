
//POST
document.getElementById("saveNoteButton").addEventListener(
  'click',
  () => {
	const note = document.getElementById('noteInput').value
	fetch('/api', {
		method: 'POST',
		body: JSON.stringify({ note })
    })
  }
)

document.getElementById("goToNotes").onclick = function () {
        location.href = "/notes.html";
    };




