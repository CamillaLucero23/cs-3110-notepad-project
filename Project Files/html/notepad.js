document.addEventListener("DOMContentLoaded", () => {
  // Check if the user is logged in by checking the authHeader in sessionStorage
  const authHeader = sessionStorage.getItem("authHeader");

  // If authHeader doesn't exist, redirect to login page
  if (!authHeader) {
    window.location.href = "page_login.html"; // Redirect to login page if not logged in
  }

  // If logged in, allow access to the page
  console.log("Logged in as: " + sessionStorage.getItem("username"));
  // You can add any other logic here to display user-related content
});


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
	let title = document.getElementById('noteTitle').value
	if (!title || title.length === 0){
		title = 'Note';
	}
	
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
	.then(() => {location.href = "/notes.html";})
  }
)

document.getElementById("goToNotes").onclick = function () {
        location.href = "/notes.html";
    };




