"use client";

import { makeAutoObservable } from "mobx";
import type { TransactionInput } from "@/features/transactions/types";

class HomeUiStore {
  isAddModalOpen = false;
  isAudioFormOpen = false;
  voiceTransactionData: TransactionInput | null = null;
  lastProcessedTranscript: string = "";

  constructor() {
    makeAutoObservable(this);
  }

  openAddModal(transaction?: TransactionInput) {
    if (transaction) {
      this.voiceTransactionData = transaction;
    }
    this.isAddModalOpen = true;
  }

  closeAddModal() {
    this.isAddModalOpen = false;
    this.voiceTransactionData = null;
  }

  openAudioForm() {
    this.isAudioFormOpen = true;
  }

  closeAudioForm() {
    this.isAudioFormOpen = false;
  }

  setVoiceTransactionData(tx: TransactionInput | null) {
    this.voiceTransactionData = tx;
  }

  clearVoiceTransaction() {
    this.voiceTransactionData = null;
  }

  markTranscriptProcessed(text: string) {
    this.lastProcessedTranscript = text;
  }

  isTranscriptProcessed(text: string) {
    return this.lastProcessedTranscript === text;
  }
}

export const homeUiStore = new HomeUiStore();
