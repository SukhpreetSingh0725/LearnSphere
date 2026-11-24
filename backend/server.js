require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const courseRoutes = require("./routes/courseRoutes");
const curriculumRoutes = require("./routes/curriculumRoutes");
const enrollmentRoutes = require("./routes/enrollmentRoutes");
const adminRoutes = require("./routes/adminRoutes");
const adminUserRoutes = require("./routes/adminUserRoutes");
const adminAnalyticsRoutes = require("./routes/adminAnalyticsRoutes");
const instructorAnalyticsRoutes = require("./routes/instructorAnalyticsRoutes");
const progressRoutes = require("./routes/progressRoutes");
const faqRoutes = require("./routes/faqRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const streamRoutes = require("./routes/streamRoutes");

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json({ limit: "1mb" }));
if (process.env.NODE_ENV !== "test") app.use(morgan("dev"));

// Slow down brute-force attempts on auth endpoints
app.use(
    "/api/auth",
    rateLimit({
        windowMs: 15 * 60 * 1000,
        limit: 50,
        standardHeaders: true,
        legacyHeaders: false,
        message: { success: false, message: "Too many attempts. Try again later." }
    })
);

app.use("/api/auth", authRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api", curriculumRoutes);
app.use("/api/enrollments", enrollmentRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/admin/users", adminUserRoutes);
app.use("/api/admin/analytics", adminAnalyticsRoutes);
app.use("/api/instructor/analytics", instructorAnalyticsRoutes);
app.use("/api/progress", progressRoutes);
app.use("/api", faqRoutes);
app.use("/api/uploads", uploadRoutes);
app.use("/api/lessons", streamRoutes);

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

// Central error handler (Express 5 forwards async errors here)
app.use((err, req, res, next) => {
    console.error(err);
    res.status(err.status || 500).json({
        success: false,
        message: process.env.NODE_ENV === "production" ? "Internal server error" : err.message
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