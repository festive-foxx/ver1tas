# Veritas Analyzer

Create a full-stack web application called "Veritas: The Stress & Truth Analyzer." It is an interactive, gamified "lie detector" app that assesses a user's stress levels and calculates a playful "Truth Probability" percentage based on behavioral inputs. 

### 1. UI/UX Style & Theme

- **Aesthetic:** Sleek, futuristic, and high-tech "cyber-agency" vibe. Use a dark mode background (deep slates/blacks) with electric neon accents (cyberpunk green for truth, warning red for stress/lies, and electric blue for scanning states).

- **Animations:** Use smooth pulse effects, glowing borders, and loading spinners that mimic real-time biometric scanning. 

### 2. Core App Structure & Screens

- **Dashboard/Home Screen:** - A prominent "Start New Analysis" button.

  - A brief, stylish onboarding card explaining how the "scan" works (analyzing voice tone, response latency, and micro-hesitations).

  - A history log showing past "Interrogations" with their corresponding truth scores.

- **The Interactive "Interrogation" Screen:**

  - A multi-step form or wizard where a user types or speaks an answer to a question.

  - Include a large, animated "Biometric Scanner" graphic in the center (a pulsing fingerprint or a facial scanning frame using the user's webcam if permitted, or a simulated radar grid).

  - A live "Stress Pulse" line chart (using Recharts) that spikes randomly or fluctuates while the user is answering to create tension.

- **The Results Screen:**

  - A gorgeous circular gauge component showing the final "Truth Probability Score" (e.g., 85% Truthful vs 15% Deceptive).

  - A breakdown panel showing mock metrics: "Voice Tremor Index," "Response Latency (ms)," and "Stress Fluctuations."

  - A dynamic text summary that changes based on the score (e.g., "Verdict: Highly Credible. Your heart rate remained stable," or "Verdict: Deceptive. Significant hesitation detected!").

  - A button to "Share Results" or "Test Someone Else."

### 3. Logic & Features

- Implement a simulated algorithm that calculates the truth score based on how long the user takes to submit their answer (longer hesitation = higher stress/lower truth score) combined with a controlled random variance.

- If possible, integrate the browser's Web Audio API to show a real-time audio waveform when the user speaks into their microphone during the test.

- Use local storage (or a mock database) to save past test results so the history tab feels alive and persistent.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://ver1tas.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/ad9b2497-0376-45fd-ac89-96d50a63cc17).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
