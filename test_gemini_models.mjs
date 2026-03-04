import fetch from 'node-fetch';

async function listModels() {
    const apiKey = 'AIzaSyAKWH9EarhO6NxMkDB1B5mGPRDRJhoa82A';
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    const response = await fetch(url);
    const data = await response.json();
    console.log(JSON.stringify(data, null, 2));
}

listModels();
