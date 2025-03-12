const form = document.getElementById("registerForm");
const firstName_input = document.getElementById("firstName");
const lastName_input = document.getElementById("lastName");
const email_input = document.getElementById("email");
const password_input = document.getElementById("password");
const confirmPassword_input = document.getElementById("confirmPassword");

form.addEventListener("submit", (e) => {
    //e.preventDefault()


    let errors = []

    if(firstName_input){
        errors =  getSignupFormErrors()
    }
    else
    {
        
    }
    
})