
import app from './src/app';

const PORT = 3005;

app.listen(PORT, () => {
    console.log(`\nLocal API Server running at http://localhost:${PORT}`);
    console.log(`Ensure your frontend VITE_API_URL is set to http://localhost:${PORT}\n`);
});
