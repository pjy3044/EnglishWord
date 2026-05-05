/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Word, StorageData, WrongWordRecord } from '../types';

const SHEET_URL = 'https://docs.google.com/spreadsheets/d/1u9tLFtzbqL8i68PaJutyyXjX7zZ1a_ZGZXKF03Z0pTQ/export?format=csv';
const STORAGE_KEY = 'sat_voca_app_data';

export async function fetchWords(): Promise<Word[]> {
  try {
    const response = await fetch(SHEET_URL);
    const csvText = await response.text();
    
    // Simple CSV parser (assuming comma delivery, handles basic cases)
    const lines = csvText.split('\n');
    const words: Word[] = [];
    
    // Skip header (단어, 뜻, ...)
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      // Handle potential quotes in CSV
      const parts = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
      if (parts.length >= 2) {
        words.push({
          id: parts[0].trim().replace(/^"|"$/g, ''), // Use word itself as ID if no unique ID
          word: parts[0].trim().replace(/^"|"$/g, ''),
          meaning: parts[1].trim().replace(/^"|"$/g, ''),
          example: parts[2]?.trim().replace(/^"|"$/g, '') || ''
        });
      }
    }
    return words;
  } catch (error) {
    console.error('Failed to fetch words:', error);
    return [];
  }
}

export function getStorageData(): StorageData {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) {
    return { wrongWords: {} };
  }
  return JSON.parse(data);
}

export function saveWrongWord(wordId: string) {
  const data = getStorageData();
  const current = data.wrongWords[wordId] || { count: 0, lastUpdated: 0 };
  
  data.wrongWords[wordId] = {
    count: current.count + 1,
    lastUpdated: Date.now()
  };
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function removeWrongWord(wordId: string) {
  const data = getStorageData();
  if (data.wrongWords[wordId]) {
    delete data.wrongWords[wordId];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }
}

export function clearAllData() {
  localStorage.removeItem(STORAGE_KEY);
}

// Web Speech API wrapper
export function speak(text: string) {
  if ('speechSynthesis' in window) {
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.8; // Slightly slower for clarity
    window.speechSynthesis.speak(utterance);
  }
}
