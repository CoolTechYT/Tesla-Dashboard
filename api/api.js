const express = require('express')
const axios = require('axios')
require('dotenv').config()

const { email, password } = process.env

const app = express()
const port = 7777
const teslaLogin = require('../tsla').teslaLogin
const baseUrl = 'https://owner-api.teslamotors.com'

app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", `*`);
    res.header("Access-Control-Allow-Headers", "Access-Control-Allow-Headers, Origin, Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers, Authorization");
    next();
});

app.get('/vehicles', async (req, res) => {
    const accessToken = req.headers.authorization.replace(/^Bearer /, '');
    if (!accessToken) res.sendStatus(403);
    const response = await axios.get(`${baseUrl}/api/1/vehicles/`, {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        }
    });
    const id = response?.data?.response[0]?.id;
    res.send(JSON.stringify(id));
});

app.get('/vehicle/', async (req, res) => {
    const accessToken = req.headers.authorization.replace(/^Bearer /, '');
    if (!accessToken) res.sendStatus(403);
    const response = await axios.get(`${baseUrl}/api/1/vehicles/`, {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        }
    });
    const id = response?.data?.response[0]?.id;
    res.send(JSON.stringify(id));
});

app.get('/vehicle/:id/state/', async (req, res) => {
    const accessToken = req.headers.authorization.replace(/^Bearer /, ''),
    id = req.params.id,
    url = `${baseUrl}/api/1/vehicles/${id}/vehicle_data`;

    if (!accessToken) res.sendStatus(403);
    const response = await axios.get(url, {
        headers: {
            Authorization: `Bearer ${accessToken}`
        }
    });
    res.send(JSON.stringify(response?.data?.response));
});

app.get('/', async (req, res) => {
    const accessToken = await teslaLogin(email, password);
    return res.send(JSON.stringify(accessToken));
});

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
});