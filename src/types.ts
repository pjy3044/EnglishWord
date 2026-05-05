/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Word {
  id: string;
  word: string;
  meaning: string;
  example?: string;
}

export interface WrongWordRecord {
  count: number;
  lastUpdated: number;
}

export interface StorageData {
  wrongWords: Record<string, WrongWordRecord>;
}

export type TabType = 'words' | 'quiz' | 'errors' | 'list';
