import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./EnrollButton.css";

function EnrollButton({ course }) {
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [checkingEnrollment, setCheckingEnrollment] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);

  const API = import.meta.env.VITE_API_URL || "http://localhost:5000";
  useEffect(() => {
    const checkEnrollment = async () => {
      if (!user || !token || user.role !== "student") {
        setIsEnrolled(false);
        setCheckingEnrollment(false);
        return;
      }
  
      try {
        const response = await fetch(`${API}/api/enrollments/my-courses`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
  
        const result = await response.json();
  
        if (!response.ok) {
          throw new Error(result.message || "Unable to check enrollment");
        }
  
        const enrollments = result.data || [];
  
        const alreadyEnrolled = enrollments.some((enrollment) => {
          const enrolledCourse = enrollment.course?._id || enrollment.course;
          return String(enrolledCourse) === String(course._id);
        });
  
        setIsEnrolled(alreadyEnrolled);
        if (alreadyEnrolled) {
          const progressResponse = await fetch(
            `${API}/api/progress/${course._id}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
        
          const progressResult = await progressResponse.json();
        
          if (progressResponse.ok) {
            const progress = progressResult.data;
        
            setIsCompleted(
              Boolean(progress?.completedAt) ||
              (Number(progress?.totalLessons) > 0 &&
                Number(progress?.percentage) >= 100)
            );
          }
        } else {
          setIsCompleted(false);
        }
      } catch (err) {
        console.error("Enrollment check failed:", err.message);
      } finally {
        setCheckingEnrollment(false);
      }
    };
  
    checkEnrollment();
  }, [course._id, user, token, API]);

  const handleEnroll = async () => {
    if (isEnrolled) {
      navigate(`/learn/${course._id}`);
      return;
    }
    setMessage("");
    setError("");

    if (!user || !token) {
      navigate("/login");
      return;
    }

    if (user.role !== "student") {
      setError("Only students can enroll in courses.");
      return;
    }

    try {
      setLoading(true);

      if (Number(course.price) === 0) {
        const response = await fetch(
          `${API}/api/enrollments/${course._id}`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Enrollment failed");
        }

        setMessage("Successfully enrolled!");
        return;
      }

      const loaded = await new Promise((resolve) => {
        if (window.Razorpay) {
          resolve(true);
          return;
        }

        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
      });

      if (!loaded) {
        throw new Error("Unable to load Razorpay.");
      }

      const orderResponse = await fetch(
        `${API}/api/payments/create-order`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ courseId: course._id }),
        }
      );

      const orderData = await orderResponse.json();

      if (!orderResponse.ok) {
        throw new Error(orderData.message || "Order creation failed");
      }

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: orderData.data.amount,
        currency: orderData.data.currency,
        name: "LearnSphere",
        description: course.title,
        order_id: orderData.data.id,

        handler: async (payment) => {
          try {
            const verifyResponse = await fetch(
              `${API}/api/payments/verify`,
              {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  courseId: course._id,
                  razorpay_order_id: payment.razorpay_order_id,
                  razorpay_payment_id: payment.razorpay_payment_id,
                  razorpay_signature: payment.razorpay_signature,
                }),
              }
            );

            const verifyData = await verifyResponse.json();

            if (!verifyResponse.ok) {
              throw new Error(
                verifyData.message || "Payment verification failed"
              );
            }

            setMessage("Payment verified! You are enrolled.");
          } catch (err) {
            setError(err.message);
          } finally {
            setLoading(false);
          }
        },

        modal: {
          ondismiss: () => setLoading(false),
        },

        theme: {
          color: "#2563eb",
        },
      };

      if (!options.key) {
        throw new Error("Razorpay Key ID is missing.");
      }

      const paymentObject = new window.Razorpay(options);

      paymentObject.on("payment.failed", () => {
        setError("Payment failed. Please try again.");
        setLoading(false);
      });

      paymentObject.open();
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="enroll-container">
      <button
          onClick={handleEnroll}
          disabled={loading || checkingEnrollment}
      >
        {checkingEnrollment
          ? "Checking..."
          : isEnrolled
          ? isCompleted
            ? "Review Course"
            : "Continue Learning"
          : loading
          ? "Processing..."
          : Number(course.price) === 0
          ? "Enroll for Free"
          : "Enroll Now"}
      </button>

      {message && <p className="enroll-success">{message}</p>}
      {error && <p className="enroll-error">{error}</p>}
    </div>
  );
}

export default EnrollButton;