require("dotenv").config();

const express = require("express");
const courses = require("./data/courses");
const cors = require("cors");
const connectDB = require("./config/db");

const app = express();

app.use(cors());
app.use(express.json());

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

app.get("/api/courses", (req, res) => {
    let result = [...courses];

    const {
        search,
        category,
        level,
        maxPrice,
        page = 1,
        limit = 10
    } = req.query;

    if (search) {
        result = result.filter(course =>
            course.title.toLowerCase().includes(search.toLowerCase())
        );
    }

    if (category) {
        result = result.filter(course =>
            course.category.toLowerCase() === category.toLowerCase()
        );
    }

    if (level) {
        result = result.filter(course =>
            course.level.toLowerCase() === level.toLowerCase()
        );
    }

    if (maxPrice !== undefined) {
        const priceLimit = Number(maxPrice);

        if (!Number.isFinite(priceLimit) || priceLimit < 0) {
            return res.status(400).json({
                success: false,
                message: "maxPrice must be a non-negative number"
            });
        }

        result = result.filter(course => course.price <= priceLimit);
    }

    const pageNumber = Number(page);
    const pageSize = Number(limit);

    if (
        !Number.isInteger(pageNumber) ||
        !Number.isInteger(pageSize) ||
        pageNumber < 1 ||
        pageSize < 1 ||
        pageSize > 50
    ) {
        return res.status(400).json({
            success: false,
            message: "page must be >= 1 and limit must be between 1 and 50"
        });
    }

    const total = result.length;
    const startIndex = (pageNumber - 1) * pageSize;

    result = result.slice(startIndex, startIndex + pageSize);

    res.status(200).json({
        success: true,
        total,
        page: pageNumber,
        limit: pageSize,
        data: result
    });
});

app.get("/api/courses/:id", (req, res) => {
    const courseId = Number(req.params.id);

    const course = courses.find(course => course.id === courseId);

    if (!course) {
        return res.status(404).json({
            success: false,
            message: "Course not found"
        });
    }

    res.status(200).json({
        success: true,
        data: course
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
