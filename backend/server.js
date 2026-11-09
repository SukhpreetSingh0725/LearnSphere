require("dotenv").config();

const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const courseRoutes = require("./routes/courseRoutes");
const curriculumRoutes = require("./routes/curriculumRoutes");
const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api", curriculumRoutes);


app.get("/", (req, res) => {
    res.send("Welcome to LearnSphere API!");
});

app.get("/api/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "LearnSphere backend is running",
        database: "Connected"
    });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        await connectDB();

        app.listen(PORT, () => {
            console.log(`LearnSphere server running at http://localhost:${PORT}`);
        });

    } catch (error) {
        console.error("Server startup failed:", error.message);
        process.exit(1);
    }
};

startServer();
