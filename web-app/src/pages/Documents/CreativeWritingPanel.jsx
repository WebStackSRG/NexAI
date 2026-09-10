import React, { useState } from "react";
import {
  Feather,
  Sparkles,
  UserPlus,
  X,
  Globe,
  Plus,
  BookOpen,
  Send,
  Loader2,
} from "lucide-react";
import styles from "./CreativeWritingPanel.module.scss";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

export default function CreativeWritingPanel({
  documentTitle,
  currentSectionCount,
  onAppendChapter,
}) {
  const [genre, setGenre] = useState("sci-fi");
  const [tone, setTone] = useState("dark");
  const [style, setStyle] = useState("descriptive");
  const [worldNotes, setWorldNotes] = useState("");
  const [instruction, setInstruction] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  // Character roster state
  const [characters, setCharacters] = useState([
    { name: "Kaelen", role: "Protagonist" },
  ]);
  const [newCharName, setNewCharName] = useState("");
  const [newCharRole, setNewCharRole] = useState("");

  const handleAddCharacter = (e) => {
    e.preventDefault();
    if (!newCharName.trim()) return;
    setCharacters([
      ...characters,
      { name: newCharName.trim(), role: newCharRole.trim() || "Supporting" },
    ]);
    setNewCharName("");
    setNewCharRole("");
  };

  const handleRemoveCharacter = (idx) => {
    setCharacters(characters.filter((_, i) => i !== idx));
  };

  const handleContinue = async () => {
    setIsGenerating(true);
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch(`${API_BASE}/documents/creative-continue`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: documentTitle || "Untitled Story",
          genre,
          tone,
          style,
          chapterNumber: currentSectionCount + 1,
          characters,
          worldNotes,
          instruction: instruction || "Advance the plot with rising action and dialogue.",
        }),
      });

      if (!res.ok) throw new Error("Failed to continue chapter");
      const data = await res.json();
      if (data.heading && data.body) {
        onAppendChapter({
          heading: data.heading,
          body: data.body,
        });
        setInstruction("");
      }
    } catch (err) {
      alert("Creative generation failed: " + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className={styles.creativePanel}>
      <div className={styles.panelHeader}>
        <h3>
          <Feather size={18} color="#a78bfa" />
          Creative Writing Studio Suite
        </h3>
        <span className={styles.badge}>Multi-Chapter Arc</span>
      </div>

      <div className={styles.controlRow}>
        <div className={styles.field}>
          <label>Genre</label>
          <select value={genre} onChange={(e) => setGenre(e.target.value)}>
            <option value="sci-fi">Sci-Fi / Cyberpunk</option>
            <option value="fantasy">High Fantasy</option>
            <option value="thriller">Psychological Thriller</option>
            <option value="mystery">Noir Mystery</option>
            <option value="historical">Historical Fiction</option>
            <option value="dystopian">Dystopian</option>
          </select>
        </div>

        <div className={styles.field}>
          <label>Tone</label>
          <select value={tone} onChange={(e) => setTone(e.target.value)}>
            <option value="dark">Dark & Gritty</option>
            <option value="suspenseful">Suspenseful & Tense</option>
            <option value="epic">Grand & Epic</option>
            <option value="humorous">Satirical & Witty</option>
            <option value="reflective">Reflective & Poetic</option>
          </select>
        </div>

        <div className={styles.field}>
          <label>Prose Style</label>
          <select value={style} onChange={(e) => setStyle(e.target.value)}>
            <option value="descriptive">Vivid & Sensory</option>
            <option value="fast-paced">Kinetic & Dialogue-Heavy</option>
            <option value="minimalist">Hemingwayesque Minimalist</option>
            <option value="lyrical">Lyrical & Metaphorical</option>
          </select>
        </div>
      </div>

      {/* Characters roster */}
      <div className={styles.charactersBox}>
        <h4>
          <UserPlus size={14} /> Character Cast Notes
        </h4>
        <div className={styles.charList}>
          {characters.map((c, i) => (
            <span key={i} className={styles.charPill}>
              <strong>{c.name}</strong> ({c.role})
              <button
                type="button"
                onClick={() => handleRemoveCharacter(i)}
                title="Remove character"
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
        <div className={styles.charInputs}>
          <input
            type="text"
            placeholder="Name (e.g. Elena)"
            value={newCharName}
            onChange={(e) => setNewCharName(e.target.value)}
          />
          <input
            type="text"
            placeholder="Role / Archetype (e.g. Tech Smuggler)"
            value={newCharRole}
            onChange={(e) => setNewCharRole(e.target.value)}
          />
          <button
            type="button"
            className={styles.addBtn}
            onClick={handleAddCharacter}
          >
            <Plus size={12} /> Add
          </button>
        </div>
      </div>

      {/* World-building notes */}
      <div className={styles.field}>
        <label>World-Building & Lore References</label>
        <textarea
          rows={2}
          placeholder="e.g. Floating neon cities above acidic clouds; magic is fueled by raw cobalt extraction..."
          value={worldNotes}
          onChange={(e) => setWorldNotes(e.target.value)}
        />
      </div>

      {/* Next Chapter Director Action */}
      <div className={styles.actionFooter}>
        <input
          type="text"
          className={styles.instructionInput}
          placeholder="Author instruction for this chapter (e.g. Ambush at the midnight train station)..."
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleContinue();
          }}
        />
        <button
          type="button"
          className={styles.continueBtn}
          onClick={handleContinue}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <>
              <Loader2 size={14} className="spin" /> Generating Chapter...
            </>
          ) : (
            <>
              <Sparkles size={14} /> Continue Story Arc (Chapter {currentSectionCount + 1})
            </>
          )}
        </button>
      </div>
    </div>
  );
}
