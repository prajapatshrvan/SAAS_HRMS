function logout() {
  if (confirm("Do you really want to logout")) {
    fetch("/logout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      }
    })
      .then(response => response.text())
      .then(data => {
        if (data === "success") {
          window.location.href = "/login";
        }
      })
      .catch(error => {
        console.error("Error during logout:", error);
        alert("An error occurred while logging out. Please try again.");
      });
  }
}
