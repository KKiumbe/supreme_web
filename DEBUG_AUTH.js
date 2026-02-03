// Debug Auth State
// Open browser console and run this to check your auth state

console.log("=== AUTH DEBUG ===");
console.log("Token:", localStorage.getItem("token"));
console.log("CurrentUser:", localStorage.getItem("currentUser"));

try {
  const user = JSON.parse(localStorage.getItem("currentUser"));
  console.log("Parsed User:", user);
} catch (e) {
  console.error("Error parsing user:", e);
}

console.log(
  "isAuthenticated check:",
  !!localStorage.getItem("token") && !!localStorage.getItem("currentUser"),
);

// If you need to manually set auth for testing:
// localStorage.setItem("token", "your-test-token");
// localStorage.setItem("currentUser", JSON.stringify({ id: 1, name: "Test User", email: "test@example.com" }));
// window.location.reload();
