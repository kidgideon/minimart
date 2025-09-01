import { useState } from "react";
import styles from "./help.module.css";
import Navbar from "../businessComponent/navbar";
import problems from "../problems.json";

const Help = () => {
  const [search, setSearch] = useState("");
  const [expandedIndex, setExpandedIndex] = useState(null);

  // Improved search: split words and check if any word matches question keywords
  const filteredProblems = problems.filter(p => {
    if (!search) return true; // show all if search is empty

    const searchWords = search.toLowerCase().split(/\s+/);
    const questionText = p.question.toLowerCase();

    return searchWords.some(word => questionText.includes(word));
  });

  const toggleExpand = (index) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  const handleEmail = () => {
    const subject = encodeURIComponent("Minimart Help Request");
    const body = encodeURIComponent(
      "Hello Minimart Team,\n\nI need help with the following issue:\n\n[Describe your problem here]\n\nAttached screenshot (if any)."
    );
    window.location.href = `mailto:minimart.com.ng?subject=${subject}&body=${body}`;
  };

  return (
    <div className="container">
      <Navbar />
      <div className="displayArea">
        <h1 className={styles.title}>Minimart Help Center</h1>

        {/* Search + Contact Us on same row */}
        <div className={styles.topControls}>
          <input
            type="text"
            placeholder="Search for a problem..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles.searchInput}
          />
          <button onClick={handleEmail} className={styles.contactButton}>
          <i class="fa-solid fa-envelope"></i>  contact us
          </button>
        </div>

        <div className={styles.problemList}>
          {filteredProblems.length > 0 ? (
            filteredProblems.map((p, i) => (
              <div key={i} className={styles.problemCard}>
                <div
                  className={styles.question}
                  onClick={() => toggleExpand(i)}
                  style={{ cursor: "pointer" }}
                >
                    <p>
    <i className="fa-solid fa-circle-question"></i> {p.question}
                    </p>
                  <span className={styles.expandIcon}>
                    {expandedIndex === i ? "▲" : "▼"}
                  </span>
                </div>
                {expandedIndex === i && (
                  <div className={styles.answer}> {p.answer}</div>
                )}
              </div>
            ))
          ) : (
            <div className={styles.noMatch}>
              <p>No exact results found. Try different keywords or reach out below:</p>
              <button onClick={handleEmail} className={styles.contactButton}>
               <i class="fa-solid fa-envelope"></i> contact us
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Help;
