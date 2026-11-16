import "./EnrollmentStatus.css";

function EnrollmentStatus({ status }) {
  const statusDetails = {
    active: "Enrolled",
    completed: "Completed",
    cancelled: "Cancelled",
    pending: "Payment Processing",
    failed: "Payment Failed",
    not_enrolled: "Not Enrolled",
  };

  return (
    <span className={`enrollment-badge ${status || "not_enrolled"}`}>
      {statusDetails[status] || "Not Enrolled"}
    </span>
  );
}

export default EnrollmentStatus;