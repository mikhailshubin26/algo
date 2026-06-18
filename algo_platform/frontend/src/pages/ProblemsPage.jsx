import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ProblemCard from "../components/ProblemCard";
import client from "../api/client";
import { useAuth } from "../context/AuthContext";

const ProblemsPage = () => {
  const [problems, setProblems] = useState([]);
  const { user } = useAuth();

  useEffect(() => {
    client.get("/problems/").then(({ data }) => setProblems(data.results ?? data));
  }, []);

  return (
    <div className="problems-page">
      <div className="problems-page__header">
        <h2>Задачи</h2>
        {user && (
          <Link to="/problems/new" className="btn-primary">+ Добавить задачу</Link>
        )}
      </div>
      <div className="problems-page__grid">
        {problems.map((problem) => (
          <ProblemCard key={problem.id} problem={problem} />
        ))}
      </div>
    </div>
  );
};

export default ProblemsPage;
