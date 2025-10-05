import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

function App() {
  const [topic, setTopic] = useState("");
  const [facts, setFacts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadingRandomWord, setLoadingRandomWord] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const link = document.createElement("link");
    link.href =
      "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
    return () => document.head.removeChild(link);
  }, []);

  const fetchFacts = async () => {
    const sanitizedTopic = topic.trim();

    // Input validation
    if (!sanitizedTopic) {
      setError("Please enter a topic first!");
      return;
    }
    if (sanitizedTopic.length < 2) {
      setError("Topic too short! Please enter at least 2 characters.");
      return;
    }
    if (sanitizedTopic.length > 50) {
      setError("Topic too long! Please keep it under 50 characters.");
      return;
    }

    setError("");
    setLoading(true);
    setFacts([]);

    try {
      const response = await fetch("http://localhost:5000/api/facts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: sanitizedTopic }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch facts");
      }

      let cleanFacts = [];
      if (Array.isArray(data.facts)) cleanFacts = data.facts;
      else if (typeof data.facts === "string") {
        cleanFacts = data.facts
          .split(/\d+\.\s/)
          .map((s) => s.trim())
          .filter((s) => s.length > 0);
      }
      setFacts(cleanFacts);
    } catch (error) {
      console.error(error);
      if (
        error.message.includes("429") ||
        error.message.includes("Too many requests")
      ) {
        setFacts(["⏰ Too many requests! Please wait a moment and try again."]);
      } else if (
        error.message.includes("500") ||
        error.message.includes("Something went wrong")
      ) {
        setFacts([
          "🔧 Server issue detected. Try a different topic or wait a few minutes.",
        ]);
      } else {
        setFacts([
          "🙏 Sorry, we couldn't fetch fun facts right now.",
          "📡 Possible reason: connectivity issue or API credit limit reached.",
          "💡 Please try again in a few minutes!",
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchMoreFacts = async () => {
    if (!topic) return;
    setLoadingMore(true);
    try {
      const response = await fetch("http://localhost:5000/api/facts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, more: true }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch more facts");
      }

      let cleanFacts = [];
      if (Array.isArray(data.facts)) cleanFacts = data.facts;
      else if (typeof data.facts === "string") {
        cleanFacts = data.facts
          .split(/\d+\.\s/)
          .map((s) => s.trim())
          .filter((s) => s.length > 0);
      }
      setFacts((prev) => [...prev, ...cleanFacts]);
    } catch (error) {
      console.error(error);
      setFacts((prev) => [...prev, "🙏 Sorry, couldn't fetch more facts."]);
    } finally {
      setLoadingMore(false);
    }
  };

  const getRandomWord = async () => {
    setLoadingRandomWord(true);
    try {
      const response = await fetch("http://localhost:5000/api/random-words");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to get random word");
      }

      setTopic(data.word);
      setError(""); // Clear any existing errors
      console.log(
        `Random word: ${data.word}, ${data.remaining} remaining in cache`
      );
    } catch (error) {
      console.error("Failed to get random word:", error);
      setError("Failed to get random topic. Please try again.");
    } finally {
      setLoadingRandomWord(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      fetchFacts();
    } else if (e.key === "Escape") {
      setTopic("");
      setError("");
    }
  };

  const colors = {
    navy: "#1E3A8A",
    skyBlue: "#38BDF8",
    emerald: "#10B981",
    amber: "#F59E0B",
    watermelon: "#e54f6d",
    white: "#F9F9F9",
  };

  // Static particle positions to prevent re-rendering
  const staticParticles = [
    { x: 15, y: 20, color: colors.navy, delay: 0 },
    { x: 85, y: 30, color: colors.skyBlue, delay: 0.5 },
    { x: 25, y: 60, color: colors.emerald, delay: 1 },
    { x: 75, y: 80, color: colors.amber, delay: 1.5 },
    { x: 45, y: 15, color: colors.watermelon, delay: 2 },
    { x: 65, y: 45, color: colors.navy, delay: 2.5 },
    { x: 10, y: 85, color: colors.skyBlue, delay: 3 },
    { x: 90, y: 65, color: colors.emerald, delay: 3.5 },
  ];

  const floatingElements = staticParticles.map((particle, i) => (
    <motion.div
      key={`particle-${i}`}
      className="absolute w-2 h-2 rounded-full opacity-20"
      style={{
        left: `${particle.x}%`,
        top: `${particle.y}%`,
        backgroundColor: particle.color,
      }}
      animate={{
        y: [-20, 20, -20],
        x: [-10, 10, -10],
        opacity: [0.2, 0.5, 0.2],
      }}
      transition={{
        duration: 4 + i * 0.3,
        repeat: Infinity,
        delay: particle.delay,
      }}
    />
  ));

  return (
    <div
      className="min-h-screen min-w-screen relative overflow-x-hidden font-sans"
      style={{
        background: "white",
        backgroundImage: `
          linear-gradient(rgba(30, 58, 138, 0.05) 1px, transparent 1px),
          linear-gradient(90deg, rgba(30, 58, 138, 0.05) 1px, transparent 1px)
        `,
        backgroundSize: "20px 20px",
      }}
    >
      <div className="absolute inset-0 pointer-events-none">
        {floatingElements}
        <motion.div
          className="absolute -top-20 -right-20 w-40 h-40 rounded-full opacity-10"
          style={{ backgroundColor: colors.emerald }}
          animate={{ rotate: 360, scale: [1, 1.1, 1] }}
          transition={{ duration: 20, repeat: Infinity }}
        />
        <motion.div
          className="absolute -bottom-16 -left-16 w-32 h-32 rounded-full opacity-10"
          style={{ backgroundColor: colors.amber }}
          animate={{ rotate: -360, scale: [1, 1.2, 1] }}
          transition={{ duration: 25, repeat: Infinity }}
        />
      </div>

      <header className="relative z-10 pt-12 pb-8 text-center px-4 sm:px-6 md:px-8 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <motion.h1
            className="text-4xl sm:text-5xl md:text-6xl font-black mb-3 tracking-tight"
            style={{
              color: colors.navy,
              textShadow: "0 2px 10px rgba(30, 58, 138, 0.2)",
            }}
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            FiFuFa🖐🏻
          </motion.h1>
          <motion.div
            className="inline-block px-6 py-2 rounded-full text-lg font-semibold"
            style={{
              backgroundColor: colors.navy,
              color: colors.skyBlue,
              boxShadow: `0 4px 15px ${colors.navy}4D`,
            }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
          >
            Five Fun Facts Generator
          </motion.div>
        </motion.div>
      </header>

      <main className="relative z-10 flex flex-col items-center pb-0">
        <motion.div
          className="relative w-full max-w-full sm:max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl mb-2"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div
            className="rounded-3xl p-8 shadow-2xl border border-gray-200"
            style={{
              backgroundColor: colors.white,
              boxShadow: "0 20px 40px rgba(0,0,0,0.1)",
            }}
          >
            <motion.div className="mb-6">
              <label
                className="block text-sm font-semibold mb-3"
                style={{ color: colors.navy }}
                htmlFor="topic-input"
              >
                What's on your mind? 🤔
              </label>

              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-3 p-3 rounded-xl text-sm font-medium text-white"
                  style={{ backgroundColor: colors.watermelon }}
                  role="alert"
                  aria-live="polite"
                >
                  {error}
                </motion.div>
              )}

              {/* Input with Random Button Inside */}
              <div className="relative">
                <motion.input
                  id="topic-input"
                  type="text"
                  placeholder="Search ninja, batik, le sserafim, or else.."
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="w-full border-2 rounded-2xl p-4 pr-16 text-lg font-medium transition-all duration-300 focus:ring-0 outline-none placeholder-gray-400"
                  style={{
                    borderColor: error ? colors.watermelon : "#e5e7eb",
                    backgroundColor: "white",
                    color: "#1f2937",
                  }}
                  whileFocus={{
                    borderColor: error ? colors.watermelon : colors.navy,
                    scale: 1.02,
                    boxShadow: `0 0 0 4px ${
                      error ? colors.watermelon : colors.navy
                    }1A`,
                  }}
                  transition={{ duration: 0.2 }}
                  maxLength={50}
                  aria-describedby={error ? "topic-error" : undefined}
                  aria-invalid={error ? "true" : "false"}
                />

                {/* Random Button Inside Input */}
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  whileHover={{ scale: 1.1 }}
                  onClick={getRandomWord}
                  disabled={loadingRandomWord}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 w-12 h-12 rounded-xl font-bold transition-all duration-300 border-2 disabled:opacity-70 flex items-center justify-center"
                  style={{
                    backgroundColor: loadingRandomWord
                      ? "#f3f4f6"
                      : "transparent",
                    color: colors.amber,
                    borderColor: colors.amber,
                  }}
                  title="Get random topic"
                  aria-label="Generate random topic"
                  type="button"
                >
                  {loadingRandomWord ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                      aria-hidden="true"
                    >
                      🎲
                    </motion.div>
                  ) : (
                    <span aria-hidden="true">🎲</span>
                  )}
                </motion.button>
              </div>

              {/* Character Count */}
              <div className="mt-2 text-right text-xs text-gray-500">
                {topic.length}/50 characters
              </div>
            </motion.div>
            <motion.button
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.02, y: -2 }}
              onClick={fetchFacts}
              disabled={loading || !topic.trim()}
              className="w-full font-bold py-4 px-6 rounded-2xl text-lg transition-all duration-300 relative disabled:opacity-70"
              style={{
                backgroundColor: colors.watermelon,
                color: "white",
                boxShadow: `0 8px 25px ${colors.watermelon}66`,
              }}
              aria-describedby="main-button-status"
              type="button"
            >
              <motion.div
                className="absolute inset-0 opacity-0"
                style={{ backgroundColor: colors.amber }}
                whileHover={{ opacity: 0.1 }}
                transition={{ duration: 0.3 }}
              />
              <span className="relative z-10">
                {loading ? (
                  <motion.div className="flex items-center justify-center gap-2">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                    >
                      ⭐
                    </motion.div>
                    Generating Magic...
                  </motion.div>
                ) : (
                  "Discover Amazing Facts 🚀"
                )}
              </span>
            </motion.button>
          </div>
        </motion.div>

        <AnimatePresence>
          {facts.length > 0 && (
            <motion.div
              className="w-[100%] md:w-[85%] lg:w-[65%] xl:w-[60%] mt-5 max-w-screen relative"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.5 }}
            >
              <div
                className="rounded-3xl p-8 shadow-2xl border border-gray-200 overflow-x-hidden max-w-screen"
                style={{
                  backgroundColor: colors.white,
                  boxShadow: "0 25px 50px rgba(0,0,0,0.1)",
                }}
              >
                <motion.h2
                  className="text-2xl sm:text-2xl md:text-xl font-bold mb-6 text-center"
                  style={{ color: colors.navy }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  Amazing Facts about "{topic}"🎉
                </motion.h2>
                <div className="space-y-4">
                  {facts.map((fact, idx) => (
                    <motion.div
                      key={idx}
                      className="group p-5 rounded-2xl transition-all duration-300 hover:shadow-lg border-l-4"
                      style={{
                        backgroundColor: "white",
                        borderLeftColor: [
                          colors.navy,
                          colors.skyBlue,
                          colors.emerald,
                          colors.amber,
                          colors.watermelon,
                        ][idx % 5],
                      }}
                      initial={{ opacity: 0, x: -30 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.15 + 0.3 }}
                      whileHover={{ scale: 1.02, x: 5 }}
                    >
                      <div className="flex items-start gap-4">
                        <motion.div
                          className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm"
                          style={{
                            backgroundColor: [
                              colors.navy,
                              colors.skyBlue,
                              colors.emerald,
                              colors.amber,
                              colors.watermelon,
                            ][idx % 5],
                            color: "white",
                          }}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{
                            delay: idx * 0.15 + 0.5,
                            type: "spring",
                            stiffness: 200,
                          }}
                        >
                          {idx + 1}
                        </motion.div>
                        <p className="flex-1 text-gray-800 leading-relaxed font-medium text-sm sm:text-base md:text-lg">
                          {fact}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Tombol More - hanya tampil jika facts <= 5 */}
                {facts.length <= 5 && facts.length > 0 && (
                  <motion.div
                    className="mt-6 text-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                  >
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      whileHover={{ scale: 1.02, y: -2 }}
                      onClick={fetchMoreFacts}
                      disabled={loadingMore}
                      className="font-bold py-3 px-8 rounded-2xl text-base transition-all duration-300 relative disabled:opacity-70 border-2"
                      style={{
                        backgroundColor: "transparent",
                        color: colors.skyBlue,
                        borderColor: colors.skyBlue,
                      }}
                      aria-label="Load 5 more facts"
                      type="button"
                    >
                      <motion.div
                        className="absolute inset-0 opacity-0"
                        style={{ backgroundColor: colors.skyBlue }}
                        whileHover={{ opacity: 0.1 }}
                        transition={{ duration: 0.3 }}
                      />
                      <span className="relative z-10">
                        {loadingMore ? (
                          <motion.div className="flex items-center justify-center gap-2">
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{
                                duration: 1,
                                repeat: Infinity,
                                ease: "linear",
                              }}
                            >
                              ⚡
                            </motion.div>
                            Loading More...
                          </motion.div>
                        ) : (
                          "More Facts ✨"
                        )}
                      </span>
                    </motion.button>
                  </motion.div>
                )}

                {/* AI Disclaimer */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1 }}
                  className="mt-6 p-4 rounded-xl border"
                  style={{
                    backgroundColor: `${colors.amber}20`,
                    borderColor: `${colors.amber}40`,
                  }}
                >
                  <p
                    className="text-sm text-center font-medium"
                    style={{ color: colors.navy }}
                  >
                    ⚠️ AI-generated content may not be 100% accurate. Please
                    verify facts.
                  </p>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="relative z-10 mt-4 py-8 text-center lg:pt-2">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="space-y-6"
        >
          {/* Creator Credit with Instagram Link */}
          <motion.a
            href="https://otachiking.my.canva.site/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300 cursor-pointer"
            style={{
              backgroundColor: colors.emerald,
              color: "white",
              boxShadow: `0 4px 15px ${colors.emerald}33`,
            }}
            whileHover={{
              scale: 1.1,
              y: -2,
              boxShadow: `0 6px 20px ${colors.emerald}4D`,
            }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            Created by Muhammad Iqbal Rasyid 👨🏻‍💻
          </motion.a>

          {/* Logos & Appreciation Section */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.6 }}
            className="mt-12"
          >
            <div className="flex flex-col md:flex-row items-center justify-center gap-12">
              {/* Col1 */}
              <motion.div
                className="flex flex-col items-center gap-2"
                whileHover={{ scale: 1.05, y: -2 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <span
                  style={{ color: colors.navy }}
                  className="text-sm font-medium"
                >
                  Hosted by:
                </span>
                <a
                  href="https://www.instagram.com/hacktiv8id/"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2"
                >
                  <div className="h-20 w-20 bg-gray-200 rounded-lg flex items-center justify-center">
                    <img
                      src="/Logo_Hactiv8.png"
                      alt=""
                      className="h-20 w-full"
                    />
                  </div>
                </a>
                <span
                  style={{ color: colors.navy }}
                  className="text-sm font-semibold"
                >
                  Hactiv8
                </span>
              </motion.div>

              {/* Col2 */}
              <motion.div
                className="flex flex-col items-center gap-2"
                whileHover={{ scale: 1.05, y: -2 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <span
                  style={{ color: colors.navy }}
                  className="text-sm font-medium"
                >
                  Collaborated with:
                </span>
                <a
                  href="https://skills.yourlearning.ibm.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2"
                >
                  <div className="h-20 w-32 bg-gray-200 rounded-lg flex items-center justify-center">
                    <img src="/Logo_IBM2.png" alt="" className="w-25" />
                  </div>
                </a>
                <span
                  style={{ color: colors.navy }}
                  className="text-sm font-semibold"
                >
                  IBM SkillsBuild
                </span>
              </motion.div>

              {/* Col3 */}
              <motion.div
                className="flex flex-col items-center gap-2"
                whileHover={{ scale: 1.05, y: -2 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <span
                  style={{ color: colors.navy }}
                  className="text-sm font-medium"
                >
                  AI Powered by:
                </span>
                <a
                  href="https://replicate.com/ibm-granite/granite-3.3-8b-instruct"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2"
                >
                  <div className="h-20 w-20 bg-gray-200 rounded-lg flex items-center justify-center">
                    <img
                      src="/Logo_Granite.png"
                      alt=""
                    />
                  </div>
                </a>
                <span
                  style={{ color: colors.navy }}
                  className="text-sm font-semibold"
                >
                  Granite 3.3-8b
                </span>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      </footer>
    </div>
  );
}

export default App;