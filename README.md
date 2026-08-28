# Veritas Analyzer

"Veritas: The Stress & Truth Analyzer." is an interactive, gamified "lie detector" app that assesses a user's stress levels and calculates a "Truth Probability" percentage based on behavioral inputs. 

### Logic & Features

- a simulated algorithm that calculates the truth score based on how long the user takes to submit their answer (longer hesitation = higher stress/lower truth score) combined with a controlled random variance.

the browser's Web Audio API shows a real-time audio waveform when the user speaks into their microphone during the test.

- Use local storage (or a mock database) to save past test results so the history tab feels alive and persistent.

**Live app**: https://ver1tas.lovable.app

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
