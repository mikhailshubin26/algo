import { useEffect, useState } from "react";
import RoadmapTree from "../components/RoadmapTree";
import client from "../api/client";

const RoadmapsPage = () => {
  const [roadmaps, setRoadmaps] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    client.get("/roadmaps/").then(({ data }) => setRoadmaps(data.results ?? data));
  }, []);

  const openRoadmap = async (id) => {
    const { data } = await client.get(`/roadmaps/${id}/`);
    setSelected(data);
  };

  return (
    <div className="roadmaps-page">
      <div className="roadmaps-page__list">
        <h2>Дорожные карты</h2>
        <ul>
          {roadmaps.map((roadmap) => (
            <li key={roadmap.id}>
              <button onClick={() => openRoadmap(roadmap.id)}>{roadmap.title}</button>
            </li>
          ))}
        </ul>
      </div>
      {selected && (
        <div className="roadmaps-page__detail">
          <h3>{selected.title}</h3>
          <p>{selected.description}</p>
          <RoadmapTree nodes={selected.nodes} />
        </div>
      )}
    </div>
  );
};

export default RoadmapsPage;
