async function run() {
  try {
    const res = await fetch('http://localhost:8080/api/issues');
    const data = await res.json();
    console.log("All issues:");
    data.forEach(issue => {
       console.log(`ID: ${issue.id}, imageUrl: ${issue.imageUrl}`);
    });
  } catch (err) {
    console.error(err.message);
  }
}
run();
