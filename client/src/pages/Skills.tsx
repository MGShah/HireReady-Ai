import React from "react";
import { useNavigate } from "react-router-dom";
import CareerFitDashboard from "../components/career/CareerFitDashboard";

export default function Skills() {
  const navigate = useNavigate();

  const handleNavigateToTailoring = (targetRole: string, company: string, jd: string) => {
    navigate("/resume", {
      state: {
        targetRole,
        targetCompany: company,
        jobDescription: jd,
      },
    });
  };

  return (
    <div className="space-y-6">
      <CareerFitDashboard onNavigateToTailoring={handleNavigateToTailoring} />
    </div>
  );
}
