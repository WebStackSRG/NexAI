import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { SaveItemForm } from './SaveItemForm';
import { SuggestionReview } from './SuggestionReview';
import { useLibraryStore } from '@/store/libraryStore';

export function SaveItemModal() {
  const {
    isAddModalOpen,
    addModalPrefill,
    closeAddModal,
    suggestItem,
    isSuggesting,
    suggestError,
    suggestion,
    saveItem,
    isSaving,
  } = useLibraryStore();


  const [stepSuggestion, setStepSuggestion] = useState(null);
  const [lastPayload, setLastPayload] = useState(null);

  // Sync with store suggestion or local state
  const activeSuggestion = suggestion || stepSuggestion;

  const handleSuggest = async (payload) => {
    setLastPayload(payload);
    try {
      const result = await suggestItem(payload);
      setStepSuggestion({
        ...result,
        content: payload.content || result?.content,
      });
    } catch {
      // Handled in store toast / error state
    }
  };

  const handleRegenerate = async () => {
    if (lastPayload) {
      await handleSuggest(lastPayload);
    }
  };

  const handleBack = () => {
    setStepSuggestion(null);
    useLibraryStore.setState({ suggestion: null, suggestError: null });
  };

  const handleSave = async (itemData) => {
    try {
      await saveItem(itemData);
      setStepSuggestion(null);
      setLastPayload(null);
    } catch {
      // Handled in store
    }
  };

  const handleClose = () => {
    setStepSuggestion(null);
    setLastPayload(null);
    closeAddModal();
  };

  return (
    <Modal
      open={isAddModalOpen}
      onClose={handleClose}
      title={activeSuggestion ? 'Review & Confirm' : 'Add to Personal Library'}
    >
      {activeSuggestion ? (
        <SuggestionReview
          suggestion={activeSuggestion}
          onSave={handleSave}
          onBack={handleBack}
          onRegenerate={lastPayload ? handleRegenerate : undefined}
          isSaving={isSaving}
          isRegenerating={isSuggesting}
        />
      ) : (
        <SaveItemForm
          onSuggest={handleSuggest}
          onDirectSave={handleSave}
          isSuggesting={isSuggesting}
          isSaving={isSaving}
          error={suggestError}
          prefill={addModalPrefill}
        />

      )}
    </Modal>
  );
}
