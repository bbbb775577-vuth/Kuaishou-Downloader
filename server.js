const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors'); // បន្ថែម cors package
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
const PORT = process.env.PORT || 3000;

// បើកដំណើរការ CORS ឱ្យគ្រប់ Domain ទាំងអស់អាចហៅ API នេះបាន
app.use(cors());
app.use(bodyParser.json());

app.post('/api/download', async (req, res) => {
    let videoUrl = req.body.url;

    if (!videoUrl) {
        return res.json({ success: false, message: 'សូមបញ្ចូល Link ជាមុនសិន។' });
    }

    try {
        // ធ្វើការ Request ទៅកាន់ Link Kuaishou
        const response = await axios.get(videoUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });

        const $ = cheerio.load(response.data);
        let directVideoUrl = $('meta[property="og:video"]').attr('content');

        if (directVideoUrl) {
            return res.json({
                success: true,
                downloadUrl: directVideoUrl
            });
        } else {
            return res.json({ 
                success: false, 
                message: 'រកមិនឃើញវីដេអូទេ សូមពិនិត្យមើល Link ម្តងទៀត។' 
            });
        }

    } catch (error) {
        console.error(error);
        return res.json({ 
            success: false, 
            message: 'មានបញ្ហាក្នុងការទាញយកទិន្នន័យពី Kuaishou។' 
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
