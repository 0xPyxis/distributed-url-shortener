const express = require('express');
const router = express.Router();
const urlService = require('../services/urlService');

router.post('/shorten', async (req, res, next)=>{
    try {
        const { url} =req.body;

        const shortCode = await urlService.createShortUrl(url);

        
    } catch(err) {

    }
})