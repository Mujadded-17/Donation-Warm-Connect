import DonorDashboard from "../components/dashboards/DonorDashboard";
import ReceiverDashboard from "../components/dashboards/ReceiverDashboard";
import AdminDashboard from "../components/dashboards/AdminDashboard";

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
  const email = String(user.email || "").trim().toLowerCase();

  if (role === "admin" || email === "silviaadmin@gmail.com") {
    return <AdminDashboard />;
  }

  if (role === "donor") {
    return <DonorDashboard />;
  }

  if (role === "receiver") {
    return <ReceiverDashboard />;
  }

  return <div>Invalid user role: {role}</div>;
}