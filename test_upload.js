const fs = require('fs');
const FormData = require('form-data');
const axios = require('axios');

async function run() {
  try {
    fs.writeFileSync('dummy.jpg', 'fake image content');
    const fd = new FormData();
    fd.append('file', fs.createReadStream('dummy.jpg'));

    const res = await axios.post('http://localhost:8080/api/issues/upload-image', fd, {
      headers: fd.getHeaders()
    });
    
    console.log("Upload result:", res.data);

  } catch (err) {
    console.error("Error:", err.response ? err.response.data : err.message);
  }
}
run();
