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
| Anything else | Copy the red error text and paste it to Claude. |
