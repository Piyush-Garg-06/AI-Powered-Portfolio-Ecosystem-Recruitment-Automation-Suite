const axios = require('axios');

async function getProfile(username) {
  try {
    const url = `https://api.github.com/users/${username}`;
    const res = await axios.get(url);
    console.log("Data mil gaya bhai! ->", res.data.name);
  } catch (err) {
    console.log("Error aa gaya:", err.message);
  }
}

getProfile('Piyush-Garg-06'); // Ye React ke creator ka username h testing ke liye