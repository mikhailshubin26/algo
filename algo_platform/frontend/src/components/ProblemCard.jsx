import { Link } from "react-router-dom";

const DIFFICULTY_LABEL = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
};

const ProblemCard = ({ problem }) => {
  return (
    <Link to={`/problems/${problem.id}`} className="problem-card">
      <h3>{problem.title}</h3>
      <span className={`problem-card__difficulty problem-card__difficulty--${problem.difficulty}`}>
        {DIFFICULTY_LABEL[problem.difficulty]}
      </span>
    </Link>
  );
};

export default ProblemCard;
