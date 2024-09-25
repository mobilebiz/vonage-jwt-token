import { Voice, vcr } from "@vonage/vcr-sdk";
import express from 'express';
import cors from 'cors';

const app = express();
const port = process.env.VCR_PORT;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static('public'));

const session = vcr.createSession();
const voice = new Voice(session);

// Define functions to be called when there is an incoming call in the session.
await voice.onCall('onCall');
// Define functions when events occur in the session.
await voice.onCallEvent({ callback: 'onEvent' });

app.get('/_/health', async (req, res) => {
    res.sendStatus(200);
});

app.get('/_/metrics', async (req, res) => {
    res.sendStatus(200);
});

// Generate Token.
app.get('/getToken', async (req, res, next) => {
    console.log(`🐞 getToken called.`);
    try {
        // Generate JWT.
        const jwt = generateJWT();  // For InApp, the parameter should be given a user name.
        res.json({
            token: jwt
        });
    } catch (e) {
        next(e);
    }
});

// Event handler for Incoming call.
app.post('/onCall', async (req, res, next) => {
    console.log(`🐞 onCall called via ${req.body.from || 'not PSTN Number'}`);
    console.dir(req.body);
    try {
        res.json([
            {
                action: 'talk',
                language: 'ja-JP',
                style: 3,
                premium: true,
                loop: 3,
                text: 'こちらは発信専用番号のため、お繋ぎすることができません。'
            }
        ]);            
    } catch (e) {
        next(e);
    }
});

// Event handler when event occurs.
app.post('/onEvent', async (req, res, next) => {
    try {
        console.log('🐞 event status is: ', req.body.status);
        console.log('🐞 event direction is: ', req.body.direction);
        res.sendStatus(200);
    } catch (e) {
        next(e);
    }
});

// Ganerate JWT.
function generateJWT(username) {
    const nowTime = Math.round(new Date().getTime() / 1000);
    const aclPaths = {
        "/*/users/**": {},
        "/*/conversations/**": {},
        "/*/sessions/**": {},
        "/*/devices/**": {},
        "/*/image/**": {},
        "/*/media/**": {},
        "/*/applications/**": {},
        "/*/push/**": {},
        "/*/knocking/**": {},
        "/*/legs/**": {}
    };
    if (username) {
        return vcr.createVonageToken({ exp: nowTime + 86400, subject: username, aclPaths: aclPaths });
    } else {
        return vcr.createVonageToken({ exp: nowTime + 86400 });
    }
}

app.listen(port, () => {
    console.log(`App listening on port ${port}`)
});