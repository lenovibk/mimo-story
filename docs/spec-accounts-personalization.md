# MimoKids — Spec: Accounts & Personalization (đề xuất)

> **Lưu ý:** Spec này mô tả một hướng phát triển mới (tài khoản phụ huynh,
> đăng nhập, dashboard, admin panel...) **trái với triết lý PRD gốc**
> (`design.md`): *"No login, no account, no progress management"*. Đây là
> tài liệu đề xuất/roadmap, chưa có gì trong mục này được cài đặt trong code
> hiện tại (xem `design.md`).

---

# Authentication & Personalization

## Authentication

- Parent registers using **Email + Verification Code**.
- No password required.
- One account can manage multiple children.
- Child does not need to log in; they simply select their avatar.

---

# First-Time Setup Wizard

After registration, guide parents through a short onboarding.

### Step 1
Choose Child

- Boy
- Girl

### Step 2
Enter Child Name

### Step 3
Select Age

- 3
- 4
- 5
- 6
- 7+

### Step 4
Choose Interests (multi-select)

Examples:

- 🐶 Animals
- 🦖 Dinosaurs
- 🚗 Vehicles
- 🍦 Food
- 👨‍👩‍👧 Family
- 🌦 Weather
- 🎄 Holidays
- 🎵 Songs
- 🌈 Colors
- 🔬 Science

These interests are used to personalize story recommendations.

---

# Home Page

The home screen should be personalized for each child.

Sections:

## Continue Learning

Display unfinished stories.

---

## Recommended For You

Recommend stories based on:

- Age
- Interests
- Learning history
- Favorite categories

---

## Favorite Stories ❤️

Parents and children can tap ❤️ on any story.

Favorite stories appear here.

---

## Recently Watched

Display recently opened stories.

---

## New Stories

Latest published stories.

---

## Seasonal Stories

Examples:

- Christmas
- Halloween
- Summer
- Back to School

Automatically shown when appropriate.

---

# Story Card

Each story displays:

- Cover
- Title
- Duration
- Progress
- ❤️ Favorite
- ▶ Continue / Play

---

# Player

Add a Favorite button.

❤️ Add to Favorites

Progress is automatically saved.

When reopening the app, continue from the last watched position.

---

# Child Profile

Display:

- Avatar
- Name
- Age
- Learning Level
- Stars Earned
- Learning Streak
- Vocabulary Learned
- Favorite Stories

---

# Parent Dashboard

Menu

- Dashboard
- Children
- Story Library
- Learning Statistics
- Subscription
- Settings

Dashboard includes:

- Total learning time
- Stories completed
- Speaking practice count
- Favorite stories
- Weekly activity
- Learning streak

---

# Story Library Management

Admin can:

- Upload Cover
- Upload Video
- Upload English Subtitle (.srt)
- Upload Vietnamese Subtitle (.srt)
- Set Category
- Set Recommended Age
- Set Difficulty Level
- Add Tags

---

# Subscription

Plans:

- Free
- Premium
- Family

Premium unlocks all stories and AI speaking practice.

---

# Admin Panel

Modules:

- Dashboard
- Story Management
- Categories
- Users
- Child Profiles
- Subscriptions
- Analytics
- Push Notifications
- Recommendation Rules
- AI Story Management

---

# Recommendation Logic

Recommend stories using:

- Child age
- Selected interests
- Favorite stories
- Recently watched
- Completion history
- Seasonal events
- New releases

The goal is to make the Home page feel personalized, similar to Netflix Kids, while keeping the UI extremely simple for children.
