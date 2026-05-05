/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Book, Brain, ListRestart, Volume2, ChevronRight, ChevronLeft, CheckCircle2, XCircle, Trash2, ArrowRight, Search, LayoutList } from 'lucide-react';
import { Word, TabType, StorageData } from './types';
import { fetchWords, getStorageData, saveWrongWord, removeWrongWord, clearAllData, speak } from './services/wordService';

export default function App() {
  const [words, setWords] = useState<Word[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('words');
  const [loading, setLoading] = useState(true);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [storageData, setStorageData] = useState<StorageData>({ wrongWords: {} });
  const [searchTerm, setSearchTerm] = useState('');
  
  // Quiz state
  const [quizIdx, setQuizIdx] = useState(0);
  const [quizWords, setQuizWords] = useState<Word[]>([]);
  const [quizAnswered, setQuizAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [quizOptions, setQuizOptions] = useState<Word[]>([]);

  useEffect(() => {
    async function init() {
      const fetchedWords = await fetchWords();
      setWords(fetchedWords);
      setStorageData(getStorageData());
      setLoading(false);
    }
    init();
  }, []);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setIsFlipped(false);
    if (tab === 'quiz') {
      startNewQuiz();
    }
  };

  const startNewQuiz = () => {
    if (words.length < 4) return;
    const shuffled = [...words].sort(() => Math.random() - 0.5);
    setQuizWords(shuffled);
    setQuizIdx(0);
    generateOptions(shuffled[0], words);
    setQuizAnswered(false);
    setIsCorrect(null);
  };

  const generateOptions = (correctWord: Word, allWords: Word[]) => {
    const others = allWords.filter(w => w.id !== correctWord.id)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);
    const options = [correctWord, ...others].sort(() => Math.random() - 0.5);
    setQuizOptions(options);
  };

  const currentWord = words[currentIdx];
  const progress = words.length > 0 ? ((currentIdx + 1) / words.length) * 100 : 0;

  const wrongWordList = useMemo(() => {
    const list = words.filter(w => storageData.wrongWords[w.id]);
    return list.sort((a, b) => 
      (storageData.wrongWords[b.id]?.count || 0) - (storageData.wrongWords[a.id]?.count || 0)
    );
  }, [words, storageData]);

  const topWrongWords = useMemo(() => wrongWordList.slice(0, 5), [wrongWordList]);

  const filteredWords = useMemo(() => {
    if (!searchTerm) return words;
    const lowerSearch = searchTerm.toLowerCase();
    return words.filter(w => 
      w.word.toLowerCase().includes(lowerSearch) || 
      w.meaning.toLowerCase().includes(lowerSearch)
    );
  }, [words, searchTerm]);

  const handleNextWord = () => {
    setIsFlipped(false);
    setCurrentIdx((prev) => (prev + 1) % words.length);
  };

  const handlePrevWord = () => {
    setIsFlipped(false);
    setCurrentIdx((prev) => (prev - 1 + words.length) % words.length);
  };

  const handleQuizAnswer = (selectedWord: Word) => {
    if (quizAnswered) return;
    
    const correct = selectedWord.id === quizWords[quizIdx].id;
    setIsCorrect(correct);
    setQuizAnswered(true);

    if (!correct) {
      saveWrongWord(quizWords[quizIdx].id);
      setStorageData(getStorageData());
    }
  };

  const handleNextQuiz = () => {
    const nextIdx = quizIdx + 1;
    if (nextIdx < quizWords.length) {
      setQuizIdx(nextIdx);
      generateOptions(quizWords[nextIdx], words);
      setQuizAnswered(false);
      setIsCorrect(null);
    } else {
      startNewQuiz();
    }
  };

  const handleRemoveWrong = (id: string) => {
    removeWrongWord(id);
    setStorageData(getStorageData());
  };

  const handleClearAll = () => {
    // iFrame 보안 정책상 window.confirm이 작동하지 않을 수 있으므로 즉시 초기화하도록 변경합니다.
    clearAllData();
    setStorageData({ wrongWords: {} });
    
    // 초기화 후 첫 단어로 이동 및 퀴즈 상태 초기화
    setCurrentIdx(0);
    setIsFlipped(false);
    if (activeTab === 'quiz') {
      startNewQuiz();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#F0F4F8]">
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="text-slate-400 font-bold tracking-tighter"
        >
          로딩 중...
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F0F4F8] text-slate-800 font-sans p-6 md:p-8 flex items-center justify-center">
      <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-8 h-full max-h-[900px]">
        {/* Sidebar: PC & Layout Context */}
        <aside className="w-full lg:w-80 flex flex-col gap-6 order-2 lg:order-1">
          {/* Progress Card */}
          <div className="main-card p-6">
            <h1 className="text-xl font-bold text-slate-900 mb-1 flex items-center gap-2">
              📖 기초 탈출!
            </h1>
            <p className="text-sm text-slate-500 mb-6">수능 필수 영단어</p>
            
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">오늘의 학습량</span>
                <span className="text-sm font-bold text-blue-600">
                  {activeTab === 'words' ? `${currentIdx + 1} / ${words.length}` : (activeTab === 'quiz' ? `${quizIdx + 1} / ${quizWords.length}` : `${words.length}개 전체`)}
                </span>
              </div>
              <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                <motion.div 
                  className="bg-blue-500 h-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${activeTab === 'words' ? progress : ((quizIdx + 1) / (quizWords.length || 1)) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Top Errors Card */}
          <div className="flex-1 main-card p-6 flex flex-col gap-4 overflow-hidden">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-slate-700">⚠️ 집중 복습</h2>
              <span className="px-2 py-1 bg-red-50 text-red-500 text-[10px] font-bold rounded-lg uppercase">Critical</span>
            </div>
            
            <div className="space-y-3 flex-1 overflow-y-auto pr-2 custom-scrollbar">
              {topWrongWords.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-8">아직 오답이 없습니다!</p>
              ) : (
                topWrongWords.map(word => (
                  <div key={word.id} className="p-3 bg-slate-50 rounded-xl flex justify-between items-center border border-slate-100">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-800 text-sm">{word.word}</span>
                      <span className="text-[10px] text-slate-500">{word.meaning}</span>
                    </div>
                    <span className="text-xs font-bold text-rose-400">{storageData.wrongWords[word.id]?.count}회</span>
                  </div>
                ))
              )}
            </div>

            <button 
              onClick={() => handleTabChange('errors')}
              className="mt-auto w-full py-3 bg-slate-900 text-white rounded-2xl font-bold text-sm btn-action flex items-center justify-center gap-2"
            >
              전체 오답 보기 <ArrowRight size={14} />
            </button>
          </div>
        </aside>

        {/* Main Section */}
        <main className="flex-1 flex flex-col gap-6 order-1 lg:order-2">
          {/* Top Navigation Bar */}
          <nav className="bg-slate-200/50 p-1.5 rounded-2xl flex gap-1 w-fit self-center">
            <button 
              onClick={() => handleTabChange('list')}
              className={`tab-item ${activeTab === 'list' ? 'tab-item-active' : 'text-slate-500 hover:text-slate-700'}`}
            >
              단어장
            </button>
            <button 
              onClick={() => handleTabChange('words')}
              className={`tab-item ${activeTab === 'words' ? 'tab-item-active' : 'text-slate-500 hover:text-slate-700'}`}
            >
              암기모드
            </button>
            <button 
              onClick={() => handleTabChange('quiz')}
              className={`tab-item ${activeTab === 'quiz' ? 'tab-item-active' : 'text-slate-500 hover:text-slate-700'}`}
            >
              퀴즈 모드
            </button>
            <button 
              onClick={() => handleTabChange('errors')}
              className={`tab-item ${activeTab === 'errors' ? 'tab-item-active' : 'text-slate-500 hover:text-slate-700'}`}
            >
              오답노트
            </button>
          </nav>

          {/* Core Interaction Area */}
          <div className="flex-1 flex flex-col gap-6 min-h-0">
            <AnimatePresence mode="wait">
              {activeTab === 'words' && (
                <motion.div
                  key="words-view"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className="flex-1 flex flex-col gap-6"
                >
                  <div 
                    onClick={() => setIsFlipped(!isFlipped)}
                    className="flex-1 main-card rounded-[40px] flex flex-col items-center justify-center relative cursor-pointer group"
                    id="flashcard"
                  >
                    <div className="absolute top-8 left-8 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Voca #{currentIdx + 1}</span>
                    </div>

                    <motion.div
                      className="text-center p-8 space-y-4"
                      animate={{ rotateY: isFlipped ? 180 : 0 }}
                      transition={{ duration: 0.5, type: 'spring', stiffness: 200, damping: 25 }}
                      style={{ transformStyle: 'preserve-3d' }}
                    >
                      {!isFlipped ? (
                        <div className="backface-hidden">
                          <h3 className="text-5xl md:text-7xl font-bold text-slate-900 tracking-tight italic mb-2">
                            {currentWord?.word}
                          </h3>
                          <p className="text-slate-300 text-sm font-medium">클릭하여 의미 보기</p>
                        </div>
                      ) : (
                        <div className="backface-hidden" style={{ transform: 'rotateY(180deg)' }}>
                          <h3 className="text-3xl md:text-5xl font-bold text-blue-600 mb-4">
                            {currentWord?.meaning}
                          </h3>
                          {currentWord?.example && (
                            <p className="text-slate-500 text-sm max-w-xs mx-auto italic leading-relaxed">
                              "{currentWord.example}"
                            </p>
                          )}
                        </div>
                      )}
                    </motion.div>

                    <div className="absolute bottom-12 flex gap-4">
                      <button 
                        onClick={(e) => { e.stopPropagation(); speak(currentWord?.word); }}
                        className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 btn-action shadow-sm hover:bg-blue-100"
                      >
                        <Volume2 size={24} />
                      </button>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-2 gap-4">
                    <button 
                      onClick={handlePrevWord}
                      className="py-6 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-3xl font-bold text-xl btn-action flex items-center justify-center gap-2"
                    >
                      <ChevronLeft size={24} /> 이전
                    </button>
                    <button 
                      onClick={handleNextWord}
                      className="py-6 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-3xl font-bold text-xl btn-action flex items-center justify-center gap-2"
                    >
                      다음 <ChevronRight size={24} />
                    </button>
                  </div>
                </motion.div>
              )}

              {activeTab === 'list' && (
                <motion.div
                  key="list-view"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className="flex-1 flex flex-col gap-4 min-h-0"
                >
                  <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center gap-3">
                    <Search size={20} className="text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="단어 또는 뜻으로 검색..." 
                      className="flex-1 bg-transparent border-none outline-none text-slate-800 font-medium placeholder:text-slate-300"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  
                  <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar space-y-3 pb-4">
                    {filteredWords.map((word) => (
                      <div key={word.id} className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex items-center justify-between group hover:border-blue-200 transition-colors">
                        <div>
                          <h4 className="text-xl font-bold text-slate-900 mb-0.5">{word.word}</h4>
                          <p className="text-slate-500 font-medium">{word.meaning}</p>
                        </div>
                        <button 
                          onClick={() => speak(word.word)}
                          className="w-12 h-12 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center hover:bg-blue-50 hover:text-blue-500 transition-all btn-action"
                        >
                          <Volume2 size={22} />
                        </button>
                      </div>
                    ))}
                    {filteredWords.length === 0 && (
                      <div className="text-center py-20">
                        <p className="text-slate-400 font-medium">검색 결과가 없습니다.</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {activeTab === 'quiz' && (
                <motion.div
                  key="quiz-view"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex-1 flex flex-col gap-6"
                >
                  <div className="bg-white rounded-[40px] p-12 main-card text-center relative flex flex-col items-center justify-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest absolute top-8 left-8">Question #{quizIdx + 1}</span>
                    <h2 className="text-5xl font-bold text-slate-900 mb-6 italic">{quizWords[quizIdx]?.word}</h2>
                    <button 
                      onClick={() => speak(quizWords[quizIdx]?.word)}
                      className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors btn-action"
                    >
                      <Volume2 size={20} />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {quizOptions.map((opt, i) => (
                      <button
                        key={i}
                        onClick={() => handleQuizAnswer(opt)}
                        disabled={quizAnswered}
                        className={`
                          p-6 rounded-3xl text-lg font-bold transition-all border-2 flex items-center justify-between btn-action
                          ${!quizAnswered 
                            ? 'bg-white border-slate-100 hover:border-blue-400 hover:shadow-md' 
                            : opt.id === quizWords[quizIdx].id
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                              : opt.id !== quizWords[quizIdx].id && quizAnswered && isCorrect === false
                                ? 'bg-rose-50 border-rose-200 text-rose-700'
                                : 'bg-white border-slate-50 opacity-40'
                          }
                        `}
                      >
                        {opt.meaning}
                        {quizAnswered && opt.id === quizWords[quizIdx].id && <CheckCircle2 className="text-emerald-500" />}
                        {quizAnswered && opt.id !== quizWords[quizIdx].id && isCorrect === false && <XCircle className="text-rose-500" />}
                      </button>
                    ))}
                  </div>

                  {quizAnswered && (
                    <motion.button
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      onClick={handleNextQuiz}
                      className="py-5 bg-slate-900 text-white rounded-3xl font-bold text-xl shadow-xl flex items-center justify-center gap-2 btn-action hover:bg-slate-800"
                    >
                      {quizIdx === quizWords.length - 1 ? '처음부터 다시' : '다음 문제'} <ChevronRight />
                    </motion.button>
                  )}
                </motion.div>
              )}

              {activeTab === 'errors' && (
                <motion.div
                  key="errors-view"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="flex-1 flex flex-col gap-4 min-h-0"
                >
                  <div className="flex items-center justify-between px-4">
                    <h2 className="text-2xl font-bold text-slate-800">오답 상세 ({wrongWordList.length})</h2>
                    <button onClick={handleClearAll} className="text-sm font-bold text-rose-500 flex items-center gap-1 hover:bg-rose-50 p-2 rounded-xl transition-colors">
                      <Trash2 size={16} /> 데이터 초기화
                    </button>
                  </div>

                  {wrongWordList.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center main-card text-center p-12 border-2 border-dashed border-slate-100">
                      <CheckCircle2 size={64} className="text-emerald-300 mb-6" />
                      <h3 className="text-2xl font-bold text-slate-800 mb-2">모두 외우셨네요!</h3>
                      <p className="text-slate-400">퀴즈에서 틀린 단어가 여기에 정리됩니다.</p>
                    </div>
                  ) : (
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto pb-4 pr-1 custom-scrollbar">
                      {wrongWordList.map(word => (
                        <motion.div 
                          layout
                          key={word.id}
                          className="bg-white p-5 rounded-[32px] shadow-sm border border-slate-100 flex items-center justify-between hover:shadow-md transition-shadow"
                        >
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="text-xl font-bold text-slate-900">{word.word}</h4>
                              <span className="text-[10px] font-bold text-rose-500 bg-rose-50 px-2 py-0.5 rounded-full">{storageData.wrongWords[word.id]?.count}회 오답</span>
                            </div>
                            <p className="text-slate-500 text-sm font-medium">{word.meaning}</p>
                          </div>
                          <div className="flex gap-2">
                             <button onClick={() => speak(word.word)} className="w-10 h-10 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-50 transition-colors">
                              <Volume2 size={20} />
                            </button>
                            <button onClick={() => handleRemoveWrong(word.id)} className="w-10 h-10 rounded-full flex items-center justify-center text-emerald-500 hover:bg-emerald-50 transition-colors">
                              <CheckCircle2 size={22} />
                            </button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>
      </div>

      <style>{`
        .backface-hidden {
          backface-visibility: hidden;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #E2E8F0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #CBD5E1;
        }
      `}</style>
    </div>
  );
}
