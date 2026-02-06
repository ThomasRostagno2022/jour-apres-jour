# Voice Drill

A 5-minute voice practice app to improve your communication skills. Built for non-native English speakers who want to sound like crisp American executives.

## What It Does

1. Shows you a random interview question
2. Records your spoken answer (60-90 seconds)
3. Transcribes and analyzes your response
4. Gives you instant feedback on:
   - Word count vs. target
   - Filler words (uh, um, like, you know, basically...)
   - Speaking pace (words per minute)
   - Longest sentence (flags rambling)
5. Optional: AI rewrites your answer in crisp executive style (via Grok API)

## Setup Instructions

### Step 1: Get a Grok API Key (Free)

1. Go to [x.ai/api](https://x.ai/api)
2. Sign up for a free account
3. You get $25 free credits (more than enough for months of use)
4. Copy your API key

### Step 2: Deploy to GitHub Pages (Free Hosting)

1. Create a new repository on GitHub:
   - Go to github.com → "New repository"
   - Name it `voice-drill`
   - Make it **public**
   - Click "Create repository"

2. Upload the files:
   - Click "uploading an existing file"
   - Drag all files from this folder:
     - `index.html`
     - `style.css`
     - `app.js`
     - `questions.js`
     - `manifest.json`
   - Click "Commit changes"

3. Enable GitHub Pages:
   - Go to repository Settings → Pages
   - Source: select "main" branch
   - Folder: select "/ (root)"
   - Click Save
   - Wait 2-3 minutes

4. Your app is now live at:
   ```
   https://YOUR-USERNAME.github.io/voice-drill
   ```

### Step 3: Add to iPhone Home Screen

1. Open the URL in Safari on your iPhone
2. Tap the Share button (square with arrow)
3. Scroll down and tap "Add to Home Screen"
4. Tap "Add"

Now it works like a native app!

### Step 4: Configure API Key

1. Open the app
2. Tap the ⚙️ settings icon
3. Paste your Grok API key
4. Tap Save

## How to Use

**Time commitment:** 5 minutes, 3x per week

1. Open the app
2. Tap "New Question"
3. Read the question
4. Tap the mic button and speak your answer
5. Tap again to stop (or wait for timer)
6. Review your scorecard
7. Tap "Get Crisp Version" to see how an American exec would say it
8. Compare and learn the pattern

## Scoring Guide

| Metric | Good | Warning | Bad |
|--------|------|---------|-----|
| Word Count | At or under target | 10-30% over | 30%+ over |
| Fillers | 0-2 | 3-5 | 6+ |
| Pace | 140-170 wpm | 120-140 or 170-180 wpm | Under 120 or over 180 |
| Longest Sentence | Under 25 words | 25-35 words | 35+ words |

## Tips for Improvement

1. **Lead with the headline** - Say your main point in the first sentence
2. **Cut setup** - Don't explain why you're about to say something, just say it
3. **Pause instead of filling** - When you need to think, pause silently instead of saying "um"
4. **Short sentences** - If a sentence has "and" or "but" in the middle, make it two sentences
5. **Practice the rewrite** - After seeing the crisp version, say it out loud 3 times

## Customizing Questions

Edit `questions.js` to add your own questions:

```javascript
{
    category: "Your Category",
    question: "Your question here?",
    targetWords: 120,
    targetTime: 90
}
```

## Troubleshooting

**Microphone not working:**
- Make sure you're using Safari on iOS or Chrome on desktop
- Check that microphone permissions are enabled
- Reload the page and try again

**API key not working:**
- Make sure you copied the full key
- Check that you have credits remaining at x.ai
- Try generating a new key

**Transcription is inaccurate:**
- Speak clearly and at a moderate pace
- Reduce background noise
- Web Speech API works best with clear enunciation

## Privacy

- Your voice is processed locally by your browser's speech recognition
- Transcripts are only sent to Grok when you click "Get Crisp Version"
- API key is stored locally in your browser
- Session history is stored locally on your device
