const toolbarOptions = [
  ['bold', 'italic', 'underline', 'strike'],        // toggled buttons
  ['blockquote', 'code-block'],
  ['link', 'image', 'video', 'formula'],

  [{ 'list': 'ordered'}, { 'list': 'bullet' }, { 'list': 'check' }],
  [{ 'script': 'sub'}, { 'script': 'super' }],      // superscript/subscript
  [{ 'indent': '-1'}, { 'indent': '+1' }],          // outdent/indent
  [{ 'direction': 'rtl' }],                         // text direction

  [{ 'header': [1, 2, 3, 4, 5, 6, false] }],

  [{ 'color': [] }, { 'background': [] }],          // dropdown with defaults from theme
  [{ 'font': [] }],
  [{ 'align': [] }],

  ['clean']                                         // remove formatting button
];

const notePad = new Quill('#noteInput', {
	modules: {
		toolbar: toolbarOptions
  },
    theme: 'snow' //donot change this! this has toolbar!
  });


//POST
document.getElementById("saveNoteButton").addEventListener(
  'click',
  () => {
	const noteLength = notePad.getLength() //get our note length
	const note = notePad.root.innerHTML //tell our editor to get all text from 0 to our length
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




