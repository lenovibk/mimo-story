# MimoKids - Product Requirement Document (PRD)

Version: 1.0

---

# Project Overview

MimoKids is a **very simple English learning application** for children aged **3-6 years old**.

The application is **NOT** designed like a traditional learning app.

Instead, it should feel like:

> **Netflix Kids + Little Fox + AI Shadowing + Karaoke**

The child should be able to operate the app **without reading**.

Everything should require **at most one tap**.

No login.

No account.

No progress management.

No complicated settings.

No advertisements.

No distractions.

---

# Target Platforms

Single codebase.

- React 19
- TypeScript
- Vite
- Capacitor
- Android
- iOS
- Web

---

# Design Philosophy

The application should feel:

- Magical
- Friendly
- Calm
- Soft
- Colorful
- Safe

Everything should use:

- Large buttons
- Large illustrations
- Large touch areas
- Rounded corners
- Cute animations

Avoid:

- Tiny icons
- Complex menus
- Nested settings
- Text-heavy UI

---

# Navigation

There are only two screens.

```
Splash

↓

Home

↓

Story Player

↓

Back to Home
```

No bottom navigation.

No drawer.

No side menu.

No hamburger menu.

---

# Screen 1 — Splash

Display:

- Logo
- Rainbow
- Clouds
- Animated stars

Duration:

2 seconds

Then automatically enter Home.

---

# Screen 2 — Home

Purpose:

Select a story.

Layout:

Large story cards.

Example:

-------------------------------------------------

                🌈 Mimo Kids

        Continue Watching

┌─────────────────────┐

🐰 Little Fox Story 1

└─────────────────────┘

┌─────────────────────┐

🐻 Little Fox Story 2

└─────────────────────┘

┌─────────────────────┐

🦁 Little Fox Story 3

└─────────────────────┘

-------------------------------------------------

Requirements:

Very large thumbnails.

Very large tap targets.

Simple scrolling.

No filters.

No search.

No categories.

---

# Story Card

Each card contains:

- Cover Image
- Story Title

Optional:

- Small "New" badge

Animation:

Scale up slightly when tapped.

---

# Story Player

The story player occupies the entire screen.

The video fills the screen.

No native video controls.

Disable:

- timeline
- seek bar
- fullscreen button
- playback speed
- picture-in-picture

---

# Floating Buttons

Buttons are displayed vertically on the right.

Large circular buttons.

Approximately 72–80px.

Buttons:

🇬🇧 English Subtitle

🇻🇳 Vietnamese Subtitle

😊 Shadowing Camera

⏸ Pause

🎤 Practice Speaking

---

# Button 1 — English Subtitle

Toggle.

ON

OFF

Shows English subtitle.

---

# Button 2 — Vietnamese Subtitle

Toggle.

ON

OFF

Shows translated subtitle.

---

# Subtitle Display

English

Displayed above.

Vietnamese

Displayed below.

Example:

--------------------------------

Hello everyone.

Xin chào mọi người.

--------------------------------

Font:

Very large.

Rounded.

High contrast.

---

# Karaoke Effect

As the narrator speaks:

Current word changes color.

Example:

Hello everyone.

↓

Hello everyone.

Only the active word is highlighted.

Animation:

Smooth color transition.

---

# Button 3 — Shadowing Camera

When enabled:

Display a small floating camera preview.

Default position:

Bottom-right.

Rounded rectangle.

Can be dragged.

Purpose:

The child can watch themselves speaking.

---

# Button 4 — Pause

Pause video.

Tap again to continue.

---

# Button 5 — Practice Speaking

This is the main feature.

Workflow:

Video plays.

↓

Subtitle reaches the current sentence.

↓

Video pauses.

↓

Countdown.

3

2

1

↓

Microphone starts.

↓

Child speaks.

↓

Speech recognition.

↓

Pronunciation scoring.

↓

Positive animation.

↓

Video continues automatically.

---

# Speech Recognition

Use:

Web:

Web Speech API (fallback)

Mobile:

Native Speech Recognition via Capacitor plugin

Future:

Azure Speech

Google Speech

OpenAI Speech

Should support replacing the recognition provider.

Create an abstraction layer.

Example:

SpeechProvider

start()

stop()

score()

---

# Pronunciation Scoring

Never display:

Accuracy %

Confidence %

Phoneme details

Instead display:

★★★★★

or

⭐⭐⭐⭐

Then show:

Excellent!

Amazing!

Great Job!

Awesome!

Let's Go!

Use celebration animations.

---

# If pronunciation is poor

Never show:

Wrong

Incorrect

Failed

Instead:

Let's try again!

Then allow retry.

---

# Rewards

Every successful sentence:

Confetti

Stars

Sparkles

Cute sound

Example:

⭐⭐⭐⭐⭐

+10 Stars

---

# Subtitle Source

Each story contains:

video.mp4

audio.mp3

subtitle_en.srt

subtitle_vi.srt

Parse SRT into:

```ts
interface SubtitleItem {
    start:number;
    end:number;
    text:string;
}
```

Each subtitle sentence becomes one practice segment.

---

# Video Folder Structure

```
stories/

    story001/

        cover.jpg

        video.mp4

        subtitle_en.srt

        subtitle_vi.srt

    story002/

    story003/
```

No backend required.

Everything is local.

---

# Home Data Structure

```
interface Story {

    id:string;

    title:string;

    cover:string;

    video:string;

    subtitleEn:string;

    subtitleVi:string;

}
```

---

# Tech Stack

React

TypeScript

Vite

Capacitor

React Router

Framer Motion

Lottie

React Player (Web)

Capacitor Filesystem

Capacitor Camera

Capacitor Speech Recognition

---

# State Management

Zustand

No Redux.

---

# Styling

TailwindCSS

Rounded UI.

Soft shadows.

Pastel colors.

---

# Theme

Background

#F7FBFF

Primary

#5CC8FF

Yellow

#FFD54A

Pink

#FF92C2

Green

#8EE28E

White

#FFFFFF

---

# Fonts

Fredoka

Baloo 2

Nunito

Never use Roboto.

---

# Animations

Clouds drifting

Floating balloons

Sparkles

Button bounce

Story card scale

Confetti

Rainbow transitions

Everything should feel alive.

---

# Sounds

Soft button click.

Reward sound.

Star collection sound.

No harsh sounds.

---

# Accessibility

Buttons

Minimum 72px

High contrast

Simple language

Minimal reading

Visual first

---

# Folder Structure

```
src/

components/

Button/

Subtitle/

StoryCard/

FloatingButtons/

RewardPopup/

CameraPreview/

Speech/

pages/

Splash/

Home/

Player/

hooks/

services/

Speech/

Subtitle/

Video/

utils/

assets/

stories/

animations/

images/

sounds/

```

---

# Future Features

Favorites

Offline downloads

Daily recommended story

AI conversation mode

Vocabulary games

Mini quizzes

Parent dashboard

Cloud sync

Achievements

Sticker collection

Voice cloning

Character AI

---

# MVP Scope

Must include:

✅ Splash screen

✅ Story list

✅ Fullscreen video

✅ English subtitle

✅ Vietnamese subtitle

✅ Karaoke highlighting

✅ Shadowing camera

✅ Pause button

✅ Speaking practice

✅ Speech recognition

✅ Pronunciation scoring

✅ Celebration animations

✅ Responsive for Web, Android, and iPad

---

# UI Guidelines

Claude should generate UI similar to:

- Disney+
- Netflix Kids
- Khan Academy Kids
- Duolingo ABC
- Pok Pok
- Lingokids

Avoid:

- Material Design look
- Business dashboard style
- Desktop software appearance
- Complex menus
- Tiny controls

The final experience should feel like a premium children's entertainment app rather than an educational application.