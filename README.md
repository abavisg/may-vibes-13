# WanderSnap

Discover your next adventure, instantly.
An app that suggests nearby activities based on your location, mood, and available time, using AI for personalized recommendations.

## Features

- **Location Detection**: Detects the user's current GPS location and fetches a human-readable place name.
- **Mood and Time Selection**: Allows users to select their current mood (e.g., Happy, Adventurous, Educational) and available time.
- **AI-Powered Activity Discovery**: Generates tailored activity suggestions by prompting an AI model (user can choose between Google AI or a local Ollama instance) with location, mood, and time. Aims to suggest specific, real-world places.
- **Dynamic Image Display**: Fetches and displays real images from Unsplash based on keywords provided by the AI for each activity.
- **Instant Directions & Information**: Offers one-tap integration with Google Maps to get directions or find the activity on a map, and a "Learn More" button for a targeted Google search.
- **User-Selectable AI Provider**: Users can switch between using Google's AI (Gemini) or a locally running Ollama model for suggestions.

## Tech Stack

- **Framework**: Next.js (App Router, Server Components, Server Actions)
- **Language**: TypeScript
- **UI Components**: ShadCN UI
- **Styling**: Tailwind CSS, CSS Variables
- **AI Integration**:
    - Genkit (for Google AI model interaction and flow definition)
    - Direct `fetch` calls to local Ollama instances
- **Language Models**: Google Gemini (e.g., `gemini-1.5-flash-latest`), Local Ollama (e.g., `mistral`)
- **Location Services**:
    - Browser Geolocation API (for coordinates)
    - Nominatim (OpenStreetMap) API (for reverse geocoding place names)
- **Image Sourcing**: Unsplash Source API
- **State Management**: React Hooks (`useState`, `useEffect`), `localStorage` for AI provider preference

## Architecture

- **Client-Side (Frontend)**:
    - Built with Next.js and React, handling user interactions, state management, and rendering of UI components.
    - Fetches data from server-side flows/actions.
- **Server-Side (Next.js Backend / Server Actions)**:
    - Genkit flows defined in `src/ai/flows/` are executed as server-side logic. These flows encapsulate prompting logic for AI models.
    - For Ollama, if chosen by the user, a direct `fetch` call is made from the Genkit flow to the local Ollama API endpoint.
- **AI Layer**:
    - Genkit is used to interface with the Google AI provider.
    - Direct HTTP POST requests are made to a local Ollama server (e.g., `http://localhost:11434/api/generate`) when Ollama is selected.
- **Third-Party Services**:
    - **Nominatim API**: For converting latitude/longitude to place names.
    - **Unsplash Source API**: For fetching relevant real-world images for activities.
    - **Google Maps/Search**: For "Get Directions" and "Learn More" functionalities via URL schemes.

## API Endpoints

The application primarily uses Next.js Server Actions which invoke server-side Genkit flows. These are not traditional REST API endpoints exposed for general consumption but are server-side TypeScript functions called from the client components.

- **Key Server-Side Flows (located in `src/ai/flows/`)**:
    - `suggest-activities-flow.ts`:
        - Input: `locationContext` (string), `mood` (string), `timeAvailable` (string), `aiProvider` ('googleai' | 'ollama')
        - Output: An array of activity suggestions, each including a name, description, category, estimated duration, location hint, and image keywords.
    - `summarize-activity.ts`: (Currently not in the primary user path but available)
        - Input: `activityDescription`, `mood`, `timeAvailable`, `preferences`
        - Output: A concise summary.

- **External API Calls made by the application**:
    - `https://nominatim.openstreetmap.org/reverse`: For reverse geocoding.
    - `http://localhost:11434/api/generate`: For Ollama suggestions (if Ollama is selected and running locally).
    - `https://source.unsplash.com/`: For fetching images.

## Setup the application

1.  **Clone the repository**:
    ```bash
    git clone <repository-url>
    cd wandersnap
    ```
2.  **Install dependencies**:
    ```bash
    npm install
    ```
3.  **Set up environment variables**:
    Create a `.env` file in the root of the project. If you plan to use the Google AI provider for suggestions or image generation, add your Google API key:
    ```env
    GOOGLE_API_KEY=your_google_api_key_here
    ```
4.  **Ollama Setup (Optional, if you want to use the local Ollama provider)**:
    *   Ensure Ollama is installed and running on your local machine. See [Ollama official website](https://ollama.com/) for installation instructions.
    *   By default, the application expects Ollama to be running at `http://localhost:11434`.
    *   Pull a model that you want to use (e.g., Mistral, Llama3). The application is currently configured to try `mistral` by default for Ollama.
        ```bash
        ollama pull mistral
        ```

## Run the application

1.  **Start the Next.js development server**:
    ```bash
    npm run dev
    ```
    The application will typically be available at `http://localhost:9003` (or the port specified in `package.json`).

2.  **Genkit Developer UI (Optional)**:
    If you want to inspect Genkit traces or use its developer UI, you can run it in a separate terminal:
    ```bash
    npm run genkit:dev
    ```
    The Genkit Developer UI is usually available at `http://localhost:4000`.

## License
MIT
