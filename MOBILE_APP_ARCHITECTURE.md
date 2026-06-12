# Social Gyms - Mobile App Architecture

This document provides a detailed breakdown of the Social Gyms Mobile App (built with Expo Router and React Native). 

The mobile application acts as a unified platform supporting three distinct products hiding inside a single codebase. It dynamically restructures its routing, dashboards, and training content based on the logged-in user's "persona".

## 🎭 The Three Personas

The app identifies the user via `user.persona` (managed in `src/components/AuthProvider.tsx`):

### 1. B2C Pro Gamification (`b2c_user`)
**Target Audience:** Adults and professionals practicing high-stakes social interactions (negotiations, dates, networking).
* **Home Screen:** `dashboard.tsx` - A highly gamified dashboard tracking streaks, total workouts, and a running "Presence Score" based on eye contact and tone.
* **Skills Tab:** `skills.tsx` - An RPG-style visual branching skills tree tracking conversational mastery.
* **Training Picker:** `ScenarioPicker.tsx` - A sleek, vertical list of adult-oriented modules (e.g., Salary Negotiation, Difficult Conversations).
* **Profile:** Features an editable profile to support future social features.

### 2. Neurodivergent / Autism Mode (`b2b_autism_user`)
**Target Audience:** Autistic children and their carers/parents practicing daily social scenarios.
* **Home Screen:** `autism-home.tsx` - A calm, low-stimulus Carer Portal displaying active NDBI guardrails (e.g., No Eye-Contact tracking) and IEP (Individualized Education Program) goals.
* **Training Picker:** `AutismScenarioPicker.tsx` - A kid-friendly, 2x2 grid of massive icons with a prominent "Start Game!" button. 
* **Topics:** Specific micro-scenarios such as "Joining a Game" (Playground rules) and "Loud Noises" (Sensory coping).

### 3. Enterprise / Educator HR Portal (`b2b_educator`)
**Target Audience:** Corporate HR, school administrators, and special education teachers.
* **Home Screen:** `enterprise.tsx` - An institutional dashboard that toggles between Corporate aggregate metrics (e.g., workforce conflict resolution scores) and granular Special Education student tracking.
* **Training Picker:** `EnterpriseScenarioPicker.tsx` - A premium, horizontal side-scrolling carousel of corporate modules.
* **Topics:** High-impact institutional scenarios like "De-escalating Angry Clients" and "Navigating IEP Disagreements".

---

## 🧭 Intelligent Routing (Expo Router)

We use an "invisible router" pattern to handle default screens. 

Because Expo Router defaults to `index.tsx` for the root of the `(tabs)` directory, our `src/app/(tabs)/index.tsx` contains NO visual UI. Instead, it acts as a "traffic cop", immediately redirecting the user based on their persona:
* `b2c_user` ➡️ `/(tabs)/dashboard`
* `b2b_autism_user` ➡️ `/(tabs)/autism-home`
* `b2b_educator` ➡️ `/(tabs)/enterprise`

### The Tab Bar (`_layout.tsx`)
The `_layout.tsx` file controls which tabs are visible on the bottom bar. 
Tabs are re-ordered and dynamically hidden using the `href: null` property so that:
1. The user's specific Home screen (`dashboard`, `autism-home`, or `enterprise`) always appears as the far-left tab.
2. The `Train` screen appears globally as the second tab.
3. The `Skills` screen is dynamically exposed only for the `b2c_user`.
4. The `History` screen is fully hidden from the tab bar (`href: null`) and accessed only via a button inside the B2C Dashboard.

---

## 🗃️ Core Components & Data Structures

* **Auth Context:** `src/components/AuthProvider.tsx` mocks the authentication state and holds the active persona. Switching personas triggers a re-render of the layout and redirects.
* **Topics Database:** `src/lib/topics.ts` holds all available conversational scenarios, mapping them explicitly to their respective `persona` so the Pickers can filter them accordingly.
* **Trinity Coach:** The `src/components/social-gyms/TrinityCoachSession.tsx` is the universal core module that manages the actual voice/video AI interaction, agnostic of the persona.
