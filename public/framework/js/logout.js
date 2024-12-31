function logout() {
  if (confirm("Do you really want to logout")) {
    fetch("/admin/logout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      }
    })
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.text();
      })
      .then(data => {
        if (data === "success") {
          window.location.href = "/login";
        } else {
          alert("Logout failed. Please try again.");
        }
      })
      .catch(error => {
        console.error("Error during logout:", error);
        alert("An error occurred while logging out. Please try again.");
      });
  }
}
