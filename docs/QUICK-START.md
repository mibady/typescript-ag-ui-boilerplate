# 🚀 Quick Start - Fix Clerk Error

## Error: "Publishable key not valid"

This error means Clerk authentication is not configured. Here's how to fix it:

---

## Quick Fix (2 Minutes)

### Step 1: Create `.env.local` file

```bash
# Copy the example file
cp .env.example .env.local
```

### Step 2: Get Clerk Keys (Free)

1. Go to **https://clerk.com** and sign up (free)
2. Create a new application
3. Go to **API Keys** in the dashboard
4. Copy your keys

### Step 3: Add Keys to `.env.local`

Open `.env.local` and replace these lines:

```env
# Replace with your actual Clerk keys
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
CLERK_SECRET_KEY=sk_test_xxxxx
```

### Step 4: Restart Dev Server

```bash
# Stop the server (Ctrl+C)
npm run dev
```

**✅ Done!** The error should be gone.

---

## Full Setup

For complete setup with all services, see `SETUP.md`.

**Required services:**
- ✅ Clerk (authentication) - **REQUIRED**
- ✅ Supabase (database) - **REQUIRED**
- ✅ Upstash (Redis, Vector, Search, QStash) - **REQUIRED**
- ✅ OpenAI (embeddings) - **REQUIRED**

---

## Troubleshooting

### Error: "Publishable key not valid"
- Check `.env.local` exists
- Verify keys are correct (no extra spaces)
- Restart dev server

### Need Help?
- **Full Setup:** `SETUP.md`
- **Architecture:** `ARCHITECTURE.md`

**Happy building!** 🚀
