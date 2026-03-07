import DonorDashboard from "../components/dashboards/DonorDashboard";
import ReceiverDashboard from "../components/dashboards/ReceiverDashboard";

type User = {
  name?: string;
  email?: string;
  user_type?: string;
};

export default function Dashboard() {
  const user: User | null = JSON.parse(localStorage.getItem("user") || "null");

  if (!user) {
    return <div>Please login first.</div>;
  }

  const role = String(user.user_type || "").trim().toLowerCase();

  if (role === "donor") {
    return <DonorDashboard />;
  }

  if (role === "receiver") {
    return <ReceiverDashboard />;
  }

  return <div>Invalid user role: {role}</div>;
}