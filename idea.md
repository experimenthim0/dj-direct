This project, which we could call "DJ-Direct," is a lean, high-tech bridge between the traditional offline village DJ workflow and the modern smartphone-carrying crowd.

By using your MERN skills, you are creating a system that solves the "crowded booth" problem without forcing the DJ to change how they play music.

## The Core Concept
A temporary, QR-activated digital request menu. Guests use their mobile data to search for songs on YouTube, but instead of streaming them, they send just the Title to the DJ’s dashboard. The DJ then finds that song in their offline pen drive library.

## Key Features
1. Smart "Room" System
Instant Setup: The DJ creates a room in one click. No login required for guests.

QR Entry: A generated QR code is pasted on the speakers for guests to join the "Digital Queue."

Auto-Self Destruct: To keep the database clean and private, the entire room and all its requests automatically delete after 3 hours using MongoDB TTL indexes.

2. "Title-Only" YouTube Search
Global Search: Guests search any song via the YouTube API to ensure correct spellings and versions.

Data Efficient: Only the String (Song Title) is saved to your DB. This makes the app lightning-fast even on weak village 4G/5G networks.

Visual Aid: Guests see thumbnails to confirm they have the right song, but the DJ only sees the text.

3. DJ-Centric Dashboard
Real-Time Sync: Using Socket.io, requests pop up on the DJ's screen instantly without refreshing.

Midnight Neon UI: A high-contrast, dark-mode design that is easy to read in dark, smoky environments.

Workflow Bridge: A "Copy" button next to each request so the DJ can quickly paste the title into their local Windows/Mac file search to find the MP3.

4. "Village-Proof" Reliability
Local Persistence: If the internet dips for a few minutes, the DJ's current list stays visible thanks to browser localStorage.

Request Limits: Prevents "spamming" by limiting the number of requests per device, ensuring everyone gets a turn to dance.

## The One-Line Value Prop
"A 3-hour temporary digital bridge that turns a messy crowd into a clean, real-time request list, keeping the DJ booth clear and the workflow offline."