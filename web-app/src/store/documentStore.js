import { create } from "zustand";
import { devtools } from "zustand/middleware";
import * as documentApi from "../lib/documentApi";

const useDocumentStore = create(
  devtools(
    (set, get) => ({
      documents: [],
      activeDocument: null,
      sections: [],
      isGenerating: false,
      isSaving: false,
      isLoading: false,
      error: null,
      hasUnsavedChanges: false,

      setDocuments: (documents) => set({ documents }),
      setActiveDocument: (doc) =>
        set({
          activeDocument: doc,
          sections: doc ? doc.sections || [] : [],
          hasUnsavedChanges: false,
        }),
      setSections: (sections) => set({ sections, hasUnsavedChanges: true }),

      updateSection: (index, field, value) => {
        const sections = [...get().sections];
        if (sections[index]) {
          sections[index] = { ...sections[index], [field]: value };
          set({ sections, hasUnsavedChanges: true });
        }
      },

      addSection: (heading = "New Section", body = "<p></p>") => {
        const sections = [
          ...get().sections,
          {
            heading,
            body,
            order: get().sections.length,
          },
        ];
        set({ sections, hasUnsavedChanges: true });
      },

      removeSection: (index) => {
        const sections = get().sections.filter((_, i) => i !== index);
        // Recalculate order
        const reordered = sections.map((s, i) => ({ ...s, order: i }));
        set({ sections: reordered, hasUnsavedChanges: true });
      },

      moveSection: (fromIndex, toIndex) => {
        const sections = [...get().sections];
        if (
          fromIndex < 0 ||
          fromIndex >= sections.length ||
          toIndex < 0 ||
          toIndex >= sections.length
        ) {
          return;
        }
        const [moved] = sections.splice(fromIndex, 1);
        sections.splice(toIndex, 0, moved);
        const reordered = sections.map((s, i) => ({ ...s, order: i }));
        set({ sections: reordered, hasUnsavedChanges: true });
      },

      loadDocuments: async () => {
        set({ isLoading: true, error: null });
        try {
          const docs = await documentApi.fetchDocuments();
          set({ documents: docs, isLoading: false });
          return docs;
        } catch (err) {
          set({
            error: err.response?.data?.error || err.message,
            isLoading: false,
          });
          return [];
        }
      },

      generateAndCreate: async ({ topic, tone = "technical", sectionCount = 4 }) => {
        set({ isGenerating: true, error: null });
        try {
          const result = await documentApi.generateDocumentSections({
            topic,
            tone,
            sectionCount,
          });

          const created = await documentApi.createDocument({
            title: result.title || topic,
            sections: result.sections || [],
          });

          set((state) => ({
            documents: [created, ...state.documents],
            activeDocument: created,
            sections: created.sections || [],
            isGenerating: false,
            hasUnsavedChanges: false,
          }));

          return created;
        } catch (err) {
          set({
            error: err.response?.data?.error || err.message,
            isGenerating: false,
          });
          throw err;
        }
      },

      saveActiveDocument: async () => {
        const { activeDocument, sections } = get();
        if (!activeDocument) return null;

        set({ isSaving: true, error: null });
        try {
          const updated = await documentApi.updateDocument(
            activeDocument._id || activeDocument.id,
            {
              title: activeDocument.title,
              sections,
            },
          );

          set((state) => ({
            activeDocument: updated,
            sections: updated.sections,
            documents: state.documents.map((d) =>
              (d._id || d.id) === (updated._id || updated.id) ? updated : d,
            ),
            isSaving: false,
            hasUnsavedChanges: false,
          }));

          return updated;
        } catch (err) {
          set({
            error: err.response?.data?.error || err.message,
            isSaving: false,
          });
          throw err;
        }
      },

      deleteActiveDocument: async (docId) => {
        const id = docId || get().activeDocument?._id || get().activeDocument?.id;
        if (!id) return;

        try {
          await documentApi.deleteDocument(id);
          set((state) => {
            const remaining = state.documents.filter(
              (d) => (d._id || d.id) !== id,
            );
            return {
              documents: remaining,
              activeDocument: remaining.length > 0 ? remaining[0] : null,
              sections: remaining.length > 0 ? remaining[0].sections || [] : [],
              hasUnsavedChanges: false,
            };
          });
        } catch (err) {
          set({ error: err.response?.data?.error || err.message });
        }
      },
    }),
    { name: "document-store" },
  ),
);

export default useDocumentStore;
