# Getting Started — open ThePlatform in GitHub Codespaces

A **Codespace** is a computer that runs in your web browser and already has everything
ThePlatform needs. You don't install anything.

## Step 0 — See the app running (about 5 minutes)

1. Go to **https://github.com/Alek-Approach/ThePlatform**.
2. Near the top-left, click the **branch** dropdown (it says `main`) and choose
   **`claude/architecture-proposal`**. (This is the work-in-progress version. Later it
   will be merged into `main`.)
3. Click the green **`<> Code`** button → **Codespaces** tab →
   **Create codespace on claude/architecture-proposal**.
4. Wait 2–4 minutes while it sets up. You'll see an editor that looks like VS Code.
   Setup finishes on its own when the bottom panel stops printing text.
5. At the bottom of the screen there's a **Terminal** panel (a box where you type
   commands). If you don't see it: top menu ☰ → **Terminal** → **New Terminal**.
6. Click inside the terminal, type the line below, and press **Enter**:

   ```
   npm run dev
   ```

7. After a few seconds a pop-up says *"Your application running on port 3000 is
   available"* → click **Open in Browser**. (If you miss the pop-up: click the **Ports**
   tab next to Terminal, then the 🌐 globe icon beside port 3000.)
8. ✅ You should see **"Your AI business team"** with three agent cards.

To stop the app: click in the terminal and press **Ctrl + C**.

## Getting new updates into your Codespace
Whenever Claude finishes a step, it saves the new version to GitHub. To pull it into
your Codespace:

1. Open your Codespace (github.com/codespaces → click it).
2. In the terminal, stop the app if it's running (**Ctrl + C**), then type each line
   and press **Enter** after each:

   ```
   git checkout -- .
   git pull
   npm install
   npm run dev
   ```

`git checkout -- .` clears small automatic changes in the Codespace that can block an
update (your saved business data is not affected), `git pull` downloads the new version, `npm install` adds any new building blocks, and
`npm run dev` starts the app (it also updates your database automatically).

## Step 1 — Company profile
1. Get the update (see above) and open the app in your browser.
2. Click **Company profile** in the left menu.
3. Try clicking **Save profile** with an empty company name → you should see a red
   message asking for it.
4. Fill in your company details and click **Save profile** → "✓ Profile saved."
5. Refresh the page (or stop and restart the app) → your details are still there.
6. Click **Dashboard** → your company name and a "profile completeness" bar appear.

Your data is stored in a small database file inside your Codespace
(`prisma/dev.db`). It is *not* uploaded to GitHub, so your business details stay private.

## Step 2 — Your AI team
1. Get the update (see above) and open the app.
2. Click **AI team** in the left menu. You'll see your three agents, all switched **Off**.
3. Click the switch on one or two agents → they turn **Active** (purple), and the count at
   the top updates.
4. Refresh the page → your choices are remembered.
5. Click **Dashboard** → the AI team section shows which agents are active.

## Step 3 — Give your agents tasks (mock mode)
1. Get the update (see above) and open the app. Make sure at least one agent is
   switched on in **AI team**.
2. Click **Tasks**. Type a task in your own words, or click one of the suggestion
   buttons, then click **Give task**.
3. You'll see "Working…" for a moment, then the result. The line under the title
   says which agent did it and *why ThePlatform chose it*.
4. Try tasks for different agents, for example:
   - "Who are my competitors?" → Market Research Agent
   - "Write an email newsletter" → Marketing Agent
   - "Should we raise our prices?" → Business Strategy Agent
5. Try **Assign to** to pick an agent yourself.
6. To see how errors are handled, give a task containing the word **[fail]**. It
   shows a friendly "This task didn't finish" message instead of crashing.

Results are *sample answers* (mock mode). They use your profile details but are not
real AI yet. That comes in Step 7, and costs nothing until then.

## Saving money on Codespaces
GitHub gives free monthly hours. A Codespace stops automatically after 30 minutes of
inactivity. You can also stop it at **github.com/codespaces** → `…` → **Stop codespace**.
Your work is kept; just reopen it from the same page next time.

## Troubleshooting
| Problem | Fix |
|---|---|
| `npm: command not found` | Setup isn't finished — wait a minute and try again. |
| `Cannot find module …` | Type `npm install`, press Enter, then `npm run dev` again. |
| Browser shows "502" or blank | Wait 10 seconds and refresh — the app is still starting. |
| "Invalid Server Actions request" when saving | You have an older version — get the latest update (see above). |
| `git pull` says "Your local changes would be overwritten" | Type `git checkout -- .` then `git pull` again. |
| `Cannot read properties of undefined (reading 'findMany')` | Stop the app (Ctrl + C), get the latest update, and run `npm run dev` again. |
| Anything else | Copy the red error text and paste it to Claude. |
