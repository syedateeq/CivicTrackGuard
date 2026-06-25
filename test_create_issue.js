async function run() {
  try {
    // 1. Register a user
    const user = { name: "Test User", email: "test" + Date.now() + "@test.com", password: "password", role: "USER" };
    let res = await fetch('http://localhost:8080/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user)
    });
    
    // 2. Login
    res = await fetch('http://localhost:8080/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: user.email, password: "password" })
    });
    const authData = await res.json();
    const token = authData.token;
    console.log("Token acquired.");

    // 3. Create Issue
    const issuePayload = {
      title: "Pothole with Image",
      description: "Testing image url save",
      category: "ROAD_DAMAGE",
      imageUrl: "https://example.com/test-image.png"
    };
    res = await fetch('http://localhost:8080/api/issues', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      body: JSON.stringify(issuePayload)
    });
    const createdIssue = await res.json();
    console.log("Created Issue imageUrl:", createdIssue.imageUrl);

    // 4. Fetch the issue
    res = await fetch('http://localhost:8080/api/issues/' + createdIssue.id);
    const fetchedIssue = await res.json();
    console.log("Fetched Issue imageUrl:", fetchedIssue.imageUrl);

  } catch (err) {
    console.error(err);
  }
}
run();
