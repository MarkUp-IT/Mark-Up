import { create } from "zustand";

export const useCheckoutFormStore = create((set) => ({

  buyerInfo: {
    email: "",
    fullName: "",
    phone: "",
  },
  setBuyerInfo: (patch) =>
    set((state) => ({
      buyerInfo: { ...state.buyerInfo, ...patch },
    })),

  voucherCode: null,
  setVoucherCode: (code) => set({ voucherCode: code }),

  notes: "",
  setNotes: (notes) => set({ notes }),

  checkoutSummary: {
    productId: null,
    productTitle: "",
    productType: "",
    total: 0,
  },
  setCheckoutSummary: (summary) =>
    set((state) => ({
      checkoutSummary: { ...state.checkoutSummary, ...summary },
    })),

  selectedMentor: null, 
  selectedSlot: null, 
  setMentorSelection: (mentor, slot) =>
    set({ selectedMentor: mentor, selectedSlot: slot }),
  clearMentorSelection: () =>
    set({ selectedMentor: null, selectedSlot: null }),

  proofFile: null,
  setProofFile: (file) => set({ proofFile: file }),

  reset: () =>
    set({
      buyerInfo: { email: "", fullName: "", phone: "" },
      voucherCode: null,
      notes: "",
      checkoutSummary: { productId: null, productTitle: "", productType: "", total: 0 },
      selectedMentor: null,
      selectedSlot: null,
      proofFile: null,
    }),
}));