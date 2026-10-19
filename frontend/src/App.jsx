
import { useEffect, useState } from "react";
import "./App.css";

const API_URL = "http://localhost:5000/api/auth";
const CHILDREN_URL = "http://localhost:5000/api/children";

const services = [
  {
    icon: "🌱",
    title: "Awareness",
    description:
      "Build understanding of different learning needs and help create more inclusive communities.",
  },
  {
    icon: "🔎",
    title: "Educational Assessment",
    description:
      "Understand each child's strengths, challenges, and individual learning needs.",
  },
  {
    icon: "🌈",
    title: "Early Intervention",
    description:
      "Provide targeted support that helps children develop skills at their own pace.",
  },
  {
    icon: "🤝",
    title: "Parent & Caregiver Support",
    description:
      "Equip caregivers with practical strategies to support learning and development at home.",
  },
  {
    icon: "💚",
    title: "Social & Emotional Learning",
    description:
      "Help children explore emotions, communication, relationships, and everyday situations.",
  },
];

const pathways = [
  {
    icon: "🔤",
    title: "Communication & Early Literacy",
    description:
      "Explore sounds, letters, vocabulary, early reading, comprehension, and communication.",
    level: "Early learning",
  },
  {
    icon: "🔢",
    title: "Early Numeracy",
    description:
      "Practise counting, number recognition, sequencing, patterns, and basic maths.",
    level: "Early learning",
  },
  {
    icon: "💛",
    title: "Social & Emotional Learning",
    description:
      "Explore feelings, turn-taking, asking for help, and everyday social situations.",
    level: "Life skills",
  },
  {
    icon: "🧩",
    title: "Everyday & Independence Skills",
    description:
      "Practise routines, following instructions, organisation, and everyday independence.",
    level: "Life skills",
  },
];


const literacyActivities = {
  recognition: {
    title: "Letter Recognition",
    description: "Look at the choices and find the correct letter.",
    questions: [
      { question: "Which letter is A?", choices: ["A", "B", "C"], answer: "A" },
      { question: "Which letter is M?", choices: ["N", "M", "W"], answer: "M" },
      { question: "Which letter is S?", choices: ["C", "S", "O"], answer: "S" },
    ],
  },
  sounds: {
    title: "Letter Sounds",
    description: "Choose the word that begins with the given sound.",
    questions: [
      { question: "Which word begins with the /b/ sound?", choices: ["Ball", "Cat", "Sun"], answer: "Ball" },
      { question: "Which word begins with the /m/ sound?", choices: ["Dog", "Moon", "Fish"], answer: "Moon" },
      { question: "Which word begins with the /s/ sound?", choices: ["Apple", "Sun", "Ball"], answer: "Sun" },
    ],
  },
  matching: {
    title: "Letter Matching",
    description: "Match the uppercase letter with its lowercase partner.",
    questions: [
      { question: "Which lowercase letter matches B?", choices: ["d", "b", "p"], answer: "b" },
      { question: "Which lowercase letter matches M?", choices: ["n", "w", "m"], answer: "m" },
      { question: "Which lowercase letter matches S?", choices: ["s", "c", "o"], answer: "s" },
    ],
  },
};


const caregiverGuidance = [
  {
    title: "Understand your child's learning needs",
    description:
      "Notice your child's strengths, interests, and the situations in which they learn best.",
  },
  {
    title: "Build helpful routines",
    description:
      "Use predictable routines, simple instructions, and visual reminders where helpful.",
  },
  {
    title: "Encourage communication",
    description:
      "Allow processing time, acknowledge communication attempts, and use the communication approach that works for your child.",
  },
  {
    title: "Celebrate progress",
    description:
      "Recognise small achievements and allow your child to learn at their own pace.",
  },
];

function formatDate(value) {
  if (!value) return "Not provided";

  let dateText = "";

  if (typeof value === "string") {
    dateText = value.slice(0, 10);
  } else if (value instanceof Date) {
    dateText = value.toISOString().slice(0, 10);
  }

  const parts = dateText.split("-").map(Number);

  if (
    parts.length !== 3 ||
    parts.some(Number.isNaN) ||
    !parts[0] ||
    !parts[1] ||
    !parts[2]
  ) {
    return "Not provided";
  }

  return new Date(parts[0], parts[1] - 1, parts[2]).toLocaleDateString(
    undefined,
    { day: "numeric", month: "short", year: "numeric" }
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState("");
  const [publicPage, setPublicPage] = useState("home");
  const [authMode, setAuthMode] = useState("login");
  const [dashboardPage, setDashboardPage] = useState("overview");

  const [authForm, setAuthForm] = useState({
    full_name: "",
    email: "",
    password: "",
  });

  const [authMessage, setAuthMessage] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  const [children, setChildren] = useState([]);
  const [selectedChildId, setSelectedChildId] = useState("");
  const [childrenLoading, setChildrenLoading] = useState(false);
  const [childrenError, setChildrenError] = useState("");
  const [childMessage, setChildMessage] = useState("");
  const [childError, setChildError] = useState("");
  const [showChildModal, setShowChildModal] = useState(false);
  const [childLoading, setChildLoading] = useState(false);

  const [childForm, setChildForm] = useState({
    full_name: "",
    date_of_birth: "",
    learning_needs: "",
  });

  
const [literacyMenuOpen, setLiteracyMenuOpen] = useState(false);
const [activeLiteracyActivity, setActiveLiteracyActivity] = useState(null);
const [questionIndex, setQuestionIndex] = useState(0);
const [selectedAnswer, setSelectedAnswer] = useState("");
const [activityScore, setActivityScore] = useState(0);
const [activityComplete, setActivityComplete] = useState(false);
const [activitySaving, setActivitySaving] = useState(false);
const [activityMessage, setActivityMessage] = useState("");
const [activityError, setActivityError] = useState("");
const [progressHistory, setProgressHistory] = useState([]);


  useEffect(() => {
    if (!user || user.role !== "parent" || !token) {
      setChildren([]);
      return;
    }

    let cancelled = false;

    async function loadChildren() {
      setChildrenLoading(true);
      setChildrenError("");

      try {
        const response = await fetch(CHILDREN_URL, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Could not load children's records.");
        }

        if (!cancelled) {
          setChildren(data.children || []);
        }
      } catch (error) {
        if (!cancelled) {
          setChildrenError(error.message || "Could not load children's records.");
        }
      } finally {
        if (!cancelled) {
          setChildrenLoading(false);
        }
      }
    }

    loadChildren();

    return () => {
      cancelled = true;
    };
  }, [user, token]);

  async function handleAuthSubmit(event) {
    event.preventDefault();
    setAuthMessage("");
    setAuthError("");
    setAuthLoading(true);

    const endpoint =
      authMode === "login" ? `${API_URL}/login` : `${API_URL}/register`;

    const payload =
      authMode === "login"
        ? {
            email: authForm.email.trim(),
            password: authForm.password,
          }
        : {
            full_name: authForm.full_name.trim(),
            email: authForm.email.trim(),
            password: authForm.password,
            role: "parent",
          };

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to complete your request.");
      }

      if (authMode === "register") {
        setAuthMessage(
          data.message || "Registration successful. Please log in."
        );
        setAuthMode("login");
        setAuthForm((previous) => ({
          ...previous,
          password: "",
        }));
        return;
      }

      if (!data.token || !data.user) {
        throw new Error("Login response was incomplete. Please try again.");
      }

      setToken(data.token);
      setUser(data.user);
      setDashboardPage("overview");
      setChildren([]);
      setAuthForm({ full_name: "", email: "", password: "" });
      setAuthMessage("");
      setPublicPage("portal");
    } catch (error) {
      setAuthError(error.message || "Something went wrong. Please try again.");
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleAddChild(event) {
    event.preventDefault();
    setChildMessage("");
    setChildError("");
    setChildLoading(true);

    try {
      const response = await fetch(CHILDREN_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          full_name: childForm.full_name.trim(),
          date_of_birth: childForm.date_of_birth,
          learning_needs: childForm.learning_needs.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not save the child's details.");
      }

      if (data.child) {
        setChildren((previous) => [data.child, ...previous]);
      } else {
        const refreshed = await fetch(CHILDREN_URL, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const refreshedData = await refreshed.json();

        if (refreshed.ok) {
          setChildren(refreshedData.children || []);
        }
      }

      setChildForm({
        full_name: "",
        date_of_birth: "",
        learning_needs: "",
      });

      setShowChildModal(false);
      setChildMessage(data.message || "Child registered successfully.");
      setDashboardPage("children");
    } catch (error) {
      setChildError(error.message || "Could not save the child's details.");
    } finally {
      setChildLoading(false);
    }
  }

  
function startLiteracyActivity(activityKey) {
  setActiveLiteracyActivity(activityKey);
  setLiteracyMenuOpen(false);
  setQuestionIndex(0);
  setSelectedAnswer("");
  setActivityScore(0);
  setActivityComplete(false);
  setActivityMessage("");
  setActivityError("");
}

function handleLiteracyAnswer(answer) {
  if (selectedAnswer) return;

  const activity = literacyActivities[activeLiteracyActivity];
  const question = activity.questions[questionIndex];

  setSelectedAnswer(answer);

  if (answer === question.answer) {
    setActivityScore((previous) => previous + 1);
  }
}

async function handleNextLiteracyQuestion() {
  const activity = literacyActivities[activeLiteracyActivity];

  if (!selectedAnswer || !activity) return;

  if (questionIndex < activity.questions.length - 1) {
    setQuestionIndex((previous) => previous + 1);
    setSelectedAnswer("");
    return;
  }

  const finalScore =
    activityScore +
    (selectedAnswer === activity.questions[questionIndex].answer ? 0 : 0);

  setActivitySaving(true);
  setActivityError("");
  setActivityMessage("");

  try {
    const response = await fetch(
      "http://localhost:5000/api/learning-progress",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          child_id: Number(selectedChildId),
          activity_name: activity.title,
          progress_notes:
            `Completed ${activity.title}. Score: ${finalScore} out of ${activity.questions.length}.`,
          progress_date: [
            new Date().getFullYear(),
            String(new Date().getMonth() + 1).padStart(2, "0"),
            String(new Date().getDate()).padStart(2, "0"),
          ].join("-"),
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Could not save learning progress.");
    }

    setActivityComplete(true);
    setActivityMessage(
      data.message || "Your child's learning progress has been saved!"
    );
  } catch (error) {
    setActivityError(
      error.message || "Could not save learning progress."
    );
  } finally {
    setActivitySaving(false);
  }
}


  function handleLogout() {
    setUser(null);
    setToken("");
    setChildren([]);
    setDashboardPage("overview");
    setShowChildModal(false);
    setAuthMessage("");
    setAuthError("");
    setChildMessage("");
    setChildError("");
    setPublicPage("home");
  }

  function openPortal() {
    setAuthMode("login");
    setAuthMessage("");
    setAuthError("");
    setPublicPage("portal");
  }

  function openPublicPage(page) {
    setPublicPage(page);
    setAuthMessage("");
    setAuthError("");
  }

  function openChildModal() {
    setChildForm({
      full_name: "",
      date_of_birth: "",
      learning_needs: "",
    });
    setChildError("");
    setChildMessage("");
    setShowChildModal(true);
  }

  if (user) {
    return (
      <div className="ab-app-shell">
        <aside className="ab-sidebar">
          <button
            type="button"
            className="ab-brand"
            onClick={() => setDashboardPage("overview")}
            aria-label="Go to dashboard"
          >
            <span className="ab-brand-mark">AB</span>
            <span className="ab-brand-copy">
              <strong>Ability Bridge</strong>
              <small>HUB</small>
            </span>
          </button>

          <div className="ab-sidebar-label">PARENT PORTAL</div>

          <nav className="ab-side-nav" aria-label="Parent navigation">
            <button
              type="button"
              className={dashboardPage === "overview" ? "active" : ""}
              onClick={() => setDashboardPage("overview")}
            >
              <span className="ab-nav-icon">⌂</span>
              <span>Dashboard</span>
            </button>

            <button
              type="button"
              className={dashboardPage === "children" ? "active" : ""}
              onClick={() => {
                setDashboardPage("children");
                setChildMessage("");
              }}
            >
              <span className="ab-nav-icon">♧</span>
              <span>My Children</span>
              <span className="ab-nav-count">{children.length}</span>
            </button>

            <button
              type="button"
              className={dashboardPage === "learning" ? "active" : ""}
              onClick={() => setDashboardPage("learning")}
            >
              <span className="ab-nav-icon">▤</span>
              <span>Learning Hub</span>
            </button>

            <button
              type="button"
              className={dashboardPage === "support" ? "active" : ""}
              onClick={() => setDashboardPage("support")}
            >
              <span className="ab-nav-icon">♡</span>
              <span>Caregiver Support</span>
            </button>
          </nav>

          <div className="ab-sidebar-bottom">
            <div className="ab-sidebar-help">
              <span className="ab-help-symbol">✳</span>
              <strong>Every child can grow.</strong>
              <p>Small steps make a meaningful difference.</p>
            </div>

            <button
              type="button"
              className="ab-side-logout"
              onClick={handleLogout}
            >
              <span className="ab-nav-icon">↪</span>
              Log out
            </button>
          </div>
        </aside>

        <main className="ab-main">
          <header className="ab-topbar">
            <div>
              <p className="ab-topbar-eyebrow">ABILITY BRIDGE HUB</p>
              <p className="ab-topbar-subtitle">Your family learning space</p>
            </div>

            <div className="ab-user-chip">
              <span className="ab-user-avatar">
                {(user.full_name || user.name || "P").charAt(0).toUpperCase()}
              </span>
              <span className="ab-user-name">
                {user.full_name || user.name || "Parent"}
                <small>Parent account</small>
              </span>
            </div>
          </header>

          <div className="ab-page-content">
            {dashboardPage === "overview" && (
              <section>
                <div className="ab-welcome-banner">
                  <div className="ab-welcome-copy">
                    <span className="ab-eyebrow">YOUR FAMILY LEARNING SPACE</span>
                    <h1>Welcome back, {((user.full_name || user.name || "there").trim().split(" ")[0])}!</h1>
                    <p>
                      Every child learns differently. Let's make room for
                      discovery, confidence, and growth.
                    </p>
                    <button
                      type="button"
                      className="ab-button ab-button-light"
                      onClick={() => setDashboardPage("children")}
                    >
                      Explore My Children <span>→</span>
                    </button>
                  </div>
                  <div className="ab-welcome-art" aria-hidden="true">
                    <span className="ab-art-circle ab-art-circle-one" />
                    <span className="ab-art-circle ab-art-circle-two" />
                    <span className="ab-art-spark">✳</span>
                    <span className="ab-art-heart">♡</span>
                    <span className="ab-art-leaf">✿</span>
                  </div>
                </div>

                <div className="ab-section-heading">
                  <div>
                    <span className="ab-eyebrow">YOUR OVERVIEW</span>
                    <h2>A little progress, every day</h2>
                  </div>
                </div>

                <div className="ab-stat-grid">
                  <button
                    type="button"
                    className="ab-stat-card"
                    onClick={() => setDashboardPage("children")}
                  >
                    <span className="ab-stat-icon ab-stat-green">♧</span>
                    <span className="ab-stat-number">{children.length}</span>
                    <span className="ab-stat-label">Registered children</span>
                    <span className="ab-stat-link">View profiles →</span>
                  </button>

                  <button
                    type="button"
                    className="ab-stat-card"
                    onClick={() => setDashboardPage("learning")}
                  >
                    <span className="ab-stat-icon ab-stat-yellow">✳</span>
                    <span className="ab-stat-number">4</span>
                    <span className="ab-stat-label">Learning pathways</span>
                    <span className="ab-stat-link">Explore learning →</span>
                  </button>

                  <button
                    type="button"
                    className="ab-stat-card"
                    onClick={() => setDashboardPage("support")}
                  >
                    <span className="ab-stat-icon ab-stat-pink">♡</span>
                    <span className="ab-stat-number">1</span>
                    <span className="ab-stat-label">Family support space</span>
                    <span className="ab-stat-link">Get guidance →</span>
                  </button>
                </div>

                <div className="ab-section-heading ab-section-heading-spaced">
                  <div>
                    <span className="ab-eyebrow">GET STARTED</span>
                    <h2>What would you like to do?</h2>
                  </div>
                </div>

                <div className="ab-action-grid">
                  <button
                    type="button"
                    className="ab-action-card"
                    onClick={() => setDashboardPage("children")}
                  >
                    <span className="ab-action-icon">👧🏽</span>
                    <span>
                      <strong>Manage child profiles</strong>
                      <small>View details or register a child.</small>
                    </span>
                    <span className="ab-action-arrow">→</span>
                  </button>

                  <button
                    type="button"
                    className="ab-action-card"
                    onClick={() => setDashboardPage("learning")}
                  >
                    <span className="ab-action-icon">📚</span>
                    <span>
                      <strong>Explore the Learning Hub</strong>
                      <small>Discover learning pathways.</small>
                    </span>
                    <span className="ab-action-arrow">→</span>
                  </button>

                  <button
                    type="button"
                    className="ab-action-card"
                    onClick={() => setDashboardPage("support")}
                  >
                    <span className="ab-action-icon">🌷</span>
                    <span>
                      <strong>Support at home</strong>
                      <small>Find practical caregiver guidance.</small>
                    </span>
                    <span className="ab-action-arrow">→</span>
                  </button>
                </div>
              </section>
            )}

            {dashboardPage === "children" && (
              <section className="ab-children-page">
                <div className="ab-page-title-row">
                  <div>
                    <span className="ab-eyebrow">YOUR FAMILY</span>
                    <h1>My Children</h1>
                    <p>
                      Each child has their own strengths, interests, and
                      learning journey. Keep their information in one place.
                    </p>
                  </div>

                  <button
                    type="button"
                    className="ab-button ab-button-primary"
                    onClick={openChildModal}
                  >
                    <span className="ab-plus">+</span> Add Child
                  </button>
                </div>

                {childMessage && (
                  <div className="ab-alert ab-alert-success" role="status">
                    ✓ {childMessage}
                  </div>
                )}

                {childrenError && (
                  <div className="ab-alert ab-alert-error" role="alert">
                    {childrenError}
                    <button
                      type="button"
                      onClick={() => setChildrenError("")}
                      aria-label="Dismiss error"
                    >
                      ×
                    </button>
                  </div>
                )}

                <div className="ab-children-summary">
                  <div className="ab-summary-icon">♧</div>
                  <div>
                    <strong>
                      {children.length}{" "}
                      {children.length === 1 ? "child" : "children"} registered
                    </strong>
                    <p>
                      {children.length
                        ? "Your children's profiles are ready to view."
                        : "Add a child to begin organising their learning journey."}
                    </p>
                  </div>
                </div>

                {childrenLoading ? (
                  <div className="ab-empty-state">
                    <div className="ab-loading-dot" />
                    <p>Loading your children's profiles...</p>
                  </div>
                ) : children.length > 0 ? (
                  <div className="ab-children-grid">
                    {children.map((child, index) => (
                      <article className="ab-child-card" key={child.id}>
                        <div className={`ab-child-card-top ab-child-color-${index % 4}`}>
                          <span className="ab-child-avatar">
                            {(child.full_name || "C").charAt(0).toUpperCase()}
                          </span>
                          <span className="ab-child-tag">CHILD PROFILE</span>
                        </div>

                        <div className="ab-child-card-body">
                          <h2>{child.full_name}</h2>
                          <div className="ab-child-detail">
                            <span className="ab-detail-icon">▦</span>
                            <span>
                              <small>Date of birth</small>
                              <strong>{formatDate(child.date_of_birth)}</strong>
                            </span>
                          </div>

                          <div className="ab-child-needs">
                            <span className="ab-detail-icon">✳</span>
                            <span>
                              <small>Learning needs & support</small>
                              <p>
                                {child.learning_needs?.trim() ||
                                  "No learning needs added yet."}
                              </p>
                            </span>
                          </div>

                          <div className="ab-child-card-footer">
                            <span>Growing at their own pace</span>
                            <span aria-hidden="true">♡</span>
                          </div>
                        </div>
                      </article>
                    ))}

                    <button
                      type="button"
                      className="ab-add-child-card"
                      onClick={openChildModal}
                    >
                      <span className="ab-add-child-circle">+</span>
                      <strong>Add another child</strong>
                      <span>Create a new child profile</span>
                    </button>
                  </div>
                ) : (
                  <div className="ab-empty-state">
                    <div className="ab-empty-illustration">🌱</div>
                    <h2>Your family's learning journey starts here</h2>
                    <p>
                      Register your child to keep their details together and
                      prepare for personalised learning activities.
                    </p>
                    <button
                      type="button"
                      className="ab-button ab-button-primary"
                      onClick={openChildModal}
                    >
                      <span className="ab-plus">+</span> Register your first child
                    </button>
                  </div>
                )}
              </section>
            )}

            ```jsx
{dashboardPage === "learning" && (
  <section>
    <div className="ab-page-title-row">
      <div>
        <span className="ab-eyebrow">EXPLORE & DISCOVER</span>
        <h1>Learning Hub</h1>
        <p>
          Short, engaging activities that help children learn
          at their own pace.
        </p>
      </div>
    </div>

    {!activeLiteracyActivity && !literacyMenuOpen && (
      <>
        <div className="ab-learning-note">
          <span>💡</span>
          <p>
            <strong>Learn together.</strong> Choose a pathway
            to explore activities with your child.
          </p>
        </div>

        <div className="ab-pathway-grid">
          {pathways.map((pathway, index) => (
            <article className="ab-pathway-card" key={pathway.title}>
              <span className="ab-pathway-icon">{pathway.icon}</span>
              <span className="ab-pathway-level">{pathway.level}</span>
              <h2>{pathway.title}</h2>
              <p>{pathway.description}</p>

              {index === 0 ? (
                <button
                  type="button"
                  className="ab-button ab-button-primary"
                  onClick={() => setLiteracyMenuOpen(true)}
                >
                  Explore Activities →
                </button>
              ) : (
                <span className="ab-coming-soon">
                  Activities coming soon
                </span>
              )}
            </article>
          ))}
        </div>
      </>
    )}

    {literacyMenuOpen && !activeLiteracyActivity && (
      <div className="ab-literacy-panel">
        <button
          type="button"
          className="ab-button ab-button-secondary"
          onClick={() => setLiteracyMenuOpen(false)}
        >
          ← Back to pathways
        </button>

        <h2>Communication & Early Literacy</h2>
        <p>Choose an activity to begin.</p>

        <label className="ab-child-select-label">
          Which child is learning?
          <select
            value={selectedChildId}
            onChange={(event) => setSelectedChildId(event.target.value)}
            required
          >
            <option value="">Select a child</option>
            {children.map((child) => (
              <option key={child.id} value={child.id}>
                {child.full_name}
              </option>
            ))}
          </select>
        </label>

        {!children.length && (
          <p>Please register a child before starting an activity.</p>
        )}

        <div className="ab-literacy-activity-grid">
          {Object.entries(literacyActivities).map(([key, activity]) => (
            <article className="ab-literacy-card" key={key}>
              <span className="ab-pathway-icon">
                {key === "recognition"
                  ? "🔤"
                  : key === "sounds"
                    ? "🔊"
                    : "🧩"}
              </span>
              <h3>{activity.title}</h3>
              <p>{activity.description}</p>
              <button
                type="button"
                className="ab-button ab-button-primary"
                disabled={!selectedChildId}
                onClick={() => startLiteracyActivity(key)}
              >
                Start Activity →
              </button>
            </article>
          ))}
        </div>
      </div>
    )}

    {activeLiteracyActivity && (
      <div className="ab-literacy-panel">
        <button
          type="button"
          className="ab-button ab-button-secondary"
          disabled={activitySaving}
          onClick={() => {
            setActiveLiteracyActivity(null);
            setActivityComplete(false);
            setActivityError("");
            setActivityMessage("");
            setLiteracyMenuOpen(true);
          }}
        >
          ← Back to activities
        </button>

        {(() => {
          const activity = literacyActivities[activeLiteracyActivity];
          const question = activity.questions[questionIndex];

          return (
            <>
              <span className="ab-eyebrow">
                COMMUNICATION & EARLY LITERACY
              </span>
              <h2>{activity.title}</h2>
              <p>{activity.description}</p>

              {!activityComplete ? (
                <>
                  <div className="ab-literacy-progress">
                    Question {questionIndex + 1} of{" "}
                    {activity.questions.length}
                  </div>

                  <div className="ab-literacy-question">
                    <h3>{question.question}</h3>

                    <div className="ab-answer-grid">
                      {question.choices.map((choice) => {
                        const isCorrect = choice === question.answer;
                        const isSelected = choice === selectedAnswer;

                        return (
                          <button
                            type="button"
                            key={choice}
                            className={`ab-answer-button ${
                              isSelected
                                ? isCorrect
                                  ? "correct"
                                  : "incorrect"
                                : ""
                            }`}
                            disabled={Boolean(selectedAnswer)}
                            onClick={() => handleLiteracyAnswer(choice)}
                          >
                            {choice}
                          </button>
                        );
                      })}
                    </div>

                    {selectedAnswer && (
                      <p className="ab-literacy-feedback" role="status">
                        {selectedAnswer === question.answer
                          ? "🌟 Well done! That's correct!"
                          : `Good try! The correct answer is ${question.answer}.`}
                      </p>
                    )}

                    <button
                      type="button"
                      className="ab-button ab-button-primary"
                      disabled={!selectedAnswer || activitySaving}
                      onClick={handleNextLiteracyQuestion}
                    >
                      {activitySaving
                        ? "Saving progress..."
                        : questionIndex === activity.questions.length - 1
                          ? "Finish & Save Progress"
                          : "Next Question →"}
                    </button>
                  </div>
                </>
              ) : (
                <div className="ab-literacy-completion">
                  <span className="ab-completion-icon">🌟</span>
                  <h2>Wonderful effort!</h2>
                  <p>
                    You scored {activityScore} out of{" "}
                    {activity.questions.length}.
                  </p>
                  <p>{activityMessage}</p>
                  <button
                    type="button"
                    className="ab-button ab-button-primary"
                    onClick={() => {
                      setActiveLiteracyActivity(null);
                      setActivityComplete(false);
                      setActivityMessage("");
                      setLiteracyMenuOpen(true);
                    }}
                  >
                    Explore More Activities →
                  </button>
                </div>
              )}

              {activityError && (
                <div className="ab-alert ab-alert-error" role="alert">
                  {activityError}
                  <button
                    type="button"
                    onClick={handleNextLiteracyQuestion}
                    disabled={activitySaving || !selectedAnswer}
                  >
                    Retry saving
                  </button>
                </div>
              )}
            </>
          );
        })()}
      </div>
    )}
  </section>
)}
```
              <section>
                <div className="ab-page-title-row">
                  <div>
                    <span className="ab-eyebrow">YOU ARE NOT ALONE</span>
                    <h1>Caregiver Support</h1>
                    <p>
                      Simple, practical ideas to help you support your child's
                      learning and independence at home.
                    </p>
                  </div>
                </div>

                <div className="ab-support-banner">
                  <span>💚</span>
                  <div>
                    <h2>Progress looks different for every child.</h2>
                    <p>
                      Start with what your child enjoys, offer encouragement,
                      and celebrate small steps forward.
                    </p>
                  </div>
                </div>

                <div className="ab-guidance-grid">
                  {caregiverGuidance.map((item, index) => (
                    <article className="ab-guidance-card" key={item.title}>
                      <span className="ab-guidance-number">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <h2>{item.title}</h2>
                      <p>{item.description}</p>
                    </article>
                  ))}
                </div>
              </section>
            
          </div>

          <footer className="ab-footer">
            <span>Ability Bridge Hub</span>
            <span>Every child deserves the opportunity to thrive. ♡</span>
          </footer>
        </main>

        {showChildModal && (
          <div
            className="ab-modal-overlay"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget && !childLoading) {
                setShowChildModal(false);
                setChildError("");
              }
            }}
          >
            <section
              className="ab-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="ab-modal-title"
            >
              <div className="ab-modal-header">
                <div>
                  <span className="ab-eyebrow">NEW CHILD PROFILE</span>
                  <h2 id="ab-modal-title">Let's get to know your child</h2>
                  <p>
                    Add a few details to help organise your child's learning
                    journey.
                  </p>
                </div>
                <button
                  type="button"
                  className="ab-modal-close"
                  onClick={() => {
                    setShowChildModal(false);
                    setChildError("");
                  }}
                  disabled={childLoading}
                  aria-label="Close registration form"
                >
                  ×
                </button>
              </div>

              {childError && (
                <div className="ab-alert ab-alert-error" role="alert">
                  {childError}
                </div>
              )}

              <form className="ab-modal-form" onSubmit={handleAddChild}>
                <label>
                  Child's full name <span>*</span>
                  <input
                    type="text"
                    name="full_name"
                    value={childForm.full_name}
                    onChange={(event) =>
                      setChildForm({
                        ...childForm,
                        full_name: event.target.value,
                      })
                    }
                    placeholder="Enter the child's name"
                    maxLength={100}
                    autoComplete="off"
                    required
                  />
                </label>

                <label>
                  Date of birth <span>*</span>
                  <input
                    type="date"
                    name="date_of_birth"
                    value={childForm.date_of_birth}
                    max={new Date().toLocaleDateString("en-CA")}
                    onChange={(event) =>
                      setChildForm({
                        ...childForm,
                        date_of_birth: event.target.value,
                      })
                    }
                    required
                  />
                </label>

                <label>
                  Learning needs and support
                  <span className="ab-optional">Optional</span>
                  <textarea
                    name="learning_needs"
                    value={childForm.learning_needs}
                    onChange={(event) =>
                      setChildForm({
                        ...childForm,
                        learning_needs: event.target.value,
                      })
                    }
                    placeholder="Share any learning goals or support needs you would like us to know about."
                    rows={4}
                    maxLength={10000}
                  />
                  <small className="ab-field-hint">
                    Share only what you feel comfortable recording.
                  </small>
                </label>

                <div className="ab-modal-actions">
                  <button
                    type="button"
                    className="ab-button ab-button-secondary"
                    onClick={() => {
                      setShowChildModal(false);
                      setChildError("");
                    }}
                    disabled={childLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="ab-button ab-button-primary"
                    disabled={childLoading}
                  >
                    {childLoading ? "Saving..." : "Save Child Profile"}
                    {!childLoading && <span>→</span>}
                  </button>
                </div>
              </form>
            </section>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="ab-public-app">
      <header className="ab-public-header">
        <button
          type="button"
          className="ab-brand ab-public-brand"
          onClick={() => openPublicPage("home")}
        >
          <span className="ab-brand-mark">AB</span>
          <span className="ab-brand-copy">
            <strong>Ability Bridge</strong>
            <small>HUB</small>
          </span>
        </button>

        <nav className="ab-public-nav" aria-label="Main navigation">
          <button
            type="button"
            className={publicPage === "home" ? "active" : ""}
            onClick={() => openPublicPage("home")}
          >
            Home
          </button>
          <button
            type="button"
            className={publicPage === "services" ? "active" : ""}
            onClick={() => openPublicPage("services")}
          >
            Our Services
          </button>
        </nav>

        <button
          type="button"
          className="ab-button ab-button-primary ab-header-portal"
          onClick={openPortal}
        >
          Parent Portal <span>→</span>
        </button>
      </header>

      {publicPage === "home" && (
        <main>
          <section className="ab-public-hero">
            <div className="ab-public-hero-copy">
              <span className="ab-eyebrow">
                UNDERSTANDING · SUPPORT · EMPOWERMENT
              </span>
              <h1>
                Every child deserves a chance to <em>thrive.</em>
              </h1>
              <p>
                We help children with different learning needs build skills,
                confidence, and independence through personalised support and
                practical guidance for families.
              </p>
              <div className="ab-hero-actions">
                <button
                  type="button"
                  className="ab-button ab-button-primary"
                  onClick={() => openPublicPage("services")}
                >
                  Explore Our Services <span>→</span>
                </button>
                <button
                  type="button"
                  className="ab-button ab-button-secondary"
                  onClick={openPortal}
                >
                  Parent Portal
                </button>
              </div>
              <div className="ab-hero-trust">
                <span>♡</span> Every child is unique. Every step matters.
              </div>
            </div>

            <div className="ab-public-hero-art" aria-label="Illustration of growth">
              <div className="ab-hero-art-orbit" />
              <div className="ab-hero-art-center">
                <span>✿</span>
                <strong>Grow</strong>
                <small>at your own pace</small>
              </div>
              <span className="ab-floating-leaf ab-floating-leaf-one">✿</span>
              <span className="ab-floating-leaf ab-floating-leaf-two">✳</span>
              <span className="ab-floating-leaf ab-floating-leaf-three">♡</span>
            </div>
          </section>

          <section className="ab-public-intro">
            <span className="ab-eyebrow">OUR PURPOSE</span>
            <h2>Learning looks different for every child.</h2>
            <p>
              Ability Bridge Hub is here to help children and their families
              find the support, tools, and understanding they need to move
              forward with confidence.
            </p>
          </section>

          <section className="ab-public-services-preview">
            <div className="ab-public-section-heading">
              <span className="ab-eyebrow">HOW WE HELP</span>
              <h2>Support that meets children where they are</h2>
              <p>
                Explore our services and discover how we can support your
                child's development.
              </p>
            </div>
            <div className="ab-public-service-grid">
              {services.slice(0, 3).map((service) => (
                <article className="ab-public-service-card" key={service.title}>
                  <span>{service.icon}</span>
                  <h3>{service.title}</h3>
                  <p>{service.description}</p>
                </article>
              ))}
            </div>
            <button
              type="button"
              className="ab-button ab-button-primary"
              onClick={() => openPublicPage("services")}
            >
              View All Services <span>→</span>
            </button>
          </section>

          <section className="ab-public-cta">
            <div>
              <span className="ab-eyebrow">YOUR JOURNEY STARTS HERE</span>
              <h2>Let's help every child find their way forward.</h2>
              <p>
                Explore our services or sign in to access your family learning
                space.
              </p>
            </div>
            <button
              type="button"
              className="ab-button ab-button-light"
              onClick={openPortal}
            >
              Visit Parent Portal <span>→</span>
            </button>
          </section>
        </main>
      )}

      {publicPage === "services" && (
        <main className="ab-services-page">
          <section className="ab-services-hero">
            <span className="ab-eyebrow">OUR SERVICES</span>
            <h1>Every child deserves support that sees their potential.</h1>
            <p>
              We support children's learning, development, and independence
              while helping families understand how to support them.
            </p>
          </section>

          <section className="ab-services-grid">
            {services.map((service, index) => (
              <article className="ab-service-card" key={service.title}>
                <div className={`ab-service-icon ab-service-icon-${index % 4}`}>
                  {service.icon}
                </div>
                <span className="ab-service-number">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h2>{service.title}</h2>
                <p>{service.description}</p>
              </article>
            ))}
          </section>

          <section className="ab-services-cta">
            <span className="ab-eyebrow">FAMILY LEARNING SPACE</span>
            <h2>Continue learning and growing together.</h2>
            <p>
              Parents and caregivers can access the portal to manage child
              profiles and explore learning resources.
            </p>
            <button
              type="button"
              className="ab-button ab-button-primary"
              onClick={openPortal}
            >
              Enter Parent Portal <span>→</span>
            </button>
          </section>
        </main>
      )}

      {publicPage === "portal" && (
        <main className="ab-auth-layout">
          <section className="ab-auth-welcome">
            <span className="ab-eyebrow">WELCOME TO YOUR FAMILY SPACE</span>
            <h1>A little support can open up a world of possibilities.</h1>
            <p>
              Sign in to manage your child's profile, explore learning
              pathways, and find practical caregiver guidance.
            </p>
            <div className="ab-auth-points">
              <span><b>✓</b> Keep child details organised</span>
              <span><b>✓</b> Explore learning pathways</span>
              <span><b>✓</b> Find support for learning at home</span>
            </div>
            <span className="ab-auth-decoration">✿</span>
          </section>

          <section className="ab-auth-card">
            <button
              type="button"
              className="ab-auth-back"
              onClick={() => openPublicPage("home")}
            >
              ← Back to website
            </button>

            <span className="ab-auth-mark">AB</span>

            <h2>{authMode === "login" ? "Welcome back" : "Create your account"}</h2>
            <p className="ab-auth-subtitle">
              {authMode === "login"
                ? "Sign in to continue your family's journey."
                : "Create a parent account to get started."}
            </p>

            {authMessage && (
              <div className="ab-alert ab-alert-success" role="status">
                {authMessage}
              </div>
            )}

            {authError && (
              <div className="ab-alert ab-alert-error" role="alert">
                {authError}
              </div>
            )}

            <form className="ab-auth-form" onSubmit={handleAuthSubmit}>
              {authMode === "register" && (
                <label>
                  Full name
                  <input
                    type="text"
                    value={authForm.full_name}
                    onChange={(event) =>
                      setAuthForm({ ...authForm, full_name: event.target.value })
                    }
                    placeholder="Your full name"
                    autoComplete="name"
                    required
                  />
                </label>
              )}

              <label>
                Email address
                <input
                  type="email"
                  value={authForm.email}
                  onChange={(event) =>
                    setAuthForm({ ...authForm, email: event.target.value })
                  }
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                />
              </label>

              <label>
                Password
                <input
                  type="password"
                  value={authForm.password}
                  onChange={(event) =>
                    setAuthForm({ ...authForm, password: event.target.value })
                  }
                  placeholder="Enter your password"
                  autoComplete={
                    authMode === "login" ? "current-password" : "new-password"
                  }
                  required
                />
              </label>

              <button
                type="submit"
                className="ab-button ab-button-primary ab-auth-submit"
                disabled={authLoading}
              >
                {authLoading
                  ? "Please wait..."
                  : authMode === "login"
                    ? "Sign In"
                    : "Create Parent Account"}
                {!authLoading && <span>→</span>}
              </button>
            </form>

            <div className="ab-auth-switch">
              {authMode === "login"
                ? "New to Ability Bridge Hub?"
                : "Already have an account?"}
              <button
                type="button"
                onClick={() => {
                  setAuthMode(authMode === "login" ? "register" : "login");
                  setAuthMessage("");
                  setAuthError("");
                }}
              >
                {authMode === "login" ? "Create an account" : "Sign in"}
              </button>
            </div>

            <p className="ab-auth-note">
              Your family's learning journey, supported with care. ♡
            </p>
          </section>
        </main>
      )}

      <footer className="ab-public-footer">
        <button
          type="button"
          className="ab-footer-brand"
          onClick={() => openPublicPage("home")}
        >
          <span className="ab-brand-mark">AB</span>
          <strong>Ability Bridge Hub</strong>
        </button>
        <span>Understanding. Support. Empowerment.</span>
      </footer>
    </div>
  );
}
export default App;
