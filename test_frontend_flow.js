async function run() {
  try {
    const fs = require('fs');
    // 1. Register a user
    const user = { name: "Test User", email: "fronttest" + Date.now() + "@test.com", password: "password", role: "USER" };
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

    // 3. Image Upload
    fs.writeFileSync('dummy.jpg', 'fake image content');
    const FormDataNode = require('form-data');
    const fd = new FormDataNode();
    fd.append('file', fs.createReadStream('dummy.jpg'));
    
    res = await fetch('http://localhost:8080/api/issues/upload-image', {
      method: 'POST',
      headers: { 
        'Authorization': 'Bearer ' + token
      },
      body: fd
    });
    if (!res.ok) {
        console.error("Upload failed", await res.text());
        return;
    }
    const data = await res.json();
    const url = data?.imageUrl || data;
    console.log("Uploaded URL:", url);

    // 4. Create Issue
    const payload = {
      title: "Test Image",
      description: "Test Image",
      category: "ROAD_DAMAGE",
      imageUrl: url || undefined,
    };
    
    res = await fetch('http://localhost:8080/api/issues', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      body: JSON.stringify(payload)
    });
    const issueData = await res.json();
    console.log("Created Issue ID:", issueData.id, "imageUrl:", issueData.imageUrl);

    // 5. Fetch the issue
    res = await fetch('http://localhost:8080/api/issues/' + issueData.id);
    const fetchedIssue = await res.json();
    console.log("Fetched Issue imageUrl:", fetchedIssue.imageUrl);

  } catch (err) {
    console.error(err);
  }
}
run();
