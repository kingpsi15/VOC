
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Download ollama from the following website
https://ollama.com/download

# Step 5: Install Ollama with the standard settings

# Step 6: Run mistral:7b-instruct in command prompt or git bash
ollama run mistral:7b-instruct

# Step 7: In the command prompt, run the backend code. Ensure that you enter the right password in the .env and server codes.
node <path_to_server.js>

# Step 8: Start the development server with auto-reloading and an instant preview.
npm run dev

## Changes made:

1. The NLP summary is generated by nlp_summaries_generator.py

2. The function is called once every 24 hours

3. The route has been defined by /backend/db.js and /backend/routes/summaries.js


```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

