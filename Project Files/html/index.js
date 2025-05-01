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

const notePad = new Quill('#noteInput', {
    theme: 'snow' //donot change this! this has toolbar!
  });


//POST
document.getElementById("saveQuickNoteButton").addEventListener(
  'click',
  () => {
	const noteLength = notePad.getLength() //get our note length
	const note = notePad.root.innerHTML //tell our editor to get all text from 0 to our length
	let title = 'quickNote';
	
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
	.then(() => {location.href = "/quickNotes.html";})
  }
)

document.getElementById("goToQuickNotes").onclick = function () {
        location.href = "/quickNotes.html";
    };